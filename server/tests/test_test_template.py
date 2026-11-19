"""B-25 test-only template contract and deployment reminder."""
import contextlib
import io
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'tools'))
import app
import commerce
import check_deploy
from db import DB


class TestTemplateTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.db = DB(os.path.join(self.temp.name, 'catalog.db'))
        self.addCleanup(self.db.conn.close)

    def test_test_only_roundtrip_and_boolean_validation(self):
        bead = self.db.list('beads')[0]
        data = {'id': 't-test-local', 'name': '测试款', 'pattern': [bead['id']], 'testOnly': True}
        saved = commerce.create_template(self.db, data)
        self.assertIs(saved['testOnly'], True)
        self.assertIs(self.db.get('templates', data['id'])['testOnly'], True)
        changed = commerce.update_template(self.db, data['id'], {**data, 'testOnly': False})
        self.assertIs(changed['testOnly'], False)
        _, error = commerce.normalize_template(self.db, {**data, 'testOnly': 'true'})
        self.assertIn('布尔', error)

    def test_test_only_is_last_even_with_early_home_order(self):
        bead = self.db.list('beads')[0]
        self.db.put('templates', 't-test-local', {'name': '测试款', 'pattern': [bead['id']],
                    'onSale': True, 'homeOrder': -1, 'testOnly': True})
        with patch.object(app, 'db', self.db):
            _, templates, _ = app.on_sale_catalog()
        self.assertEqual(templates[-1]['id'], 't-test-local')

    def test_deploy_reminder_only_for_live_test_template(self):
        values = {'ENV': 'production', 'PAYMENT_PROVIDER': 'wechat'}
        with patch.object(check_deploy, '_live_test_template', return_value=True):
            results = check_deploy.check(values)
        self.assertIn(('提醒', '测试款仍在上架'), results)
        self.assertNotIn('t-test-local', str(results))
        with patch.object(check_deploy, '_live_test_template', return_value=False):
            self.assertNotIn(('提醒', '测试款仍在上架'), check_deploy.check(values))
        with patch.object(check_deploy, '_live_test_template', return_value=True):
            self.assertNotIn(('提醒', '测试款仍在上架'), check_deploy.check({**values, 'ENV': 'staging'}))
        with patch.object(check_deploy, 'check', return_value=[('提醒', '测试款仍在上架')]):
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                self.assertEqual(check_deploy.main([]), 0)
            self.assertEqual(output.getvalue().strip(), '提醒：测试款仍在上架')
