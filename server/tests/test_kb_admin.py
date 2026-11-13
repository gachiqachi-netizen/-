"""K3 后台知识库接口的 HTTP 测试。

临时库跑全量迁移（m010 导入真实 kb 数据、m011 给角色补 edit_kb），
kb_store/kb 经 DATABASE_PATH 指向同一个临时库文件。
"""
import copy
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest import mock
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import accounts
import app
import kb
from db import DB
from admin_helpers import owner_headers


def _login(base, username, name, role):
    password = 'test-only-kb-pass'
    accounts.create_user(app.db, username, name, role, password)
    req = Request(base + '/api/admin/session',
                  data=json.dumps({'username': username, 'password': password}).encode(),
                  headers={'Content-Type': 'application/json'}, method='POST')
    with urlopen(req, timeout=3) as resp:
        return {'Cookie': resp.headers['Set-Cookie'].split(';', 1)[0]}


class KbAdminHttpTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls.temp.name, 'kb-admin.sqlite3')
        cls.env = mock.patch.dict(os.environ, {'DATABASE_PATH': cls.db_path})
        cls.env.start()
        cls.original_db = app.db
        app.db = DB(cls.db_path)
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)
        cls.owner = owner_headers(cls.base)
        cls.svc = _login(cls.base, 'kb-svc', '测试客服', 'service')

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db = cls.original_db
        cls.env.stop()
        cls.temp.cleanup()

    def request(self, path, method='GET', data=None, headers=None):
        req = Request(self.base + path,
                      data=json.dumps(data).encode() if data is not None else None,
                      headers={'Content-Type': 'application/json'}, method=method)
        if headers:
            req.add_header('Cookie', headers['Cookie'])
        try:
            resp = urlopen(req, timeout=3)
        except HTTPError as e:
            resp = e
        with resp:
            return resp.status, json.loads(resp.read())

    def test_anonymous_401(self):
        for method, path in (('GET', '/api/admin/kb'),
                             ('GET', '/api/admin/kb/mila'),
                             ('PUT', '/api/admin/kb/mila'),
                             ('POST', '/api/admin/kb/mila/check'),
                             ('POST', '/api/admin/kb/mila/rollback')):
            status, _ = self.request(path, method=method, data={} if method != 'GET' else None)
            self.assertEqual(status, 401, path)

    def test_list_overview_and_stats(self):
        status, body = self.request('/api/admin/kb', headers=self.owner)
        self.assertEqual(status, 200)
        beads = kb._load()['beads']
        products = [p for p in app.db.list('beads') if p.get('onSale', True)]
        conf = {k: (b.get('confidence') or {}).get('meaning') for k, b in beads.items()}
        self.assertEqual(body['totalKinds'], len(beads))
        self.assertEqual(body['spacer'], sum(1 for p in products if p.get('mat') == 'metal'))
        self.assertEqual(body['lowConfidence'],
                         sum(1 for p in products
                             if p.get('mat') != 'metal' and conf.get(p.get('kb')) == 'low'))
        self.assertEqual(body['recent7d'], len(beads))  # m010 导入即当前时间
        mila = next(r for r in body['items'] if r['id'] == 'mila')
        self.assertEqual(mila['name'], '蜜蜡')
        self.assertEqual(mila['onSaleCount'], 3)
        self.assertEqual(mila['meaningConfidence'], 'low')

    def test_list_search(self):
        from urllib.parse import quote
        status, body = self.request('/api/admin/kb?q=' + quote('蜜蜡'), headers=self.svc)
        self.assertEqual(status, 200)
        self.assertIn('mila', [r['id'] for r in body['items']])
        _, empty = self.request('/api/admin/kb?q=' + quote('不存在的品种xyz'), headers=self.svc)
        self.assertEqual(empty['items'], [])

    def test_detail(self):
        status, body = self.request('/api/admin/kb/mila', headers=self.svc)
        self.assertEqual(status, 200)
        self.assertEqual(body['version'], 1)
        self.assertEqual(body['data']['id'], 'mila')
        self.assertEqual({p['id'] for p in body['products']}, {'ml10', 'ml10-8', 'ml10-12'})
        self.assertEqual(len(body['history']), 1)
        self.assertEqual(body['history'][0]['savedBy'], '导入')
        status, _ = self.request('/api/admin/kb/no-such-bead', headers=self.svc)
        self.assertEqual(status, 404)

    def test_check_open_to_service(self):
        bad = copy.deepcopy(kb.get('mila'))
        bad['meaning']['text'] += '，招财'
        status, body = self.request('/api/admin/kb/mila/check', method='POST',
                                    data={'data': bad}, headers=self.svc)
        self.assertEqual(status, 200)
        self.assertTrue(any('功效词' in e['message'] for e in body['errors']))
        status, body = self.request('/api/admin/kb/mila/check', method='POST',
                                    data={'data': kb.get('mila')}, headers=self.svc)
        self.assertEqual(status, 200)
        self.assertEqual(body['errors'], [])

    def test_service_cannot_save(self):
        status, _ = self.request('/api/admin/kb/mila', method='PUT',
                                 data={'version': 1, 'data': kb.get('mila')}, headers=self.svc)
        self.assertEqual(status, 403)
        status, _ = self.request('/api/admin/kb/mila/rollback', method='POST',
                                 data={'version': 1}, headers=self.svc)
        self.assertEqual(status, 403)

    def test_save_banned_word_400(self):
        data = copy.deepcopy(kb.get('mila'))
        data['meaning']['text'] += '，转运'
        status, body = self.request('/api/admin/kb/mila', method='PUT',
                                    data={'version': 1, 'data': data}, headers=self.owner)
        self.assertEqual(status, 400)
        self.assertTrue(body['errors'])
        self.assertEqual(kb.get('mila')['meaning']['text'],
                         '蜜蜡色泽温暖，在藏地和中国传统饰物里常与红珊瑚、绿松石搭配，取温润吉祥之意。')

    def test_save_version_conflict_409(self):
        status, _ = self.request('/api/admin/kb/mila', method='PUT',
                                 data={'version': 99, 'data': kb.get('mila')}, headers=self.owner)
        self.assertEqual(status, 409)

    def test_save_ok_and_catalog_sees_it(self):
        _, before = self.request('/api/catalog')
        ml10 = next(b for b in before['beads'] if b['id'] == 'ml10')
        self.assertEqual(ml10['meaning'], '')   # 把握 low，不给用户看寓意
        data = copy.deepcopy(kb.get('mila'))
        data['confidence']['meaning'] = 'mid'
        data['sources'] = data['sources'] + ['产地档口访谈']
        status, body = self.request('/api/admin/kb/mila', method='PUT',
                                    data={'version': 1, 'data': data, 'note': '补上来源'},
                                    headers=self.owner)
        self.assertEqual(status, 200)
        self.assertEqual(body['version'], 2)
        self.assertEqual(set(body['products']), {'ml10', 'ml10-8', 'ml10-12'})
        self.assertEqual(kb.get('mila')['confidence']['meaning'], 'mid')
        _, after = self.request('/api/catalog')
        ml10 = next(b for b in after['beads'] if b['id'] == 'ml10')
        self.assertIn('温润', ml10['meaning'])
        _, detail = self.request('/api/admin/kb/mila', headers=self.owner)
        self.assertEqual(detail['history'][0]['savedBy'], '测试负责人')
        self.assertEqual(detail['history'][0]['note'], '补上来源')

    def test_rollback(self):
        _, before = self.request('/api/admin/kb/nanhong', headers=self.owner)
        self.assertEqual(before['version'], 1)
        first = copy.deepcopy(before['data'])
        edited = copy.deepcopy(first)
        edited['summary'] += '（测试修订）'
        status, body = self.request('/api/admin/kb/nanhong', method='PUT',
                                    data={'version': 1, 'data': edited}, headers=self.owner)
        self.assertEqual(status, 200)
        self.assertEqual(body['version'], 2)
        status, _ = self.request('/api/admin/kb/nanhong/rollback', method='POST',
                                 data={'version': 99}, headers=self.owner)
        self.assertEqual(status, 404)
        status, body = self.request('/api/admin/kb/nanhong/rollback', method='POST',
                                    data={'version': 1}, headers=self.owner)
        self.assertEqual(status, 200)
        self.assertEqual(body['version'], 3)
        self.assertEqual(body['rolledBackTo'], 1)
        _, detail = self.request('/api/admin/kb/nanhong', headers=self.owner)
        self.assertEqual(detail['data'], first)
        self.assertEqual(detail['version'], 3)
        self.assertEqual(detail['history'][0]['savedBy'], '测试负责人')
        self.assertEqual(detail['history'][0]['note'], '退回到第 1 版')


if __name__ == '__main__':
    unittest.main()
