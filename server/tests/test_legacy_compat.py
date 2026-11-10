"""SQLite 旧数据兼容迁移测试。

旧库只有旧字段：订单 status 为中文、商品只有 onSale 布尔（无 status/type/images）。
启动 DB 后：新表自动创建、旧数据不破坏、四态与商品类型/状态正确推导。
"""
import json
import os
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB, TABLES
import status


class LegacyCompatTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, 'legacy.db')

    def tearDown(self):
        self.tmp.cleanup()

    def _make_legacy_db(self):
        """模拟旧版本数据库：只有旧表 + 旧字段格式。"""
        conn = sqlite3.connect(self.path)
        old_tables = ("beads", "templates", "banners", "orders", "users", "sessions",
                      "designs", "order_requests", "shares")
        for t in old_tables:
            conn.execute(f"CREATE TABLE IF NOT EXISTS {t} (id TEXT PRIMARY KEY, doc TEXT NOT NULL)")
        conn.execute("INSERT OR REPLACE INTO beads (id, doc) VALUES (?, ?)",
                     ('legacy-bead', json.dumps({'name': '旧珠子', 'mm': 8, 'price': 3.5,
                                                 'onSale': True, 'spacer': False, 'photo': 'p.jpg'})))
        conn.execute("INSERT OR REPLACE INTO beads (id, doc) VALUES (?, ?)",
                     ('legacy-spacer', json.dumps({'name': '旧隔片', 'mm': 6, 'price': 1.0,
                                                   'onSale': True, 'spacer': True})))
        conn.execute("INSERT OR REPLACE INTO templates (id, doc) VALUES (?, ?)",
                     ('legacy-tpl', json.dumps({'name': '旧模板', 'onSale': True,
                                                'pattern': ['legacy-bead'], 'special': [], 'tail': []})))
        conn.execute("INSERT OR REPLACE INTO orders (id, doc) VALUES (?, ?)",
                     ('legacy-order', json.dumps({'no': 'legacy-order', 'status': '待串制',
                                                  'userId': 'u1', 'total': 3000, 'createdAt': 1000})))
        conn.commit()
        conn.close()

    def test_legacy_db_migrates_and_derives(self):
        self._make_legacy_db()
        db = DB(self.path)  # 启动即迁移：建新表 + 保留旧数据
        db.conn.close()

        # 新表（audit_logs / after_sales / terms）已自动创建
        conn = sqlite3.connect(self.path)
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        conn.close()
        for t in TABLES:
            self.assertIn(t, tables, f"缺少表 {t}")

        db = DB(self.path)
        # 旧商品：type 由 spacer 推导，status 由 onSale 推导
        bead = db.get('beads', 'legacy-bead')
        self.assertEqual(status.product_type(bead), 'bead')
        self.assertEqual(status.product_status(bead), 'on_sale')
        self.assertTrue(status.product_on_sale(bead))
        spacer = db.get('beads', 'legacy-spacer')
        self.assertEqual(status.product_type(spacer), 'spacer')

        # 旧订单：中文 status → 四组英文枚举，且旧字段未被改写
        order = db.get('orders', 'legacy-order')
        derived = status.derive_status(order)
        self.assertEqual(derived['orderStatus'], 'confirmed')
        self.assertEqual(derived['paymentStatus'], 'paid')
        self.assertEqual(derived['fulfillmentStatus'], 'unfulfilled')
        self.assertEqual(derived['afterSaleStatus'], 'none')
        self.assertEqual(order['status'], '待串制')

        # 预置服务条款已补种（旧库没有 terms）
        terms = db.list('terms')
        self.assertTrue(terms)
        self.assertTrue(all('待运营' in t.get('body', '') and '法务确认' in t.get('body', '') for t in terms))
        db.conn.close()

    def test_legacy_order_without_groups_uses_defaults(self):
        # 旧订单 status 不在映射表里时，回退到默认四态
        db = DB(self.path)
        db.put('orders', 'unknown-legacy', {'no': 'unknown-legacy', 'status': '未知状态'})
        derived = status.derive_status(db.get('orders', 'unknown-legacy'))
        self.assertEqual(derived['orderStatus'], 'pending_confirmation')
        self.assertEqual(derived['paymentStatus'], 'unpaid')
        db.conn.close()


if __name__ == '__main__':
    unittest.main()
