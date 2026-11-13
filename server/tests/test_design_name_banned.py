"""A design name uses the same banned-word check for saving and sharing."""
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import kb
from db import DB
from user_api import token_hash


class DesignNameBannedTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db = app.db
        app.db = DB(os.path.join(cls.temp.name, 'names.db'))
        cls.token = 'n' * 43
        app.db.put('sessions', token_hash(cls.token), {'userId': 'name-owner', 'expiresAt': time.time() + 300})
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)
        app.db.conn.close()
        app.db = cls.original_db
        cls.temp.cleanup()

    def request(self, path, payload):
        request = Request(self.base + path, data=json.dumps(payload).encode(), method='POST', headers={
            'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json',
        })
        try:
            response = urlopen(request, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_banned_name_rejected_on_save(self):
        status, body = self.request('/api/designs', {'name': '招财手串', 'beads': ['zt8'], 'wrist': 15})
        self.assertEqual(status, 400)
        self.assertEqual(body['error'], '名字里不要写功效类的词')

    def test_future_banned_word_rejected_after_dictionary_update(self):
        # F6 adds 治失眠 to the shared dictionary; this checks the integration now.
        original = kb.banned_in
        with patch.object(kb, 'banned_in', side_effect=lambda text: original(text) or (['治失眠'] if '治失眠' in text else [])):
            status, body = self.request('/api/designs', {'name': '治失眠手串', 'beads': ['zt8'], 'wrist': 15})
        self.assertEqual(status, 400)
        self.assertEqual(body['error'], '名字里不要写功效类的词')

    def test_normal_name_saves(self):
        status, body = self.request('/api/designs', {'name': '山间月色', 'beads': ['zt8'], 'wrist': 15})
        self.assertEqual(status, 201)
        self.assertEqual(body['name'], '山间月色')

    def test_share_rejects_banned_name(self):
        status, body = self.request('/api/shares', {'name': '招财手串', 'beads': ['zt8'], 'wrist': 15})
        self.assertEqual(status, 400)
        self.assertEqual(body['error'], '名字里不要写功效类的词')
