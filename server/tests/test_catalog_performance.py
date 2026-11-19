"""H4: catalog latency with a production-sized, isolated catalog."""
import json
import os
import sys
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.request import urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import catalog_cache
import pricing
import seed
from db import DB


def assert_catalog_speed(case, db):
    source = seed.BEADS[0]
    for index in range(562):
        bead = dict(source, id=f'h4-bead-{index:03d}', order=index)
        db.put('beads', bead['id'], bead)
    catalog_cache.invalidate()
    with patch.object(app, 'db', db), patch.object(pricing, '_db', db):
        server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            durations = []
            for _ in range(2):
                start = time.perf_counter()
                with urlopen(f'http://127.0.0.1:{server.server_port}/api/catalog', timeout=10) as response:
                    payload = json.load(response)
                durations.append(time.perf_counter() - start)
                case.assertEqual(len(payload['beads']), 562)
            print(f'H4 {type(db).__name__} catalog cold={durations[0]:.3f}s warm={durations[1]:.3f}s', flush=True)
            case.assertLess(durations[0], 3, f'cold catalog: {durations[0]:.3f}s')
            case.assertLess(durations[1], 1, f'warm catalog: {durations[1]:.3f}s')
        finally:
            server.shutdown()
            server.server_close()
            worker.join()
            catalog_cache.invalidate()


class SQLiteCatalogPerformanceTest(unittest.TestCase):
    def test_562_beads_cold_and_warm(self):
        db = DB(':memory:')
        self.addCleanup(db.conn.close)
        for bead in db.list('beads'):
            db.delete('beads', bead['id'])
        assert_catalog_speed(self, db)
