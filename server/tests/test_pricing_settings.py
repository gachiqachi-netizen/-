"""A3: persisted pricing, admin validation and public catalog."""
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import accounts
import app
import pricing
from db import DB
from migrate import SQLiteAdapter
from migrations import m008_pricing_settings


class PricingSettingsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db, self.old_pricing_db = app.db, pricing._db
        self.db = DB(os.path.join(self.temp.name, 'pricing.db'))
        app.db = self.db
        pricing.attach(self.db)
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'
        self.opener = build_opener(ProxyHandler({}))
        self.db.put('admin_users', 'owner-test', {'name': '测试负责人', 'roleId': 'owner',
                                                 'status': 'active', 'mustChangePassword': False})
        sid = accounts.create_session(self.db, 'owner-test', 60)
        self.cookie = 'beadloop_admin=' + sid
        self.default = {'handwork': {'enabled': True, 'fen': 1500},
                        'shipping': {'enabled': True, 'fen': 800, 'freeThresholdFen': 9900}}

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.db.conn.close()
        app.db = self.old_db
        pricing.attach(self.old_pricing_db)
        self.temp.cleanup()

    def request(self, path, method='GET', data=None, logged_in=True):
        headers = {'Content-Type': 'application/json'}
        if logged_in:
            headers['Cookie'] = self.cookie
        raw = json.dumps(data).encode() if data is not None else None
        req = Request(self.base + path, data=raw, headers=headers, method=method)
        try:
            response = self.opener.open(req, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def save(self, config):
        return self.request('/api/admin/pricing-settings', 'PUT', config)

    def test_migration_keeps_existing_price_and_is_repeatable(self):
        before = self.db.get('settings', 'pricing')
        self.assertEqual({k: before[k] for k in self.default}, self.default)
        self.assertEqual(before['updatedBy'], '导入')
        m008_pricing_settings.up(self.db.conn, SQLiteAdapter())
        self.assertEqual(self.db.get('settings', 'pricing'), before)

    def test_default_quote_matches_old_numbers(self):
        items = [{'unitPriceFen': 300, 'quantity': 6}]
        self.assertEqual(pricing.quote(items, {'cord': 1, 'gift': True})['totalFen'], 5600)
        self.assertEqual(pricing.quote([{'unitPriceFen': 8400}])['shippingFen'], 0)
        self.assertEqual(pricing.public_config()['handworkEnabled'], True)
        self.assertEqual(pricing.public_config()['shippingEnabled'], True)

    def test_handwork_disabled_and_old_order_snapshot_unchanged(self):
        previous = pricing.quote([{'unitPriceFen': 300}])
        self.db.put('orders', 'OLD', {'userId': 'user-test', 'payableFen': previous['payableFen']})
        config = {**self.default, 'handwork': {'enabled': False, 'fen': 1500}}
        self.assertEqual(self.save(config)[0], 200)
        self.assertEqual(pricing.quote([{'unitPriceFen': 300}])['handworkFen'], 0)
        self.assertEqual(self.db.get('orders', 'OLD')['payableFen'], previous['payableFen'])

    def test_shipping_disabled_and_null_threshold(self):
        config = {**self.default, 'shipping': {'enabled': False, 'fen': 800, 'freeThresholdFen': 9900}}
        self.assertEqual(self.save(config)[0], 200)
        self.assertEqual(pricing.quote([{'unitPriceFen': 20000}])['shippingFen'], 0)
        config['shipping'] = {'enabled': True, 'fen': 800, 'freeThresholdFen': None}
        self.assertEqual(self.save(config)[0], 200)
        self.assertEqual(pricing.quote([{'unitPriceFen': 20000}])['shippingFen'], 800)

    def test_invalid_amounts_return_400(self):
        for bad in (-1, 1.5, '100', 100001, True):
            with self.subTest(bad=bad):
                config = {**self.default, 'handwork': {'enabled': True, 'fen': bad}}
                self.assertEqual(self.save(config)[0], 400)
        config = {**self.default, 'shipping': {'enabled': 'yes', 'fen': 800, 'freeThresholdFen': None}}
        self.assertEqual(self.save(config)[0], 400)
        config['shipping'] = {'enabled': True, 'fen': 800, 'freeThresholdFen': -1}
        self.assertEqual(self.save(config)[0], 400)

    def test_admin_login_required_and_catalog_tracks_config(self):
        self.assertEqual(self.request('/api/admin/pricing-settings', logged_in=False)[0], 401)
        self.assertEqual(self.request('/api/admin/pricing-settings', 'PUT', self.default, False)[0], 401)
        config = {**self.default, 'handwork': {'enabled': False, 'fen': 900},
                  'shipping': {'enabled': True, 'fen': 500, 'freeThresholdFen': None}}
        status, saved = self.save(config)
        self.assertEqual(status, 200)
        self.assertEqual(saved['updatedBy'], '测试负责人')
        self.assertTrue(saved['updatedAt'])
        self.assertEqual(self.request('/api/admin/pricing-settings')[1]['shipping']['fen'], 500)
        status, catalog = self.request('/api/catalog', logged_in=False)
        self.assertEqual(status, 200)
        self.assertEqual(catalog['pricing']['handworkFen'], 0)
        self.assertEqual(catalog['pricing']['shippingFen'], 500)
        self.assertIsNone(catalog['pricing']['freeShippingThresholdFen'])
