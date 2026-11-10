"""退款真实性与额度约束测试。

覆盖：管理员不能把退款类售后标成 completed；未支付订单（paidFen=0）不能退款；
退款总额（reserved + requested）不能超过 paidFen；idempotencyKey 幂等；
并发退款请求不突破 paidFen；refunding 不等于退款成功（refundedFen 恒 0）；
补发仍可 completed、退款类 approved 后不能再 receive/complete。
"""
import os
import sys
import tempfile
import threading
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import commerce
import status
import user_api


class RefundTruthTest(unittest.TestCase):
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

    def set_paid(self, no, paid_fen):
        order = self.db.get('orders', no)
        order['paymentStatus'] = 'paid'
        order['paidFen'] = paid_fen
        self.db.put('orders', no, order)
        return order

    # ---- 1. 管理员不能把退款类售后标成 completed ----

    def test_admin_cannot_complete_refund_after_sale(self):
        no = self.make_order('rt-complete-000001')['no']
        self.set_paid(no, paid_fen=1000)
        rec = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                   'reason': '不想要了', 'refundFen': 100})
        rec = commerce.transition_after_sale(self.db, rec['no'], 'approve')  # requested → reviewing
        rec = commerce.transition_after_sale(self.db, rec['no'], 'approve')  # reviewing → approved
        self.assertEqual(rec['status'], 'approved')
        # approved 后 receive 不能推进到 refunding
        with self.assertRaises(ValueError) as ctx:
            commerce.transition_after_sale(self.db, rec['no'], 'receive')
        self.assertIn('真实退款服务尚未接入', str(ctx.exception))
        # approved 后 complete 也不能把退款类标成 completed
        with self.assertRaises(ValueError):
            commerce.transition_after_sale(self.db, rec['no'], 'complete')
        self.assertEqual(commerce.after_sale_detail(self.db, rec['no'])['status'], 'approved')

        # 即便历史遗留 refunding 记录，也不能 complete 到 completed
        legacy = dict(rec)
        legacy['status'] = 'refunding'
        self.db.put('after_sales', legacy['no'], legacy)
        with self.assertRaises(ValueError) as ctx:
            commerce.transition_after_sale(self.db, legacy['no'], 'complete')
        self.assertIn('真实退款服务尚未接入', str(ctx.exception))

    # ---- 2. 未支付订单（paidFen=0）不能退款 ----

    def test_unpaid_order_cannot_refund(self):
        no = self.make_order('rt-unpaid-000001')['no']
        order = self.db.get('orders', no)
        self.assertGreater(order['totalFen'], 0)  # 未支付订单仍有应付金额
        self.assertEqual(order['paidFen'], 0)
        with self.assertRaises(ValueError):
            commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                 'reason': '不想要了', 'refundFen': 100})

    # ---- 3. 退款总额（reserved + requested）不能超过 paidFen ----

    def test_refund_total_cannot_exceed_paid(self):
        no = self.make_order('rt-total-00000001')['no']
        self.set_paid(no, paid_fen=1000)
        # 已有一笔有效售后预占 700，可退额度只剩 300
        self.db.put('after_sales', 'AS-RES', {'no': 'AS-RES', 'orderNo': no, 'type': '仅退款',
                                              'status': 'requested', 'reservedFen': 700,
                                              'refundedFen': 0, 'requestedFen': 700})
        order = self.db.get('orders', no)
        with self.assertRaises(ValueError):
            commerce._check_refund_constraints(order, 400, self.db)
        commerce._check_refund_constraints(order, 300, self.db)

    # ---- 4. 同一 idempotencyKey 不会创建两条售后记录 ----

    def test_idempotency_key_prevents_duplicate(self):
        no = self.make_order('rt-idempotency-01')['no']
        self.set_paid(no, paid_fen=1000)
        key = 'refund-key-0000000001'
        rec1 = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                    'reason': '不想要了', 'refundFen': 100,
                                                    'idempotencyKey': key})
        rec2 = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                    'reason': '不想要了', 'refundFen': 100,
                                                    'idempotencyKey': key})
        self.assertEqual(rec1['no'], rec2['no'])
        self.assertTrue(rec2.get('idempotent'))
        sales = [a for a in self.db.list('after_sales') if a.get('orderNo') == no]
        self.assertEqual(len(sales), 1)
        # 同一幂等键改金额不是重试，必须拒绝，不能静默返回旧记录
        with self.assertRaises(ValueError) as ctx:
            commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                 'reason': '不想要了', 'refundFen': 200,
                                                 'idempotencyKey': key})
        self.assertIn('幂等键已用', str(ctx.exception))
        self.assertEqual(len([a for a in self.db.list('after_sales') if a.get('orderNo') == no]), 1)
        # 非法幂等键抛错
        with self.assertRaises(ValueError):
            commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                 'reason': 'x', 'refundFen': 0,
                                                 'idempotencyKey': 'short'})

    def test_refund_amount_must_be_positive_but_resend_can_be_zero(self):
        no = self.make_order('rt-positive-000001')['no']
        self.set_paid(no, paid_fen=1000)
        for atype in ('仅退款', '退货退款'):
            with self.assertRaises(ValueError) as ctx:
                commerce.create_after_sale(self.db, {'orderNo': no, 'type': atype,
                                                     'reason': '退款', 'refundFen': 0})
            self.assertIn('必须大于 0', str(ctx.exception))
        resend = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '补发',
                                                      'reason': '珠子有瑕疵', 'refundFen': 0})
        self.assertEqual(resend['reservedFen'], 0)

    # ---- 5. 两个并发退款请求不会突破 paidFen ----

    def test_concurrent_refunds_do_not_exceed_paid(self):
        no = self.make_order('rt-concurrent-01')['no']
        self.set_paid(no, paid_fen=1000)
        barrier = threading.Barrier(2)
        results = []

        def worker(amount):
            barrier.wait()
            try:
                rec = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                           'reason': '并发退款', 'refundFen': amount})
                results.append(('ok', rec['no']))
            except ValueError as e:
                results.append(('err', str(e)))

        threads = [threading.Thread(target=worker, args=(600,)) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        ok_count = sum(1 for r in results if r[0] == 'ok')
        self.assertEqual(ok_count, 1, results)
        reserved = commerce._order_reserved_fen(self.db, no)
        self.assertLessEqual(reserved, 1000)

    # ---- 6. refunding 不等于退款成功（refundedFen 恒为 0）----

    def test_refunding_is_not_refund_success(self):
        no = self.make_order('rt-refunded-000001')['no']
        self.set_paid(no, paid_fen=1000)
        rec = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款',
                                                   'reason': '不想要了', 'refundFen': 500})
        self.assertEqual(rec['refundedFen'], 0)
        rec = commerce.transition_after_sale(self.db, rec['no'], 'approve')
        rec = commerce.transition_after_sale(self.db, rec['no'], 'approve')
        self.assertEqual(rec['status'], 'approved')
        self.assertEqual(rec['refundedFen'], 0)  # 无真实回调，可信退款金额不增加
        self.assertEqual(commerce._order_refunded_fen(self.db, no), 0)

    # ---- 7. 补发仍可 completed；退款类 approved 后不能再 receive/complete ----

    def test_resend_can_complete_and_refund_cannot(self):
        # 补发仍可 approved → completed
        no1 = self.make_order('rt-resend-000001')['no']
        resend = commerce.create_after_sale(self.db, {'orderNo': no1, 'type': '补发',
                                                      'reason': '珠子有瑕疵', 'refundFen': 0})
        resend = commerce.transition_after_sale(self.db, resend['no'], 'approve')
        resend = commerce.transition_after_sale(self.db, resend['no'], 'approve')
        self.assertEqual(resend['status'], 'approved')
        resend = commerce.transition_after_sale(self.db, resend['no'], 'complete')
        self.assertEqual(resend['status'], 'completed')

        # 退款类 approved 后不再返回 receive / complete 动作
        no2 = self.make_order('rt-refund-000001')['no']
        self.set_paid(no2, paid_fen=1000)
        refund = commerce.create_after_sale(self.db, {'orderNo': no2, 'type': '仅退款',
                                                      'reason': '不想要了', 'refundFen': 100})
        refund = commerce.transition_after_sale(self.db, refund['no'], 'approve')
        refund = commerce.transition_after_sale(self.db, refund['no'], 'approve')
        self.assertEqual(refund['status'], 'approved')
        actions = commerce.after_sale_allowed_actions(refund)
        self.assertNotIn('receive', actions)
        self.assertNotIn('complete', actions)
        with self.assertRaises(ValueError):
            commerce.transition_after_sale(self.db, refund['no'], 'receive')
        with self.assertRaises(ValueError):
            commerce.transition_after_sale(self.db, refund['no'], 'complete')


if __name__ == '__main__':
    unittest.main()
