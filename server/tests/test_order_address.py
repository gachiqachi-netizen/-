"""A4b user order detail and pre-shipment address changes."""
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import commerce
import user_api
from db import DB


OLD_PHONE = '10000000000'  # synthetic fixture, not a reachable number
NEW_PHONE = '10000000001'
ADDRESS = {'person': '测试收件人', 'phone': NEW_PHONE, 'addr': '测试地址二'}


def order(**changes):
    row = {'no': 'A4B-1', 'userId': 'owner-a', 'person': '原收件人',
           'phone': OLD_PHONE, 'addr': '测试地址一', 'orderStatus': 'pending_confirmation',
           'paymentStatus': 'unpaid', 'fulfillmentStatus': 'unfulfilled',
           'afterSaleStatus': 'none', 'logisticsStatus': 'not_shipped',
           'workOrder': {'internal': True}, 'qualityGate': {'internal': True}}
    row.update(changes)
    return row


class AddressTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.old_db = app.db
        app.db = DB(os.path.join(cls.temp.name, 'test.db'))
        cls.http = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.http.server_port}'
        for uid, token in [('owner-a', 'a' * 43), ('owner-b', 'b' * 43)]:
            app.db.put('sessions', user_api.token_hash(token),
                       {'userId': uid, 'expiresAt': time.time() + 300})

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db = cls.old_db
        cls.temp.cleanup()

    def setUp(self):
        app.db.put('orders', 'A4B-1', order())

    def request(self, path='/api/my/orders/A4B-1', method='GET', data=None, token='a'):
        headers = {'Authorization': 'Bearer ' + token * 43}
        body = json.dumps(data).encode() if data is not None else None
        if body is not None:
            headers['Content-Type'] = 'application/json'
        req = Request(self.base + path, data=body, headers=headers, method=method)
        try:
            response = urlopen(req, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_own_order_detail_hides_internal_fields(self):
        code, body = self.request()
        self.assertEqual(code, 200)
        for key in ('userId', 'workOrder', 'addressHistory'):
            self.assertNotIn(key, body)
        self.assertIn('edit_address', body['allowedActions'])

    def test_other_and_missing_order_are_404(self):
        self.assertEqual(self.request(token='b')[0], 404)
        self.assertEqual(self.request('/api/my/orders/MISSING')[0], 404)

    def test_login_required(self):
        req = Request(self.base + '/api/my/orders/A4B-1')
        with self.assertRaises(HTTPError) as error:
            urlopen(req, timeout=3)
        self.assertEqual(error.exception.code, 401)

    def test_address_change_in_three_pre_ship_states(self):
        for fulfillment in ('unfulfilled', 'producing', 'ready_to_ship'):
            with self.subTest(fulfillment=fulfillment):
                app.db.put('orders', 'A4B-1', order(fulfillmentStatus=fulfillment))
                code, body = self.request(method='POST', data=ADDRESS,
                                          path='/api/my/orders/A4B-1/address')
                self.assertEqual(code, 200)
                self.assertEqual(body['addr'], ADDRESS['addr'])
                self.assertNotIn('addressHistory', body)
                saved = app.db.get('orders', 'A4B-1')
                self.assertEqual(len(saved['addressHistory']), 1)
                self.assertNotEqual(saved['addressHistory'][0]['phone'], OLD_PHONE)
                self.assertNotIn(OLD_PHONE, json.dumps(app.db.list('audit_logs')))

    def test_shipped_and_after_sale_cannot_change(self):
        for changes in ({'logisticsStatus': 'shipped'}, {'afterSaleStatus': 'requested'},
                        {'orderStatus': 'completed'}):
            with self.subTest(changes=changes):
                app.db.put('orders', 'A4B-1', order(**changes))
                self.assertNotIn('edit_address', user_api.public_order(app.db.get('orders', 'A4B-1'))['allowedActions'])
                self.assertEqual(self.request(method='POST', data=ADDRESS,
                                             path='/api/my/orders/A4B-1/address')[0], 400)

    def test_other_owner_cannot_change(self):
        self.assertEqual(self.request(method='POST', data=ADDRESS, token='b',
                                     path='/api/my/orders/A4B-1/address')[0], 404)
        self.assertEqual(app.db.get('orders', 'A4B-1')['addr'], '测试地址一')

    def test_invalid_phone_is_400(self):
        self.assertEqual(self.request(method='POST', data={**ADDRESS, 'phone': 'bad'},
                                     path='/api/my/orders/A4B-1/address')[0], 400)

    def test_history_is_capped(self):
        app.db.put('orders', 'A4B-1', order(addressHistory=[{'at': i} for i in range(20)]))
        commerce.change_order_address(app.db, 'A4B-1', ADDRESS, 'customer', 'owner-a')
        self.assertEqual(len(app.db.get('orders', 'A4B-1')['addressHistory']), 20)
