"""收紧后的状态机严格约束测试：未支付不能完成/发货、已取消不能发货、手工写时间被拒、m005 物流回填合法。"""
import json
import os
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import commerce
import status
import user_api
from migrate import SQLiteAdapter, run_migrations
from migrations import m005_logistics_status


class StrictStateMachineTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, 'test.db'))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    @staticmethod
    def quote(bead):
        goods = round(bead['price'] * 100) * 6
        sub = goods + 1500
        return {'totalFen': sub + (0 if sub >= 9900 else 800),
                'items': [{'id': bead['id'], 'unitPriceFen': round(bead['price'] * 100), 'mm': bead['mm']}]}

    def make_order(self, token):
        bead = self.db.list('beads')[0]
        request_id = token if len(token) >= 16 else token + '0' * (16 - len(token))
        req = {'requestId': request_id, 'name': '测试', 'beads': [bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址', 'confirmedQuote': self.quote(bead)}
        return user_api.make_order(self.db, req, 'u1')

    def set_paid(self, no):
        order = self.db.get('orders', no)
        order['paymentStatus'] = 'paid'
        order['paidFen'] = order.get('totalFen', 0)
        self.db.put('orders', no, order)
        return order

    def test_unpaid_cannot_complete(self):
        no = self.make_order('sm-strict-000001')['no']
        commerce.transition_order_status(self.db, no, 'orderStatus', 'confirmed')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'orderStatus', 'completed')

    def test_unpaid_cannot_ship(self):
        no = self.make_order('sm-strict-000002')['no']
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped',
                                             logistics={'carrierName': '顺丰', 'trackingNo': 'SF123'})
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'logisticsStatus', 'shipped')

    def test_paid_but_unfulfilled_cannot_advance_logistics(self):
        no = self.make_order('sm-strict-000007')['no']
        self.set_paid(no)
        with self.assertRaisesRegex(ValueError, '发货履约'):
            commerce.transition_order_status(self.db, no, 'logisticsStatus', 'shipped')

    def test_cancelled_order_cannot_ship(self):
        no = self.make_order('sm-strict-000003')['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'orderStatus', 'cancelled')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped',
                                             logistics={'carrierName': '顺丰', 'trackingNo': 'SF123'})
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'logisticsStatus', 'shipped')

    def test_complete_requires_fulfillment_and_logistics_delivered(self):
        no = self.make_order('sm-strict-000004')['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'orderStatus', 'confirmed')
        # 未履约不能完成
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'orderStatus', 'completed')
        # 已发货（履约 shipped + 物流 shipped）但未签收不能完成
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试质检'})  # 发货前必须过质检
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped',
                                         logistics={'carrierName': '顺丰', 'trackingNo': 'SF123'})
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'orderStatus', 'completed')
        # 履约已签收、物流已签收后可完成
        commerce.transition_order_status(self.db, no, 'logisticsStatus', 'in_transit')
        commerce.transition_order_status(self.db, no, 'logisticsStatus', 'delivered')
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'delivered')
        saved = commerce.transition_order_status(self.db, no, 'orderStatus', 'completed')
        self.assertEqual(saved['orderStatus'], 'completed')

    def test_update_logistics_rejects_timestamps(self):
        no = self.make_order('sm-strict-000005')['no']
        with self.assertRaisesRegex(ValueError, '自动生成'):
            commerce.update_order_logistics(self.db, no, {'carrierName': '顺丰', 'trackingNo': 'SF1', 'shippedAt': 1700000000})
        with self.assertRaisesRegex(ValueError, '自动生成'):
            commerce.update_order_logistics(self.db, no, {'carrierName': '顺丰', 'trackingNo': 'SF1', 'signedAt': 1700000000})
        # 正常物流资料可改
        saved = commerce.update_order_logistics(self.db, no, {'carrierName': '顺丰', 'trackingNo': 'SF2', 'note': '已联系'})
        self.assertEqual(saved['logistics']['trackingNo'], 'SF2')
        self.assertNotIn('shippedAt', saved['logistics'])

    def test_ship_transition_auto_writes_shipped_at(self):
        no = self.make_order('sm-strict-000006')['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试质检'})  # 发货前必须过质检
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')
        saved = commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped',
                                                 logistics={'carrierName': '顺丰', 'trackingNo': 'SF123'})
        self.assertIsInstance(saved['logistics'].get('shippedAt'), int)

    def test_delivered_logistics_transition_auto_writes_signed_at(self):
        no = self.make_order('sm-strict-000008')['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试质检'})  # 发货前必须过质检
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')
        commerce.transition_order_status(
            self.db, no, 'fulfillmentStatus', 'shipped',
            logistics={'carrierName': '顺丰', 'trackingNo': 'SF123'})
        commerce.transition_order_status(self.db, no, 'logisticsStatus', 'in_transit')
        saved = commerce.transition_order_status(self.db, no, 'logisticsStatus', 'delivered')
        self.assertIsInstance(saved['logistics'].get('signedAt'), int)


class LogisticsMigrationTest(unittest.TestCase):
    def _run_m005(self, orders):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'test.db')
            conn = sqlite3.connect(path)
            conn.execute("CREATE TABLE orders (id TEXT PRIMARY KEY, doc TEXT NOT NULL)")
            for rid, doc in orders:
                conn.execute("INSERT INTO orders (id, doc) VALUES (?, ?)",
                             (rid, json.dumps(doc, ensure_ascii=False)))
            conn.commit()
            run_migrations(conn, SQLiteAdapter(), migrations=[m005_logistics_status])
            docs = {rid: json.loads(raw) for rid, raw in
                    conn.execute("SELECT id, doc FROM orders").fetchall()}
            conn.close()
            return docs

    def test_legacy_shipped_maps_to_shipped(self):
        docs = self._run_m005([('O1', {'status': '已发货', 'paymentStatus': 'unpaid'})])
        self.assertEqual(docs['O1']['logisticsStatus'], 'shipped')
        derived = status.derive_status(docs['O1'])
        self.assertEqual(derived['fulfillmentStatus'], 'shipped')
        self.assertEqual(derived['logisticsStatus'], 'shipped')

    def test_legacy_completed_maps_to_delivered(self):
        docs = self._run_m005([('O2', {'status': '已完成', 'paymentStatus': 'unpaid'})])
        self.assertEqual(docs['O2']['logisticsStatus'], 'delivered')
        derived = status.derive_status(docs['O2'])
        self.assertEqual(derived['fulfillmentStatus'], 'delivered')
        self.assertEqual(derived['logisticsStatus'], 'delivered')

    def test_no_shipped_fulfillment_with_not_shipped_logistics(self):
        docs = self._run_m005([
            ('O1', {'status': '已发货', 'paymentStatus': 'unpaid'}),
            ('O2', {'status': '已完成', 'paymentStatus': 'unpaid'}),
            ('O3', {'status': '待串制', 'paymentStatus': 'unpaid'}),
        ])
        for rid in ('O1', 'O2', 'O3'):
            derived = status.derive_status(docs[rid])
            self.assertFalse(
                derived['fulfillmentStatus'] == 'shipped' and derived['logisticsStatus'] == 'not_shipped',
                f"{rid} 出现 shipped/not_shipped 矛盾")

    def test_fulfillment_backfill_not_always_not_shipped(self):
        docs = self._run_m005([('O4', {'fulfillmentStatus': 'shipped', 'paymentStatus': 'paid'})])
        self.assertEqual(docs['O4']['logisticsStatus'], 'shipped')

    def test_idempotent_and_corrects_inconsistent(self):
        # 已有错误 logisticsStatus=not_shipped 但 fulfillmentStatus=shipped → 校正为 shipped
        docs = self._run_m005([('O5', {'fulfillmentStatus': 'shipped', 'logisticsStatus': 'not_shipped'})])
        self.assertEqual(docs['O5']['logisticsStatus'], 'shipped')

    def test_modern_fulfillment_wins_over_stale_legacy_status(self):
        docs = self._run_m005([(
            'O6', {'status': '待支付', 'fulfillmentStatus': 'shipped',
                   'logisticsStatus': 'in_transit'})])
        self.assertEqual(docs['O6']['logisticsStatus'], 'in_transit')

    def test_delivered_fulfillment_corrects_stale_logistics(self):
        docs = self._run_m005([(
            'O7', {'status': '已发货', 'fulfillmentStatus': 'delivered',
                   'logisticsStatus': 'shipped'})])
        self.assertEqual(docs['O7']['logisticsStatus'], 'delivered')


if __name__ == '__main__':
    unittest.main()
