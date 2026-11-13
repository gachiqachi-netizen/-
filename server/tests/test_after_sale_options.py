"""C9a 售后选项及申请补充字段。"""
import os
import sys
import tempfile
import time
import unittest
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import user_api
from db import DB
from routes.after_sale_options import options, ROUTES


class AfterSaleOptionsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'test.db'))
        self.order = {'no': 'C9-1', 'userId': 'owner', 'orderStatus': 'confirmed',
                      'paymentStatus': 'paid', 'paidFen': 1200, 'payableFen': 1200,
                      'fulfillmentStatus': 'producing', 'afterSaleStatus': 'none',
                      'logisticsStatus': 'not_shipped', 'logistics': None}
        self.db.put('orders', 'C9-1', self.order)

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def get_options(self, uid='owner'):
        import re
        return options(SimpleNamespace(db=self.db, user_id=uid),
                       re.fullmatch(r'/api/my/orders/([\w-]+)/after-sale-options',
                                    '/api/my/orders/C9-1/after-sale-options'), None)[1]['types']

    def test_route_requires_user(self):
        self.assertEqual(ROUTES[0][3], 'user')

    def test_options_follow_order_stage_and_backend_amount(self):
        self.assertEqual(self.get_options(), [{'type': '仅退款', 'label': '仅退款',
            'refundFen': 1200, 'reasons': ['不想要了', '拍错了，想重新设计', '等太久了', '其他']}])
        self.db.put('orders', 'C9-1', {**self.order, 'logisticsStatus': 'shipped'})
        self.assertEqual([x['type'] for x in self.get_options()], ['拒收后退款'])
        self.db.put('orders', 'C9-1', {**self.order, 'logisticsStatus': 'delivered',
            'logistics': {'signedAt': int(time.time() * 1000) - 86400000}})
        self.assertEqual([(x['type'], x['refundFen']) for x in self.get_options()],
                         [('退货退款', 1200), ('补寄配件', 0), ('改手围重串', 0)])
        self.db.put('orders', 'C9-1', {**self.order, 'paymentStatus': 'unpaid'})
        self.assertEqual(self.get_options(), [])

    def test_other_owner_not_found(self):
        with self.assertRaises(KeyError):
            self.get_options('stranger')

    def test_photo_owner_and_phone_validation_and_storage(self):
        self.db.put('uploads', 'mine', {'userId': 'owner', 'checkStatus': 'passed'})
        self.db.put('uploads', 'other', {'userId': 'stranger', 'checkStatus': 'passed'})
        data = {'type': '仅退款', 'reason': '不想要了'}
        for ids in (['other'], ['missing']):
            with self.assertRaises(ValueError):
                user_api.request_after_sale(self.db, 'C9-1', 'owner', {**data, 'photoIds': ids})
        with self.assertRaises(ValueError):
            user_api.request_after_sale(self.db, 'C9-1', 'owner', {**data, 'contactPhone': '123'})
        result = user_api.request_after_sale(self.db, 'C9-1', 'owner',
            {**data, 'photoIds': ['mine'], 'contactPhone': '13800000000'})
        sale = self.db.get('after_sales', result['afterSale']['no'])
        self.assertEqual((sale['photoIds'], sale['contactPhone']), (['mine'], '13800000000'))
