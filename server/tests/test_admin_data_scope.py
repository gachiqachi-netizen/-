"""A8e: maker work orders are limited to the signed-in account name."""
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import accounts
import app
import commerce
from db import DB


class AdminDataScopeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.old_db = app.db
        app.db = DB(os.path.join(cls.temp.name, 'scope.db'))
        role = app.db.get('admin_roles', 'maker')
        role['dataScope'] = 'own'
        app.db.put('admin_roles', 'maker', role)
        cls.maker_name = '测试做单师傅'
        maker, _ = accounts.create_user(app.db, 'scope-maker', cls.maker_name, 'maker', 'test-only-password')
        owner, _ = accounts.create_user(app.db, 'scope-owner', '测试负责人', 'owner', 'test-only-password')
        cls.cookies = {
            'maker': accounts.create_session(app.db, maker['id'], 3600),
            'owner': accounts.create_session(app.db, owner['id'], 3600),
        }
        for no, assignee in (('SCOPE-OWN', cls.maker_name), ('SCOPE-OTHER', '另一位师傅'),
                             ('SCOPE-UNASSIGNED', '')):
            app.db.put('orders', no, {
                'no': no, 'userId': 'test-user', 'name': '测试手串', 'beads': [], 'items': [],
                'totalFen': 0, 'payableFen': 0, 'paidFen': 100,
                'orderStatus': 'confirmed', 'paymentStatus': 'paid',
                'fulfillmentStatus': 'producing', 'afterSaleStatus': 'none',
                'logisticsStatus': 'not_shipped', 'statusHistory': [],
                'workOrder': {'assignee': assignee}, 'createdAt': int(time.time() * 1000),
            })
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.opener = build_opener(ProxyHandler({}))

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db = cls.old_db
        cls.temp.cleanup()

    def request(self, role, path, method='GET', data=None):
        headers = {'Cookie': 'beadloop_admin=' + self.cookies[role], 'Content-Type': 'application/json'}
        raw = json.dumps(data).encode() if data is not None else None
        req = Request(self.base + path, data=raw, method=method, headers=headers)
        try:
            response = self.opener.open(req, timeout=5)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_maker_sees_only_assigned_work_orders(self):
        status, rows = self.request('maker', '/api/admin/work-orders')
        self.assertEqual(status, 200)
        self.assertEqual([row['orderNo'] for row in rows], ['SCOPE-OWN'])
        self.assertEqual(self.request('maker', '/api/admin/orders/SCOPE-OWN/work-order')[0], 200)
        for no in ('SCOPE-OTHER', 'SCOPE-UNASSIGNED'):
            with self.subTest(no=no):
                self.assertEqual(self.request('maker', f'/api/admin/orders/{no}/work-order')[0], 404)

    def test_maker_cannot_update_or_quality_check_other_work_order(self):
        for no in ('SCOPE-OTHER', 'SCOPE-UNASSIGNED'):
            with self.subTest(no=no):
                self.assertEqual(self.request('maker', f'/api/admin/orders/{no}/work-order',
                                              'PUT', {'progress': 20})[0], 404)
                self.assertEqual(self.request('maker', f'/api/admin/orders/{no}/quality-gate', 'PUT', {
                    'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True,
                })[0], 404)
        self.assertEqual(app.db.get('orders', 'SCOPE-OTHER')['workOrder']['assignee'], '另一位师傅')

    def test_owner_sees_all_work_orders(self):
        status, rows = self.request('owner', '/api/admin/work-orders')
        self.assertEqual(status, 200)
        self.assertEqual({row['orderNo'] for row in rows},
                         {'SCOPE-OWN', 'SCOPE-OTHER', 'SCOPE-UNASSIGNED'})
        self.assertEqual(self.request('owner', '/api/admin/orders/SCOPE-OTHER/work-order')[0], 200)

    def test_internal_call_without_current_admin_is_unfiltered(self):
        token = accounts.CURRENT_ADMIN.set(None)
        try:
            self.assertIsNone(accounts.own_scope_name(app.db))
            self.assertEqual(len(commerce.list_work_orders(app.db)), 3)
            self.assertIsNotNone(commerce.get_work_order(app.db, 'SCOPE-OTHER'))
            self.assertEqual(commerce.update_work_order(app.db, 'SCOPE-OTHER',
                                                        {'progress': 20})['progress'], 20)
            self.assertTrue(commerce.record_quality_gate(app.db, 'SCOPE-OTHER', {
                'sequenceOk': True, 'sizeOk': True, 'materialOk': True, 'appearanceOk': True,
            })['qualityGate']['passed'])
        finally:
            accounts.CURRENT_ADMIN.reset(token)
