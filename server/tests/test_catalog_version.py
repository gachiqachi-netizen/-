"""P1 public catalog version changes with products and pricing."""
import json
import hashlib
import os
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from http_helper import urlopen
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import pricing
import catalog_cache
import ai
import home
from db import DB


class CatalogVersionTests(unittest.TestCase):
    def setUp(self):
        catalog_cache.invalidate()
        self.db = DB(':memory:')
        self.db_patch = patch.object(app, 'db', self.db)
        self.pricing_patch = patch.object(pricing, '_db', self.db)
        self.db_patch.start(); self.pricing_patch.start()
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        self.worker = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.worker.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}/api/catalog'

    def tearDown(self):
        catalog_cache.invalidate()
        self.server.shutdown(); self.server.server_close(); self.worker.join()
        self.pricing_patch.stop(); self.db_patch.stop()
        self.db.conn.close()

    def get(self, suffix=''):
        with urlopen(self.base + suffix, timeout=3) as response:
            return json.load(response)

    def test_matching_version_returns_only_unchanged_marker(self):
        first = self.get()
        self.assertRegex(first['version'], r'^[0-9a-f]{16}$')
        self.assertEqual(self.get('?v=' + first['version']),
                         {'unchanged': True, 'version': first['version']})

    def test_product_and_pricing_changes_update_version(self):
        initial = self.get()['version']
        bead = app.on_sale_catalog()[0][0]
        self.db.put('beads', bead['id'], dict(bead, priceFen=bead.get('priceFen', 0) + 100))
        catalog_cache.invalidate()  # Direct DB write bypasses the admin HTTP invalidation point.
        after_bead = self.get()['version']
        self.assertNotEqual(initial, after_bead)
        current = pricing.config()
        changed = dict(current, handwork={**current['handwork'], 'fen': current['handwork']['fen'] + 100})
        self.db.put('settings', 'pricing', changed)
        catalog_cache.invalidate()
        self.assertNotEqual(after_bead, self.get()['version'])

    def test_hit_reuses_serialized_response_and_version(self):
        beads, templates, banners = app.on_sale_catalog()
        catalog = {'beads': beads, 'templates': templates, 'banners': banners,
                   'ai': ai.status(), 'pricing': pricing.public_config(),
                   'homeArticles': home.home_articles(self.db)}
        raw = json.dumps(catalog, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
        version = hashlib.sha256(raw.encode('utf-8')).hexdigest()[:16]
        expected = json.dumps({**catalog, 'version': version}, ensure_ascii=False).encode()
        with patch.object(app, 'on_sale_catalog', wraps=app.on_sale_catalog) as build:
            with urlopen(self.base, timeout=3) as response:
                first = response.read()
            self.assertEqual(first, expected)
            with urlopen(self.base, timeout=3) as response:
                self.assertEqual(first, response.read())
            self.assertEqual(build.call_count, 1)

    def test_expired_entry_rebuilds(self):
        with patch.object(app, 'on_sale_catalog', wraps=app.on_sale_catalog) as build, \
             patch.object(catalog_cache.time, 'monotonic', return_value=0) as clock:
            self.get()
            clock.return_value = 61
            self.get()
            self.assertEqual(build.call_count, 2)

    def test_concurrent_misses_build_once(self):
        with patch.object(app, 'on_sale_catalog', wraps=app.on_sale_catalog) as build:
            with ThreadPoolExecutor(max_workers=6) as pool:
                results = list(pool.map(lambda _: self.get()['version'], range(6)))
            self.assertEqual(len(set(results)), 1)
            self.assertEqual(build.call_count, 1)
