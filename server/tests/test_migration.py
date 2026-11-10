"""数据库迁移机制的单元测试：用临时 SQLite，不连真实生产库。"""
import json
import os
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import migrate
from migrate import SCHEMA_MIGRATIONS_TABLE, SQLiteAdapter, run_migrations
from migrations import TABLES


def _versions(conn):
    return {row[0] for row in conn.execute(f"SELECT version FROM {SCHEMA_MIGRATIONS_TABLE}")}


def _order_doc(conn, rid):
    row = conn.execute("SELECT doc FROM orders WHERE id = ?", (rid,)).fetchone()
    return json.loads(row[0]) if row else None


class MigrationTest(unittest.TestCase):
    def test_old_structure_migrates_to_new(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'test.db')
            conn = sqlite3.connect(path)
            # 旧结构：只有部分基础表，无电商表（audit_logs/after_sales/terms），
            # 无 schema_migrations 版本表。
            for t in ('beads', 'templates', 'banners', 'orders', 'users', 'sessions',
                      'designs', 'order_requests', 'shares'):
                conn.execute(f"CREATE TABLE {t} (id TEXT PRIMARY KEY, doc TEXT NOT NULL)")
            old_order = {'no': 'OLD1', 'userId': 'u1', 'status': '待支付',
                         'goods': 10.0, 'ship': 8.0, 'total': 18.0,
                         'goodsFen': 1000, 'shipFen': 800, 'totalFen': 1800}
            conn.execute("INSERT INTO orders (id, doc) VALUES (?, ?)",
                         ('OLD1', json.dumps(old_order, ensure_ascii=False)))
            conn.commit()
            conn.close()

            conn = sqlite3.connect(path)
            applied = run_migrations(conn, SQLiteAdapter())
            self.assertEqual(applied, ['001', '002', '003', '004', '005'])
            self.assertEqual(_versions(conn), {'001', '002', '003', '004', '005'})
            existing = {row[0] for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'")}
            for t in TABLES:
                self.assertIn(t, existing)
            cols = {row[1] for row in conn.execute("PRAGMA table_info(orders)")}
            self.assertIn('user_id', cols)

            doc = _order_doc(conn, 'OLD1')
            self.assertEqual(doc['paymentStatus'], 'unpaid')
            self.assertEqual(doc['logisticsStatus'], 'not_shipped')
            self.assertEqual(doc['subtotalFen'], 1000)   # 1800 - 800
            self.assertEqual(doc['shippingFen'], 800)
            self.assertEqual(doc['discountFen'], 0)
            self.assertEqual(doc['payableFen'], 1800)    # 1000 + 800 - 0
            self.assertEqual(doc['paidFen'], 0)
            self.assertEqual(doc['refundFen'], 0)
            conn.close()

    def test_rerun_does_not_duplicate_or_destroy(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'test.db')
            conn = sqlite3.connect(path)
            run_migrations(conn, SQLiteAdapter())
            conn.execute("INSERT INTO orders (id, doc) VALUES (?, ?)",
                         ('O1', json.dumps({'no': 'O1', 'totalFen': 100, 'shipFen': 0})))
            conn.commit()
            applied_again = run_migrations(conn, SQLiteAdapter())
            self.assertEqual(applied_again, [])
            self.assertEqual(_versions(conn), {'001', '002', '003', '004', '005'})
            self.assertEqual(_order_doc(conn, 'O1')['totalFen'], 100)
            conn.close()

    def test_failed_migration_rolls_back_and_is_rerunnable(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'test.db')
            conn = sqlite3.connect(path)
            adapter = SQLiteAdapter()

            class Failing:
                VERSION = '999_fail'

                def up(self, c, a):
                    a.create_table(c, 'partial_table')
                    c.execute("INSERT INTO partial_table (id, doc) VALUES (?, ?)", ('x', '{}'))
                    raise RuntimeError('注入的失败')

            with self.assertRaises(RuntimeError) as ctx:
                run_migrations(conn, adapter, migrations=[Failing()])
            self.assertIn('999_fail', str(ctx.exception))
            self.assertNotIn('999_fail', _versions(conn))
            exists = conn.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='partial_table'").fetchone()
            self.assertIsNone(exists)  # 半迁移状态被回滚
            applied = run_migrations(conn, adapter)  # 可重跑
            self.assertEqual(applied, ['001', '002', '003', '004', '005'])
            conn.close()

    def test_money_backfill_from_yuan_fields(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'test.db')
            conn = sqlite3.connect(path)
            run_migrations(conn, SQLiteAdapter(),
                           migrations=[m for m in migrate.MIGRATIONS if m.VERSION in ('001', '002')])
            old = {'no': 'OLD2', 'status': '待支付', 'goods': 10.5, 'ship': 8.0, 'total': 18.5}
            conn.execute("INSERT INTO orders (id, doc) VALUES (?, ?)",
                         ('OLD2', json.dumps(old, ensure_ascii=False)))
            conn.commit()
            run_migrations(conn, SQLiteAdapter(),
                           migrations=[m for m in migrate.MIGRATIONS if m.VERSION in ('003', '004', '005')])
            doc = _order_doc(conn, 'OLD2')
            self.assertEqual(doc['paymentStatus'], 'unpaid')
            self.assertEqual(doc['logisticsStatus'], 'not_shipped')
            self.assertEqual(doc['shippingFen'], 800)    # ship 8.0 元 -> 800 分
            self.assertEqual(doc['subtotalFen'], 1050)   # total 18.5 - 8 = 10.5 元
            self.assertEqual(doc['payableFen'], 1850)    # 1050 + 800 - 0
            self.assertEqual(doc['discountFen'], 0)
            self.assertEqual(doc['paidFen'], 0)
            self.assertEqual(doc['refundFen'], 0)
            # 不变量：payableFen = subtotalFen + shippingFen - discountFen
            self.assertEqual(doc['payableFen'],
                             doc['subtotalFen'] + doc['shippingFen'] - doc['discountFen'])
            conn.close()


if __name__ == '__main__':
    unittest.main()
