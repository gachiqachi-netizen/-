"""B-16: use only temporary fake RSA keys and fake environment values."""
import contextlib
import io
import os
import sys
import tempfile
import unittest
from unittest import mock

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'tools'))
import check_deploy


class CheckDeployTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.private = os.path.join(self.temp.name, 'merchant.pem')
        self.public = os.path.join(self.temp.name, 'wechat.pem')
        with open(self.private, 'wb') as handle:
            handle.write(key.private_bytes(serialization.Encoding.PEM,
                                           serialization.PrivateFormat.PKCS8,
                                           serialization.NoEncryption()))
        with open(self.public, 'wb') as handle:
            handle.write(key.public_key().public_bytes(serialization.Encoding.PEM,
                                                       serialization.PublicFormat.SubjectPublicKeyInfo))
        os.chmod(self.private, 0o600)
        os.chmod(self.public, 0o600)
        self.values = {
            'ENV': 'production', 'DATABASE_URL': 'postgresql://fake:fake@postgres:5432/fake',
            'ADMIN_TOKEN': 'fake-admin-token', 'WECHAT_APP_ID': 'fake-app',
            'WECHAT_APP_SECRET': 'fake-app-secret', 'PAYMENT_PROVIDER': 'wechat',
            'PUBLIC_BASE_URL': 'https://example.invalid',
            'MEDIA_LINK_SECRET': 'fake-media-secret', 'PHONE_SALT': 'fake-phone-salt',
            'WXPAY_MCHID': 'fake-merchant', 'WXPAY_APPID': 'fake-app',
            'WXPAY_API_V3_KEY': 'a' * 32, 'WXPAY_CERT_SERIAL': 'fake-serial',
            'WXPAY_PRIVATE_KEY_PATH': self.private,
            'WXPAY_PLATFORM_PUBLIC_KEY_PATH': self.public,
            'WXPAY_PLATFORM_PUBLIC_KEY_ID': 'fake-public-id',
            'WXPAY_NOTIFY_URL': 'https://example.invalid/api/payments/notify',
        }

    def statuses(self, **changes):
        return dict(check_deploy.check({**self.values, **changes}))

    def test_fake_complete_configuration_all_passes(self):
        self.assertTrue(all(value == '通过' for value in self.statuses().values()))

    def test_missing_variable_reports_its_name(self):
        self.assertEqual(self.statuses(WXPAY_MCHID='')['WXPAY_MCHID'], '缺少')

    def test_wrong_api_v3_key_length_fails(self):
        self.assertIn('不对', self.statuses(WXPAY_API_V3_KEY='short')['WXPAY_API_V3_KEY 长度'])

    def test_unreadable_or_wrong_permission_key_fails(self):
        os.chmod(self.private, 0o644)
        self.assertIn('不对', self.statuses()['WXPAY_PRIVATE_KEY_PATH 文件'])

    def test_non_https_or_wrong_callback_path_fails(self):
        self.assertIn('不对', self.statuses(WXPAY_NOTIFY_URL='http://example.invalid/api/payments/notify')['WXPAY_NOTIFY_URL 格式'])
        self.assertIn('不对', self.statuses(WXPAY_NOTIFY_URL='https://example.invalid/other')['WXPAY_NOTIFY_URL 格式'])

    def test_appid_mismatch_and_mock_provider_fail(self):
        self.assertIn('不对', self.statuses(WXPAY_APPID='other')['WXPAY_APPID 与 WECHAT_APP_ID'])
        self.assertIn('不对', self.statuses(PAYMENT_PROVIDER='mock')['PAYMENT_PROVIDER 类型'])

    def test_no_configuration_value_appears_in_output(self):
        output = io.StringIO()
        with mock.patch.dict(os.environ, self.values, clear=True), contextlib.redirect_stdout(output):
            self.assertEqual(check_deploy.main([]), 0)
        printed = output.getvalue()
        for secret in ('fake-admin-token', 'fake-app-secret', 'fake-merchant',
                       'fake-media-secret', 'fake-phone-salt',
                       'fake-public-id', 'a' * 32, self.private, self.public,
                       self.values['DATABASE_URL'], self.values['WXPAY_NOTIFY_URL']):
            self.assertNotIn(secret, printed)

    def test_ping_expects_unsigned_callback_to_return_400(self):
        error = __import__('urllib.error', fromlist=['HTTPError']).HTTPError(
            self.values['WXPAY_NOTIFY_URL'], 400, 'bad request', {}, None)
        with mock.patch('check_deploy.urllib.request.urlopen', side_effect=error) as request:
            self.assertEqual(self.statuses()['WXPAY_NOTIFY_URL 格式'], '通过')
            self.assertEqual(dict(check_deploy.check(self.values, ping=True))['回调公网探测'], '通过')
            sent = request.call_args.args[0]
            self.assertEqual(sent.get_method(), 'POST')
            self.assertEqual(sent.data, b'{}')
            self.assertIsNone(sent.get_header('Authorization'))

    def test_ping_rejects_non_400_without_leaking_exception(self):
        error = __import__('urllib.error', fromlist=['HTTPError']).HTTPError(
            self.values['WXPAY_NOTIFY_URL'], 403, 'private secret', {}, None)
        with mock.patch('check_deploy.urllib.request.urlopen', side_effect=error):
            status = dict(check_deploy.check(self.values, ping=True))['回调公网探测']
        self.assertIn('不对', status)
        self.assertNotIn('private secret', status)


if __name__ == '__main__':
    unittest.main()
