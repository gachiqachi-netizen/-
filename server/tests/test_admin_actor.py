"""A8d: admin writes identify the signed-in account in audit and history."""
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import accounts
import app
import commerce
import status as order_status
from db import DB


ACTOR_NAME = '测试操作员'


class AdminActorHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db = app.db
        app.db = DB(os.path.join(cls.temp.name, 'actor.db'))
        user, _ = accounts.create_user(app.db, 'actor-test', ACTOR_NAME, 'owner', 'test-only-password')
        sid = accounts.create_session(app.db, user['id'], 3600)
        cls.headers = {'Cookie': 'beadloop_admin=' + sid, 'Content-Type': 'application/json'}
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.opener = build_opener(ProxyHandler({}))

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db = cls.original_db
        cls.temp.cleanup()

    def request(self, method, path, data=None):
        raw = json.dumps(data).encode() if data is not None else None
        req = Request(self.base + path, data=raw, method=method, headers=self.headers)
        try:
            response = self.opener.open(req, timeout=5)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def audit(self, action, target_id):
        matches = [row for row in app.db.list('audit_logs')
                   if row.get('action') == action and row.get('targetId') == target_id]
        self.assertTrue(matches, (action, target_id))
        self.assertEqual(matches[-1]['actor'], ACTOR_NAME)

    def order(self, no):
        app.db.put('orders', no, {
            'no': no, 'userId': 'test-user', 'name': '测试手串', 'beads': [], 'items': [],
            'totalFen': 0, 'payableFen': 0, 'paidFen': 100,
            'orderStatus': 'pending_confirmation', 'paymentStatus': 'paid',
            'fulfillmentStatus': 'unfulfilled', 'afterSaleStatus': 'none',
            'logisticsStatus': 'not_shipped', 'statusHistory': [], 'logisticsHistory': [],
            'createdAt': int(time.time() * 1000),
        })

    def test_product_create_copy_update_delete_audits_account(self):
        status, created = self.request('POST', '/api/admin/beads', {
            'name': '测试线材', 'type': 'cord', 'mat': 'cord', 'priceFen': 150,
            'status': 'draft', 'images': [],
        })
        self.assertEqual(status, 200)
        rid = created['id']
        self.audit('create', rid)
        status, copied = self.request('POST', f'/api/admin/beads/{rid}/copy')
        self.assertEqual(status, 200)
        self.audit('copy', copied['id'])
        status, _ = self.request('PUT', f'/api/admin/beads/{rid}', {**created, 'name': '测试线材二号'})
        self.assertEqual(status, 200)
        self.audit('update', rid)
        self.assertEqual(self.request('DELETE', f'/api/admin/beads/{rid}')[0], 200)
        self.audit('delete', rid)

    def test_order_history_note_and_quality_use_account(self):
        no = 'ACTOR-ORDER-1'
        self.order(no)
        status, _ = self.request('PUT', f'/api/admin/orders/{no}/status',
                                 {'group': 'orderStatus', 'to': 'confirmed'})
        self.assertEqual(status, 200)
        self.audit('transition', no)
        self.assertEqual(app.db.get('orders', no)['statusHistory'][-1]['actor'], ACTOR_NAME)

        status, _ = self.request('PUT', f'/api/admin/orders/{no}/note', {'text': '内部测试备注'})
        self.assertEqual(status, 200)
        self.audit('internal_note', no)
        self.assertEqual(app.db.get('orders', no)['internalNotes'][-1]['actor'], ACTOR_NAME)

        status, detail = self.request('PUT', f'/api/admin/orders/{no}/quality-gate', {
            'sequenceOk': True, 'sizeOk': True, 'materialOk': True,
            'appearanceOk': True, 'inspector': '伪造质检人',
        })
        self.assertEqual(status, 200)
        self.audit('quality_gate', no)
        self.assertEqual(detail['qualityGate']['inspector'], ACTOR_NAME)
        self.assertEqual(app.db.get('orders', no)['statusHistory'][-1]['actor'], ACTOR_NAME)

    def test_direct_quality_gate_ignores_request_inspector(self):
        no = 'ACTOR-ORDER-2'
        self.order(no)
        detail = commerce.record_quality_gate(app.db, no, {
            'sequenceOk': True, 'sizeOk': True, 'materialOk': True,
            'appearanceOk': True, 'inspector': '伪造质检人',
        }, actor=ACTOR_NAME)
        self.assertEqual(detail['qualityGate']['inspector'], ACTOR_NAME)
        self.audit('quality_gate', no)

    def test_logistics_and_work_order_audit_account(self):
        no = 'ACTOR-ORDER-3'
        self.order(no)
        status, _ = self.request('PUT', f'/api/admin/orders/{no}/logistics', {'note': '测试物流备注'})
        self.assertEqual(status, 200)
        self.audit('update_logistics', no)
        self.assertEqual(app.db.get('orders', no)['logisticsHistory'][-1]['actor'], ACTOR_NAME)
        status, _ = self.request('PUT', f'/api/admin/orders/{no}/work-order', {'progress': 20})
        self.assertEqual(status, 200)
        self.audit('update_work_order', no)

    def test_term_create_update_delete_audit_account(self):
        term = {'title': '测试条款', 'type': '售前说明', 'version': '1.0',
                'body': '测试正文', 'status': 'draft'}
        status, created = self.request('POST', '/api/admin/terms', term)
        self.assertEqual(status, 200)
        rid = created['id']
        self.audit('create', rid)
        status, _ = self.request('PUT', f'/api/admin/terms/{rid}', {**term, 'title': '测试条款二'})
        self.assertEqual(status, 200)
        self.audit('update', rid)
        self.assertEqual(self.request('DELETE', f'/api/admin/terms/{rid}')[0], 200)
        self.audit('delete', rid)

    def test_after_sale_create_and_transition_audit_account(self):
        no = 'ACTOR-ORDER-4'
        self.order(no)
        status, created = self.request('POST', '/api/admin/after-sales', {
            'orderNo': no, 'type': '补寄配件', 'reason': '测试补寄', 'refundFen': 0,
        })
        self.assertEqual(status, 200)
        sale_no = created['no']
        self.audit('create', sale_no)
        self.assertEqual(app.db.get('orders', no)['statusHistory'][-1]['actor'], ACTOR_NAME)
        status, _ = self.request('PUT', f'/api/admin/after-sales/{sale_no}/transition',
                                 {'action': 'approve'})
        self.assertEqual(status, 200)
        self.audit('approve', sale_no)
        self.assertEqual(app.db.get('after_sales', sale_no)['history'][-1]['actor'], ACTOR_NAME)

    def test_template_create_copy_update_delete_audits_account(self):
        bead = next(row for row in app.db.list('beads') if order_status.product_type(row) == 'bead')
        template = {'name': '测试模板', 'pattern': [bead['id']], 'status': 'draft'}
        status, created = self.request('POST', '/api/admin/templates', template)
        self.assertEqual(status, 200)
        rid = created['id']
        self.audit('create', rid)
        status, copied = self.request('POST', f'/api/admin/templates/{rid}/copy')
        self.assertEqual(status, 200)
        self.audit('copy', copied['id'])
        status, _ = self.request('PUT', f'/api/admin/templates/{rid}',
                                 {**template, 'name': '测试模板二'})
        self.assertEqual(status, 200)
        self.audit('update', rid)
        self.assertEqual(self.request('DELETE', f'/api/admin/templates/{rid}')[0], 200)
        self.audit('delete', rid)
