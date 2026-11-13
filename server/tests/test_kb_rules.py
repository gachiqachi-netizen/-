"""Existing file checks and stricter checks applied when an item is saved."""
import contextlib
import copy
import glob
import io
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import kb
import kb_rules
import reviews
from db import DB


class KBRulesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(os.path.join(kb_rules.DATA, 'attributes.json'), encoding='utf-8') as source:
            cls.attrs = json.load(source)
        cls.dicts = {**cls.attrs, '_taxonomy': kb_rules.taxonomy_items()}
        cls.items = {}
        for path in glob.glob(os.path.join(kb_rules.DATA, 'beads', '*.json')):
            with open(path, encoding='utf-8') as source:
                cls.items.update((item['id'], item) for item in json.load(source))

    def errors(self, item, mode='save'):
        return kb_rules.check_bead(item, self.dicts, mode)

    def test_existing_all_200_pass(self):
        self.assertEqual(len(self.items), 200)
        for key, item in self.items.items():
            with self.subTest(key=key):
                self.assertEqual(self.errors(item, 'existing'), [])

    def test_existing_taxonomy_fields_and_flags(self):
        cases = [
            ('hupo', lambda b: b.update(id='not-in-taxonomy'), 'taxonomy 里没有这个 id'),
            ('hupo', lambda b: b.update(category='wrong'), 'category 应为 organic'),
            ('hupo', lambda b: b.update(name='错误名'), 'name 应为 琥珀'),
            ('xiangya', lambda b: b['compliance'].update(level='ok'), '禁售大类'),
            ('cheqv', lambda b: b['compliance'].update(level='ok'), '应为 restricted'),
            ('huang-shuijing', lambda b: b.update(confusables=[]), 'confusables 不能空'),
            ('huang-shuijing', lambda b: b.update(treatments=[]), 'treatments 不能空'),
            ('chao-qi', lambda b: b['confidence'].update(look='high'), '不该有 high'),
            ('hupo', lambda b: b.pop('summary'), '缺字段：summary'),
        ]
        for key, change, message in cases:
            with self.subTest(message=message):
                item = copy.deepcopy(self.items[key])
                change(item)
                self.assertTrue(any(message in error['message'] for error in self.errors(item, 'existing')))

    def test_existing_dimensions_grades_banned_words_and_sources(self):
        cases = [
            (lambda b: b['dims'].update(unknown=[]), '不认识的维度'),
            (lambda b: b['grades'].append({'label': '3A'}), '品级用了 A 数'),
            (lambda b: b.update(summary='招财'), '功效词：招财'),
            (lambda b: b.update(sources=[]), '没有 sources'),
        ]
        for change, message in cases:
            with self.subTest(message=message):
                item = copy.deepcopy(self.items['hupo'])
                change(item)
                self.assertTrue(any(message in error['message'] for error in self.errors(item, 'existing')))
        allowed = copy.deepcopy(self.items['hupo'])
        allowed['summary'] = '转运珠、本命年是文化说法'
        self.assertFalse(any(error['field'] == 'summary' for error in self.errors(allowed, 'existing')))

    def test_on_save_tag_dictionary_and_limit_fail_and_pass(self):
        item = copy.deepcopy(self.items['hupo'])
        self.assertEqual(self.errors(item), [])
        item['meaning']['tags'] = ['词典外']
        self.assertTrue(any(error['field'] == 'meaning.tags' for error in self.errors(item)))
        item['meaning']['tags'] = self.attrs['meaning_tags'][:4]
        self.assertTrue(any('最多 3 个' in error['message'] for error in self.errors(item)))
        item['meaning']['tags'] = self.attrs['meaning_tags'][:3]
        self.assertEqual(self.errors(item), [])

    def test_on_save_source_fail_and_pass(self):
        item = copy.deepcopy(self.items['hupo'])
        item['sources'] = ['常识']
        self.assertTrue(any(error['field'] == 'sources' and '中或高' in error['message']
                            for error in self.errors(item)))
        item['sources'].append('书籍')
        self.assertEqual(self.errors(item), [])

    def test_on_save_required_content_fail_and_pass(self):
        item = copy.deepcopy(self.items['hupo'])
        item['status'] = 'draft'
        for field in ('name', 'category', 'summary', 'look'):
            with self.subTest(field=field):
                changed = copy.deepcopy(item)
                changed[field] = ''
                self.assertTrue(any(error['field'] == field and error['message'].endswith('不能为空')
                                    for error in self.errors(changed)))
        self.assertEqual(self.errors(item), [])

    def test_audit_is_read_only_and_reports_current_counts(self):
        with contextlib.redirect_stdout(io.StringIO()) as output:
            summary = kb_rules.audit()
        self.assertEqual(summary, {'unknown_tags': 73, 'common_only': 17, 'missing_core': 8})
        self.assertIn('汇总：词典外寓意 73 种', output.getvalue())

    def test_invalid_mode_rejected(self):
        with self.assertRaises(ValueError):
            self.errors(self.items['hupo'], 'unknown')

    def test_new_medical_banned_words_match(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {'DATA_DIR': directory}):
            self.assertIn('治失眠', kb.banned_in('能治失眠'))
            for word in ('治病', '根治', '疗效', '药效', '改善睡眠'):
                with self.subTest(word=word):
                    self.assertIn(word, kb.banned_in('宣传' + word))

    def test_review_with_insomnia_claim_fails_machine_check(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {'DATA_DIR': directory}):
            db = DB(os.path.join(directory, 'reviews.db'))
            try:
                db.put('users', 'u1', {'phoneHash': 'test-hash'})
                db.put('orders', 'F6-ORDER', {
                    'no': 'F6-ORDER', 'userId': 'u1', 'orderStatus': 'completed',
                    'paymentStatus': 'paid', 'fulfillmentStatus': 'delivered',
                    'logisticsStatus': 'delivered', 'afterSaleStatus': 'none'})
                with patch('content_security.ensure_allowed'):
                    result = reviews.submit(db, 'F6-ORDER', 'u1',
                                            {'stars': 5, 'text': '能治失眠'})
                self.assertEqual(result['status'], 'machine_failed')
                self.assertFalse(result['machine']['textOk'])
            finally:
                db.conn.close()
