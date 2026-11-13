"""Share moderation and migration behavior."""
import os
import re
import sys
import tempfile
import unittest
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
from routes import shares_admin
from user_api import read_share


class SharesAdminTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'shares.db'))
        self.share_id = 's' * 43
        self.db.put('shares', self.share_id, {'name': '山间手串', 'beads': ['a']})
        self.ctx = SimpleNamespace(db=self.db, qs={})

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def test_migration_registers_report_table(self):
        self.assertEqual(self.db.list('share_reports'), [])

    def test_admin_search_name_and_link_id(self):
        for query in ('山间', self.share_id, 'https://example.invalid/s/' + self.share_id):
            self.ctx.qs = {'q': [query]}
            self.assertEqual(len(shares_admin.list_shares(self.ctx, None, None)[1]['shares']), 1)
        self.ctx.qs = {'q': ['missing']}
        self.assertEqual(shares_admin.list_shares(self.ctx, None, None)[1]['shares'], [])

    def test_take_down_hides_share_and_preserves_reason(self):
        match = re.fullmatch(r'([a-z]{43})', self.share_id)
        with self.assertRaises(ValueError):
            shares_admin.take_down(self.ctx, match, {})
        result = shares_admin.take_down(self.ctx, match, {'reason': '用户举报'})[1]
        self.assertEqual(result['takeDownReason'], '用户举报')
        self.assertIsNotNone(result['takenDownAt'])
        self.assertIsNone(read_share(self.db, self.share_id))
        self.assertEqual(shares_admin.take_down(self.ctx, match, {'reason': '重复'})[1], result)

    def test_take_down_missing_share(self):
        match = re.fullmatch(r'([a-z]{43})', 'z' * 43)
        with self.assertRaises(KeyError):
            shares_admin.take_down(self.ctx, match, {'reason': '用户举报'})


if __name__ == '__main__':
    unittest.main()
