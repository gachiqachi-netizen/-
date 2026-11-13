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
from routes import return_address


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
            'internalNote': '内部', 'returnLogistics': {'note': '内部物流备注'}, 'createdAt': 100,
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
        self.assertNotIn('note', sale['returnLogistics'])
        self.assertEqual(sale['history'], [{'status': 'requested', 'at': 100}])
        self.assertNotIn('returnAddress', sale)
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

    def test_return_address_only_when_submit_return_is_allowed(self):
        match = self.match(routes.ROUTES[1][1], '/api/my/after-sales/AS-1')
        self.db.put('after_sales', 'AS-1', {**self.sale, 'status': 'approved'})
        self.assertIsNone(routes.detail(self.owner, match, None)[1]['afterSale']['returnAddress'])
        self.db.put('settings', 'return_address', {'person': '测试收件人',
            'phone': '000-0000000', 'address': '测试路 1 号', 'note': '',
            'updatedBy': '内部操作人'})
        address = routes.detail(self.owner, match, None)[1]['afterSale']['returnAddress']
        self.assertEqual(address['address'], '测试路 1 号')
        self.assertNotIn('updatedBy', address)
        self.db.put('after_sales', 'AS-1', {**self.sale, 'status': 'requested'})
        self.assertNotIn('returnAddress', routes.detail(self.owner, match, None)[1]['afterSale'])

    def test_return_address_validation_and_update_metadata(self):
        self.assertTrue(all(route[3] == 'process_after_sales' for route in return_address.ROUTES))
        good = {'person': '测试收件人', 'phone': '000-0000000', 'address': '测试路 1 号'}
        for invalid in ({**good, 'person': ''}, {**good, 'address': ''},
                        {**good, 'phone': '123'}, {**good, 'note': '长' * 101}):
            with self.assertRaises(ValueError):
                return_address.put_address(self.owner, None, invalid)
        import accounts
        token = accounts.CURRENT_ADMIN.set({'name': '测试管理员'})
        try:
            status, saved = return_address.put_address(self.owner, None, good)
        finally:
            accounts.CURRENT_ADMIN.reset(token)
        self.assertEqual(status, 200)
        self.assertEqual(saved['updatedBy'], '测试管理员')
        self.assertTrue(saved['updatedAt'])
        self.assertEqual(return_address.get_address(self.owner, None, None)[1]['address'], '测试路 1 号')
        self.assertEqual(return_address.put_address(self.owner, None,
                         {**good, 'phone': '10000000000'})[1]['phone'], '10000000000')


if __name__ == '__main__':
    unittest.main()

class ReturnAddressPermissionHTTPTests(unittest.TestCase):
    def test_account_without_process_after_sales_gets_403(self):
        import app
        import accounts
        import threading
        from http.server import ThreadingHTTPServer
        from urllib.error import HTTPError
        from urllib.request import ProxyHandler, Request, build_opener
        temp = tempfile.TemporaryDirectory()
        old_db = app.db
        db = DB(os.path.join(temp.name, 'auth.db'))
        app.db = db
        server = None
        try:
            db.put('admin_roles', 'limited', {'permissions': ['view_orders']})
            db.put('admin_users', 'limited', {'name': '测试受限账号', 'roleId': 'limited',
                   'status': 'active', 'mustChangePassword': False})
            session = accounts.create_session(db, 'limited', 60)
            server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            opener = build_opener(ProxyHandler({}))
            url = f'http://127.0.0.1:{server.server_port}/api/admin/return-address'
            for method in ('GET', 'PUT'):
                request = Request(url, method=method,
                    data=b'{}' if method == 'PUT' else None,
                    headers={'Cookie': 'beadloop_admin=' + session,
                             'Content-Type': 'application/json'})
                with self.assertRaises(HTTPError) as error:
                    opener.open(request, timeout=3)
                self.assertEqual(error.exception.code, 403)
        finally:
            if server:
                server.shutdown()
                server.server_close()
                thread.join()
            db.conn.close()
            app.db = old_db
            temp.cleanup()
