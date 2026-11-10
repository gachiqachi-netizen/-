import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import content_security


class ContentSecurityTest(unittest.TestCase):
    def tearDown(self):
        content_security.set_checker(None)

    def test_configured_checker_allows_or_rejects(self):
        content_security.set_checker(lambda text: '拦截' not in text)
        content_security.ensure_allowed('普通标题')
        with self.assertRaisesRegex(content_security.ContentRejected, '请修改'):
            content_security.ensure_allowed('需要拦截')

    def test_unconfigured_environment_skips_remote_check(self):
        with patch.dict(os.environ, {'WECHAT_APP_ID': '', 'WECHAT_APP_SECRET': ''}):
            self.assertTrue(content_security.allowed('本地开发标题'))

    def test_ai_entries_drop_only_rejected_result(self):
        content_security.set_checker(lambda text: '不安全' not in text)
        entries = [{'name': '保留', 'meaning': '普通寓意'}, {'name': '丢弃', 'meaning': '不安全'}]
        self.assertEqual(content_security.filter_ai_entries(entries), entries[:1])

