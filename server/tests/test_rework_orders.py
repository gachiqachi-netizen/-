"""A5c: received-only rework, editable sequence, quality gate, shipping, permissions."""
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import accounts
import app
import commerce
import user_api
from db import DB


class ReworkOrderTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, 'rework.db'))
        beads = [bead for bead in self.db.list('beads') if bead.get('onSale') and not bead.get('spacer')]
        self.bead_a, self.bead_b = beads[0]['id'], beads[1]['id']
        self.order = {
            'no': 'REWORK-ORDER-1', 'name': '原手串', 'userId': 'customer-1',
            'beads': [self.bead_a] * 6, 'wrist': 15, 'paymentStatus': 'paid',
            'orderStatus': 'completed', 'fulfillmentStatus': 'delivered',
            'logisticsStatus': 'delivered', 'afterSaleStatus': 'returning',
            'payableFen': 12800, 'paidFen': 12800, 'refundFen': 0,
        }
        self.db.put('orders', self.order['no'], self.order)
        self.sale = {'no': 'REWORK-SALE-1', 'orderNo': self.order['no'],
                     'type': '改手围重串', 'status': 'returning', 'newWrist': 17,
                     'refundFen': 0, 'history': []}
        self.db.put('after_sales', self.sale['no'], self.sale)

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def receive(self):
        commerce.transition_after_sale(self.db, self.sale['no'], 'receive', actor='客服')

    def test_only_received_rework_sale_can_create_order(self):
        with self.assertRaises(ValueError):
            commerce.create_rework_order(self.db, self.sale['no'])
        rec = self.db.get('after_sales', self.sale['no'])
        rec['type'] = '退货退款'
        self.db.put('after_sales', self.sale['no'], rec)
        with self.assertRaises(ValueError):
            commerce.create_rework_order(self.db, self.sale['no'])
        rec['type'] = '改手围重串'
        self.db.put('after_sales', self.sale['no'], rec)
        self.receive()
        saved = self.db.get('orders', self.order['no'])
        self.assertEqual(user_api.public_order(saved)['customerStatus']['code'], 'after_sale_open')
        wo = commerce.create_rework_order(self.db, self.sale['no'], actor='客服')
        self.assertEqual(wo['wrist'], 17)
        self.assertEqual([item['id'] for item in wo['sequence']], self.order['beads'])
        self.assertEqual(wo['targetMm'], __import__('plans').target_for(17, wo['sequence'][0]['mm']))
        self.assertEqual(commerce.create_rework_order(self.db, self.sale['no'])['workOrderNo'], wo['workOrderNo'])
        self.assertEqual(self.db.get('orders', self.order['no'])['payableFen'], 12800)

    def test_rework_sequence_note_and_normal_order_lock(self):
        self.receive()
        commerce.create_rework_order(self.db, self.sale['no'])
        with self.assertRaisesRegex(ValueError, '备注'):
            commerce.update_rework_order(self.db, self.sale['no'], {'sequence': [self.bead_a, self.bead_b]})
        with self.assertRaises(ValueError):
            commerce.update_work_order(self.db, self.order['no'], {'sequence': [self.bead_b]})
        wo = commerce.update_rework_order(self.db, self.sale['no'],
            {'sequence': [self.bead_a] * 6 + [self.bead_b], 'note': '已电话沟通加一颗'}, actor='做单师傅')
        self.assertEqual(wo['count'], 7)
        self.assertEqual(wo['sequence'][-1]['id'], self.bead_b)
        wo = commerce.update_rework_order(self.db, self.sale['no'],
            {'sequence': [self.bead_b] * 6, 'note': '已电话沟通换珠并减一颗'}, actor='做单师傅')
        self.assertEqual(wo['count'], 6)
        self.assertTrue(all(item['id'] == self.bead_b for item in wo['sequence']))
        self.assertTrue(any(row.get('action') == 'change_rework_sequence' for row in self.db.list('audit_logs')))
        saved = self.db.get('orders', self.order['no'])
        self.assertEqual((saved['payableFen'], saved['paidFen'], saved['refundFen']), (12800, 12800, 0))

    def test_rework_requires_qc_before_shipping_and_completes_sale(self):
        self.receive()
        commerce.create_rework_order(self.db, self.sale['no'])
        with self.assertRaisesRegex(ValueError, '质检'):
            commerce.update_rework_order(self.db, self.sale['no'],
                {'shipping': {'carrierName': '测试快递', 'trackingNo': 'TEST-123'}})
        checks = {key: True for key in commerce.QUALITY_GATE_FIELDS}
        wo = commerce.update_rework_order(self.db, self.sale['no'], {'qualityGate': checks}, actor='质检员')
        self.assertEqual(wo['status'], 'qc_passed')
        wo = commerce.update_rework_order(self.db, self.sale['no'],
            {'shipping': {'carrierName': '测试快递', 'trackingNo': 'TEST-123'}}, actor='客服')
        self.assertEqual(wo['status'], 'shipped')
        self.assertEqual(self.db.get('after_sales', self.sale['no'])['status'], 'completed')
        saved = self.db.get('orders', self.order['no'])
        self.assertEqual(saved['afterSaleStatus'], 'completed')
        self.assertEqual((saved['payableFen'], saved['paidFen'], saved['refundFen']), (12800, 12800, 0))

    def test_http_permissions(self):
        old_db = app.db
        app.db = self.db
        server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(lambda: (server.shutdown(), server.server_close(), thread.join(), setattr(app, 'db', old_db)))
        base = f'http://127.0.0.1:{server.server_port}'
        opener = build_opener(ProxyHandler({}))

        def call(path, method, data, cookie):
            request = Request(base + path, method=method,
                data=json.dumps(data).encode() if data is not None else None,
                headers={'Cookie': cookie, 'Content-Type': 'application/json'})
            try:
                response = opener.open(request, timeout=3)
            except HTTPError as error:
                response = error
            with response:
                return response.status, json.loads(response.read())

        for role in ('maker', 'service'):
            uid = 'rework-' + role
            self.db.put('admin_users', uid, {'id': uid, 'username': uid, 'name': role,
                                             'roleId': role, 'status': 'active', 'mustChangePassword': False})
        maker = 'beadloop_admin=' + accounts.create_session(self.db, 'rework-maker', 3600)
        service = 'beadloop_admin=' + accounts.create_session(self.db, 'rework-service', 3600)
        self.receive()
        path = '/api/admin/after-sales/' + self.sale['no'] + '/rework-order'
        self.assertEqual(call(path, 'POST', {}, maker)[0], 403)
        self.assertEqual(call(path, 'POST', {}, service)[0], 201)
        self.assertEqual(call('/api/admin/rework-orders/' + self.sale['no'], 'PUT',
                              {'sequence': [self.bead_a], 'note': '同意'}, service)[0], 403)
