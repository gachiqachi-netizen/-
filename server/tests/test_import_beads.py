"""H6 bulk import: preview, validation, enrichment and insert-only behavior."""

import csv
import os
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import import_beads  # noqa: E402


class ImportBeadsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.photo = self.root / "photo.bin"
        self.photo.write_bytes(b"test image")
        env = patch.dict(os.environ, {"DATABASE_URL": "", "DATABASE_PATH": str(self.root / "test.sqlite3")})
        env.start()
        self.addCleanup(env.stop)

    def db(self):
        db = import_beads.open_database()
        self.addCleanup(db.conn.close)
        return db

    def test_preview_apply_and_repeat_preserve_existing_record(self):
        file = self.root / "beads.csv"
        with file.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=["ID", "名称", "尺寸(mm)", "价格(分)", "材质", "照片"])
            writer.writeheader()
            writer.writerow({"ID": "new1", "名称": "紫水晶", "尺寸(mm)": "8", "价格(分)": "1234",
                             "材质": "水晶", "照片": str(self.photo)})
            writer.writerow({"ID": "new2", "名称": "未收录材料", "尺寸(mm)": "10", "价格(分)": "345",
                             "材质": "石", "照片": str(self.photo)})
            writer.writerow({"ID": "bad", "名称": "无图", "尺寸(mm)": "8", "价格(分)": "50",
                             "材质": "石", "照片": "missing.jpg"})
        db = self.db()
        out = []
        with patch.object(import_beads, "color_for", return_value=["#123456", "#123456"]) as colors:
            preview = import_beads.import_rows(db, import_beads.read_rows(file), file, output=out.append)
            self.assertEqual(len(db.list("beads")), 0)
            self.assertEqual(tuple(map(len, preview.values())), (2, 0, 1, 1))
            self.assertTrue(any("照片文件不存在" in line for line in out))
            import_beads.import_rows(db, import_beads.read_rows(file), file, apply=True, output=lambda _: None)
            colors.assert_called()
        self.assertEqual(db.get("beads", "new1")["priceFen"], 1234)
        self.assertEqual(db.get("beads", "new1")["kb"], "zi-jing")
        self.assertEqual(db.get("beads", "new1")["c"], ["#123456", "#123456"])
        self.assertNotIn("kb", db.get("beads", "new2"))
        saved = db.get("beads", "new1")
        saved["priceFen"] = 9999
        db.put("beads", "new1", saved)
        repeat = import_beads.import_rows(db, import_beads.read_rows(file), file, apply=True, output=lambda _: None)
        self.assertEqual(len(repeat["跳过"]), 2)
        self.assertEqual(db.get("beads", "new1")["priceFen"], 9999)

    def test_color_uses_b22_name_fallback_for_unreadable_photo(self):
        colors = import_beads.color_for("紫水晶", "crystal", b"not an image")
        self.assertEqual(len(colors), 2)
        self.assertTrue(all(color.startswith("#") and len(color) == 7 for color in colors))

    def test_duplicate_id_inside_file_is_skipped_in_preview(self):
        row = {"ID": "same", "名称": "紫水晶", "尺寸(mm)": "8", "价格(分)": "100",
               "材质": "水晶", "照片": str(self.photo)}
        other = dict(row, **{"名称": "红玛瑙"})
        with patch.object(import_beads, "color_for", return_value=["#123456", "#123456"]):
            groups = import_beads.import_rows(self.db(), [row, other], self.root / "input.csv",
                                              output=lambda _: None)
        self.assertEqual(len(groups["将新增"]), 1)
        self.assertEqual(len(groups["跳过"]), 1)

    def test_missing_runtime_kb_entry_stays_in_new_and_pending_groups(self):
        row = {"名称": "蔷薇石", "尺寸(mm)": "8", "价格(分)": "100",
               "材质": "石", "照片": str(self.photo)}
        self.assertEqual(import_beads.match("蔷薇石", import_beads.load_entries()), "qiangwei-shi")
        with patch("commerce.kb.get", return_value=None), \
                patch.object(import_beads, "color_for", return_value=["#123456", "#123456"]):
            db = self.db()
            preview = import_beads.import_rows(db, [row], self.root / "input.csv", output=lambda _: None)
            self.assertEqual(len(preview["将新增"]), 1)
            self.assertEqual(len(preview["知识库待确认"]), 1)
            self.assertEqual(len(preview["缺字段"]), 0)
            applied = import_beads.import_rows(db, [row], self.root / "input.csv", apply=True,
                                               output=lambda _: None)
            self.assertEqual(len(applied["将新增"]), 1)
            self.assertNotIn("kb", db.list("beads")[0])

    def test_archived_name_size_material_does_not_block_new_import(self):
        db = self.db()
        db.put("beads", "old", {"name": "旧珠", "mm": 8, "mat": "crystal",
                                "type": "bead", "status": "archived", "onSale": False})
        row = {"名称": "旧珠", "尺寸(mm)": "8", "价格(分)": "100",
               "材质": "水晶", "照片": str(self.photo)}
        with patch.object(import_beads, "color_for", return_value=["#123456", "#123456"]):
            preview = import_beads.import_rows(db, [row], self.root / "input.csv", output=lambda _: None)
            self.assertEqual(len(preview["将新增"]), 1)
            import_beads.import_rows(db, [row], self.root / "input.csv", apply=True, output=lambda _: None)
        self.assertEqual(len(db.list("beads")), 2)
        self.assertEqual(db.get("beads", "old")["status"], "archived")

    def test_required_fields_and_price_are_checked_per_row(self):
        source = self.root / "input.csv"
        entries = import_beads.load_entries()
        base = {"名称": "测试珠", "尺寸(mm)": "8", "价格(分)": "100", "材质": "石", "照片": str(self.photo)}
        for key in base:
            row = dict(base, **{key: ""})
            _, errors, _ = import_beads.prepare(row, source, entries)
            self.assertTrue(errors, key)
        for value in ("0", "-1", "abc"):
            _, errors, _ = import_beads.prepare(dict(base, **{"尺寸(mm)": value}), source, entries)
            self.assertTrue(errors)
        for value in ("1.5", "-1", "abc"):
            _, errors, _ = import_beads.prepare(dict(base, **{"价格(分)": value}), source, entries)
            self.assertTrue(errors)

    def test_xlsx_first_sheet_values(self):
        file = self.root / "small.xlsx"
        with zipfile.ZipFile(file, "w") as book:
            book.writestr("xl/workbook.xml", '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="商品" sheetId="1" r:id="rId1"/></sheets></workbook>')
            book.writestr("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
            book.writestr("xl/sharedStrings.xml", '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>名称</t></si><si><t>紫水晶</t></si></sst>')
            book.writestr("xl/worksheets/sheet1.xml", '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>尺寸(mm)</t></is></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><v>8</v></c></row></sheetData></worksheet>')
        self.assertEqual(import_beads.read_rows(file), [{"名称": "紫水晶", "尺寸(mm)": "8"}])


if __name__ == "__main__":
    unittest.main()
