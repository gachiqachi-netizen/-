"""Public share metadata and mini program code behavior."""
import os
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
    def test_configured_uses_fake_fetcher(self, configured, fetch):
        status, body = share_qrcode.get_qrcode(self.ctx, self.match, None)
        self.assertEqual(status, 200)
        self.assertTrue(body.startswith(b'\x89PNG'))
        fetch.assert_called_once_with(self.share_id)

    @patch.object(share_qrcode.content_security, 'configured', return_value=True)
    def test_taken_down_returns_404(self, configured):
        share = self.db.get('shares', self.share_id)
        share['takenDownAt'] = 1
        self.db.put('shares', self.share_id, share)
        with self.assertRaises(KeyError):
            share_qrcode.get_qrcode(self.ctx, self.match, None)


if __name__ == '__main__':
    unittest.main()
