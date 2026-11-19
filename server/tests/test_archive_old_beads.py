"""H9 archives displaced products and templates without deleting history."""

import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import archive_old_beads  # noqa: E402


class ArchiveOldBeadsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        env = patch.dict(os.environ, {"DATABASE_URL": "", "DATABASE_PATH": str(Path(self.temp.name) / "test.sqlite3")})
        env.start()
        self.addCleanup(env.stop)
        self.db = archive_old_beads.open_database()
        self.addCleanup(self.db.conn.close)

    def bead(self, rid, name, kind="bead", photo="/uploads/old.png", status="on_sale"):
        self.db.put("beads", rid, {"name": name, "type": kind, "mat": "crystal", "mm": 8,
                                    "priceFen": 100, "photo": photo, "status": status,
                                    "onSale": status == "on_sale"})

    def test_preview_apply_and_repeat(self):
        self.bead("h7a", "H7 A", photo="/uploads/hc-aaa.png")
        self.bead("h7b", "H7 B", photo="/uploads/hc-bbb.png")
        self.bead("old1", "旧珠一")
        self.bead("old2", "旧珠二")
        self.bead("old3", "旧隔片", kind="spacer")
        self.bead("test", "测试款珠子")
        self.bead("done", "已归档", status="archived")
        self.db.put("templates", "normal", {"name": "普通款", "special": ["old1"],
                                            "pattern": ["old2", "old2"], "tail": [],
                                            "status": "on_sale", "onSale": True})
        self.db.put("templates", "trial", {"name": "测试款", "testOnly": True,
                                           "special": [], "pattern": ["test"], "tail": [],
                                           "status": "on_sale", "onSale": True})
        before_beads = self.db.list("beads")
        before_templates = self.db.list("templates")
        report = []
        preview = archive_old_beads.run(self.db, output=report.append)
        self.assertEqual(len(preview["h7"]), 2)
        self.assertEqual(len(preview["test"]), 1)
        self.assertEqual({item["id"] for item in preview["targets"]}, {"old1", "old2", "old3"})
        self.assertEqual(len(preview["archived"]), 1)
        self.assertEqual(preview["templates"][0][1], 3)
        self.assertTrue(any("珠子 2；配件 1" in line for line in report))
        self.assertEqual(self.db.list("beads"), before_beads)
        self.assertEqual(self.db.list("templates"), before_templates)

        archive_old_beads.run(self.db, apply=True, output=lambda _: None)
        for rid in ("old1", "old2", "old3"):
            self.assertEqual(self.db.get("beads", rid)["status"], "archived")
            self.assertFalse(self.db.get("beads", rid)["onSale"])
        for rid in ("h7a", "h7b", "test"):
            self.assertEqual(self.db.get("beads", rid)["status"], "on_sale")
        self.assertEqual(self.db.get("templates", "normal")["status"], "archived")
        self.assertFalse(self.db.get("templates", "normal")["onSale"])
        self.assertEqual(self.db.get("templates", "trial")["status"], "on_sale")
        repeat = archive_old_beads.run(self.db, apply=True, output=lambda _: None)
        self.assertFalse(repeat["targets"])
        self.assertFalse(repeat["templates"])
        self.assertEqual(len(self.db.list("beads")), 7)

    def test_without_h7_materials_refuses_even_apply(self):
        self.bead("old", "旧珠")
        with self.assertRaisesRegex(RuntimeError, "先完成 H7 导入"):
            archive_old_beads.run(self.db, apply=True, output=lambda _: None)
        self.assertEqual(self.db.get("beads", "old")["status"], "on_sale")


if __name__ == "__main__":
    unittest.main()
