"""C9a 售后选项及申请补充字段。"""
import os
import sys
import tempfile
import threading
import time
import unittest
from types import SimpleNamespace
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import user_api
import app
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
        self.db.put('uploads', 'rejected', {'userId': 'owner', 'checkStatus': 'rejected'})
        data = {'type': '仅退款', 'reason': '不想要了'}
        for ids in (['other'], ['missing'], ['rejected'], ['mine'] * 7):
            with self.assertRaises(ValueError):
                user_api.request_after_sale(self.db, 'C9-1', 'owner', {**data, 'photoIds': ids})
        with self.assertRaises(ValueError):
            user_api.request_after_sale(self.db, 'C9-1', 'owner', {**data, 'contactPhone': '123'})
        result = user_api.request_after_sale(self.db, 'C9-1', 'owner',
            {**data, 'photoIds': ['mine'], 'contactPhone': '13800000000'})
        sale = self.db.get('after_sales', result['afterSale']['no'])
        self.assertEqual((sale['photoIds'], sale['contactPhone']), (['mine'], '13800000000'))


class AfterSaleOptionsHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.old_db = app.db
        app.db = DB(os.path.join(cls.temp.name, 'http.db'))
        cls.http = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.http.server_port}'
        for uid, token in [('owner', 'a' * 43), ('other', 'b' * 43)]:
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
        app.db.put('orders', 'C9-1', {'no': 'C9-1', 'userId': 'owner',
            'orderStatus': 'confirmed', 'paymentStatus': 'paid', 'paidFen': 1200,
            'payableFen': 1200, 'fulfillmentStatus': 'producing',
            'afterSaleStatus': 'none', 'logisticsStatus': 'not_shipped', 'logistics': None})

    def request(self, path, token='a', data=None):
        import json
        headers = {'Authorization': 'Bearer ' + token * 43}
        if data is not None:
            headers['Content-Type'] = 'application/json'
        req = Request(self.base + path, headers=headers,
                      data=json.dumps(data).encode() if data is not None else None,
                      method='POST' if data is not None else 'GET')
        try:
            response = urlopen(req, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_options_http_and_other_owner_404(self):
        path = '/api/my/orders/C9-1/after-sale-options'
        code, body = self.request(path)
        self.assertEqual((code, body['types'][0]['refundFen']), (200, 1200))
        self.assertEqual(self.request(path, 'b')[0], 404)

    def test_invalid_photo_and_phone_are_400(self):
        path = '/api/my/orders/C9-1/after-sales'
        data = {'type': '仅退款', 'reason': '不想要了'}
        self.assertEqual(self.request(path, data={**data, 'photoIds': ['unknown']})[0], 400)
        self.assertEqual(self.request(path, data={**data, 'contactPhone': '123'})[0], 400)
