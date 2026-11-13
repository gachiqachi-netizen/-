"""F6 migration extends existing dictionaries without overwriting edits."""
import json
import os
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import kb
from migrate import SQLiteAdapter
from migrations import m010_kb_tables, m019_banned_words_f6


class BannedWordsMigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = os.path.join(self.temp.name, 'kb.sqlite3')
        self.adapter = SQLiteAdapter()
        self.env = patch.dict(os.environ, {'DATABASE_PATH': self.path})
        self.env.start()
        self.addCleanup(self.env.stop)

    def import_kb(self, old=False):
        with sqlite3.connect(self.path) as conn:
            if old:
                root = os.path.join(self.temp.name, 'old-kb')
                os.mkdir(root)
                os.symlink(os.path.join(m010_kb_tables.ROOT, 'beads'), os.path.join(root, 'beads'))
                with open(os.path.join(m010_kb_tables.ROOT, 'attributes.json'), encoding='utf-8') as source:
                    attrs = json.load(source)
                attrs['banned'] = [entry for entry in attrs['banned']
                                   if entry['word'] not in m019_banned_words_f6.WORDS]
                with open(os.path.join(root, 'attributes.json'), 'w', encoding='utf-8') as target:
                    json.dump(attrs, target, ensure_ascii=False)
                with patch.object(m010_kb_tables, 'ROOT', root):
                    m010_kb_tables.up(conn, self.adapter)
            else:
                m010_kb_tables.up(conn, self.adapter)

    def documents(self):
        with sqlite3.connect(self.path) as conn:
            item = json.loads(conn.execute("SELECT doc FROM kb_items WHERE id = 'dict:banned'").fetchone()[0])
            versions = [json.loads(row[0]) for row in conn.execute(
                "SELECT doc FROM kb_versions WHERE id LIKE 'dict:banned:%' ORDER BY id")]
        return item, versions

    def test_old_dictionary_gets_one_version_and_live_banned_words(self):
        self.import_kb(old=True)
        before, history = self.documents()
        self.assertEqual(len(history), 1)
        with sqlite3.connect(self.path) as conn:
            m019_banned_words_f6.up(conn, self.adapter)
        after, history = self.documents()
        self.assertEqual(after['version'], before['version'] + 1)
        self.assertEqual(after['updatedBy'], '迁移 F6')
        self.assertEqual(len(history), 2)
        self.assertEqual(history[-1]['note'], '补功效类禁用词')
        added = {entry['word']: entry for entry in after['data'] if entry['word'] in m019_banned_words_f6.WORDS}
        self.assertEqual(set(added), set(m019_banned_words_f6.WORDS))
        self.assertTrue(all(entry.get('reason') for entry in added.values()))
        kb._cache['stamp'] = None
        self.assertIn('治失眠', kb.banned_in('能治失眠'))
        with sqlite3.connect(self.path) as conn:
            m019_banned_words_f6.up(conn, self.adapter)
        self.assertEqual(self.documents(), (after, history))

    def test_fresh_import_already_has_words_and_keeps_version(self):
        self.import_kb()
        before = self.documents()
        with sqlite3.connect(self.path) as conn:
            m019_banned_words_f6.up(conn, self.adapter)
        self.assertEqual(self.documents(), before)

    def test_partly_updated_dictionary_adds_only_missing_words(self):
        self.import_kb(old=True)
        with open(m019_banned_words_f6.ATTRIBUTES, encoding='utf-8') as source:
            first = next(entry for entry in json.load(source)['banned'] if entry['word'] == '治失眠')
        with sqlite3.connect(self.path) as conn:
            item = json.loads(conn.execute("SELECT doc FROM kb_items WHERE id = 'dict:banned'").fetchone()[0])
            item['data'].append(first)
            conn.execute("UPDATE kb_items SET doc = ? WHERE id = 'dict:banned'", (json.dumps(item, ensure_ascii=False),))
            m019_banned_words_f6.up(conn, self.adapter)
        after, _ = self.documents()
        self.assertEqual(sum(entry['word'] == '治失眠' for entry in after['data']), 1)
        self.assertEqual(after['version'], 2)

    def test_missing_dictionary_is_noop(self):
        with sqlite3.connect(self.path) as conn:
            self.adapter.create_table(conn, 'kb_items')
            self.adapter.create_table(conn, 'kb_versions')
            m019_banned_words_f6.up(conn, self.adapter)
            self.assertEqual(conn.execute('SELECT count(*) FROM kb_versions').fetchone()[0], 0)
