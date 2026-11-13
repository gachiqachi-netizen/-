"""Knowledge-base import, live reads, and version history."""
import glob
import json
import os
import sqlite3
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import kb
import kb_store
import migrate
from migrations import m010_kb_tables


class KBStoreTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = os.path.join(self.temp.name, 'kb.sqlite3')
        self.env = mock.patch.dict(os.environ, {'DATABASE_PATH': self.path}, clear=False)
        self.env.start()
        self.addCleanup(self.env.stop)
        with sqlite3.connect(self.path) as conn:
            migrate.run_migrations(conn, migrate.SQLiteAdapter())
        kb._cache.clear()
        kb._cache['stamp'] = None

    def test_import_matches_file_reading(self):
        expected = {}
        for path in glob.glob(os.path.join(kb.ROOT, 'beads', '*.json')):
            with open(path, encoding='utf-8') as source:
                expected.update({item['id']: item for item in json.load(source)})
        with open(os.path.join(kb.ROOT, 'attributes.json'), encoding='utf-8') as source:
            attrs = json.load(source)
        self.assertEqual(kb_store.snapshot(), {'beads': expected, 'attrs': attrs})
        self.assertEqual(kb.get('mila'), expected['mila'])
        bead = {'id': 'test', 'kb': 'mila', 'tags': []}
        with mock.patch.object(kb_store, 'snapshot', return_value={'beads': expected, 'attrs': attrs}), \
             mock.patch.object(kb_store, 'stamp', return_value=('files',)):
            kb._cache['stamp'] = None
            expected_enriched = kb.enrich(bead)
            expected_banned = kb.banned_in('招财')
        kb._cache['stamp'] = None
        self.assertEqual(kb.enrich(bead), expected_enriched)
        self.assertEqual(kb.banned_in('招财'), expected_banned)

    def test_save_is_live_and_adds_one_version(self):
        original = kb.get('mila')
        changed = {**original, 'name': '蜜蜡测试名'}
        with sqlite3.connect(self.path) as conn:
            before = conn.execute("SELECT count(*) FROM kb_versions WHERE id LIKE 'bead:mila:%'").fetchone()[0]
        self.assertEqual(kb_store.save('mila', changed, '测试', '改名'), 2)
        self.assertEqual(kb.get('mila')['name'], '蜜蜡测试名')
        with sqlite3.connect(self.path) as conn:
            after = conn.execute("SELECT count(*) FROM kb_versions WHERE id LIKE 'bead:mila:%'").fetchone()[0]
        self.assertEqual(after, before + 1)

    def test_import_is_repeatable_and_does_not_overwrite(self):
        changed = {**kb.get('mila'), 'name': '保留修改'}
        kb_store.save('mila', changed, '测试', '保留')
        with sqlite3.connect(self.path) as conn:
            m010_kb_tables.up(conn, migrate.SQLiteAdapter())
        self.assertEqual(kb.get('mila')['name'], '保留修改')

    def test_missing_database_data_falls_back_to_files(self):
        with sqlite3.connect(self.path) as conn:
            conn.execute('DELETE FROM kb_items')
        kb._cache['stamp'] = None
        with self.assertWarnsRegex(RuntimeWarning, '退回读取'):
            self.assertEqual(kb.get('mila')['id'], 'mila')
