"""跨状态约束状态机测试：订单/支付/履约/物流/售后的迁移表、跨状态约束、幂等、审计还原。

表驱动覆盖五组状态的所有关键合法/非法转换；再用临时 SQLite 走 commerce 入口，
验证跨状态约束（未支付不能制作/发货、未发货不能签收、未支付不能退款、退款不超实付、
退款完成不能重复、取消后不能履约）、幂等（重复转换不重复写历史）与审计还原。
"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import commerce
import status
import user_api


class TransitionTableTest(unittest.TestCase):
    def _run(self, group, pairs):
        for from_, to, ok in pairs:
            if ok:
                status.validate_transition(group, from_, to)
            else:
                with self.assertRaises(ValueError, msg=f"{group}: {from_}->{to}"):
                    status.validate_transition(group, from_, to)

    def test_order_transitions(self):
        self._run("orderStatus", [
            ("pending_confirmation", "confirmed", True),
            ("pending_confirmation", "cancelled", True),
            ("confirmed", "completed", True),
            ("confirmed", "closed", True),
            ("cancelled", "confirmed", False),
            ("completed", "confirmed", False),
            ("closed", "confirmed", False),
            ("pending_confirmation", "completed", False),
        ])

    def test_fulfillment_transitions(self):
        self._run("fulfillmentStatus", [
            ("unfulfilled", "producing", True),
            ("producing", "ready_to_ship", True),
            ("producing", "returned", True),
            ("ready_to_ship", "shipped", True),
            ("ready_to_ship", "returned", True),
            ("shipped", "delivered", True),
            ("shipped", "exception", True),
            ("shipped", "returned", True),
            ("exception", "shipped", True),
            ("exception", "returned", True),
            ("ready_to_ship", "delivered", False),
            ("unfulfilled", "shipped", False),
            ("delivered", "shipped", False),
            ("returned", "shipped", False),
        ])

    def test_logistics_transitions(self):
        self._run("logisticsStatus", [
            ("not_shipped", "shipped", True),
            ("shipped", "in_transit", True),
            ("shipped", "delivered", True),
            ("shipped", "exception", True),
            ("in_transit", "delivered", True),
            ("in_transit", "exception", True),
            ("exception", "in_transit", True),
            ("exception", "returned", True),
            ("not_shipped", "in_transit", False),
            ("not_shipped", "delivered", False),
            ("delivered", "in_transit", False),
            ("returned", "in_transit", False),
        ])

    def test_after_sale_transitions(self):
        self._run("afterSaleStatus", [
            ("requested", "reviewing", True),
            ("requested", "rejected", True),
            ("requested", "closed", True),
            ("reviewing", "approved", True),
            ("reviewing", "rejected", True),
            ("reviewing", "closed", True),
            ("approved", "returning", True),
            ("approved", "refunding", True),
            ("approved", "completed", True),
            ("approved", "closed", True),
            ("returning", "refunding", True),
            ("returning", "closed", True),
            ("refunding", "completed", True),
            ("refunding", "closed", True),
            ("rejected", "closed", True),
            ("requested", "approved", False),  # 必须经过 reviewing
            ("completed", "closed", False),
            ("closed", "completed", False),
        ])

    def test_payment_is_not_transitionable(self):
        # 支付状态迁移表允许 unpaid→paid（真实支付回调内部推进路径）；
        # 后台手工推进由 commerce.transition_order_status 对 paymentStatus 拒绝，
        # 见 test_payment_truth.py::test_admin_transition_payment_status_rejected。
        self.assertTrue(status.validate_transition("paymentStatus", "unpaid", "paid"))

    def test_next_states(self):
        self.assertEqual(status.next_states("logisticsStatus", "shipped"),
                         ["delivered", "exception", "in_transit"])
        self.assertEqual(status.next_states("orderStatus", "completed"), [])


class CrossStateConstraintTest(unittest.TestCase):
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

    def set_paid(self, no, paid_fen=None):
        order = self.db.get('orders', no)
        order['paymentStatus'] = 'paid'
        order['paidFen'] = paid_fen if paid_fen is not None else order.get('totalFen', 0)
        self.db.put('orders', no, order)
        return order

    # ---- 初始状态 ----

    def test_new_order_initial_logistics_not_shipped(self):
        order = self.make_order('sm-init-000001')
        self.assertEqual(self.db.get('orders', order['no'])['logisticsStatus'], 'not_shipped')
        groups = status.new_order_status()
        self.assertEqual(groups['logisticsStatus'], 'not_shipped')

    # ---- 跨状态约束 ----

    def test_unpaid_cannot_start_fulfillment(self):
        no = self.make_order('sm-unpaid-000001')['no']
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')

    def test_paid_can_start_fulfillment(self):
        no = self.make_order('sm-paid-000001')['no']
        self.set_paid(no)
        saved = commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        self.assertEqual(saved['fulfillmentStatus'], 'producing')

    def test_unshipped_cannot_mark_in_transit_or_delivered(self):
        no = self.make_order('sm-ship-000001')['no']
        self.set_paid(no)
        # 未发货（logisticsStatus == not_shipped）不能标记运输中/已签收
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'logisticsStatus', 'in_transit')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'logisticsStatus', 'delivered')

    def test_ship_links_fulfillment_and_logistics(self):
        no = self.make_order('sm-link-000001')['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试质检'})  # 发货前必须过质检
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')
        saved = commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped',
                                                 logistics={'carrierName': '顺丰', 'trackingNo': 'SF123'})
        self.assertEqual(saved['fulfillmentStatus'], 'shipped')
        self.assertEqual(saved['logisticsStatus'], 'shipped')
        # 履约联动后，物流维度可推进运输中/签收
        saved = commerce.transition_order_status(self.db, no, 'logisticsStatus', 'in_transit')
        self.assertEqual(saved['logisticsStatus'], 'in_transit')
        saved = commerce.transition_order_status(self.db, no, 'logisticsStatus', 'delivered')
        self.assertEqual(saved['logisticsStatus'], 'delivered')

    def test_cancelled_order_cannot_fulfill(self):
        no = self.make_order('sm-cancel-000001')['no']
        commerce.transition_order_status(self.db, no, 'orderStatus', 'cancelled')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')

    def test_unpaid_cannot_refund(self):
        no = self.make_order('sm-refund-000001')['no']
        with self.assertRaises(ValueError):
            commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款', 'reason': '不想要了', 'refundFen': 100})

    def test_refund_cannot_exceed_paid(self):
        no = self.make_order('sm-refund-000002')['no']
        self.set_paid(no, paid_fen=1000)
        with self.assertRaises(ValueError):
            commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款', 'reason': '退款超了', 'refundFen': 1001})

    def test_refunded_order_cannot_refund_again(self):
        no = self.make_order('sm-refund-000003')['no']
        self.set_paid(no, paid_fen=1000)
        order = self.db.get('orders', no)
        order['paymentStatus'] = 'refunded'
        self.db.put('orders', no, order)
        with self.assertRaises(ValueError):
            commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款', 'reason': '再次退款', 'refundFen': 100})

    def test_cumulative_refund_cannot_exceed_paid(self):
        no = self.make_order('sm-refund-000004')['no']
        self.set_paid(no, paid_fen=1000)
        # 已有 500 分可信退款回调确认（refundedFen），再退 600 会超实付
        self.db.put('after_sales', 'AS-CUM', {'no': 'AS-CUM', 'orderNo': no, 'type': '仅退款',
                                              'status': 'completed', 'refundedFen': 500, 'reservedFen': 0})
        order = self.db.get('orders', no)
        with self.assertRaises(ValueError):
            commerce._check_refund_constraints(order, 600, self.db)
        # 500 + 400 = 900 不超
        commerce._check_refund_constraints(order, 400, self.db)

    # ---- 幂等 ----

    def test_repeat_transition_is_idempotent(self):
        no = self.make_order('sm-idem-000001')['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        before = len(self.db.get('orders', no)['statusHistory'])
        # 重复同一转换：返回当前状态，不重复写历史
        saved = commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        self.assertEqual(saved['fulfillmentStatus'], 'producing')
        self.assertEqual(len(self.db.get('orders', no)['statusHistory']), before)

    def test_order_status_repeat_transition_is_idempotent(self):
        no = self.make_order('sm-idem-000002')['no']
        o = self.db.get('orders', no); self.db.put('orders', no, {**o, 'paymentStatus': 'paid', 'paidFen': o.get('payableFen') or o.get('totalFen') or 0})  # A4c：只有已付款订单能手动确认
        commerce.transition_order_status(self.db, no, 'orderStatus', 'confirmed')
        before = len(self.db.get('orders', no)['statusHistory'])
        commerce.transition_order_status(self.db, no, 'orderStatus', 'confirmed')
        self.assertEqual(len(self.db.get('orders', no)['statusHistory']), before)

    # ---- 审计可还原状态变化 ----

    def test_audit_and_history_reconstruct_process(self):
        no = self.make_order('sm-audit-000001')['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'orderStatus', 'confirmed')
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试质检'})  # 发货前必须过质检
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')

        order = self.db.get('orders', no)
        chain = [(h['group'], h['from'], h['to']) for h in order['statusHistory']]
        self.assertIn(('orderStatus', 'pending_confirmation', 'confirmed'), chain)
        self.assertIn(('fulfillmentStatus', 'unfulfilled', 'producing'), chain)
        self.assertIn(('fulfillmentStatus', 'producing', 'ready_to_ship'), chain)
        transitions = [a for a in self.db.list('audit_logs') if a.get('action') == 'transition' and a.get('target') == 'order']
        self.assertTrue(transitions)

    # ---- 服务端权威：allowedTransitions ----

    def test_order_detail_returns_allowed_transitions(self):
        no = self.make_order('sm-allowed-000001')['no']
        self.set_paid(no)
        detail = commerce.order_detail(self.db, no)
        self.assertIn('allowedTransitions', detail)
        self.assertIn('producing', detail['allowedTransitions']['fulfillmentStatus'])
        # 物流维度不单独提供「发货」按钮（由履约联动）
        self.assertNotIn('shipped', detail['allowedTransitions']['logisticsStatus'])

    def test_after_sale_allowed_actions_respect_reviewing(self):
        no = self.make_order('sm-asa-000001')['no']
        self.set_paid(no, paid_fen=1000)
        rec = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款', 'reason': '不想要了', 'refundFen': 100})
        detail = commerce.after_sale_detail(self.db, rec['no'])
        self.assertEqual(detail['status'], 'requested')
        self.assertIn('reviewing', detail['allowedTransitions'])
        self.assertIn('approve', detail['allowedActions'])
        self.assertIn('reject', detail['allowedActions'])
        # 审核中后可同意到 approved
        rec = commerce.transition_after_sale(self.db, rec['no'], 'approve')
        self.assertEqual(rec['status'], 'reviewing')
        rec = commerce.transition_after_sale(self.db, rec['no'], 'approve')
        self.assertEqual(rec['status'], 'approved')


if __name__ == '__main__':
    unittest.main()
