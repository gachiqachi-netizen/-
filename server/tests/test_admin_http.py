"""后台电商接口的 HTTP 端到端测试：鉴权、商品/订单/售后/条款路由与错误码。"""
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import status
from db import DB


class AdminCommerceHTTPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db, cls.original_token = app.db, app.ADMIN_TOKEN
        app.db = DB(os.path.join(cls.temp.name, 'http.db'))
        app.ADMIN_TOKEN = 'test-admin'
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db, app.ADMIN_TOKEN = cls.original_db, cls.original_token
        cls.temp.cleanup()

    def request(self, path, method='GET', data=None, admin=None):
        headers = {'Content-Type': 'application/json'}
        if admin:
            headers['X-Admin-Token'] = admin
        raw = json.dumps(data).encode() if data is not None else None
        req = Request(self.base + path, data=raw, headers=headers, method=method)
        try:
            resp = urlopen(req, timeout=3)
        except HTTPError as e:
            resp = e
        with resp:
            return resp.status, json.loads(resp.read())

    def _order(self, no='CGZTEST0001', paid=False):
        order = {'no': no, 'name': '测试手串', 'beads': [], 'items': [], 'wrist': 15,
                 'goods': 0, 'ship': 0, 'promo': 0, 'total': 0, 'totalFen': 0,
                 'person': '测试', 'phone': '13800138000', 'addr': '测试地址',
                 'status': '待支付', 'userId': 'u1',
                 'orderStatus': 'pending_confirmation', 'paymentStatus': 'paid' if paid else 'unpaid',
                 'paidFen': 100 if paid else 0,
                 'fulfillmentStatus': 'unfulfilled', 'afterSaleStatus': 'none', 'logisticsStatus': 'not_shipped',
                 'statusHistory': [], 'logistics': None, 'logisticsHistory': [],
                 'termsSnapshot': [], 'createdAt': int(time.time() * 1000)}
        app.db.put('orders', no, order)
        return order

    def test_new_routes_fail_closed_without_token(self):
        for path, method in [('/api/admin/beads', 'GET'), ('/api/admin/after-sales', 'GET'),
                             ('/api/admin/terms', 'GET'), ('/api/admin/audit', 'GET'),
                             ('/api/admin/orders/CGZTEST0001', 'GET')]:
            self.assertEqual(self.request(path, method)[0], 401, path)

    def test_product_create_filter_copy_delete(self):
        _, created = self.request('/api/admin/beads', 'POST', {'name': '测试线材', 'type': 'cord', 'mat': 'cord', 'price': 1.5, 'status': 'on_sale'}, admin='test-admin')
        self.assertEqual(created['type'], 'cord')
        self.assertEqual(created['priceFen'], 150)
        self.assertTrue(created['onSale'])
        # 列表按类型筛选
        _, rows = self.request('/api/admin/beads?type=cord', admin='test-admin')
        self.assertTrue(any(b['id'] == created['id'] for b in rows))
        # 复制
        _, copied = self.request('/api/admin/beads/' + created['id'] + '/copy', 'POST', admin='test-admin')
        self.assertEqual(copied['status'], 'draft')
        # 删除
        self.assertEqual(self.request('/api/admin/beads/' + created['id'], 'DELETE', admin='test-admin')[0], 200)

    def test_order_status_transition_and_illegal(self):
        no = self._order(paid=True)['no']  # A4c：只有已付款订单能手动确认
        # 合法迁移：待确认 → 已确认
        status_code, saved = self.request(f'/api/admin/orders/{no}/status', 'PUT', {'group': 'orderStatus', 'to': 'confirmed'}, admin='test-admin')
        self.assertEqual(status_code, 200)
        self.assertEqual(saved['orderStatus'], 'confirmed')
        # 非法迁移：confirmed → pending_confirmation 应 400
        status_code, body = self.request(f'/api/admin/orders/{no}/status', 'PUT', {'group': 'orderStatus', 'to': 'pending_confirmation'}, admin='test-admin')
        self.assertEqual(status_code, 400)
        # 支付状态不可手工改
        status_code, body = self.request(f'/api/admin/orders/{no}/status', 'PUT', {'group': 'paymentStatus', 'to': 'paid'}, admin='test-admin')
        self.assertEqual(status_code, 400)

    def test_ship_requires_logistics_then_updates(self):
        no = self._order('CGZTEST0002')['no']
        app.db.put('orders', no, {**app.db.get('orders', no), 'orderStatus': 'confirmed', 'paymentStatus': 'paid', 'fulfillmentStatus': 'ready_to_ship',
                                  'qualityGate': {'passed': True, 'inspector': '测试质检'}})
        # 无物流不能发货
        status_code, body = self.request(f'/api/admin/orders/{no}/status', 'PUT', {'group': 'fulfillmentStatus', 'to': 'shipped'}, admin='test-admin')
        self.assertEqual(status_code, 400)
        # 填物流后发货
        status_code, saved = self.request(f'/api/admin/orders/{no}/status', 'PUT', {'group': 'fulfillmentStatus', 'to': 'shipped', 'logistics': {'carrierName': '顺丰', 'trackingNo': 'SF123'}}, admin='test-admin')
        self.assertEqual(status_code, 200)
        self.assertEqual(saved['fulfillmentStatus'], 'shipped')
        self.assertEqual(saved['logistics']['trackingNo'], 'SF123')
        # 修改物流
        status_code, _ = self.request(f'/api/admin/orders/{no}/logistics', 'PUT', {'carrierName': '顺丰', 'trackingNo': 'SF456', 'note': '已联系'}, admin='test-admin')
        self.assertEqual(status_code, 200)
        detail = app.db.get('orders', no)
        self.assertEqual(detail['logistics']['trackingNo'], 'SF456')
        self.assertTrue(detail['logisticsHistory'])

    def test_after_sale_flow(self):
        no = self._order('CGZTEST0003', paid=True)['no']
        status_code, rec = self.request('/api/admin/after-sales', 'POST', {'orderNo': no, 'type': '仅退款', 'reason': '不想要了', 'refundFen': 100}, admin='test-admin')
        self.assertEqual(status_code, 200)
        self.assertEqual(rec['status'], 'requested')
        order = app.db.get('orders', no)
        self.assertEqual(order['afterSaleStatus'], 'requested')
        # 同意 → 审核中 → 已同意
        status_code, rec = self.request(f"/api/admin/after-sales/{rec['no']}/transition", 'PUT', {'action': 'approve'}, admin='test-admin')
        self.assertEqual(status_code, 200)
        self.assertEqual(rec['status'], 'reviewing')
        status_code, rec = self.request(f"/api/admin/after-sales/{rec['no']}/transition", 'PUT', {'action': 'approve'}, admin='test-admin')
        self.assertEqual(status_code, 200)
        self.assertEqual(rec['status'], 'approved')
        # 无真实退款渠道：退款类售后不得推进到 refunding / completed
        status_code, body = self.request(f"/api/admin/after-sales/{rec['no']}/transition", 'PUT', {'action': 'receive'}, admin='test-admin')
        self.assertEqual(status_code, 400)
        self.assertIn('真实退款服务尚未接入', body['error'])
        status_code, body = self.request(f"/api/admin/after-sales/{rec['no']}/transition", 'PUT', {'action': 'complete'}, admin='test-admin')
        self.assertEqual(status_code, 400)
        order = app.db.get('orders', no)
        self.assertEqual(order['afterSaleStatus'], 'approved')
        self.assertTrue(order['statusHistory'])

    def test_terms_publish_and_audit(self):
        status_code, term = self.request('/api/admin/terms', 'POST', {'title': '测试条款', 'type': '售前说明', 'version': '1.0.0', 'body': '（待运营/法务确认）测试', 'status': 'published', 'confirmed': False}, admin='test-admin')
        self.assertEqual(status_code, 200)
        self.assertEqual(term['status'], 'published')
        # 审计有记录
        _, rows = self.request('/api/admin/audit', admin='test-admin')
        self.assertTrue(any(a['target'] == 'term' and a['action'] == 'create' for a in rows))


if __name__ == '__main__':
    unittest.main()
