"""Public terms expose only published, reader facing fields."""
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import ProxyHandler, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
from db import DB


class PublicTermsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'terms.db'))
        self.db.put('terms', 'published', {'type': '用户协议', 'title': '用户协议',
                    'version': '1.0', 'body': '公开正文', 'publishedAt': 100,
                    'status': 'published', 'scope': {'mode': 'global'},
                    'internalNote': '内部备注', 'operator': '管理员'})
        self.db.put('terms', 'draft', {'type': '隐私政策', 'title': '草稿',
                    'version': '1.0', 'body': '草稿正文', 'status': 'draft'})
        self.old_db = app.db
        app.db = self.db
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.opener = build_opener(ProxyHandler({}))

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        app.db = self.old_db
        self.db.conn.close()
        self.temp.cleanup()

    def get(self, path):
        url = f'http://127.0.0.1:{self.server.server_port}{path}'
        with self.opener.open(url, timeout=3) as response:
            return response.status, json.load(response)

    def test_unauthenticated_list_excludes_drafts_body_and_admin_fields(self):
        status, rows = self.get('/api/terms')
        self.assertEqual(status, 200)
        self.assertEqual(rows, [{'id': 'published', 'type': '用户协议',
                                 'title': '用户协议', 'version': '1.0', 'publishedAt': 100}])

    def test_detail_only_returns_published_reader_fields(self):
        status, term = self.get('/api/terms/published')
        self.assertEqual(status, 200)
        self.assertEqual(term, {'id': 'published', 'type': '用户协议', 'title': '用户协议',
                                'body': '公开正文', 'version': '1.0', 'publishedAt': 100})
        for term_id in ('draft', 'missing'):
            with self.assertRaises(HTTPError) as failure:
                self.get('/api/terms/' + term_id)
            self.assertEqual(failure.exception.code, 404)
