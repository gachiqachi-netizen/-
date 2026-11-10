"""分支安全回退：运行环境推导、演示下单开关、启动快速失败与错误不泄露。"""
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app  # noqa: E402
import env  # noqa: E402
from db import DB  # noqa: E402


class EnvDerivationTest(unittest.TestCase):
    def test_default_is_dev(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(env.env_name(), 'dev')
            self.assertTrue(env.is_dev())
            self.assertFalse(env.is_prod())
            self.assertFalse(env.is_experience())

    def test_explicit_env_values_and_aliases(self):
        with patch.dict(os.environ, {'ENV': 'prod'}, clear=True):
            self.assertEqual(env.env_name(), 'prod')
        with patch.dict(os.environ, {'ENV': 'experience'}, clear=True):
            self.assertEqual(env.env_name(), 'experience')
        with patch.dict(os.environ, {'ENV': 'production'}, clear=True):
            self.assertEqual(env.env_name(), 'prod')
        with patch.dict(os.environ, {'ENV': 'development'}, clear=True):
            self.assertEqual(env.env_name(), 'dev')

    def test_database_url_implies_prod(self):
        with patch.dict(os.environ, {'DATABASE_URL': 'postgres://example.invalid/db'}, clear=True):
            self.assertEqual(env.env_name(), 'prod')
            self.assertTrue(env.is_prod())

    def test_public_bind_implies_experience(self):
        with patch.dict(os.environ, {'ALLOW_PUBLIC_BIND': '1'}, clear=True):
            self.assertEqual(env.env_name(), 'experience')
            self.assertTrue(env.is_experience())

    def test_explicit_env_overrides_derivation(self):
        with patch.dict(os.environ, {'ENV': 'dev', 'DATABASE_URL': 'postgres://example.invalid/db'}, clear=True):
            self.assertEqual(env.env_name(), 'dev')


class DemoOrdersTest(unittest.TestCase):
    def test_demo_orders_only_in_dev(self):
        with patch.dict(os.environ, {'DEMO_ORDERS': '1'}, clear=True):
            self.assertTrue(env.demo_orders_allowed())
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(env.demo_orders_allowed())
        with patch.dict(os.environ, {'ENV': 'prod', 'DEMO_ORDERS': '1'}, clear=True):
            self.assertFalse(env.demo_orders_allowed())
        with patch.dict(os.environ, {'ALLOW_PUBLIC_BIND': '1', 'DEMO_ORDERS': '1'}, clear=True):
            self.assertFalse(env.demo_orders_allowed())


class StartupFastFailTest(unittest.TestCase):
    def test_prod_requires_admin_token(self):
        with patch.dict(os.environ, {'ENV': 'prod'}, clear=True):
            with self.assertRaises(SystemExit):
                env.require_admin_token()
        with patch.dict(os.environ, {'ENV': 'prod', 'ADMIN_TOKEN': 'fake-token'}, clear=True):
            env.require_admin_token()

    def test_experience_requires_admin_token(self):
        with patch.dict(os.environ, {'ALLOW_PUBLIC_BIND': '1'}, clear=True):
            with self.assertRaises(SystemExit):
                env.require_admin_token()
        with patch.dict(os.environ, {'ALLOW_PUBLIC_BIND': '1', 'ADMIN_TOKEN': 'fake-token'}, clear=True):
            env.require_admin_token()

    def test_dev_allows_empty_token(self):
        with patch.dict(os.environ, {}, clear=True):
            env.require_admin_token()

    def test_prod_rejects_missing_admin_token(self):
        with patch.dict(os.environ, {'ENV': 'prod'}, clear=True):
            with self.assertRaises(SystemExit):
                env.validate_startup()

    def test_prod_rejects_dev_login(self):
        with patch.dict(os.environ, {'ENV': 'prod', 'ADMIN_TOKEN': 'fake', 'DEV_LOGIN': '1'}, clear=True):
            with self.assertRaises(SystemExit):
                env.validate_startup()

    def test_prod_rejects_demo_orders(self):
        with patch.dict(os.environ, {'ENV': 'prod', 'ADMIN_TOKEN': 'fake', 'DEMO_ORDERS': '1'}, clear=True):
            with self.assertRaises(SystemExit):
                env.validate_startup()

    def test_prod_ok_when_configured(self):
        with patch.dict(os.environ, {'ENV': 'prod', 'ADMIN_TOKEN': 'fake'}, clear=True):
            env.validate_startup()

    def test_dev_login_with_database_url_rejected(self):
        with patch.dict(os.environ, {'DEV_LOGIN': '1', 'DATABASE_URL': 'postgres://example.invalid/db'}, clear=True):
            with self.assertRaises(SystemExit):
                env.validate_startup()

    def test_error_messages_do_not_leak_secrets(self):
        dburl = 'postgres://u:verysecret@secret-host.example/dbname'
        token = 'admin-token-must-not-leak'
        # 每个用例都应失败，且错误信息要能定位问题（含开关名），但不泄露密钥/数据库地址/堆栈。
        cases = [
            ({'ENV': 'prod'}, 'ADMIN_TOKEN'),
            ({'ENV': 'prod', 'ADMIN_TOKEN': token, 'DEV_LOGIN': '1'}, 'DEV_LOGIN'),
            ({'ENV': 'prod', 'ADMIN_TOKEN': token, 'DEMO_ORDERS': '1'}, 'DEMO_ORDERS'),
            ({'DATABASE_URL': dburl, 'DEV_LOGIN': '1'}, 'DATABASE_URL'),
        ]
        for envvars, snippet in cases:
            with patch.dict(os.environ, envvars, clear=True):
                with self.assertRaises(SystemExit) as raised:
                    env.validate_startup()
            message = str(raised.exception)
            self.assertIn(snippet, message)
            self.assertNotIn(dburl, message)
            self.assertNotIn(token, message)
            self.assertNotIn('Traceback', message)


class DemoOrderHTTPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db = app.db
        app.db = DB(os.path.join(cls.temp.name, 'http.db'))
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db = cls.original_db
        cls.temp.cleanup()

    def request(self, path, method='GET', data=None):
        raw = json.dumps(data).encode() if data is not None else None
        headers = {'Content-Type': 'application/json'}
        req = Request(self.base + path, data=raw, headers=headers, method=method)
        try:
            resp = urlopen(req, timeout=3)
        except HTTPError as exc:
            resp = exc
        with resp:
            return resp.status, json.loads(resp.read())

    def _valid_demo_payload(self):
        ids = [b['id'] for b in app.db.list('beads') if b.get('onSale', True)][:6]
        return {'beads': ids, 'person': '测试', 'phone': '13800138000', 'addr': '测试地址'}

    def test_demo_orders_allowed_in_dev(self):
        with patch.dict(os.environ, {'ENV': 'dev', 'DEMO_ORDERS': '1'}, clear=True):
            status, body = self.request('/api/orders', 'POST', self._valid_demo_payload())
        self.assertEqual(status, 200, body)
        self.assertIn('no', body)

    def test_demo_orders_forbidden_in_prod_even_when_enabled(self):
        with patch.dict(os.environ, {'ENV': 'prod', 'DEMO_ORDERS': '1'}, clear=True):
            status, body = self.request('/api/orders', 'POST', self._valid_demo_payload())
        self.assertEqual(status, 403, body)

    def test_demo_orders_forbidden_in_experience_even_when_enabled(self):
        with patch.dict(os.environ, {'ALLOW_PUBLIC_BIND': '1', 'DEMO_ORDERS': '1'}, clear=True):
            status, body = self.request('/api/orders', 'POST', self._valid_demo_payload())
        self.assertEqual(status, 403, body)


if __name__ == '__main__':
    unittest.main()
