"""B-8: AI selects recipes; the server owns sizing, pricing and meaning tags."""
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import ai
import app
import kb
import money
import plans
import pricing
from db import DB


class FakeProvider:
    name = 'fake'

    def __init__(self, reply='看第一条', count=3):
        self.reply = reply
        self.count = count

    def json(self, prompt, schema, image=None):
        pairs = [('zt8', 'jg10'), ('jg10', 'xy8'), ('zt8', 'xy8')]
        return {'reply': self.reply, 'designs': [
            {'name': '搭配' + str(i), 'meaning': '模型自称招财', 'special': [],
             'pattern': list(pair), 'count': 1, 'lengthMm': 1, 'payableFen': 1}
            for i, pair in enumerate(pairs[:self.count])]}


class AIDesignResponseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db, self.old_pricing_db = app.db, pricing._db
        self.db = DB(os.path.join(self.temp.name, 'ai.db'))
        app.db = self.db
        pricing.attach(self.db)
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'
        self.opener = build_opener(ProxyHandler({}))

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.db.conn.close()
        app.db = self.old_db
        pricing.attach(self.old_pricing_db)
        self.temp.cleanup()

    def design(self, provider):
        request = Request(self.base + '/api/ai/design', method='POST',
                          data=json.dumps({'text': '想要一条手串', 'wrist': 15}).encode(),
                          headers={'Content-Type': 'application/json'})
        with patch.object(ai, 'provider', return_value=provider):
            try:
                response = self.opener.open(request, timeout=3)
            except HTTPError as error:
                response = error
            with response:
                return response.status, json.loads(response.read())

    def test_three_plans_use_server_sizing_price_and_kb_tags(self):
        status, body = self.design(FakeProvider())
        self.assertEqual(status, 200)
        self.assertEqual(set(body), {'message', 'plans', 'quickReplies'})
        self.assertEqual(len(body['plans']), 3)
        self.assertEqual(len(body['quickReplies']), 3)
        self.assertNotIn('designs', body)
        self.assertNotIn('reply', body)
        beads = {b['id']: b for b in app.on_sale_catalog()[0]}
        for plan in body['plans']:
            sequence = plan['beads']
            self.assertEqual(plan['count'], len(sequence))
            self.assertNotEqual(plan['count'], 1)
            self.assertEqual(plan['lengthMm'], plans.target_mm(sequence, beads, 15)[1])
            items = [{'unitPriceFen': money.parse_fen(beads[x]['priceFen'])
                      if beads[x].get('priceFen') is not None else money.yuan_to_fen(beads[x]['price'])}
                     for x in sequence]
            self.assertEqual(plan['payableFen'], pricing.quote(items)['payableFen'])
            self.assertNotEqual(plan['payableFen'], 1)
            allowed = set()
            for x in sequence:
                record = kb.get(beads[x]['kb'])
                allowed.update((record.get('meaning') or {}).get('tags') or [])
            self.assertTrue(all(tag in allowed for tag in plan['line'].split('、')))
            self.assertNotIn('招财', plan['line'])

    def test_plans_follow_saved_handwork_and_shipping_settings(self):
        original = self.design(FakeProvider())[1]['plans'][0]['payableFen']
        self.db.put('settings', 'pricing', {
            'handwork': {'enabled': False, 'fen': 1500},
            'shipping': {'enabled': True, 'fen': 1200, 'freeThresholdFen': None},
        })
        status, body = self.design(FakeProvider())
        self.assertEqual(status, 200)
        self.assertNotEqual(body['plans'][0]['payableFen'], original)
        beads = {b['id']: b for b in app.on_sale_catalog()[0]}
        goods = sum(money.yuan_to_fen(beads[x]['price']) for x in body['plans'][0]['beads'])
        self.assertEqual(body['plans'][0]['payableFen'], goods + 1200)

    def test_numeric_model_message_uses_fixed_sentence(self):
        status, body = self.design(FakeProvider(reply='给你 3 条方案'))
        self.assertEqual(status, 200)
        self.assertEqual(body['message'], '为你配了三条，先看第一条。')

    def test_clean_model_message_is_returned_unchanged(self):
        sentence = '这条以沉稳为意，愿你每天从容。'
        status, body = self.design(FakeProvider(reply=sentence))
        self.assertEqual(status, 200)
        self.assertEqual(body['message'], sentence)

    def test_banned_model_message_uses_fixed_sentence(self):
        status, body = self.design(FakeProvider(reply='这条手串寓意招财'))
        self.assertEqual(status, 200)
        self.assertEqual(body['message'], '为你配了三条，先看第一条。')

    def test_fewer_than_three_valid_recipes_returns_fallback_error(self):
        status, body = self.design(FakeProvider(count=2))
        self.assertEqual(status, 502)
        self.assertEqual(body['error'], 'AI 暂时不可用，请稍后重试')
