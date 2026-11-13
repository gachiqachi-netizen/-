import copy
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import commerce
import contract
import order_view
import user_api
from db import DB


def make(**groups):
    return dict(orderStatus='confirmed', paymentStatus='paid', fulfillmentStatus='unfulfilled',
                logisticsStatus='not_shipped', afterSaleStatus='none', **{}) | groups


CUSTOMER_CASES = [
    ('requested', {'afterSaleStatus': 'requested'}, 'after_sale_open', '售后正在处理，有进展会通知你。', None),
    ('reviewing', {'afterSaleStatus': 'reviewing'}, 'after_sale_open', '售后正在处理，有进展会通知你。', None),
    ('approved', {'afterSaleStatus': 'approved'}, 'after_sale_open', '售后正在处理，有进展会通知你。', None),
    ('returning', {'afterSaleStatus': 'returning'}, 'after_sale_open', '售后正在处理，有进展会通知你。', None),
    ('after_refunding', {'afterSaleStatus': 'refunding'}, 'after_sale_open', '售后正在处理，有进展会通知你。', None),
    ('after_done', {'afterSaleStatus': 'completed'}, 'after_sale_done', '售后已经处理完了。', None),
    ('after_rejected', {'afterSaleStatus': 'rejected'}, 'after_sale_rejected', '售后申请没有通过，原因在售后详情里。', None),
    ('cancelled', {'orderStatus': 'cancelled'}, 'cancelled', '这笔订单已取消，没有扣款。', 'reorder'),
    ('closed_refunded', {'orderStatus': 'closed', 'paymentStatus': 'refunded'}, 'cancelled', '这笔订单已取消，钱已原路退回。', 'reorder'),
    ('refunding', {'paymentStatus': 'refunding'}, 'refunding', '钱正在原路退回。', None),
    ('refunded', {'paymentStatus': 'refunded'}, 'refunded', '钱已原路退回。', None),
    ('refund_failed', {'paymentStatus': 'refund_failed'}, 'refund_failed', '退款没成功，我们在处理。', None),
    ('completed', {'orderStatus': 'completed'}, 'completed', '戴得开心。', 'reorder'),
    ('delivered', {'logisticsStatus': 'delivered'}, 'delivered', '快递显示已签收，确认没问题就点确认收货。', 'confirm_receipt'),
    ('shipped', {'logisticsStatus': 'shipped'}, 'in_transit', '快件已发出。', 'view_logistics'),
    ('in_transit', {'logisticsStatus': 'in_transit', 'logistics': {'trackingNo': 'TEST-001', 'carrierName': '测试快递'}}, 'in_transit', '已交给测试快递，单号 TEST-001', 'view_logistics'),
    ('carrier_fallback', {'logisticsStatus': 'shipped', 'logistics': {'trackingNo': 'TEST-001'}}, 'in_transit', '已交给快递，单号 TEST-001', 'view_logistics'),
    ('exception', {'logisticsStatus': 'exception'}, 'logistics_issue', '快递遇到问题，我们在处理，有进展会通知你。', None),
    ('returned', {'logisticsStatus': 'returned'}, 'logistics_issue', '快递遇到问题，我们在处理，有进展会通知你。', None),
    ('ready', {'fulfillmentStatus': 'ready_to_ship'}, 'ready_to_ship', '手串做好了，等快递来取。', None),
    ('producing', {'fulfillmentStatus': 'producing'}, 'producing', '师傅正在串你的手串。', None),
    ('paid_unfulfilled', {}, 'producing', '师傅正在串你的手串。', None),
    ('unpaid', {'paymentStatus': 'unpaid'}, 'pending_payment', '还没付款，订单已为你保留。', 'pay_order'),
    ('paying', {'paymentStatus': 'paying'}, 'pending_payment', '还没付款，订单已为你保留。', 'pay_order'),
    ('pay_failed', {'paymentStatus': 'pay_failed'}, 'pending_payment', '还没付款，订单已为你保留。', 'pay_order'),
    ('processing', {'fulfillmentStatus': 'shipped'}, 'processing', '订单正在处理。', None),
    ('after_closed', {'afterSaleStatus': 'closed'}, 'producing', '师傅正在串你的手串。', None),
]
OPS_CASES = [
    ('after', {'afterSaleStatus': 'rejected', 'orderStatus': 'cancelled'}, 'after_sale'),
    ('cancelled', {'orderStatus': 'cancelled'}, 'cancelled'),
    ('closed', {'orderStatus': 'closed'}, 'closed'),
    ('unpaid', {'paymentStatus': 'unpaid'}, 'unpaid'),
    ('to_make', {}, 'to_make'),
    ('qc_failed', {'fulfillmentStatus': 'producing', 'qualityGate': {'passed': False}}, 'qc_failed'),
    ('producing', {'fulfillmentStatus': 'producing'}, 'producing'),
    ('ready', {'fulfillmentStatus': 'ready_to_ship'}, 'ready_to_ship'),
    ('exception', {'fulfillmentStatus': 'shipped', 'logisticsStatus': 'exception'}, 'logistics_issue'),
    ('shipped', {'fulfillmentStatus': 'shipped'}, 'shipped'),
    ('delivered', {'fulfillmentStatus': 'delivered'}, 'completed'),
    ('completed', {'orderStatus': 'completed', 'fulfillmentStatus': 'delivered'}, 'completed'),
    ('fallback', {'fulfillmentStatus': 'unknown'}, 'producing'),
]


class OrderViewTest(unittest.TestCase):
    def test_action_must_be_allowed(self):
        self.assertIsNone(order_view.customer_status(make(paymentStatus='unpaid'), [])['primaryAction'])

    def test_progress_four_steps_and_first_history(self):
        order = make(createdAt=1, logistics={'shippedAt': 9, 'signedAt': 4}, statusHistory=[
            {'group': 'fulfillmentStatus', 'to': 'producing', 'at': 2},
            {'group': 'fulfillmentStatus', 'to': 'producing', 'at': 20},
            {'group': 'paymentStatus', 'to': 'shipped', 'at': 30},
            {'group': 'fulfillmentStatus', 'to': 'shipped', 'at': 3}])
        result = order_view.progress(order)
        self.assertTrue(result['show'])
        self.assertEqual([s['at'] for s in result['steps']], [1, 2, 3, 4])
        self.assertTrue(all(s['done'] for s in result['steps']))
        self.assertEqual([(s['key'], s['label']) for s in result['steps']], contract.PROGRESS_STEPS)

    def test_progress_cancelled_hidden(self):
        self.assertFalse(order_view.progress(make(orderStatus='cancelled'))['show'])

    def test_progress_shipping_fallback(self):
        result = order_view.progress(make(createdAt=1, logistics={'shippedAt': 3}))
        self.assertEqual([s['done'] for s in result['steps']], [True, False, True, False])

    def test_progress_hidden_states(self):
        for groups in [{'orderStatus': 'closed'}, {'paymentStatus': 'refunding'}, {'paymentStatus': 'refunded'},
                       {'paymentStatus': 'refund_failed'}, {'afterSaleStatus': 'requested'}]:
            with self.subTest(groups=groups):
                self.assertFalse(order_view.progress(make(**groups))['show'])
        self.assertTrue(order_view.progress(make(afterSaleStatus='closed'))['show'])

    def test_functions_do_not_mutate_order(self):
        order = make(createdAt=1)
        before = copy.deepcopy(order)
        order_view.customer_status(order, [])
        order_view.ops_status(order)
        order_view.progress(order)
        self.assertEqual(order, before)

    def test_public_and_admin_interfaces(self):
        order = make(no='TEST-ORDER', beads=[], createdAt=1)
        public = user_api.public_order(order)
        self.assertIn('customerStatus', public)
        self.assertIn('progress', public)
        with tempfile.TemporaryDirectory() as folder:
            db = DB(os.path.join(folder, 'test.db'))
            try:
                db.put('orders', order['no'], order)
                self.assertEqual(commerce.order_detail(db, order['no'])['opsStatus']['code'], 'to_make')
                self.assertEqual(commerce.list_orders(db)[0]['opsStatus']['code'], 'to_make')
            finally:
                db.conn.close()


def customer_case(groups, code, desc, action):
    def test(self):
        result = order_view.customer_status(make(**groups), ['pay_order', 'reorder', 'confirm_receipt', 'view_logistics'])
        self.assertEqual(result, {'code': code, **contract.CUSTOMER_STATUS[code], 'desc': desc, 'primaryAction': action})
    return test


def ops_case(groups, code):
    def test(self):
        self.assertEqual(order_view.ops_status(make(**groups)), {'code': code, **contract.OPS_STATUS[code]})
    return test


for name, groups, code, desc, action in CUSTOMER_CASES:
    setattr(OrderViewTest, 'test_customer_' + name, customer_case(groups, code, desc, action))
for name, groups, code in OPS_CASES:
    setattr(OrderViewTest, 'test_ops_' + name, ops_case(groups, code))
