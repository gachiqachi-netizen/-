"""订单与售后的事务/并发保护测试（SQLite，始终可跑）。

SQLite 用 db.lock + BEGIN IMMEDIATE 实现与 PostgreSQL FOR UPDATE 等价的行级
串行化；本文件覆盖并发订单状态迁移、并发退款额度、售后幂等唯一约束、
订单变更与审计同事务回滚、迁移幂等重跑。PostgreSQL 版本见 test_postgres_concurrency.py。
"""
import json
import os
import sqlite3
import sys
import tempfile
import threading
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import commerce
import user_api


class TransactionTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, 'test.db'))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    # ---- 辅助 ----

    @staticmethod
    def quote(bead):
        goods = round(bead['price'] * 100) * 6
        sub = goods + 1500
        return {'totalFen': sub + (0 if sub >= 9900 else 800),
                'items': [{'id': bead['id'], 'unitPriceFen': round(bead['price'] * 100), 'mm': bead['mm']}]}

    def make_order(self, request_id):
        bead = self.db.list('beads')[0]
        req = {'requestId': request_id, 'name': '测试', 'beads': [bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址', 'confirmedQuote': self.quote(bead)}
        return user_api.make_order(self.db, req, 'u1')

    def set_paid(self, no, paid_fen=None):
        order = self.db.get('orders', no)
        order['paymentStatus'] = 'paid'
        order['paidFen'] = paid_fen if paid_fen is not None else order.get('totalFen', 0)
        self.db.put('orders', no, order)
        return order

    # ---- 1. 并发订单状态迁移：只成功一个 ----

    def test_concurrent_order_transition_succeeds_once(self):
        no = self.make_order('txn-order-000001')['no']
        barrier = threading.Barrier(2)
        results = []

        def move(target):
            try:
                barrier.wait()
                commerce.transition_order_status(self.db, no, 'orderStatus', target)
                results.append(('ok', target))
            except Exception as exc:
                results.append(('err', type(exc).__name__))

        a = threading.Thread(target=move, args=('confirmed',))
        b = threading.Thread(target=move, args=('cancelled',))
        a.start(); b.start(); a.join(); b.join()

        self.assertEqual(len([r for r in results if r[0] == 'ok']), 1)
        self.assertEqual(len([r for r in results if r[0] == 'err']), 1)
        final = self.db.get('orders', no)
        self.assertIn(final['orderStatus'], ('confirmed', 'cancelled'))
        history = [h for h in final.get('statusHistory', []) if h.get('group') == 'orderStatus']
        self.assertEqual(len(history), 1)  # 历史不重复

    # ---- 2. 并发退款：额度约束下只成功一笔 ----

    def test_concurrent_refund_does_not_exceed(self):
        no = self.make_order('txn-refund-00001')['no']
        paid = self.set_paid(no)['paidFen']
        barrier = threading.Barrier(2)
        results = []

        def refund():
            try:
                barrier.wait()
                commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                     'reason': '不想要了', 'refundFen': paid})
                results.append('ok')
            except Exception:
                results.append('err')

        a = threading.Thread(target=refund)
        b = threading.Thread(target=refund)
        a.start(); b.start(); a.join(); b.join()

        self.assertEqual(results.count('ok'), 1)
        after_sales = [a for a in self.db.list('after_sales') if a.get('orderNo') == no]
        self.assertEqual(len(after_sales), 1)
        refunded = sum(int(a.get('refundFen') or 0) for a in after_sales)
        self.assertLessEqual(refunded, paid)

    # ---- 3. 并发售后：幂等键唯一约束生效，不重复创建 ----

    def test_concurrent_after_sale_idempotent(self):
        no = self.make_order('txn-as-000000001')['no']
        self.set_paid(no)
        barrier = threading.Barrier(2)
        recs = []

        def create():
            barrier.wait()
            recs.append(commerce.create_after_sale(
                self.db, {'orderNo': no, 'type': '仅退款', 'reason': '不想要了',
                          'refundFen': 100, 'idempotencyKey': 'idem-key-00000001'}))

        a = threading.Thread(target=create)
        b = threading.Thread(target=create)
        a.start(); b.start(); a.join(); b.join()

        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0]['no'], recs[1]['no'])  # 幂等返回同一条
        after_sales = [a for a in self.db.list('after_sales') if a.get('orderNo') == no]
        self.assertEqual(len(after_sales), 1)

    def test_after_sale_idempotency_unique_constraint(self):
        no = self.make_order('txn-as-000000002')['no']
        self.set_paid(no)
        commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                             'reason': '不想要了', 'refundFen': 100,
                                             'idempotencyKey': 'idem-key-00000002'})
        # 直接写库触发唯一索引（不依赖应用层先查再写）
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.conn.execute(
                "INSERT INTO after_sales (id, doc, order_no, idempotency_key) VALUES (?, ?, ?, ?)",
                ('AS-DUP', json.dumps({'no': 'AS-DUP', 'orderNo': no, 'status': 'requested'}),
                 no, 'idem-key-00000002'))
            self.db.conn.commit()

    # ---- 4. 订单变更与审计同事务回滚 ----

    def test_order_audit_atomic_rollback(self):
        no = self.make_order('txn-audit-000001')['no']
        self.set_paid(no)
        before = self.db.get('orders', no)
        with mock.patch('commerce._audit_record', side_effect=RuntimeError('注入审计失败')):
            with self.assertRaises(RuntimeError):
                commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        after = self.db.get('orders', no)
        self.assertEqual(after['fulfillmentStatus'], before['fulfillmentStatus'])  # 订单未变
        self.assertEqual([a for a in self.db.list('audit_logs') if a.get('action') == 'transition'], [])  # 审计无记录

    def test_idempotent_order_transition_does_not_duplicate_audit(self):
        no = self.make_order('txn-audit-000002')['no']
        commerce.transition_order_status(self.db, no, 'orderStatus', 'confirmed')
        first = [a for a in self.db.list('audit_logs') if a.get('action') == 'transition']
        commerce.transition_order_status(self.db, no, 'orderStatus', 'confirmed')
        second = [a for a in self.db.list('audit_logs') if a.get('action') == 'transition']
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 1)

    # ---- 5. 迁移幂等重跑 + m006 物理列与唯一索引 ----

    def test_migration_rerun_idempotent_and_m006_constraint(self):
        path = os.path.join(self.tmp.name, 'mig.db')
        conn = sqlite3.connect(path)
        import migrate
        first = migrate.run_migrations(conn, migrate.SQLiteAdapter())
        self.assertIn('006', first)
        second = migrate.run_migrations(conn, migrate.SQLiteAdapter())
        self.assertEqual(second, [])  # 幂等重跑不重复

        cols = {row[1] for row in conn.execute("PRAGMA table_info(after_sales)")}
        self.assertIn('order_no', cols)
        self.assertIn('idempotency_key', cols)
        indexes = {row[1] for row in conn.execute("PRAGMA index_list(after_sales)")}
        self.assertIn('idx_after_sales_idem', indexes)
        conn.close()


if __name__ == '__main__':
    unittest.main()
