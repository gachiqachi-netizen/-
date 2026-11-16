"""P1 public catalog version changes with products and pricing."""
import json
import os
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.request import urlopen
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import pricing
from db import DB


class CatalogVersionTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(':memory:')
        self.db_patch = patch.object(app, 'db', self.db)
        self.pricing_patch = patch.object(pricing, '_db', self.db)
        self.db_patch.start(); self.pricing_patch.start()
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        self.worker = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.worker.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}/api/catalog'

    def tearDown(self):
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
        after_bead = self.get()['version']
        self.assertNotEqual(initial, after_bead)
        current = pricing.config()
        changed = dict(current, handwork={**current['handwork'], 'fen': current['handwork']['fen'] + 100})
        self.db.put('settings', 'pricing', changed)
        self.assertNotEqual(after_bead, self.get()['version'])
