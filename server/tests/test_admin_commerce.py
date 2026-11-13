"""后台电商模块（商品/模板/订单状态/物流/售后/条款/审计）的单元测试。

用临时 SQLite，直接调用 commerce / user_api / status 的逻辑层函数，不依赖 app 模块的全局 db。
on_sale_catalog 的过滤逻辑按 app.on_sale_catalog 复刻，避免全局状态污染。
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


class AdminCommerceTest(unittest.TestCase):
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
        """直接改库把订单标记为已支付（支付状态不可走状态机入口手工修改）。"""
        order = self.db.get('orders', no)
        order['paymentStatus'] = 'paid'
        order['paidFen'] = order.get('totalFen', 0)
        self.db.put('orders', no, order)

    def on_sale_bead_ids(self):
        """复刻 app.on_sale_catalog 里的珠子过滤：在售 + 有尺寸 + 珠子/隔片。"""
        return {b['id'] for b in self.db.list('beads')
                if b.get('onSale', True) and (b.get('mm') or 0) > 0
                and status.product_type(b) in ('bead', 'spacer')}

    # ---- 1. 商品生命周期 ----

    def test_product_lifecycle(self):
        rid = 'test-bead-01'
        doc = commerce.create_product(self.db, {'id': rid, 'name': '测试手串珠', 'type': 'bead', 'mat': 'wood',
                                                'mm': 8, 'price': 3.5, 'status': 'draft'})
        self.assertEqual(doc['status'], 'draft')
        self.assertFalse(doc['onSale'])
        self.assertNotIn(rid, self.on_sale_bead_ids())

        # 上架
        doc = commerce.update_product(self.db, rid, {'name': '测试手串珠', 'type': 'bead', 'mat': 'wood', 'mm': 8,
                                                     'price': 3.5, 'status': 'on_sale', 'images': ['a.jpg', 'b.jpg']})
        self.assertTrue(doc['onSale'])
        self.assertEqual(doc['photo'], 'a.jpg')
        self.assertEqual(doc['priceFen'], 350)
        self.assertIn(rid, self.on_sale_bead_ids())

        # 下架
        doc = commerce.update_product(self.db, rid, {'name': '测试手串珠', 'type': 'bead', 'mat': 'wood', 'mm': 8,
                                                     'price': 3.5, 'status': 'off_sale', 'images': ['a.jpg', 'b.jpg']})
        self.assertEqual(doc['status'], 'off_sale')
        self.assertFalse(doc['onSale'])
        self.assertNotIn(rid, self.on_sale_bead_ids())

        # 归档
        doc = commerce.archive_product(self.db, rid)
        self.assertEqual(doc['status'], 'archived')
        self.assertFalse(doc['onSale'])
        self.assertNotIn(rid, self.on_sale_bead_ids())

        # 副本（草稿）
        copy = commerce.copy_product(self.db, rid)
        self.assertEqual(copy['status'], 'draft')
        self.assertFalse(copy['onSale'])
        self.assertNotIn(copy['id'], self.on_sale_bead_ids())

        # 删除
        commerce.delete_product(self.db, rid)
        self.assertIsNone(self.db.get('beads', rid))

    # ---- 2. 商品类型 ----

    def test_product_types(self):
        cord = commerce.create_product(self.db, {'id': 'cord-01', 'name': '弹力线', 'type': 'cord', 'mat': 'cord',
                                                 'price': 1, 'status': 'on_sale'})
        self.assertEqual(cord['type'], 'cord')
        self.assertNotIn('mm', cord)
        self.assertNotIn('cord-01', self.on_sale_bead_ids())

        pendant = commerce.create_product(self.db, {'id': 'pendant-01', 'name': '吊坠', 'type': 'pendant', 'mat': 'metal',
                                                    'price': 5, 'status': 'on_sale'})
        self.assertEqual(pendant['type'], 'pendant')
        self.assertNotIn('pendant-01', self.on_sale_bead_ids())

        with self.assertRaises(ValueError):
            commerce.create_product(self.db, {'id': 'bead-nomm', 'name': '缺尺寸珠', 'type': 'bead', 'mat': 'wood',
                                              'price': 3, 'status': 'on_sale'})

    def test_product_price_fen_is_authoritative(self):
        product = commerce.create_product(self.db, {
            'id': 'fen-price', 'name': '整数分商品', 'type': 'bead', 'mat': 'wood',
            'mm': 8, 'priceFen': 101, 'status': 'draft',
        })
        self.assertEqual(product['priceFen'], 101)
        self.assertEqual(product['price'], 1.01)
        with self.assertRaises(ValueError):
            commerce.create_product(self.db, {
                'id': 'bad-fen-price', 'name': '冲突价格', 'type': 'bead', 'mat': 'wood',
                'mm': 8, 'priceFen': 101, 'price': 1, 'status': 'draft',
            })

    # ---- 3. 模板生命周期 ----

    def test_template_lifecycle(self):
        bead = self.db.list('beads')[0]
        rid = 'test-tpl-01'
        tpl = commerce.create_template(self.db, {'id': rid, 'name': '测试模板', 'pattern': [bead['id']],
                                                 'special': [], 'tail': [], 'status': 'draft'})
        self.assertEqual(tpl['status'], 'draft')
        self.assertFalse(tpl['onSale'])

        tpl = commerce.update_template(self.db, rid, {'name': '测试模板改', 'pattern': [bead['id']],
                                                      'special': [], 'tail': [], 'status': 'on_sale'})
        self.assertEqual(tpl['name'], '测试模板改')
        self.assertTrue(tpl['onSale'])

        copy = commerce.copy_template(self.db, rid)
        self.assertEqual(copy['status'], 'draft')
        self.assertFalse(copy['onSale'])

        tpl = commerce.archive_template(self.db, rid)
        self.assertEqual(tpl['status'], 'archived')
        self.assertFalse(tpl['onSale'])

        commerce.delete_template(self.db, rid)
        self.assertIsNone(self.db.get('templates', rid))

    def test_template_warnings_on_off_sale(self):
        rid = 'warn-bead'
        commerce.create_product(self.db, {'id': rid, 'name': '预警珠', 'type': 'bead', 'mat': 'wood',
                                          'mm': 8, 'price': 2, 'status': 'on_sale'})
        tpl = commerce.create_template(self.db, {'id': 'warn-tpl', 'name': '预警模板', 'pattern': [rid],
                                                 'special': [], 'tail': []})
        self.assertEqual(commerce.template_warnings(self.db, tpl), [])
        commerce.update_product(self.db, rid, {'name': '预警珠', 'type': 'bead', 'mat': 'wood', 'mm': 8,
                                               'price': 2, 'status': 'off_sale'})
        warnings = commerce.template_warnings(self.db, self.db.get('templates', 'warn-tpl'))
        self.assertTrue(warnings)

    # ---- 4. 四组订单状态 ----

    def test_order_four_group_status(self):
        order = self.make_order('four-group-000001')
        self.assertEqual(order['orderStatus'], 'pending_confirmation')
        self.assertEqual(order['paymentStatus'], 'unpaid')
        self.assertEqual(order['fulfillmentStatus'], 'unfulfilled')
        self.assertEqual(order['afterSaleStatus'], 'none')
        self.assertIsInstance(order['totalFen'], int)
        self.assertIsInstance(order['goodsFen'], int)
        self.assertIsInstance(order['shipFen'], int)
        self.assertIsInstance(order['termsSnapshot'], list)
        self.assertTrue(order['termsVersion'])
        self.assertEqual(order['statusHistory'], [])

        # 旧订单只有 status 字段
        self.db.put('orders', 'legacy-01', {'status': '待串制'})
        derived = status.derive_status(self.db.get('orders', 'legacy-01'))
        self.assertEqual(derived['orderStatus'], 'confirmed')
        self.assertEqual(derived['paymentStatus'], 'unpaid')
        self.assertEqual(derived['fulfillmentStatus'], 'unfulfilled')
        self.assertEqual(derived['afterSaleStatus'], 'none')

    # ---- 5. 非法状态迁移 ----

    def test_illegal_transitions(self):
        order = self.make_order('illegal-trans-01')
        no = order['no']
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'orderStatus', 'completed')
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试质检'})  # 发货前必须过质检
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'delivered')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'paymentStatus', 'paid')

    # ---- 6. 物流 ----

    def test_logistics_ship_and_sign(self):
        order = self.make_order('logistics-000001')
        no = order['no']
        self.set_paid(no)
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'producing')
        commerce.record_quality_gate(self.db, no, {'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True, 'inspector': '测试质检'})  # 发货前必须过质检
        commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'ready_to_ship')
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')

        commerce.update_order_logistics(self.db, no, {'carrierName': '顺丰速运', 'trackingNo': 'SF123456789'})
        shipped = commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'shipped')
        self.assertIsInstance(shipped['logistics']['shippedAt'], int)
        self.assertGreater(shipped['logistics']['shippedAt'], 0)

        signed = commerce.transition_order_status(self.db, no, 'fulfillmentStatus', 'delivered')
        self.assertIsInstance(signed['logistics']['signedAt'], int)
        self.assertGreater(signed['logistics']['signedAt'], 0)
        actions = [h.get('action') for h in signed['logisticsHistory']]
        self.assertIn('发货', actions)
        self.assertIn('修改物流', actions)

    # ---- 7. 售后流程 ----

    def test_after_sale_refund_flow(self):
        order = self.make_order('as-refund-000001')
        no = order['no']
        self.set_paid(no)
        rec = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款', 'reason': '不想要了', 'refundFen': 1000})
        as_no = rec['no']
        self.assertEqual(rec['status'], 'requested')
        self.assertEqual(self.db.get('orders', no)['afterSaleStatus'], 'requested')

        rec = commerce.transition_after_sale(self.db, as_no, 'approve')
        self.assertEqual(rec['status'], 'reviewing')
        self.assertEqual(self.db.get('orders', no)['afterSaleStatus'], 'reviewing')

        rec = commerce.transition_after_sale(self.db, as_no, 'approve')
        self.assertEqual(rec['status'], 'approved')
        self.assertEqual(self.db.get('orders', no)['afterSaleStatus'], 'approved')

        # 无真实退款渠道：退款类售后 approved 后不得推进到 refunding / completed
        with self.assertRaises(ValueError):
            commerce.transition_after_sale(self.db, as_no, 'receive')
        with self.assertRaises(ValueError):
            commerce.transition_after_sale(self.db, as_no, 'complete')
        self.assertEqual(self.db.get('orders', no)['afterSaleStatus'], 'approved')

        history = self.db.get('orders', no)['statusHistory']
        self.assertTrue(any(h.get('group') == 'afterSaleStatus' for h in history))
        self.assertTrue(any(a.get('target') == 'after_sale' for a in self.db.list('audit_logs')))

    def test_after_sale_refund_exceeds_total(self):
        order = self.make_order('as-exceed-000001')
        no = order['no']
        self.set_paid(no)
        total_fen = self.db.get('orders', no)['totalFen']
        with self.assertRaises(ValueError):
            commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款', 'reason': '退款超了',
                                                 'refundFen': total_fen + 1})

    def test_after_sale_reject_and_close(self):
        order = self.make_order('as-reject-000001')
        no = order['no']
        self.set_paid(no)
        rec = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '仅退款', 'reason': '不想要了', 'refundFen': 500})
        as_no = rec['no']
        rec = commerce.transition_after_sale(self.db, as_no, 'reject')
        self.assertEqual(rec['status'], 'rejected')
        self.assertEqual(self.db.get('orders', no)['afterSaleStatus'], 'rejected')
        rec = commerce.transition_after_sale(self.db, as_no, 'close')
        self.assertEqual(rec['status'], 'closed')
        self.assertEqual(self.db.get('orders', no)['afterSaleStatus'], 'closed')

    def test_after_sale_resend_has_no_receive(self):
        order = self.make_order('as-resend-000001')
        no = order['no']
        rec = commerce.create_after_sale(self.db, {'orderNo': no, 'type': '补寄配件', 'reason': '珠子有瑕疵', 'refundFen': 0})
        as_no = rec['no']
        commerce.transition_after_sale(self.db, as_no, 'approve')
        with self.assertRaises(ValueError):
            commerce.transition_after_sale(self.db, as_no, 'receive')

    # ---- 8. 条款版本快照 ----

    def test_term_snapshot_frozen(self):
        commerce.create_term(self.db, {'id': 'term-t1', 'title': '售前说明', 'type': '售前说明',
                                       'version': '1.0.0', 'body': '正文A', 'status': 'published'})
        commerce.create_term(self.db, {'id': 'term-t2', 'title': '退货退款说明', 'type': '退货退款说明',
                                       'version': '1.0.0', 'body': '正文B', 'status': 'published'})
        first = self.make_order('term-order-000001')
        snap1 = first['termsSnapshot']
        self.assertTrue(any(t['title'] == '售前说明' and t['body'] == '正文A' for t in snap1))

        commerce.update_term(self.db, 'term-t1', {'title': '售前说明', 'type': '售前说明',
                                                  'version': '1.0.0', 'body': '正文A改', 'status': 'published'})
        second = self.make_order('term-order-000002')
        snap2 = second['termsSnapshot']
        self.assertTrue(any(t['title'] == '售前说明' and t['body'] == '正文A改' for t in snap2))
        # 旧单快照保持旧正文（冻结）
        self.assertTrue(any(t['title'] == '售前说明' and t['body'] == '正文A' for t in snap1))
        self.assertFalse(any(t['body'] == '正文A改' for t in snap1))

    # ---- 9. 审计 ----

    def test_audit_logs_for_product(self):
        rid = 'audit-bead'
        commerce.create_product(self.db, {'id': rid, 'name': '审计珠', 'type': 'bead', 'mat': 'wood',
                                          'mm': 8, 'price': 2, 'status': 'on_sale'})
        commerce.update_product(self.db, rid, {'name': '审计珠改', 'type': 'bead', 'mat': 'wood',
                                               'mm': 8, 'price': 2, 'status': 'on_sale'})
        rows = commerce.list_audit(self.db, target='product')
        self.assertTrue(any(r['action'] == 'create' and r['targetId'] == rid for r in rows))
        self.assertTrue(any(r['action'] == 'update' and r['targetId'] == rid for r in rows))


if __name__ == '__main__':
    unittest.main()
