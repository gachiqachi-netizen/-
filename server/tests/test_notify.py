"""B-10：订阅消息。发货 / 物流签收 / 退款到账三处发消息；未订阅不发；同订单同模板只发一次；发送失败不影响订单状态。"""
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import commerce
import notify
import routes
import user_api


class NotifyTest(unittest.TestCase):
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

    def set_paid(self, no):
        order = self.db.get('orders', no)
        order['paymentStatus'] = 'paid'
        order['paidFen'] = order.get('totalFen', 0)
        order['orderStatus'] = 'confirmed'
        self.db.put('orders', no, order)

    def subscribe(self, *templates):
        notify.subscribe(self.db, 'u1', {'templates': list(templates)})

    def logs(self, key=None):
        rows = self.db.list('notify_logs')
        return [r for r in rows if key is None or r.get('templateKey') == key]

    def ship_ready(self, no):
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True,
                                                   'appearanceOk': True, 'inspector': '测试质检'})
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')
        commerce.update_order_logistics(self.db, no, {'carrierName': '顺丰速运', 'trackingNo': 'SF123456789'})

    # ---- 迁移与表 ----

    def test_migration_creates_tables(self):
        self.assertEqual(self.db.list('notify_logs'), [])
        self.assertEqual(self.db.list('subscriptions'), [])

    # ---- send 本体 ----

    def test_send_dev_fake_records_log(self):
        self.subscribe('shipped')
        self.assertTrue(notify.send(self.db, 'u1', 'shipped', {'orderNo': 'CGZ1'}))
        (row,) = self.logs('shipped')
        self.assertEqual(row['userId'], 'u1')
        self.assertTrue(row['ok'])
        self.assertEqual(row['error'], '')
        self.assertEqual(row['data']['orderNo'], 'CGZ1')

    def test_send_failure_recorded_and_no_raise(self):
        self.subscribe('delivered')
        with mock.patch.object(notify, '_fake_send', side_effect=RuntimeError('网关炸了')):
            self.assertFalse(notify.send(self.db, 'u1', 'delivered', {}))
        (row,) = self.logs('delivered')
        self.assertFalse(row['ok'])
        self.assertIn('网关炸了', row['error'])

    def test_send_unknown_template_fails_quietly(self):
        self.assertFalse(notify.send(self.db, 'u1', 'bogus', {}))
        (row,) = self.logs('bogus')
        self.assertFalse(row['ok'])

    # ---- 未订阅不发 ----

    def test_not_subscribed_skips_and_records(self):
        no = self.make_order('notify-nosub-000001')['no']
        self.set_paid(no)
        self.ship_ready(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')
        (row,) = self.logs('shipped')
        self.assertFalse(row['ok'])
        self.assertEqual(row['error'], '未订阅')
        self.assertFalse(notify._already_sent(self.db, no, 'shipped'))  # 未订阅不算发成功，授权后还能发
        self.subscribe('shipped')
        self.assertTrue(notify.order_event(self.db, self.db.get('orders', no), 'shipped'))
        self.assertTrue(any(r['ok'] for r in self.logs('shipped')))

    def test_partial_subscription_only_sends_authorized(self):
        self.subscribe('shipped')  # 没授权 delivered
        self.assertTrue(notify.send(self.db, 'u1', 'shipped', {}))
        self.assertFalse(notify.send(self.db, 'u1', 'delivered', {}))
        self.assertEqual(self.logs('delivered')[-1]['error'], '未订阅')

    # ---- 去重：同订单同模板只发一次 ----

    def test_same_order_same_template_sent_once(self):
        self.subscribe('shipped')
        no = self.make_order('notify-dup-000001')['no']
        self.set_paid(no)
        self.ship_ready(no)
        order = self.db.get('orders', no)
        self.assertTrue(notify.order_event(self.db, order, 'shipped'))
        self.assertFalse(notify.order_event(self.db, order, 'shipped'))
        self.assertEqual(len(self.logs('shipped')), 1)

    def test_delivered_sent_once_across_groups(self):
        no = self.make_order('notify-dup-000002')['no']
        self.set_paid(no)
        self.subscribe('delivered')
        self.ship_ready(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')
        commerce.transition_order_status(self.db, no, 'logisticsStatus', 'delivered')
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'delivered')
        self.assertEqual(len(self.logs('delivered')), 1)

    # ---- 三处调用点 ----

    def test_ship_and_deliver_send_notify(self):
        self.subscribe('shipped', 'delivered')
        no = self.make_order('notify-ship-000001')['no']
        self.set_paid(no)
        self.ship_ready(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')
        shipped = self.logs('shipped')
        self.assertEqual(len(shipped), 1)
        self.assertEqual(shipped[0]['userId'], 'u1')
        self.assertEqual(shipped[0]['data']['orderNo'], no)

        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'delivered')
        self.assertEqual(len(self.logs('delivered')), 1)

    def test_idempotent_repeat_sends_nothing(self):
        self.subscribe('shipped')
        no = self.make_order('notify-idem-000001')['no']
        self.set_paid(no)
        self.ship_ready(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')  # 幂等重复
        self.assertEqual(len(self.logs('shipped')), 1)

    def test_confirm_receipt_sends_nothing(self):
        """用户自己点确认收货，不再发"已签收"（审核意见 1）。"""
        self.subscribe('delivered')
        no = self.make_order('notify-sign-000001')['no']
        self.set_paid(no)
        order = self.db.get('orders', no)
        order['fulfillmentStatus'] = 'shipped'
        order['logisticsStatus'] = 'shipped'
        self.db.put('orders', no, order)
        commerce.customer_order_action(self.db, no, 'u1', 'confirm_receipt')
        self.assertEqual(self.db.get('orders', no)['orderStatus'], 'completed')
        self.assertEqual(self.logs('delivered'), [])

    def test_refund_completed_sends_refunded(self):
        bead_map = {b['id']: b for b in self.db.list('beads')}
        unit = user_api.bead_price_fen(bead_map['zt8'])
        sub = unit * 20 + 1500
        quote = {'totalFen': sub + (0 if sub >= 9900 else 800), 'items': [{'id': 'zt8', 'unitPriceFen': unit, 'mm': 8}]}
        clean = {k: v for k, v in os.environ.items()
                 if k not in ('ENV', 'APP_ENV', 'DATABASE_URL', 'ALLOW_PUBLIC_BIND', 'PAYMENT_PROVIDER', 'MOCK_PAYMENT_IN_TRIAL')}
        with mock.patch.dict(os.environ, {**clean, 'PAYMENT_PROVIDER': 'mock'}, clear=True):
            self.subscribe('refunded')
            order = user_api.make_order(self.db, {
                'requestId': 'notify-refund-0001', 'name': '模拟退款单', 'beads': ['zt8'] * 20, 'wrist': 15,
                'gift': False, 'cord': 0, 'person': '张三', 'phone': '13800138000', 'addr': '测试地址',
                'confirmedQuote': quote}, 'u1')
            no = order['no']
            pid = user_api.start_payment(self.db, no, 'u1')['payment']['paymentId']
            user_api.mock_payment_notify(self.db, no, 'u1', pid, 'success')

            sale = user_api.request_after_sale(self.db, no, 'u1', {'type': '仅退款', 'reason': '不想要了',
                                                                   'idempotencyKey': 'idem-' + no})['afterSale']['no']
            commerce.transition_after_sale(self.db, sale, 'approve')
            commerce.transition_after_sale(self.db, sale, 'approve')
            rec = commerce.transition_after_sale(self.db, sale, 'refund')
        self.assertEqual(rec['status'], 'completed')
        self.assertEqual(self.db.get('orders', no)['paymentStatus'], 'refunded')
        refunded = self.logs('refunded')
        self.assertEqual(len(refunded), 1)
        self.assertEqual(refunded[0]['data']['orderNo'], no)

    def test_send_failure_order_still_transitions(self):
        self.subscribe('shipped')
        no = self.make_order('notify-fail-000001')['no']
        self.set_paid(no)
        self.ship_ready(no)
        with mock.patch.object(notify, '_fake_send', side_effect=RuntimeError('发送服务不可用')):
            saved = commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')
        self.assertEqual(saved['fulfillmentStatus'], 'shipped')
        self.assertEqual(self.db.get('orders', no)['fulfillmentStatus'], 'shipped')
        (row,) = self.logs('shipped')
        self.assertFalse(row['ok'])

    # ---- 订阅授权 ----

    def test_subscribe_records_authorization(self):
        doc = notify.subscribe(self.db, 'u1', {'templates': ['delivered', 'shipped', 'shipped']})
        self.assertEqual(doc['templates'], ['delivered', 'shipped'])
        self.assertEqual(self.db.get('subscriptions', 'u1')['userId'], 'u1')
        doc = notify.subscribe(self.db, 'u1', {'templates': []})  # 空列表 = 取消全部
        self.assertEqual(doc['templates'], [])

    def test_subscribe_rejects_bad_input(self):
        with self.assertRaises(ValueError):
            notify.subscribe(self.db, 'u1', {'templates': ['bogus']})
        with self.assertRaises(ValueError):
            notify.subscribe(self.db, 'u1', {'templates': 'shipped'})
        with self.assertRaises(ValueError):
            notify.subscribe(self.db, 'u1', {})

    def test_route_registered(self):
        table = routes.load()
        self.assertTrue(any(m == 'POST' and p.pattern == r'^/api/my/subscriptions$' and a == 'user'
                            for m, p, f, a in table))


if __name__ == '__main__':
    unittest.main()
