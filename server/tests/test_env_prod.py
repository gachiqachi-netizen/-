"""生产环境收紧配置测试：ENV 三值收敛、未知值启动失败、PostgreSQL/微信凭证强校验、错误不泄露、
生产环境 AI 失败不静默降级。"""
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


class ProductionEnvTest(unittest.TestCase):
    def test_unknown_env_fails_startup(self):
        with patch.dict(os.environ, {'ENV': 'productionn'}, clear=True):
            with self.assertRaises(SystemExit) as raised:
                env.validate_startup()
            self.assertIn('development/trial/production', str(raised.exception))

    def test_legacy_env_values_rejected(self):
        for value in ('dev', 'experience', 'prod', 'local'):
            with patch.dict(os.environ, {'ENV': value}, clear=True):
                with self.assertRaises(SystemExit, msg=value):
                    env.validate_startup()

    def test_production_requires_postgres(self):
        # 无 DATABASE_URL
        with patch.dict(os.environ, {'ENV': 'production', 'ADMIN_TOKEN': 'fake',
                                     'WECHAT_APP_ID': 'x', 'WECHAT_APP_SECRET': 'y'}, clear=True):
            with self.assertRaises(SystemExit) as raised:
                env.validate_startup()
            self.assertIn('PostgreSQL', str(raised.exception))
        # 非 postgres 前缀
        with patch.dict(os.environ, {'ENV': 'production', 'ADMIN_TOKEN': 'fake',
                                     'WECHAT_APP_ID': 'x', 'WECHAT_APP_SECRET': 'y',
                                     'DATABASE_URL': 'sqlite:///tmp.db'}, clear=True):
            with self.assertRaises(SystemExit):
                env.validate_startup()

    def test_production_requires_wechat_creds(self):
        with patch.dict(os.environ, {'ENV': 'production', 'ADMIN_TOKEN': 'fake',
                                     'DATABASE_URL': 'postgres://example.invalid/db'}, clear=True):
            with self.assertRaises(SystemExit) as raised:
                env.validate_startup()
            self.assertIn('微信内容安全凭证', str(raised.exception))
        # 只给 APP_ID 不给 SECRET 也算未配置
        with patch.dict(os.environ, {'ENV': 'production', 'ADMIN_TOKEN': 'fake',
                                     'DATABASE_URL': 'postgres://example.invalid/db',
                                     'WECHAT_APP_ID': 'x'}, clear=True):
            with self.assertRaises(SystemExit):
                env.validate_startup()

    def test_trial_requires_postgres_and_wechat(self):
        with patch.dict(os.environ, {'ENV': 'trial', 'ADMIN_TOKEN': 'fake'}, clear=True):
            with self.assertRaises(SystemExit):
                env.validate_startup()

    def test_production_full_config_passes(self):
        with patch.dict(os.environ, {'ENV': 'production', 'ADMIN_TOKEN': 'fake',
                                     'DATABASE_URL': 'postgres://example.invalid/db',
                                     'WECHAT_APP_ID': 'x', 'WECHAT_APP_SECRET': 'y'}, clear=True):
            env.validate_startup()

    def test_error_does_not_leak_url_or_creds(self):
        with patch.dict(os.environ, {'ENV': 'production', 'ADMIN_TOKEN': 'fake',
                                     'DATABASE_URL': 'sqlite://u:leak@secret-host.example/db'}, clear=True):
            with self.assertRaises(SystemExit) as raised:
                env.validate_startup()
        self.assertNotIn('leak', str(raised.exception))

    def test_ai_fallback_allowed(self):
        # dev 默认允许降级
        with patch.dict(os.environ, {}, clear=True):
            self.assertTrue(env.ai_fallback_allowed())
        # production 默认不允许
        with patch.dict(os.environ, {'ENV': 'production'}, clear=True):
            self.assertFalse(env.ai_fallback_allowed())
        # 显式 AI_ALLOW_FALLBACK=1 时 production 也允许
        with patch.dict(os.environ, {'ENV': 'production', 'AI_ALLOW_FALLBACK': '1'}, clear=True):
            self.assertTrue(env.ai_fallback_allowed())


class AIFallbackHTTPTest(unittest.TestCase):
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

    def request(self, path, data=None):
        raw = json.dumps(data).encode() if data is not None else None
        req = Request(self.base + path, data=raw, headers={'Content-Type': 'application/json'}, method='POST')
        try:
            resp = urlopen(req, timeout=3)
        except HTTPError as exc:
            resp = exc
        with resp:
            return resp.status, json.loads(resp.read())

    def test_production_ai_failure_returns_502(self):
        with patch.dict(os.environ, {'ENV': 'production'}, clear=True), \
             patch.object(app.ai, 'provider', return_value=object()), \
             patch.object(app.ai, 'extract_tags', side_effect=RuntimeError('boom')):
            status, body = self.request('/api/plans/match', {'wrist': 15, 'text': '平安'})
        self.assertEqual(status, 502, body)

    def test_explicit_fallback_degrades_with_metadata(self):
        with patch.dict(os.environ, {'ENV': 'production', 'AI_ALLOW_FALLBACK': '1'}, clear=True), \
             patch.object(app.ai, 'provider', return_value=object()), \
             patch.object(app.ai, 'extract_tags', side_effect=RuntimeError('boom')):
            status, body = self.request('/api/plans/match', {'wrist': 15, 'text': '平安'})
        self.assertEqual(status, 200, body)
        self.assertEqual(body.get('by'), 'rules')
        self.assertTrue(body.get('degraded'))
        self.assertEqual(body.get('degradedReason'), 'ai_unavailable')

    def test_production_without_provider_returns_502(self):
        with patch.dict(os.environ, {'ENV': 'production'}, clear=True), \
             patch.object(app.ai, 'provider', return_value=None):
            status, body = self.request('/api/plans/match', {'wrist': 15, 'text': '平安'})
        self.assertEqual(status, 502, body)


if __name__ == '__main__':
    unittest.main()
