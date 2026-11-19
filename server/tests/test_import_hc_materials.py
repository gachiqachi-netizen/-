import builtins
import csv
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

try:  # Pillow is a local-only dev dependency (tools/requirements-dev.txt).
    from PIL import Image, ImageDraw
except ImportError:
    Image = ImageDraw = None

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from import_hc_materials import prepare, import_prepared
from import_beads import open_database


@unittest.skipUnless(Image, '需要 Pillow（tools/requirements-dev.txt）')
class ImportHcTest(unittest.TestCase):
    def test_prepare_and_import_without_pillow(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            material = base / "materials_export"
            images = material / "images"
            images.mkdir(parents=True)
            bundle, uploads = base / "bundle", base / "uploads"
            for i, size in enumerate(((100, 100), (100, 100), (80, 300)), 1):
                im = Image.new("RGBA", size, "white" if i == 2 else (0, 0, 0, 0))
                draw = ImageDraw.Draw(im)
                draw.ellipse((25, 25, 65, 65), fill="blue")
                if i == 2:
                    draw.ellipse((40, 40, 45, 45), fill="white")
                im.save(images / f"{i}.png")
            with (material / "materials_summary.csv").open("w", encoding="utf-8", newline="") as stream:
                writer = csv.writer(stream)
                writer.writerow(["名称", "长(mm)", "宽(mm)", "重量(g)", "价格(元)", "简介", "详情", "图片文件名"])
                for i, mm in enumerate((6, 8, 10), 1):
                    writer.writerow(["蓝月光", mm, mm, 1, "12.34", "禁止文案", "禁止详情", f"{i}.png"])
                for i, name in enumerate(("足银生肖吊牌", "镀金爱心", "金色光珠", "镶钻吊坠", "跑环", "花托", "铃铛", "十字架", "编绳", "不明材料"), 4):
                    writer.writerow([name, 6, 6, 1, "2", "文案", "详情", "1.png"])
            messages = []
            rows = prepare(material, bundle, output=messages.append)
            self.assertEqual(len(rows), 11)
            self.assertTrue(all(r["材质"] == "metal" for r in rows[3:]))
            self.assertTrue(any("绳子跳过" in m and "编绳" in m for m in messages))
            self.assertTrue(any("材质待确认" in m and "不明材料" in m for m in messages))
            self.assertNotIn("简介", (bundle / "import.csv").read_text(encoding="utf-8-sig"))
            with Image.open(bundle / Path(rows[0]["图片"]).name) as cropped:
                self.assertLess(cropped.width, 100)
            with Image.open(bundle / Path(rows[1]["图片"]).name) as white:
                rgba = white.convert("RGBA")
                self.assertEqual(rgba.getpixel((0, 0))[3], 0)
                self.assertTrue(any(rgba.getpixel((x, y)) == (255, 255, 255, 255)
                                    for y in range(rgba.height) for x in range(rgba.width)))
            old = os.environ.get("DATABASE_PATH")
            os.environ["DATABASE_PATH"] = str(base / "test.sqlite3")
            try:
                db = open_database()
                original_import = builtins.__import__
                def no_pil(name, *args, **kwargs):
                    if name == "PIL" or name.startswith("PIL."):
                        raise ImportError("Pillow unavailable")
                    return original_import(name, *args, **kwargs)
                with patch("builtins.__import__", side_effect=no_pil):
                    preview = import_prepared(bundle, db, uploads=uploads, output=lambda _: None)
                    self.assertEqual(len(preview["将新增"]), 11)
                    self.assertFalse(uploads.exists())
                    self.assertEqual(db.list("beads"), [])
                    applied = import_prepared(bundle, db, apply=True, uploads=uploads, output=lambda _: None)
                    self.assertEqual(len(applied["将新增"]), 11)
                    self.assertEqual(len(import_prepared(bundle, db, apply=True, uploads=uploads, output=lambda _: None)["跳过"]), 11)
                saved = db.list("beads")
                self.assertEqual({item["mm"] for item in saved if item["name"] == "蓝月光"}, {6, 8, 10})
                self.assertTrue(all(item["priceFen"] == 1234 for item in saved if item["name"] == "蓝月光"))
                self.assertTrue(all(item["photo"].startswith("/uploads/") for item in saved))
                self.assertTrue(all("禁止" not in str(item) for item in saved))
            finally:
                if old is None:
                    os.environ.pop("DATABASE_PATH", None)
                else:
                    os.environ["DATABASE_PATH"] = old
