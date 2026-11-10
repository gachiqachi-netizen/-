"""PostgreSQL 订单与售后的并发/事务保护集成测试（可选，临时 schema）。

设置 BEADLOOP_TEST_DATABASE_URL 后运行；未设置时整类跳过。SQLite 等价测试见
test_transaction.py。覆盖：并发订单状态迁移、并发退款额度、售后幂等唯一约束、
订单变更与审计同事务回滚、迁移 advisory lock 串行化。
"""
import os
import sys
import threading
import unittest
import uuid
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db_postgres import PostgresDB
import commerce
import user_api

URL = os.environ.get('BEADLOOP_TEST_DATABASE_URL')


@unittest.skipUnless(URL, 'set BEADLOOP_TEST_DATABASE_URL to run PostgreSQL integration tests')
class PostgresConcurrencyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import psycopg
        from psycopg import sql
        from psycopg.conninfo import make_conninfo
        cls.psycopg = psycopg
        cls.schema = 'beadloop_txn_' + uuid.uuid4().hex
        with psycopg.connect(URL) as conn:
            conn.execute(sql.SQL('CREATE SCHEMA {}').format(sql.Identifier(cls.schema)))
        cls.url = make_conninfo(URL, options='-csearch_path=' + cls.schema)
        cls.db = PostgresDB(cls.url, initialize=True)

    @classmethod
    def tearDownClass(cls):
        from psycopg import sql
        with cls.psycopg.connect(URL) as conn:
            conn.execute(sql.SQL('DROP SCHEMA {} CASCADE').format(sql.Identifier(cls.schema)))

    def setUp(self):
        from db import TABLES
        with self.db.connect() as conn:
            for table in TABLES:
                conn.execute(f'DELETE FROM {table}')
        self.db.put('beads', 'b1', {'id': 'b1', 'name': '测试珠', 'price': 2, 'mm': 8, 'onSale': True})

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

    # ---- 1. 并发订单状态迁移 ----

    def test_concurrent_order_transition_succeeds_once(self):
        no = self.make_order('pg-txn-order-0001')['no']
        barrier = threading.Barrier(2)
        results = []

        def move(target):
            try:
                barrier.wait()
                commerce.transition_order_status(self.db, no, 'orderStatus', target)
                results.append('ok')
            except Exception:
                results.append('err')

        a = threading.Thread(target=move, args=('confirmed',))
        b = threading.Thread(target=move, args=('cancelled',))
        a.start(); b.start(); a.join(); b.join()
        self.assertEqual(results.count('ok'), 1)
        final = self.db.get('orders', no)
        self.assertIn(final['orderStatus'], ('confirmed', 'cancelled'))
        history = [h for h in final.get('statusHistory', []) if h.get('group') == 'orderStatus']
        self.assertEqual(len(history), 1)

    # ---- 2. 并发退款额度 ----

    def test_concurrent_refund_does_not_exceed(self):
        no = self.make_order('pg-txn-refund-0001')['no']
        paid = self.db.get('orders', no)['totalFen']
        self.set_paid(no)
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
        after_sales = [x for x in self.db.list('after_sales') if x.get('orderNo') == no]
        self.assertEqual(len(after_sales), 1)
        self.assertLessEqual(sum(int(x.get('refundFen') or 0) for x in after_sales), paid)

    # ---- 3. 并发售后幂等 ----

    def test_concurrent_after_sale_idempotent(self):
        no = self.make_order('pg-txn-as-0000001')['no']
        self.set_paid(no)
        barrier = threading.Barrier(2)
        recs = []

        def create():
            barrier.wait()
            recs.append(commerce.create_after_sale(
                self.db, {'orderNo': no, 'type': '仅退款', 'reason': '不想要了',
                          'refundFen': 100, 'idempotencyKey': 'pg-idem-1'}))

        a = threading.Thread(target=create)
        b = threading.Thread(target=create)
        a.start(); b.start(); a.join(); b.join()
        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0]['no'], recs[1]['no'])
        self.assertEqual(len([x for x in self.db.list('after_sales') if x.get('orderNo') == no]), 1)

    # ---- 4. 订单变更与审计同事务回滚 ----

    def test_order_audit_atomic_rollback(self):
        no = self.make_order('pg-txn-audit-0001')['no']
        self.set_paid(no)
        before = self.db.get('orders', no)
        with mock.patch('commerce._audit_record', side_effect=RuntimeError('注入审计失败')):
            with self.assertRaises(RuntimeError):
                commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        after = self.db.get('orders', no)
        self.assertEqual(after['fulfillmentStatus'], before['fulfillmentStatus'])
        self.assertEqual([x for x in self.db.list('audit_logs') if x.get('action') == 'transition'], [])

    # ---- 5. 迁移 advisory lock 串行化 ----

    def test_concurrent_migrations_do_not_double_apply(self):
        import migrate as migrate_mod

        class Sentinel:
            VERSION = '999_concurrent'

            def up(self, conn, adapter):
                conn.execute("INSERT INTO audit_logs (id, doc) VALUES ('sentinel-999', '{}'::jsonb)")

        barrier = threading.Barrier(2)
        errors = []

        def run():
            try:
                with self.db.connect() as conn:
                    barrier.wait()
                    migrate_mod.run_migrations(conn, migrate_mod.PostgresAdapter(),
                                               migrations=[Sentinel()])
            except Exception as exc:
                errors.append(exc)

        a = threading.Thread(target=run)
        b = threading.Thread(target=run)
        a.start(); b.start(); a.join(); b.join()
        self.assertEqual(errors, [])
        with self.db.connect() as conn:
            count = conn.execute(
                "SELECT COUNT(*) FROM audit_logs WHERE id = 'sentinel-999'").fetchone()[0]
        self.assertEqual(count, 1)
        # 清理自定义迁移痕迹，避免影响同 schema 后续断言
        with self.db.connect() as conn:
            conn.execute("DELETE FROM schema_migrations WHERE version = '999_concurrent'")
            conn.execute("DELETE FROM audit_logs WHERE id = 'sentinel-999'")


if __name__ == '__main__':
    unittest.main()
