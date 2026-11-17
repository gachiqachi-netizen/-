"""B-18: one-time seed import is preview-first and never overwrites edits."""

import contextlib
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import load_seed


class LoadSeedTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = str(Path(self.temp.name) / "seed.sqlite3")
        env = patch.dict(os.environ, {"DATABASE_URL": "", "DATABASE_PATH": self.path})
        env.start()
        self.addCleanup(env.stop)

    def run_command(self, *args):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = load_seed.main(list(args))
        self.assertEqual(result, 0)
        return output.getvalue()

    def inspect(self):
        db = load_seed.open_database()
        self.addCleanup(db.conn.close)
        return db

    def test_empty_preview_does_not_write_records(self):
        text = self.run_command()
        self.assertIn("预览（不写入记录）", text)
        db = self.inspect()
        for table, rows in load_seed.SEED_TABLES.items():
            self.assertEqual(db.list(table), [])
            self.assertIn(f"{table}：将新增 {len(rows)} 条 / 已存在跳过 0 条", text)

    def test_apply_inserts_seed_and_second_apply_skips_all(self):
        first = self.run_command("--apply")
        db = self.inspect()
        for table, rows in load_seed.SEED_TABLES.items():
            self.assertEqual(len(db.list(table)), len(rows))
            self.assertIn(f"{table}：已新增 {len(rows)} 条 / 已存在跳过 0 条", first)
        second = self.run_command("--apply")
        for table, rows in load_seed.SEED_TABLES.items():
            self.assertIn(f"{table}：已新增 0 条 / 已存在跳过 {len(rows)} 条", second)

    def test_existing_price_and_cover_are_not_overwritten(self):
        db = self.inspect()
        db.put("beads", "zt8", {"id": "zt8", "price": 999, "name": "自定义珠子"})
        db.put("templates", "t1", {"id": "t1", "cover": "custom-cover", "name": "自定义款式"})
        self.run_command("--apply")
        self.assertEqual(db.get("beads", "zt8")["price"], 999)
        self.assertEqual(db.get("templates", "t1")["cover"], "custom-cover")

    def test_only_writes_selected_tables(self):
        text = self.run_command("--apply", "--only", "beads,terms")
        self.assertNotIn("templates：", text)
        db = self.inspect()
        self.assertEqual(len(db.list("beads")), len(load_seed.SEED_TABLES["beads"]))
        self.assertEqual(len(db.list("terms")), len(load_seed.SEED_TABLES["terms"]))
        self.assertEqual(db.list("templates"), [])
        self.assertEqual(db.list("banners"), [])
        self.assertTrue(all(row["status"] == "draft" for row in db.list("terms")))

    def test_output_does_not_expose_environment_values(self):
        secret = "postgresql://private-value-that-must-not-print"
        stdout, stderr = io.StringIO(), io.StringIO()
        with patch.dict(os.environ, {"DATABASE_URL": secret}), patch.object(
            load_seed, "open_database", side_effect=RuntimeError(secret)
        ), contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            result = load_seed.main([])
        self.assertEqual(result, 1)
        self.assertNotIn(secret, stdout.getvalue() + stderr.getvalue())
        self.assertNotIn(self.path, stdout.getvalue() + stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
