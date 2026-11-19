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


if __name__ == "__main__":
    unittest.main()
