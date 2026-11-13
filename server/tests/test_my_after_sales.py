"""Customer-facing after-sale routes never expose another customer's records."""
import os
import re
import sys
import tempfile
import unittest
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
from routes import my_after_sales as routes


class MyAfterSalesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'test.db'))
        self.db.put('orders', 'O-1', {'no': 'O-1', 'userId': 'owner',
            'afterSaleStatus': 'requested', 'paymentStatus': 'paid',
            'orderStatus': 'confirmed', 'fulfillmentStatus': 'delivered',
            'logisticsStatus': 'delivered'})
        self.sale = {'no': 'AS-1', 'orderNo': 'O-1', 'type': '退货退款',
            'reason': '质量问题', 'userNote': '说明', 'status': 'requested',
            'refundFen': 1200, 'reservedFen': 1200,
            'photoIds': ['PHOTO-1'], 'contactPhone': 'TEST-PHONE',
            'internalNote': '内部', 'createdAt': 100,
            'history': [{'to': 'requested', 'at': 100, 'actor': '员工', 'note': '内部备注'}]}
        self.db.put('after_sales', 'AS-1', self.sale)
        self.owner = SimpleNamespace(db=self.db, user_id='owner')
        self.other = SimpleNamespace(db=self.db, user_id='other')

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def match(self, pattern, path):
        return re.fullmatch(pattern, path)

    def test_all_routes_require_user(self):
        self.assertTrue(all(route[3] == 'user' for route in routes.ROUTES))

    def test_list_own_order_sorted_newest_first(self):
        self.db.put('after_sales', 'AS-2', {**self.sale, 'no': 'AS-2', 'createdAt': 200})
        match = self.match(routes.ROUTES[0][1], '/api/my/orders/O-1/after-sales')
        status, body = routes.list_order(self.owner, match, None)
        self.assertEqual(status, 200)
        self.assertEqual([item['no'] for item in body['afterSales']], ['AS-2', 'AS-1'])
        with self.assertRaises(KeyError):
            routes.list_order(self.other, match, None)

    def test_detail_owned_and_public_fields_only(self):
        match = self.match(routes.ROUTES[1][1], '/api/my/after-sales/AS-1')
        status, body = routes.detail(self.owner, match, None)
        self.assertEqual(status, 200)
        sale = body['afterSale']
        self.assertEqual((sale['photoIds'], sale['contactPhone']), (['PHOTO-1'], 'TEST-PHONE'))
        self.assertEqual(sale['customerActions'], ['cancel_after_sale'])
        self.assertNotIn('internalNote', sale)
        self.assertNotIn('reservedFen', sale)
        self.assertEqual(sale['history'], [{'status': 'requested', 'at': 100}])
        with self.assertRaises(KeyError):
            routes.detail(self.other, match, None)

    def test_cancel_requested_or_reviewing_only(self):
        match = self.match(routes.ROUTES[2][1], '/api/my/after-sales/AS-1/cancel')
        status, body = routes.cancel(self.owner, match, {})
        self.assertEqual((status, body['afterSale']['status']), (200, 'closed'))
        with self.assertRaisesRegex(ValueError, '已经在处理了，不能撤销'):
            routes.cancel(self.owner, match, {})
        self.db.put('after_sales', 'AS-1', {**self.sale, 'status': 'reviewing'})
        self.db.put('orders', 'O-1', {**self.db.get('orders', 'O-1'), 'afterSaleStatus': 'reviewing'})
        self.assertEqual(routes.cancel(self.owner, match, {})[1]['afterSale']['status'], 'closed')
        with self.assertRaises(KeyError):
            routes.cancel(self.other, match, {})

    def test_return_requires_approved_return_type_and_both_fields(self):
        match = self.match(routes.ROUTES[3][1], '/api/my/after-sales/AS-1/return')
        with self.assertRaises(ValueError):
            routes.submit_return(self.owner, match, {'carrierName': '顺丰', 'trackingNo': 'SF-1'})
        self.db.put('after_sales', 'AS-1', {**self.sale, 'status': 'approved'})
        self.db.put('orders', 'O-1', {**self.db.get('orders', 'O-1'), 'afterSaleStatus': 'approved'})
        with self.assertRaises(ValueError):
            routes.submit_return(self.owner, match, {'carrierName': '顺丰'})
        self.db.put('after_sales', 'AS-1', {**self.db.get('after_sales', 'AS-1'), 'type': '仅退款'})
        with self.assertRaises(ValueError):
            routes.submit_return(self.owner, match, {'carrierName': '顺丰', 'trackingNo': 'SF-1'})
        self.db.put('after_sales', 'AS-1', {**self.db.get('after_sales', 'AS-1'), 'type': '退货退款'})
        status, body = routes.submit_return(self.owner, match, {'carrierName': '顺丰', 'trackingNo': 'SF-1'})
        self.assertEqual((status, body['afterSale']['status']), (200, 'returning'))
        self.assertEqual(body['afterSale']['returnLogistics']['trackingNo'], 'SF-1')
        self.assertEqual(body['afterSale']['customerActions'], [])
        with self.assertRaises(KeyError):
            routes.submit_return(self.other, match, {'carrierName': '顺丰', 'trackingNo': 'SF-1'})


if __name__ == '__main__':
    unittest.main()
