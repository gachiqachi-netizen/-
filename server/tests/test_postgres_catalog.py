"""H4: opt-in PostgreSQL catalog and seed checks, isolated by schema."""
import contextlib
import io
import json
import os
import sys
import threading
import unittest
import uuid
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.request import urlopen
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'server'))
sys.path.insert(0, str(ROOT / 'tools'))
import app
import catalog_cache
import kb
import kb_store
import load_seed
import pricing
from db_postgres import PostgresDB
from test_catalog_performance import assert_catalog_speed

URL = os.environ.get('TEST_DATABASE_URL')


@unittest.skipUnless(URL, 'set TEST_DATABASE_URL to run PostgreSQL catalog tests')
class PostgresCatalogTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import psycopg
        from psycopg import sql
        from psycopg.conninfo import make_conninfo
        cls.schema = 'h4_test_' + uuid.uuid4().hex
        with psycopg.connect(URL) as conn:
            conn.execute(sql.SQL('CREATE SCHEMA {}').format(sql.Identifier(cls.schema)))
        cls.url = make_conninfo(URL, options='-csearch_path=' + cls.schema)
        cls.db = PostgresDB(cls.url, initialize=True)

    @classmethod
    def tearDownClass(cls):
        import psycopg
        from psycopg import sql
        with psycopg.connect(URL) as conn:
            conn.execute(sql.SQL('DROP SCHEMA {} CASCADE').format(sql.Identifier(cls.schema)))

    def setUp(self):
        from db import TABLES
        with self.db.connect() as conn:
            for table in TABLES:
                conn.execute(f'DELETE FROM {table}')
        catalog_cache.invalidate()
        kb._cache.clear()
        kb._cache['stamp'] = None

    def test_empty_startup_and_seed_preview_apply(self):
        self.assertEqual(self.db.list('beads'), [])
        self.assertEqual(self.db.list('templates'), [])
        self.assertEqual(self.db.list('banners'), [])
        with patch.dict(os.environ, {'DATABASE_URL': self.url}):
            preview = io.StringIO()
            with contextlib.redirect_stdout(preview):
                self.assertEqual(load_seed.main([]), 0)
            self.assertIn('预览（不写入记录）', preview.getvalue())
            self.assertEqual(self.db.list('beads'), [])
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(load_seed.main(['--apply']), 0)
        self.assertEqual(len(self.db.list('beads')), len(load_seed.SEED_TABLES['beads']))

    def test_catalog_response_and_single_kb_stamp(self):
        self.db.put('beads', 'h4-one', dict(load_seed.SEED_TABLES['beads'][0], id='h4-one'))
        with patch.object(app, 'db', self.db), patch.object(pricing, '_db', self.db), \
             patch.object(kb_store, 'stamp', wraps=kb_store.stamp) as stamp:
            server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
            worker = threading.Thread(target=server.serve_forever, daemon=True)
            worker.start()
            try:
                with urlopen(f'http://127.0.0.1:{server.server_port}/api/catalog', timeout=10) as response:
                    payload = json.load(response)
                self.assertEqual(response.status, 200)
                self.assertEqual(len(payload['beads']), 1)
                self.assertIn('version', payload)
                self.assertLessEqual(stamp.call_count, 1)
            finally:
                server.shutdown(); server.server_close(); worker.join()
                catalog_cache.invalidate()

    def test_562_beads_cold_and_warm(self):
        assert_catalog_speed(self, self.db)
