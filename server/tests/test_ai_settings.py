"""AI1 settings, credentials, feature gates and admin endpoints."""
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import ai
import ai_logs
import ai_settings
from db import DB
from routes import Ctx
from routes import ai_settings as route


class AISettingsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, 'test.db'))
        self.old_db = ai_logs._db
        ai_logs.attach(self.db)
        ai._provider = None
        ai._provider_err = None
        if hasattr(ai.provider, '_selected'):
            del ai.provider._selected
        self.ctx = Ctx(self.db, None, True, {})

    def tearDown(self):
        ai_logs.attach(self.old_db)
        ai._provider = None
        ai._provider_err = None
        self.db.conn.close()
        self.tmp.cleanup()

    def test_disabled_design_falls_back_and_photo_gate_is_independent(self):
        self.db.put('settings', 'ai', {'designEnabled': False, 'photoEnabled': True})
        self.assertIsNone(ai.provider())
        self.assertIsNone(ai.design([], '清爽', [], 15))
        self.db.put('settings', 'ai', {'designEnabled': True, 'photoEnabled': False})
        self.assertIsNone(ai.photo([], ('image/png', 'eA==')))

    def test_unconfigured_provider_is_rejected(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(ValueError, '未配置密钥'):
                ai_settings.validate({'provider': 'claude'}, self.db)

    def test_get_never_exposes_full_key_and_put_audits(self):
        with mock.patch.dict(os.environ, {'AI_API_KEY': 'secret-1234', 'AI_BASE_URL': 'https://example.test'}, clear=True):
            status, body = route.get_settings(self.ctx, None, None)
            self.assertEqual(status, 200)
            self.assertEqual(body['providers']['openai']['keyLast4'], '1234')
            self.assertNotIn('secret-1234', str(body))
            saved = ai_settings.save(self.db, {'provider': 'openai', 'model': 'some-model'}, '管理员')
            self.assertEqual(saved['provider'], 'openai')
            self.assertEqual(len(self.db.list('audit_logs')), 1)

    def test_test_endpoint_uses_fake_provider_without_log(self):
        fake = mock.Mock(name='fake-provider')
        fake.model = 'fake-model'
        fake.json.return_value = {'reply': '清爽'}
        with mock.patch.object(route.ai, 'provider', return_value=fake):
            status, body = route.test_provider(self.ctx, None, None)
        self.assertEqual(status, 200)
        self.assertTrue(body['success'])
        self.assertEqual(body['model'], 'fake-model')
        self.assertIn('帮我配一条清爽的手串', fake.json.call_args.args[0])
        self.assertEqual(self.db.list('ai_logs'), [])

    def test_usage_aggregates_failures_and_elapsed(self):
        from datetime import datetime, timezone
        now = int(datetime.now(timezone.utc).timestamp() * 1000)
        self.db.put('ai_logs', 'a', {'at': now, 'ok': True, 'elapsedMs': 100, 'kind': 'design'})
        self.db.put('ai_logs', 'b', {'at': now, 'ok': False, 'elapsedMs': 300, 'kind': 'design'})
        _, body = route.usage(self.ctx, None, None)
        today = body['days'][-1]['design']
        self.assertEqual(today, {'calls': 2, 'failures': 1, 'avgElapsedMs': 200})


if __name__ == '__main__':
    unittest.main()
