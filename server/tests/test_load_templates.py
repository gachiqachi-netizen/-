"""B-21: homepage template import is preview-first and all-or-nothing on validation."""

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import load_templates


class LoadTemplatesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "data.sqlite3"
        env = patch.dict(os.environ, {"DATABASE_URL": "", "DATABASE_PATH": str(self.path)})
        env.start()
        self.addCleanup(env.stop)
        self.templates = json.loads((ROOT / "deploy/data-files/templates-2026-11.json").read_text())
        self.input = Path(self.temp.name) / "templates.json"
        self.input.write_text(json.dumps(self.templates))
        db = self.db()
        for bid in {bid for t in self.templates for bid in t["special"] + t["pattern"] + t["tail"]}:
            db.put("beads", bid, {"id": bid, "name": bid, "type": "bead", "status": "on_sale", "onSale": True, "priceFen": 100, "mm": 8})

    def db(self):
        db = load_templates.load_seed.open_database()
        self.addCleanup(db.conn.close)
        return db

    def run_command(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = load_templates.main([str(self.input), *args])
        return code, out.getvalue(), err.getvalue()

    def test_preview_does_not_write_and_apply_then_skips(self):
        db = self.db()
        code, out, _ = self.run_command()
        self.assertEqual(code, 0)
        self.assertEqual(out.count("将新增"), 6)
        self.assertEqual(db.list("templates"), [])
        code, out, _ = self.run_command("--apply")
        self.assertEqual(code, 0)
        self.assertEqual(out.count("已新增"), 6)
        self.assertEqual(len(db.list("templates")), 6)
        self.assertEqual(len([r for r in db.list("audit_logs") if r.get("actor") == "load_templates"]), 6)
        code, out, _ = self.run_command("--apply")
        self.assertEqual(code, 0)
        self.assertEqual(out.count("已存在跳过"), 6)

    def test_missing_bead_rejects_whole_batch(self):
        db = self.db()
        missing = self.templates[0]["special"][0]
        bead = db.get("beads", missing)
        bead["onSale"] = False
        db.put("beads", missing, bead)
        code, out, err = self.run_command("--apply")
        self.assertEqual(code, 1)
        self.assertIn(self.templates[0]["name"], out + err)
        self.assertIn(missing, out + err)
        self.assertEqual(db.list("templates"), [])

    def test_existing_template_is_not_overwritten(self):
        db = self.db()
        rid = self.templates[0]["id"]
        db.put("templates", rid, {"id": rid, "name": "人工修改", "cover": "custom"})
        code, out, _ = self.run_command("--apply")
        self.assertEqual(code, 0)
        self.assertIn("已存在跳过", out)
        self.assertEqual(db.get("templates", rid)["name"], "人工修改")

    def named_template(self, rid="named", bead=None):
        return {"id": rid, "name": "新款", "meaning": "蓝色珠子与浅色纹理相衬，清爽而沉静。",
                "special": [], "pattern": [bead if bead is not None else {"name": "蓝月光", "mm": 8}],
                "tail": [], "status": "on_sale", "onSale": True}

    def put_named_bead(self, rid="hc-one", status="on_sale"):
        self.db().put("beads", rid, {"id": rid, "name": "蓝月光", "mm": 8, "mat": "stone",
                                      "type": "bead", "priceFen": 600, "status": status,
                                      "onSale": status == "on_sale"})

    def test_name_and_size_resolve_unique_on_sale_bead(self):
        self.put_named_bead()
        db = self.db()
        template = self.named_template()
        self.assertEqual(load_templates.load(db, [template], output=lambda _: None), 1)
        self.assertEqual(db.list("templates"), [])
        self.assertEqual(load_templates.load(db, [template], apply=True, output=lambda _: None), 1)
        self.assertEqual(db.get("templates", "named")["pattern"], ["hc-one"])
        self.assertEqual(template["pattern"], [{"name": "蓝月光", "mm": 8}])

    def test_missing_or_ambiguous_name_and_size_reject_whole_batch(self):
        db = self.db()
        good = self.named_template("good", "sm20261116-478")
        for bad in (self.named_template("missing"), self.named_template("duplicate")):
            if bad["id"] == "duplicate":
                self.put_named_bead("hc-one")
                self.put_named_bead("hc-two")
            with self.assertRaisesRegex(ValueError, "整批未写入"):
                load_templates.load(db, [good, bad], apply=True, output=lambda _: None)
            self.assertEqual(db.list("templates"), [])

    def test_archived_name_and_size_cannot_resolve(self):
        self.put_named_bead(status="archived")
        report = []
        with self.assertRaisesRegex(ValueError, "整批未写入"):
            load_templates.load(self.db(), [self.named_template()], apply=True, output=report.append)
        self.assertTrue(any("找不到在售珠子" in line for line in report))

    def test_archived_duplicate_does_not_make_live_bead_ambiguous(self):
        self.put_named_bead("old", status="archived")
        self.put_named_bead("hc-new")
        db = self.db()
        load_templates.load(db, [self.named_template()], apply=True, output=lambda _: None)
        self.assertEqual(db.get("templates", "named")["pattern"], ["hc-new"])

    def test_string_id_reference_is_unchanged(self):
        db = self.db()
        template = self.named_template(bead="sm20261116-478")
        load_templates.load(db, [template], apply=True, output=lambda _: None)
        self.assertEqual(db.get("templates", "named")["pattern"], ["sm20261116-478"])

    def test_h10_template_meanings_avoid_attribute_banned_words(self):
        templates = json.loads((ROOT / "deploy/data-files/templates-2026-11b.json").read_text(encoding="utf-8"))
        attributes = json.loads((ROOT / "kb/data/attributes.json").read_text(encoding="utf-8"))
        banned = [item["word"] for item in attributes["banned"]]
        self.assertEqual(len(templates), 8)
        self.assertEqual([item["id"] for item in templates], [f"t-2611b-{i:02d}" for i in range(1, 9)])
        self.assertEqual([item["order"] for item in templates], list(range(1, 9)))
        self.assertEqual([item["homeOrder"] for item in templates], list(range(1, 9)))
        for template in templates:
            self.assertTrue(2 <= len(template["name"]) <= 4)
            self.assertTrue(30 <= len(template["meaning"]) <= 50)
            self.assertEqual([word for word in banned if word in template["meaning"]], [])
            self.assertTrue(template["onSale"])
            self.assertTrue(template["pattern"])
            for bead in template["special"] + template["pattern"] + template["tail"]:
                self.assertEqual(set(bead), {"name", "mm"})


if __name__ == "__main__":
    unittest.main()
