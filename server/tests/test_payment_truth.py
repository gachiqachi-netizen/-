"""支付状态真相加固测试。

覆盖：创建订单默认 unpaid；管理员/客户端不能把订单改成 paid（mark_paid 抛错）；
同一回调编号幂等（结构表达）；金额不符拒绝；支付迁移表驱动测试合法/非法。
"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import commerce
import payments
import status
import user_api


class PaymentTruthTest(unittest.TestCase):
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

    def make_order(self, request_id, extra=None):
        bead = self.db.list('beads')[0]
        req = {'requestId': request_id, 'name': '测试', 'beads': [bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址', 'confirmedQuote': self.quote(bead)}
        if extra:
            req.update(extra)
        return user_api.make_order(self.db, req, 'u1')

    # ---- 1. 创建订单默认 unpaid ----

    def test_new_order_defaults_to_unpaid(self):
        order = self.make_order('pay-truth-000001')
        self.assertEqual(order['paymentStatus'], 'unpaid')
        self.assertEqual(status.new_order_status()['paymentStatus'], 'unpaid')

    # ---- 2. 客户端不能指定支付状态 ----

    def test_client_cannot_supply_payment_status(self):
        for extra in ({'paymentStatus': 'paid'}, {'paymentStatus': 'unpaid'}, {'paymentStatus': 'paying'}):
            with self.assertRaises(ValueError):
                self.make_order('pay-truth-000002', extra)

    # ---- 3. 管理员/客户端不能把订单改成 paid（mark_paid 抛错）----

    def test_mark_paid_raises_not_integrated(self):
        order = self.make_order('pay-truth-000003')
        saved = self.db.get('orders', order['no'])
        with self.assertRaises(RuntimeError) as ctx:
            payments.mark_paid(saved, {'id': 'cb-1', 'amountFen': payments.payable_fen(saved)})
        self.assertIn('未接真实支付', str(ctx.exception))
        # 状态未被改动
        self.assertEqual(self.db.get('orders', order['no'])['paymentStatus'], 'unpaid')

    def test_admin_transition_payment_status_rejected(self):
        order = self.make_order('pay-truth-000004')
        no = order['no']
        for to in ('paid', 'unpaid', 'paying'):
            with self.assertRaises(ValueError):
                commerce.transition_order_status(self.db, no, 'paymentStatus', to)

    # ---- 4. 重复回调幂等（结构表达）----

    def test_callback_idempotency_structure(self):
        order = {'paymentCallbacks': ['cb-dup']}
        self.assertTrue(payments.is_callback_processed(order, 'cb-dup'))
        self.assertFalse(payments.is_callback_processed(order, 'cb-new'))
        self.assertFalse(payments.is_callback_processed({}, 'cb-new'))

    # ---- 5. 金额不符拒绝 ----

    def test_amount_mismatch_rejected(self):
        order = {'totalFen': 5600}
        payments.assert_amount_matches(order, {'amountFen': 5600})
        with self.assertRaises(ValueError):
            payments.assert_amount_matches(order, {'amountFen': 5599})
        with self.assertRaises(ValueError):
            payments.assert_amount_matches(order, {'amountFen': 5601})
        with self.assertRaises(ValueError):
            payments.assert_amount_matches(order, {'amountFen': '5600'})

    def test_payable_fen_compatible_with_totalFen(self):
        self.assertEqual(payments.payable_fen({'totalFen': 5600}), 5600)
        self.assertEqual(payments.payable_fen({'payableFen': 5700}), 5700)
        # payableFen 优先于 totalFen（字段名将统一）
        self.assertEqual(payments.payable_fen({'totalFen': 5600, 'payableFen': 5700}), 5700)

    # ---- 6. 支付迁移表表驱动测试 ----

    def test_payment_transition_table(self):
        legal = [
            ('unpaid', 'paying'), ('unpaid', 'paid'), ('unpaid', 'closed'),
            ('paying', 'paid'), ('paying', 'pay_failed'),
            ('paid', 'refunding'), ('paid', 'closed'),
            ('refunding', 'refunded'), ('refunding', 'refund_failed'),
            ('refund_failed', 'refunding'), ('refund_failed', 'closed'),
            ('unpaid', 'unpaid'), ('paid', 'paid'), ('refunded', 'refunded'),  # 幂等
        ]
        for from_, to_ in legal:
            self.assertTrue(payments.payment_transition(from_, to_), f"{from_} → {to_} 应合法")

    def test_payment_transition_table_illegal(self):
        bad = [('unpaid', 'refunding'), ('unpaid', 'refunded'), ('unpaid', 'pay_failed'),
               ('paying', 'refunding'), ('paying', 'closed'), ('paid', 'pay_failed'),
               ('refunding', 'paid'), ('refunding', 'closed'),
               ('refunded', 'refunding'), ('refunded', 'paid'),
               ('closed', 'paid'), ('closed', 'unpaid'),
               ('pay_failed', 'paid'), ('pay_failed', 'refunding')]
        for from_, to_ in bad:
            with self.assertRaises(ValueError, msg=f"{from_} → {to_} 应非法"):
                payments.payment_transition(from_, to_)
        # 终态不再变：refunded / closed / pay_failed
        for terminal in ('refunded', 'closed', 'pay_failed'):
            self.assertEqual(status.PAYMENT_TRANSITIONS[terminal], set(), terminal)

    def test_payment_statuses_are_eight(self):
        self.assertEqual(status.PAYMENT_STATUSES,
                         ["unpaid", "paying", "paid", "pay_failed", "refunding", "refunded", "refund_failed", "closed"])
        for value in status.PAYMENT_STATUSES:
            self.assertTrue(status.status_label("paymentStatus", value), value)

    # ---- 7. 旧演示单不再显示为已支付 ----

    def test_legacy_demo_orders_not_paid(self):
        for legacy in ('待串制', '串制中', '已发货', '已完成'):
            derived = status.derive_status({'status': legacy})
            self.assertEqual(derived['paymentStatus'], 'unpaid', legacy)

    def test_refund_amount_validation(self):
        order = {'totalFen': 5600}
        payments.validate_refund_amount(order, 0)
        payments.validate_refund_amount(order, 5600)
        with self.assertRaises(ValueError):
            payments.validate_refund_amount(order, 5601)
        with self.assertRaises(ValueError):
            payments.validate_refund_amount(order, -1)

    def test_handle_refund_raises_not_integrated(self):
        order = {'totalFen': 5600}
        with self.assertRaises(RuntimeError):
            payments.handle_refund(order, 1000)


if __name__ == '__main__':
    unittest.main()
