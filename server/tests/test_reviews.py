"""B-2: review submission, machine checks, human moderation, and visibility."""
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
from urllib.request import ProxyHandler, Request, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import accounts
import app
import content_security
import contract
import reviews
import user_api
from db import DB
from migrate import SQLiteAdapter
from migrations import m013_reviews


class ReviewsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'reviews.db'))
        self.db.put('users', 'u1', {'name': '测试用户', 'phoneHash': 'fake-hash'})
        self.db.put('users', 'u2', {'name': '其他用户', 'phoneHash': 'another-fake-hash'})
        self.order = {'no': 'R1', 'userId': 'u1', 'tplId': 't1', 'wrist': 15,
                      'orderStatus': 'completed', 'paymentStatus': 'paid',
                      'fulfillmentStatus': 'delivered', 'logisticsStatus': 'delivered',
                      'afterSaleStatus': 'none'}
        self.db.put('orders', 'R1', dict(self.order))
        self.actor_token = accounts.CURRENT_ADMIN.set({'name': '测试审核员'})
        self.security = patch.object(content_security, 'ensure_allowed')
        self.security.start()

    def tearDown(self):
        self.security.stop()
        accounts.CURRENT_ADMIN.reset(self.actor_token)
        self.db.conn.close()
        self.temp.cleanup()

    def submit(self, **changes):
        return reviews.submit(self.db, 'R1', 'u1', {'stars': 5, 'text': '颜色很好看', **changes})

    def test_migration_and_contract(self):
        self.assertIn('reviews', __import__('db').TABLES)
        m013_reviews.up(self.db.conn, SQLiteAdapter())
        self.assertEqual(self.db.list('reviews'), [])
        self.assertEqual(contract.ACTIONS['write_review'], '写评价')
        self.assertIn('taken_down', contract.payload()['reviewStatuses'])
        self.assertIn('write_review', user_api.order_allowed_actions(self.order))

    def test_only_phone_bound_owner_of_delivered_order_can_review(self):
        self.db.put('orders', 'R1', {**self.order, 'fulfillmentStatus': 'shipped',
                                    'logisticsStatus': 'in_transit', 'orderStatus': 'confirmed'})
        with self.assertRaisesRegex(ValueError, '签收后'):
            self.submit()
        self.db.put('orders', 'R1', self.order.copy())
        with self.assertRaises(KeyError):
            reviews.submit(self.db, 'R1', 'u2', {'stars': 5})
        self.db.put('users', 'u1', {'name': '测试用户'})
        with self.assertRaises(PermissionError):
            self.submit()

    def test_machine_rejection_can_be_edited_but_only_one_review(self):
        first = self.submit(text='治失眠')
        self.assertEqual(first['status'], 'machine_failed')
        self.assertFalse(first['machine']['textOk'])
        self.assertIn('write_review', user_api.order_allowed_actions(self.db.get('orders', 'R1')))
        corrected = self.submit(text='颜色很好看')
        self.assertEqual(corrected['id'], first['id'])
        self.assertEqual(corrected['status'], 'pending')
        self.assertNotIn('write_review', user_api.order_allowed_actions(self.db.get('orders', 'R1')))
        with self.assertRaisesRegex(ValueError, '已经评价'):
            self.submit()

    def test_wechat_text_failure_and_photo_states(self):
        content_security.ensure_allowed.side_effect = content_security.ContentRejected('微信机审不通过')
        self.assertEqual(self.submit()['status'], 'machine_failed')
        content_security.ensure_allowed.side_effect = None
        self.db.put('uploads', 'p1', {'userId': 'u1', 'checkStatus': 'pending'})
        review = self.submit(photoIds=['p1'])
        self.assertEqual(review['status'], 'pending')
        self.assertEqual(review['machine']['photos'], [{'id': 'p1', 'status': 'pending'}])
        with self.assertRaisesRegex(ValueError, '审核中'):
            reviews.moderate(self.db, review['id'], 'approve')
        self.db.put('uploads', 'p1', {'userId': 'u1', 'checkStatus': 'passed'})
        self.assertEqual(reviews.moderate(self.db, review['id'], 'approve')['status'], 'published')

    def test_rejected_photo_machine_fails_and_foreign_photo_rejected(self):
        self.db.put('uploads', 'bad', {'userId': 'u1', 'checkStatus': 'rejected'})
        self.assertEqual(self.submit(photoIds=['bad'])['status'], 'machine_failed')
        self.db.put('uploads', 'foreign', {'userId': 'u2', 'checkStatus': 'passed'})
        with self.assertRaisesRegex(ValueError, '不属于'):
            self.submit(photoIds=['foreign'])

    def test_pending_not_public_then_approve_and_take_down_with_audit(self):
        review = self.submit(anonymous=True)
        self.assertEqual(reviews.public_reviews(self.db, 't1'), [])
        with self.assertRaisesRegex(ValueError, '原因'):
            reviews.moderate(self.db, review['id'], 'reject')
        approved = reviews.moderate(self.db, review['id'], 'approve')
        self.assertEqual(approved['status'], 'published')
        public = reviews.public_reviews(self.db, 't1')
        self.assertEqual(len(public), 1)
        self.assertEqual(public[0]['nickname'], 'X*')
        with self.assertRaisesRegex(ValueError, '原因'):
            reviews.moderate(self.db, review['id'], 'take-down')
        reviews.moderate(self.db, review['id'], 'take-down', '内容不适合公开')
        self.assertEqual(reviews.public_reviews(self.db, 't1'), [])
        self.assertEqual(reviews.my_review(self.db, 'R1', 'u1')['status'], 'taken_down')
        self.assertEqual(len([r for r in self.db.list('audit_logs') if r.get('target') == 'review']), 2)

    def test_rejected_requires_reason_and_is_not_public(self):
        review = self.submit()
        rejected = reviews.moderate(self.db, review['id'], 'reject', '请修改评价内容')
        self.assertEqual(rejected['status'], 'rejected')
        self.assertEqual(rejected['rejectReason'], '请修改评价内容')
        self.assertEqual(reviews.public_reviews(self.db, 't1'), [])

    def test_custom_order_never_public_and_filters(self):
        self.db.put('orders', 'R1', {**self.order, 'tplId': ''})
        custom = self.submit(photoIds=[])
        reviews.moderate(self.db, custom['id'], 'approve')
        self.assertEqual(reviews.public_reviews(self.db, 't1'), [])
        self.db.put('orders', 'R2', {**self.order, 'no': 'R2', 'wrist': 16, 'tplId': 't1'})
        photo = reviews.submit(self.db, 'R2', 'u1', {'stars': 4, 'photoIds': [], 'text': '', 'anonymous': False})
        reviews.moderate(self.db, photo['id'], 'approve')
        self.assertEqual(len(reviews.public_reviews(self.db, 't1', 'wrist', 15)), 1)
        self.assertEqual(reviews.public_reviews(self.db, 't1', 'photos'), [])
        self.assertEqual(reviews.public_reviews(self.db, 't1')[0]['nickname'], '测试用户')

    def test_http_auth_and_public_route(self):
        old_db = app.db
        app.db = self.db
        server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        opener = build_opener(ProxyHandler({}))
        token = 'r' * 43
        self.db.put('sessions', user_api.token_hash(token), {'userId': 'u1', 'expiresAt': time.time() + 60})
        base = f'http://127.0.0.1:{server.server_port}'
        def request(path, method='GET', body=None, auth=False):
            headers = {'Content-Type': 'application/json'}
            if auth:
                headers['Authorization'] = 'Bearer ' + token
            req = Request(base + path, data=json.dumps(body).encode() if body is not None else None,
                          headers=headers, method=method)
            try:
                response = opener.open(req, timeout=3)
            except HTTPError as error:
                response = error
            with response:
                return response.status, json.loads(response.read())
        try:
            self.assertEqual(request('/api/my/orders/R1/review', 'POST', {'stars': 5})[0], 401)
            code, review = request('/api/my/orders/R1/review', 'POST', {'stars': 5}, True)
            self.assertEqual(code, 200)
            self.assertEqual(review['status'], 'pending')
            self.assertEqual(request('/api/my/orders/R1/review', auth=True)[1]['id'], review['id'])
            self.assertEqual(request('/api/templates/t1/reviews')[1]['reviews'], [])
        finally:
            server.shutdown(); server.server_close(); thread.join()
            app.db = old_db
