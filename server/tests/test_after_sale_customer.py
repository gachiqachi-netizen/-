"""A5a: customer after-sale eligibility, request validation and migration."""
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
import contract
import user_api
from db import DB
from migrate import SQLiteAdapter
from migrations import m007_after_sale_types

NOW = 1_800_000_000_000
DAY = 24 * 60 * 60 * 1000
KEY = 'after-sale-test-key-0001'


def order(**changes):
    row = {'no': 'A5A-1', 'userId': 'owner-a', 'orderStatus': 'confirmed',
           'paymentStatus': 'paid', 'paidFen': 1200, 'payableFen': 1200,
           'fulfillmentStatus': 'producing', 'afterSaleStatus': 'none',
           'logisticsStatus': 'not_shipped', 'logistics': None}
    row.update(changes)
    return row


class AfterSaleCustomerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'test.db'))
        self.db.put('orders', 'A5A-1', order())

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def types(self, **changes):
        return commerce.customer_after_sale_types(order(**changes), NOW)

    def test_unpaid_has_no_types(self):
        self.assertEqual(self.types(paymentStatus='unpaid', paidFen=0), [])

    def test_pre_shipment_only_refund(self):
        self.assertEqual(self.types(), ['仅退款'])

    def test_shipped_and_in_transit_only_refusal_refund(self):
        for state in ('shipped', 'in_transit', 'exception'):
            with self.subTest(state=state):
                self.assertEqual(self.types(logisticsStatus=state), ['拒收后退款'])

    def test_signed_within_seven_days_has_three_types(self):
        self.assertEqual(self.types(logisticsStatus='delivered',
                                    logistics={'signedAt': NOW - 7 * DAY}),
                         ['退货退款', '补寄配件', '改手围重串'])

    def test_signed_on_day_eight_has_no_types(self):
        self.assertEqual(self.types(logisticsStatus='delivered',
                                    logistics={'signedAt': NOW - 8 * DAY}), [])

    def test_existing_after_sale_has_no_types(self):
        self.assertEqual(self.types(afterSaleStatus='requested'), [])

    def test_other_logistics_or_missing_signed_at_has_no_types(self):
        self.assertEqual(self.types(logisticsStatus='returned'), [])
        self.assertEqual(self.types(logisticsStatus='delivered', logistics={}), [])

    def test_refund_amount_ignores_client_amount(self):
        result = user_api.request_after_sale(self.db, 'A5A-1', 'owner-a',
            {'type': '仅退款', 'reason': '不想要了', 'refundFen': 1, 'idempotencyKey': KEY})
        self.assertEqual(result['afterSale']['refundFen'], 1200)
        self.assertEqual(result['order']['state']['afterSale']['code'], 'requested')
        self.assertNotIn('actor', result['afterSale']['history'][0])
        self.assertNotIn('request_after_sale', result['order']['allowedActions'])

    def test_same_key_returns_same_after_sale(self):
        data = {'type': '仅退款', 'reason': '不想要了', 'idempotencyKey': KEY}
        first = user_api.request_after_sale(self.db, 'A5A-1', 'owner-a', data)
        second = user_api.request_after_sale(self.db, 'A5A-1', 'owner-a', data)
        self.assertEqual(first['afterSale']['no'], second['afterSale']['no'])
        self.assertEqual(len(self.db.list('after_sales')), 1)

    def test_repeated_without_same_key_is_rejected(self):
        data = {'type': '仅退款', 'reason': '不想要了'}
        user_api.request_after_sale(self.db, 'A5A-1', 'owner-a', data)
        with self.assertRaisesRegex(ValueError, '这个阶段不能申请这种售后'):
            user_api.request_after_sale(self.db, 'A5A-1', 'owner-a', data)

    def test_wrong_owner_is_not_found(self):
        with self.assertRaises(KeyError):
            user_api.request_after_sale(self.db, 'A5A-1', 'owner-b',
                {'type': '仅退款', 'reason': '不想要了'})

    def test_invalid_reason_and_long_note(self):
        data = {'type': '仅退款', 'reason': '不在选项中'}
        with self.assertRaises(ValueError):
            user_api.request_after_sale(self.db, 'A5A-1', 'owner-a', data)
        with self.assertRaises(ValueError):
            user_api.request_after_sale(self.db, 'A5A-1', 'owner-a',
                {'type': '仅退款', 'reason': '不想要了', 'userNote': '甲' * 501})

    def test_new_wrist_required_and_stored(self):
        self.db.put('orders', 'A5A-1', order(logisticsStatus='delivered',
                    logistics={'signedAt': int(time.time() * 1000) - DAY}))
        data = {'type': '改手围重串', 'reason': '戴着太紧'}
        with self.assertRaises(ValueError):
            user_api.request_after_sale(self.db, 'A5A-1', 'owner-a', data)
        result = user_api.request_after_sale(self.db, 'A5A-1', 'owner-a',
                                             {**data, 'newWrist': 16})
        self.assertEqual(result['afterSale']['newWrist'], 16)
        self.assertEqual(result['afterSale']['refundFen'], 0)

    def test_migration_renames_and_is_idempotent(self):
        self.db.put('after_sales', 'AS-OLD', {'no': 'AS-OLD', 'type': '补发'})
        m007_after_sale_types.up(self.db.conn, SQLiteAdapter())
        m007_after_sale_types.up(self.db.conn, SQLiteAdapter())
        self.assertEqual(self.db.get('after_sales', 'AS-OLD')['type'], '补寄配件')

    def test_contract_reason_options(self):
        self.assertEqual(contract.payload()['afterSaleReasons']['改手围重串'],
                         ['戴着太紧', '戴着太松'])


class AfterSaleHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.old_db = app.db
        app.db = DB(os.path.join(cls.temp.name, 'http.db'))
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
        app.db.put('orders', 'A5A-1', order())

    def post(self, data, token='a'):
        headers = {'Authorization': 'Bearer ' + token * 43,
                   'Content-Type': 'application/json'}
        req = Request(self.base + '/api/my/orders/A5A-1/after-sales',
                      data=json.dumps(data).encode(), headers=headers, method='POST')
        try:
            response = urlopen(req, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_invalid_reason_is_400(self):
        self.assertEqual(self.post({'type': '仅退款', 'reason': '无效原因'})[0], 400)

    def test_other_owner_is_404(self):
        self.assertEqual(self.post({'type': '仅退款', 'reason': '不想要了'}, 'b')[0], 404)

    def test_customer_request_is_201_and_idempotent(self):
        data = {'type': '仅退款', 'reason': '不想要了', 'idempotencyKey': KEY}
        code, body = self.post(data)
        self.assertEqual(code, 201)
        self.assertEqual(self.post(data)[1]['afterSale']['no'], body['afterSale']['no'])
        self.assertEqual(self.post({**data, 'idempotencyKey': 'different-key-000000'})[0], 400)
