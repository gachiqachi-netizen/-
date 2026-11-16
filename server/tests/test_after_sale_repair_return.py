"""补寄配件选择寄回维修时复用寄回及重串工单流程。"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import commerce
from db import DB
from routes import my_after_sales


class RepairReturnTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'repair.db'))
        bead = next(row for row in self.db.list('beads') if row.get('onSale') and not row.get('spacer'))
        self.bead = bead['id']
        self.order = {'no': 'REPAIR-ORDER', 'userId': 'customer-1', 'name': '原手串',
                      'beads': [self.bead] * 6, 'wrist': 15, 'paymentStatus': 'paid',
                      'orderStatus': 'completed', 'fulfillmentStatus': 'delivered',
                      'logisticsStatus': 'delivered', 'afterSaleStatus': 'reviewing',
                      'payableFen': 12800, 'paidFen': 12800, 'refundFen': 0}
        self.db.put('orders', self.order['no'], self.order)
        self.sale = {'no': 'REPAIR-SALE', 'orderNo': self.order['no'], 'type': '补寄配件',
                     'status': 'reviewing', 'refundFen': 0, 'history': []}
        self.db.put('after_sales', self.sale['no'], self.sale)

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def test_repair_return_to_shipped_work_order(self):
        rec = commerce.transition_after_sale(self.db, self.sale['no'], 'approve', result='repair_return')
        self.assertEqual(rec['handling'], 'repair_return')
        self.assertIn('submit_return', my_after_sales._actions(rec))
        self.assertIn('returning', commerce.after_sale_allowed_actions(rec))
        commerce.transition_after_sale(self.db, self.sale['no'], 'returning',
                                       return_logistics={'carrierName': '测试快递', 'trackingNo': 'TEST-1'})
        commerce.transition_after_sale(self.db, self.sale['no'], 'receive')
        wo = commerce.create_rework_order(self.db, self.sale['no'])
        self.assertTrue(wo['repairReturn'])
        self.assertEqual(wo['wrist'], 15)
        self.assertEqual([item['id'] for item in wo['sequence']], self.order['beads'])
        self.assertIn('运费和差价已线下沟通', wo['operatorNote'])
        with self.assertRaisesRegex(ValueError, '备注'):
            commerce.update_rework_order(self.db, self.sale['no'], {'sequence': [self.bead]})
        checks = {key: True for key in commerce.QUALITY_GATE_FIELDS}
        commerce.update_rework_order(self.db, self.sale['no'], {'qualityGate': checks})
        commerce.update_rework_order(self.db, self.sale['no'],
                                     {'shipping': {'carrierName': '测试快递', 'trackingNo': 'TEST-2'}})
        self.assertEqual(self.db.get('after_sales', self.sale['no'])['status'], 'completed')
        saved = self.db.get('orders', self.order['no'])
        self.assertEqual((saved['payableFen'], saved['paidFen'], saved['refundFen']), (12800, 12800, 0))

    def test_direct_replenishment_keeps_existing_flow(self):
        rec = commerce.transition_after_sale(self.db, self.sale['no'], 'approve', result='direct')
        self.assertNotIn('submit_return', my_after_sales._actions(rec))
        self.assertIn('complete', commerce.after_sale_allowed_actions(rec))
        self.assertNotIn('returning', commerce.after_sale_allowed_actions(rec))
        commerce.transition_after_sale(self.db, self.sale['no'], 'complete')
        self.assertEqual(self.db.get('after_sales', self.sale['no'])['status'], 'completed')
