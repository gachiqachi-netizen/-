"""Public share metadata and mini program code behavior."""
import os
import json
import re
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db import DB
import user_api
from routes import share_qrcode


class ShareQRCodeTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(':memory:')
        self.share_id = user_api.create_share(self.db, {
            'name': '海盐汽水', 'beads': ['zt8'], 'wrist': 15,
            'meaning': '清澈又开阔',
        }, 'owner')['shareId']
        self.ctx = SimpleNamespace(db=self.db)
        self.match = re.fullmatch(r'/api/shares/([A-Za-z0-9_-]{43})/qrcode',
                                  '/api/shares/' + self.share_id + '/qrcode')

    def tearDown(self):
        self.db.conn.close()

    def test_share_metadata_excludes_private_identity(self):
        share = user_api.read_share(self.db, self.share_id)
        self.assertIsInstance(share['createdAt'], int)
        self.assertEqual(share['authorLabel'], '来自珠养养的一位用户')
        self.assertEqual(share['meaning'], '清澈又开阔')
        for key in ('userId', 'nickname', 'phone'):
            self.assertNotIn(key, share)

    @patch.object(share_qrcode.content_security, 'configured', return_value=False)
    def test_unconfigured_returns_404(self, configured):
        with self.assertRaises(KeyError):
            share_qrcode.get_qrcode(self.ctx, self.match, None)

    @patch.object(share_qrcode, '_fetch_code', return_value=b'\x89PNG\r\n\x1a\nimage')
    @patch.object(share_qrcode.content_security, 'configured', return_value=True)
    def test_configured_uses_stable_short_code_and_scene(self, configured, fetch):
        status, body, content_type = share_qrcode.get_qrcode(self.ctx, self.match, None)
        self.assertEqual(status, 200)
        self.assertEqual(content_type, 'image/png')
        self.assertTrue(body.startswith(b'\x89PNG'))
        code = self.db.get('shares', self.share_id)['shortCode']
        self.assertEqual(len(code), 16)
        self.assertLessEqual(len('s=' + code), 32)
        self.assertEqual(fetch.call_args.args, (code,))
        self.assertEqual(share_qrcode.get_qrcode(self.ctx, self.match, None)[0], 200)
        self.assertEqual(self.db.get('shares', self.share_id)['shortCode'], code)
        match = re.fullmatch(r'/api/shares/by-code/([A-Za-z0-9_-]{16})', '/api/shares/by-code/' + code)
        self.assertEqual(share_qrcode.by_code(self.ctx, match, None), (200, {'shareId': self.share_id}))

    @patch.object(share_qrcode.content_security, 'configured', return_value=True)
    def test_taken_down_returns_404(self, configured):
        share = self.db.get('shares', self.share_id)
        share['shortCode'] = 'a' * 16
        share['takenDownAt'] = 1
        self.db.put('shares', self.share_id, share)
        with self.assertRaises(KeyError):
            share_qrcode.get_qrcode(self.ctx, self.match, None)
        match = re.fullmatch(r'/api/shares/by-code/([A-Za-z0-9_-]{16})', '/api/shares/by-code/' + 'a' * 16)
        with self.assertRaises(KeyError):
            share_qrcode.by_code(self.ctx, match, None)

    def test_wechat_scene_contains_short_code(self):
        class FakeResponse:
            def __enter__(self): return self
            def __exit__(self, *_): return False
            def read(self): return b'\x89PNG\r\n\x1a\nimage'
        requests = []
        def fake_open(request, timeout):
            requests.append(request)
            return FakeResponse()
        with patch.object(share_qrcode.content_security, '_access_token', return_value='test-token'), \
             patch.object(share_qrcode.urllib.request, 'urlopen', side_effect=fake_open):
            share_qrcode._fetch_code('a' * 16)
        payload = json.loads(requests[0].data)
        self.assertEqual(payload['scene'], 's=' + 'a' * 16)
        self.assertLessEqual(len(payload['scene']), 32)
        self.assertEqual(payload['page'], 'features/shared/shared')

    def test_deleted_design_is_not_resolved_by_short_code(self):
        design_id = 'd' * 32
        self.db.put('designs', design_id, {'userId': 'owner', 'deletedAt': 1})
        share = self.db.get('shares', self.share_id)
        share['designId'] = design_id
        share['shortCode'] = 'b' * 16
        self.db.put('shares', self.share_id, share)
        match = re.fullmatch(r'/api/shares/by-code/([A-Za-z0-9_-]{16})', '/api/shares/by-code/' + 'b' * 16)
        with self.assertRaises(KeyError):
            share_qrcode.by_code(self.ctx, match, None)


if __name__ == '__main__':
    unittest.main()
