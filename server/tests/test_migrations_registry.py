"""A11m：迁移自动发现和新表自动登记的测试。

做法：把 server/migrations/__init__.py 的源码在临时命名空间里重放一遍，
__path__ 指向真实迁移目录 + tempfile 临时目录（假迁移只存在于测试期间，
不往 server/migrations/ 里留文件）；DB 可用性用真实 db.DB 验证。
"""
import importlib
import os
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import db  # noqa: E402
import migrate  # noqa: E402
import migrations  # noqa: E402

INIT_SRC_PATH = os.path.join(os.path.dirname(migrations.__file__), "__init__.py")
with open(INIT_SRC_PATH, encoding="utf-8") as f:
    INIT_SRC = f.read()


def _write_migration(directory, name, version, new_tables=None):
    lines = [f"VERSION = '{version}'"]
    if new_tables:
        lines.append(f"NEW_TABLES = {tuple(new_tables)!r}")
    lines += ["", "def up(conn, adapter):"]
    if new_tables:
        lines.append("    for t in NEW_TABLES:")
        lines.append("        adapter.create_table(conn, t)")
    else:
        lines.append("    pass")
    with open(os.path.join(directory, name), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def _replay_init(extra_dirs):
    """在临时命名空间里重放 migrations/__init__.py，__path__ 额外挂临时目录。"""
    namespace = {"__name__": "migrations_test", "__package__": "migrations",
                 "__path__": list(migrations.__path__) + list(extra_dirs)}
    exec(compile(INIT_SRC, INIT_SRC_PATH, "exec"), namespace)  # noqa: S102
    return namespace


class MigrationsRegistryTest(unittest.TestCase):
    def test_existing_migrations_run_in_order(self):
        versions = [m.VERSION for m in migrations.MIGRATIONS]
        self.assertEqual(versions, ["001", "002", "003", "004", "005", "006", "007", "014", "015"])

    def test_all_tables_keeps_base_tables_without_duplicates(self):
        self.assertEqual(migrations.ALL_TABLES[:len(migrations.TABLES)], migrations.TABLES)
        self.assertEqual(len(set(migrations.ALL_TABLES)), len(migrations.ALL_TABLES))
        self.assertEqual(db.TABLES, migrations.ALL_TABLES)

    def test_new_tables_from_migration_auto_registered(self):
        tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, tmp)
        _write_migration(tmp, "m099_demo.py", "099", new_tables=("demo",))
        migrations.__path__.append(tmp)
        self.addCleanup(importlib.invalidate_caches)
        try:
            importlib.invalidate_caches()
            namespace = _replay_init([])
            self.assertIn("demo", namespace["ALL_TABLES"])
            # 用真实 DB 链路验证：迁移会建 demo 表，db.put/db.get 可用
            demo_mod = importlib.import_module("migrations.m099_demo")
            old_migrations_list = migrate.MIGRATIONS
            old_tables = db.TABLES
            migrate.MIGRATIONS = old_migrations_list + [demo_mod]
            db.TABLES = namespace["ALL_TABLES"]
            try:
                database = db.DB(":memory:")
                database.put("demo", "x", {"hello": "world"})
                self.assertEqual(database.get("demo", "x"),
                                 {"hello": "world", "id": "x"})
            finally:
                migrate.MIGRATIONS = old_migrations_list
                db.TABLES = old_tables
        finally:
            migrations.__path__.remove(tmp)
        self.assertNotIn("demo", migrations.ALL_TABLES)

    def test_duplicate_version_fails_at_startup(self):
        tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, tmp)
        _write_migration(tmp, "m098_dup_a.py", "098")
        _write_migration(tmp, "m098_dup_b.py", "098")
        migrations.__path__.append(tmp)
        try:
            importlib.invalidate_caches()
            with self.assertRaises(RuntimeError) as ctx:
                _replay_init([])
            self.assertIn("m098_dup_a", str(ctx.exception))
            self.assertIn("m098_dup_b", str(ctx.exception))
        finally:
            migrations.__path__.remove(tmp)

    def test_duplicate_table_name_fails_at_startup(self):
        tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, tmp)
        _write_migration(tmp, "m097_dup_table.py", "097", new_tables=("beads",))
        migrations.__path__.append(tmp)
        try:
            importlib.invalidate_caches()
            with self.assertRaises(RuntimeError) as ctx:
                _replay_init([])
            self.assertIn("beads", str(ctx.exception))
        finally:
            migrations.__path__.remove(tmp)


if __name__ == "__main__":
    unittest.main()
