import importlib.util
import os
import unittest

PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'tools', 'phone-test-proxy.py')
spec = importlib.util.spec_from_file_location('phone_test_proxy', PATH)
proxy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proxy)


class PhoneProxyTest(unittest.TestCase):
    def test_user_ai_photo_share_kb_and_auth_routes_allowed(self):
        for method, path in (
            ('POST', '/api/plans/match'), ('POST', '/api/ai/design'), ('POST', '/api/ai/photo'),
            ('POST', '/api/shares'), ('GET', '/api/shares/' + 'a' * 43),
            ('GET', '/api/kb/rules'), ('GET', '/api/kb/bead/fenjing'),
            ('POST', '/api/auth/wechat'), ('POST', '/api/auth/logout')):
            self.assertTrue(proxy.allowed_path(method, path), (method, path))

    def test_admin_and_unknown_routes_remain_blocked(self):
        self.assertFalse(proxy.allowed_path('GET', '/api/admin/orders'))
        self.assertFalse(proxy.allowed_path('POST', '/api/unknown'))
