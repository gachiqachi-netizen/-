"""Support lookup returns only customer summaries."""
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from types import SimpleNamespace
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
from admin_helpers import owner_headers
from db import DB
from routes import admin_users_lookup


class AdminUsersLookupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'lookup.db'))
        self.db.put('users', 'u1', {'phoneMasked': '138****4321', 'privateNote': '不可返回'})
        self.db.put('users', 'u2', {'phoneMasked': '139****4321'})
        self.db.put('users', 'u3', {'phoneMasked': '137****9876'})
        self.db.put('orders', 'order-1', {'userId': 'u1', 'no': 'CZ2026A',
                                         'orderStatus': 'confirmed', 'totalFen': 12345})
        self.db.put('orders', 'order-2', {'userId': 'u2', 'no': 'CZ2026B',
                                         'orderStatus': 'completed', 'totalFen': 9000})
        self.db.put('after_sales', 'sale-1', {'orderNo': 'CZ2026A'})
        self.db.put('designs', 'design-1', {'userId': 'u1'})

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def lookup(self, query):
        ctx = SimpleNamespace(db=self.db, qs={'q': [query]})
        return admin_users_lookup.lookup(ctx, None, None)[1]['users']

    def test_phone_suffix_returns_two_masked_users_and_counts(self):
        users = self.lookup('4321')
        self.assertEqual({user['userId'] for user in users}, {'u1', 'u2'})
        first = next(user for user in users if user['userId'] == 'u1')
        self.assertEqual(first['phoneMasked'], '138****4321')
        self.assertEqual(first['orders'], [{'no': 'CZ2026A', 'status': 'confirmed', 'totalFen': 12345}])
        self.assertEqual((first['afterSaleCount'], first['designCount']), (1, 1))
        self.assertNotIn('privateNote', json.dumps(users, ensure_ascii=False))

    def test_order_number_finds_only_owner(self):
        self.assertEqual([user['userId'] for user in self.lookup('CZ2026B')], ['u2'])
        self.assertEqual(self.lookup('CZ2026'), [])

    def test_empty_query_rejected_and_permission_declared(self):
        with self.assertRaises(ValueError):
            self.lookup('')
        self.assertEqual(admin_users_lookup.ROUTES[0][3], 'lookup_users')

    def test_http_route_requires_admin(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        opener = build_opener(ProxyHandler({}))
        with patch.object(app, 'db', self.db):
            thread.start()
            try:
                url = f'http://127.0.0.1:{server.server_port}/api/admin/users?q=CZ2026A'
                headers_for_owner = owner_headers(f'http://127.0.0.1:{server.server_port}')
                for headers, expected in (({}, 401), (headers_for_owner, 200)):
                    try:
                        response = opener.open(Request(url, headers=headers), timeout=3)
                    except HTTPError as error:
                        response = error
                    with response:
                        self.assertEqual(response.status, expected)
                        if expected == 200:
                            self.assertEqual(json.load(response)['users'][0]['userId'], 'u1')
            finally:
                server.shutdown()
                server.server_close()
                thread.join()


if __name__ == '__main__':
    unittest.main()
