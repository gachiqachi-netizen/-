"""End-to-end tests of HTTP authorization, ownership and request validation."""
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
from db import DB
from user_api import token_hash


class HTTPTest(unittest.TestCase):
    def test_dev_login_requires_switch_and_returns_session(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('DEV_LOGIN', None)
            self.assertEqual(self.request('/api/auth/dev', 'POST', {'name': 'dev'})[0], 404)
        with patch.dict(os.environ, {'DEV_LOGIN': '1'}):
            status, result = self.request('/api/auth/dev', 'POST', {'name': 'dev'})
            self.assertEqual(status, 200)
            self.assertIn('token', result)
            self.assertEqual(self.request('/api/designs', token=result['token'])[0], 200)

    def test_logout_invalidates_current_token(self):
        token = 'd' * 43
        app.db.put('sessions', token_hash(token), {'userId': 'logout-user', 'expiresAt': time.time() + 300})
        self.assertEqual(self.request('/api/auth/logout', 'POST', {}, token=token)[0], 200)
        self.assertEqual(self.request('/api/designs', token=token)[0], 401)
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db, cls.original_token = app.db, app.ADMIN_TOKEN
        app.db = DB(os.path.join(cls.temp.name, 'http.db'))
        app.ADMIN_TOKEN = 'test-admin'
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)
        for uid, token in [('owner-a', 'a' * 43), ('owner-b', 'b' * 43)]:
            app.db.put('sessions', token_hash(token), {'userId': uid, 'expiresAt': time.time() + 300})

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db, app.ADMIN_TOKEN = cls.original_db, cls.original_token
        cls.temp.cleanup()

    def setUp(self):
        with app._admin_lock:
            app._admin_sessions.clear()
            app._admin_login_failures.clear()
        self.audit_path = os.path.join(self.temp.name, 'admin-audit.jsonl')
        app.ADMIN_AUDIT_PATH = self.audit_path
        if os.path.exists(self.audit_path):
            os.unlink(self.audit_path)

    def request(self, path, method='GET', data=None, token=None, raw=None, admin=None,
                cookie=None, extra_headers=None, with_headers=False):
        headers = dict(extra_headers or {})
        if token:
            headers['Authorization'] = 'Bearer ' + token
        if admin:
            headers['X-Admin-Token'] = admin
        if cookie:
            headers['Cookie'] = cookie
        if data is not None:
            raw = json.dumps(data).encode()
        if raw is not None:
            headers['Content-Type'] = 'application/json'
        request = Request(self.base + path, data=raw, headers=headers, method=method)
        try:
            response = urlopen(request, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            raw_body = response.read()
            if 'application/json' in (response.headers.get('Content-Type') or ''):
                body = json.loads(raw_body)
            else:
                body = raw_body.decode()
            result = (response.status, body)
            if with_headers:
                return result + (dict(response.headers.items()),)
            return result

    def test_admin_browser_session_logout_rate_limit_and_audit(self):
        status, _, headers = self.request('/api/admin/session', 'POST', {'password': 'test-admin'},
                                          extra_headers={'X-Forwarded-Proto': 'https'}, with_headers=True)
        self.assertEqual(status, 200)
        set_cookie = headers['Set-Cookie']
        self.assertIn('HttpOnly', set_cookie)
        self.assertIn('SameSite=Strict', set_cookie)
        self.assertIn('Secure', set_cookie)
        cookie = set_cookie.split(';', 1)[0]
        self.assertEqual(self.request('/api/admin/orders', cookie=cookie)[0], 200)

        bead = {'name': '审计珠', 'mm': 8, 'price': 1, 'mat': 'wood', 'c': ['#ffffff', '#000000']}
        self.assertEqual(self.request('/api/admin/beads', 'POST', bead, cookie=cookie)[0], 200)
        with open(self.audit_path, encoding='utf-8') as stream:
            audit = stream.read()
        self.assertIn('LOGIN', audit)
        self.assertIn('/api/admin/beads/', audit)
        self.assertNotIn('test-admin', audit)

        self.assertEqual(self.request('/api/admin/session', 'DELETE', cookie=cookie)[0], 200)
        self.assertEqual(self.request('/api/admin/orders', cookie=cookie)[0], 401)

        for _ in range(app.ADMIN_LOGIN_LIMIT):
            self.assertEqual(self.request('/api/admin/session', 'POST', {'password': 'wrong'})[0], 401)
        self.assertEqual(self.request('/api/admin/session', 'POST', {'password': 'test-admin'})[0], 429)

    def test_admin_page_has_browser_security_headers(self):
        status, _, headers = self.request('/admin', with_headers=True)
        self.assertEqual(status, 200)
        self.assertEqual(headers['X-Frame-Options'], 'DENY')
        self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
        self.assertIn("frame-ancestors 'none'", headers['Content-Security-Policy'])

    def test_local_model_files_served_without_escaping_folder(self):
        folder = os.path.join(self.temp.name, 'models')
        os.makedirs(os.path.join(folder, 'handpose', 'v1'))
        with open(os.path.join(folder, 'handpose', 'v1', 'anchors.json'), 'w') as f:
            f.write('[[1, 2]]')
        with open(os.path.join(self.temp.name, 'secret.json'), 'w') as f:
            f.write('{"secret": true}')
        old = app.MODELS
        try:
            app.MODELS = folder
            self.assertEqual(self.request('/models/handpose/v1/anchors.json'), (200, [[1, 2]]))
            for path in ('/models/../secret.json', '/models/handpose/../../secret.json', '/models/handpose/v1/missing.json', '/models/%2e%2e/secret.json'):
                self.assertEqual(self.request(path)[0], 404, path)
        finally:
            app.MODELS = old

    def test_admin_and_user_routes_fail_closed(self):
        self.assertEqual(self.request('/api/admin/orders')[0], 401)
        self.assertEqual(self.request('/api/admin/orders', admin='test-admin')[0], 200)
        self.assertEqual(self.request('/api/designs')[0], 401)
        old_token = app.ADMIN_TOKEN
        try:
            app.ADMIN_TOKEN = ''
            self.assertEqual(self.request('/api/admin/orders')[0], 401)
        finally:
            app.ADMIN_TOKEN = old_token

    def test_promotion_status(self):
        status, body = self.request('/api/promotions/status')
        self.assertEqual(status, 200)
        self.assertEqual(body['firstOrder'], {'available': False, 'discountFen': 0, 'reason': 'payment_not_integrated'})

    def test_catalog_exposes_pricing_and_demo_order_is_closed_by_default(self):
        status, catalog = self.request('/api/catalog')
        self.assertEqual(status, 200)
        self.assertEqual(catalog['pricing']['handworkFen'], 1500)
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('DEMO_ORDERS', None)
            self.assertEqual(self.request('/api/orders', 'POST', {})[0], 403)

    def test_design_isolation_and_share_snapshot(self):
        a, b = 'a' * 43, 'b' * 43
        status, design = self.request('/api/designs', 'POST', {'name':'私有设计', 'beads':['zt8'], 'wrist':15}, token=a)
        self.assertEqual(status, 201)
        self.assertNotIn('userId', design)
        self.assertEqual(self.request('/api/designs', token=b)[1], [])
        payload = {'name':'偷改', 'beads':['zt8'], 'wrist':15, 'expectedUpdatedAt':design['updatedAt']}
        self.assertEqual(self.request('/api/designs/' + design['id'], 'PUT', payload, token=b)[0], 404)
        self.assertEqual(self.request('/api/designs/' + design['id'], 'DELETE', token=b)[0], 404)
        _, shared = self.request('/api/shares', 'POST', {'name':'公开作品','beads':['zt8'],'wrist':15,'phone':'13800138000'}, token=a)
        self.assertEqual(self.request('/api/shares/' + shared['shareId'])[1], {'name':'公开作品','beads':['zt8'],'wrist':15})

    def test_template_metadata_survives_legacy_update_over_http(self):
        token = 'a' * 43
        payload = {'name':'模板设计', 'beads':['zt8'], 'wrist':15, 'pattern':['zt8','xy8'],
                   'special':[], 'tail':[], 'fixed':18, 'source':'tpl', 'tplId':'t1', 'edited':False}
        status, created = self.request('/api/designs', 'POST', payload, token=token)
        self.assertEqual(status, 201)
        legacy = {'name':'改名', 'beads':['zt8'], 'wrist':16, 'expectedUpdatedAt':created['updatedAt']}
        status, updated = self.request('/api/designs/' + created['id'], 'PUT', legacy, token=token)
        self.assertEqual(status, 200)
        self.assertEqual(updated['pattern'], ['zt8','xy8'])
        self.assertEqual(updated['fixed'], 18)
        self.assertEqual(updated['tplId'], 't1')
        self.assertTrue(any(row['id'] == created['id'] and row['pattern'] == payload['pattern']
                            for row in self.request('/api/designs', token=token)[1]))

    def test_order_idempotency_and_isolation_over_http(self):
        a, b = 'a' * 43, 'b' * 43
        bead = app.db.list('beads')[0]
        goods = round(bead['price'] * 100) * 6
        sub = goods + 1500
        payload = {'requestId':'http-request-00001','name':'测试','beads':[bead['id']]*6,'wrist':15,
                   'person':'测试','phone':'13800138000','addr':'测试地址',
                   'confirmedQuote': {'totalFen': sub + (0 if sub >= 9900 else 800), 'items': [{'id':bead['id'],'unitPriceFen':round(bead['price'] * 100),'mm':bead['mm']}]}}
        status, order = self.request('/api/my/orders', 'POST', payload, token=a)
        self.assertEqual(status, 201)
        self.assertEqual(order['status'], '待支付')
        self.assertEqual(self.request('/api/my/orders', 'POST', payload, token=a)[1]['no'], order['no'])
        self.assertEqual(self.request('/api/my/orders', 'POST', {**payload,'name':'其他'}, token=a)[0], 409)
        changed = {**payload, 'requestId': 'http-request-00002', 'confirmedQuote': {**payload['confirmedQuote'], 'totalFen': payload['confirmedQuote']['totalFen'] + 1}}
        status, result = self.request('/api/my/orders', 'POST', changed, token=a)
        self.assertEqual((status, result['code']), (409, 'price_changed'))
        self.assertEqual(len(self.request('/api/my/orders', token=a)[1]), 1)
        self.assertEqual(self.request('/api/my/orders', token=b)[1], [])
        self.assertEqual(self.request('/api/admin/orders/' + order['no'], 'PUT', {'status':'串制中'}, admin='test-admin')[0], 400)

    def test_customer_order_contract_and_cancel_authorization_over_http(self):
        a, b = 'a' * 43, 'b' * 43
        order = {
            'no': 'HTTP-CANCEL-ORDER', 'userId': 'owner-a', 'name': '待取消订单',
            'beads': ['zt8'] * 6, 'items': [{'id': 'zt8', 'unitPriceFen': 300}],
            'totalFen': 3300, 'payableFen': 3300, 'paidFen': 0, 'refundFen': 0,
            'status': '待支付', 'orderStatus': 'pending_confirmation',
            'paymentStatus': 'unpaid', 'fulfillmentStatus': 'unfulfilled',
            'afterSaleStatus': 'none', 'logisticsStatus': 'not_shipped',
            'statusHistory': [], 'logisticsHistory': [], 'logistics': None,
        }
        app.db.put('orders', order['no'], order)
        self.addCleanup(app.db.delete, 'orders', order['no'])
        listed = self.request('/api/my/orders', token=a)[1]
        public = next(row for row in listed if row['no'] == order['no'])
        self.assertEqual(public['state']['payment'], {'code': 'unpaid', 'label': '待支付'})
        self.assertEqual(public['allowedActions'], ['cancel_order', 'edit_address', 'reorder'])
        self.assertNotIn('userId', public)
        self.assertNotIn('pay', public['allowedActions'])

        path = '/api/my/orders/' + order['no'] + '/actions'
        self.assertEqual(self.request(path, 'POST', {'action': 'cancel_order'})[0], 401)
        self.assertEqual(self.request(path, 'POST', {'action': 'cancel_order'}, token=b)[0], 404)
        self.assertEqual(self.request(path, 'POST', {}, token=a)[0], 400)
        status_code, cancelled = self.request(path, 'POST', {'action': 'cancel_order'}, token=a)
        self.assertEqual(status_code, 200)
        self.assertEqual(cancelled['state']['order']['code'], 'cancelled')
        self.assertEqual(cancelled['state']['payment']['code'], 'closed')
        self.assertEqual(cancelled['allowedActions'], ['reorder'])

    def test_invalid_json_is_rejected_without_internal_details(self):
        for raw in (b'[1]', b'{broken', b'null'):
            status, result = self.request('/api/auth/wechat', 'POST', raw=raw)
            self.assertEqual(status, 400)
            self.assertIn('error', result)

    def test_ai_input_and_unconfigured_fallback(self):
        with patch.object(app.ai, 'provider', return_value=None):
            self.assertEqual(self.request('/api/ai/review', 'POST', {'wrist': 15, 'beads': ['zt8']})[0], 503)
            self.assertEqual(self.request('/api/ai/photo', 'POST', {'image': 'data:image/png;base64,aGVsbG8='})[0], 400)
            self.assertEqual(self.request('/api/plans/match', 'POST', {'wrist': 300, 'text': '平安'})[0], 400)
            self.assertEqual(self.request('/api/plans/match', 'POST', {'wrist': 15, 'history': {}, 'text': '平安'})[0], 400)
            status, result = self.request('/api/plans/match', 'POST', {'wrist': 15, 'text': '平安'})
            self.assertEqual(status, 200)
            self.assertEqual(result['by'], 'rules')

    def test_dev_login_rejects_production_database(self):
        with patch.dict(os.environ, {'DEV_LOGIN': '1', 'DATABASE_URL': 'postgres://example.invalid/db'}):
            with self.assertRaises(SystemExit):
                app.ensure_dev_login_local()
        with patch.dict(os.environ, {'DEV_LOGIN': '1'}, clear=False):
            os.environ.pop('DATABASE_URL', None)
            app.ensure_dev_login_local()
        with patch.dict(os.environ, {'DATABASE_URL': 'postgres://example.invalid/db'}, clear=False):
            os.environ.pop('DEV_LOGIN', None)
            app.ensure_dev_login_local()

    def test_server_bind_requires_explicit_safe_config(self):
        app.validate_bind('127.0.0.1', '', False, False)
        with self.assertRaises(ValueError):
            app.validate_bind('0.0.0.0', '', True, True)
        with self.assertRaises(ValueError):
            app.validate_bind('0.0.0.0', 'secret', False, True)
        with self.assertRaises(ValueError):
            app.validate_bind('0.0.0.0', 'secret', True, False)
        app.validate_bind('0.0.0.0', 'secret', True, True)


if __name__ == '__main__':
    unittest.main()
