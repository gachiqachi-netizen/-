"""A4c：后台改地址、内部备注、取消原因、去掉手动确认未付款订单。"""
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

import app
import commerce
import user_api
from db import DB
from admin_helpers import owner_headers


def order(no="ORDER-1", owner="u1", **changes):
    result = {
        "no": no, "userId": owner, "name": "测试手串", "beads": ["zt8"] * 6,
        "items": [{"id": "zt8", "unitPriceFen": 300}], "totalFen": 3300, "payableFen": 3300,
        "paidFen": 0, "refundFen": 0, "status": "待支付",
        "person": "张三", "phone": "13800138000", "addr": "某市某区某路 1 号",
        "orderStatus": "pending_confirmation", "paymentStatus": "unpaid",
        "fulfillmentStatus": "unfulfilled", "afterSaleStatus": "none", "logisticsStatus": "not_shipped",
        "statusHistory": [], "logisticsHistory": [], "logistics": None,
        "createdAt": int(time.time() * 1000),
    }
    result.update(changes)
    return result


NEW_ADDR = {"person": "李四", "phone": "13900139000", "addr": "另一市另一区 2 号"}


class FunctionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, "ops.db"))

    def tearDown(self):
        self.tmp.cleanup()

    def save(self, o):
        self.db.put("orders", o["no"], o)

    # ---- 内部备注

    def test_internal_note_is_saved_and_hidden_from_customer(self):
        self.save(order())
        commerce.add_internal_note(self.db, "ORDER-1", "  客户电话说晚点发  ", actor="admin")
        o = self.db.get("orders", "ORDER-1")
        self.assertEqual(o["internalNotes"][-1]["text"], "客户电话说晚点发")
        self.assertEqual(o["internalNotes"][-1]["actor"], "admin")
        self.assertNotIn("internalNotes", user_api.public_order(o))
        audits = [a for a in self.db.list("audit_logs") if a.get("action") == "internal_note"]
        self.assertEqual(len(audits), 1)

    def test_internal_note_length_rules(self):
        self.save(order())
        with self.assertRaises(ValueError):
            commerce.add_internal_note(self.db, "ORDER-1", "   ", actor="admin")
        with self.assertRaises(ValueError):
            commerce.add_internal_note(self.db, "ORDER-1", "字" * 301, actor="admin")
        commerce.add_internal_note(self.db, "ORDER-1", "字" * 300, actor="admin")

    def test_internal_notes_keep_last_100(self):
        self.save(order(internalNotes=[{"at": 1, "actor": "admin", "text": str(i)} for i in range(100)]))
        commerce.add_internal_note(self.db, "ORDER-1", "最新", actor="admin")
        notes = self.db.get("orders", "ORDER-1")["internalNotes"]
        self.assertEqual(len(notes), 100)
        self.assertEqual(notes[-1]["text"], "最新")
        self.assertEqual(notes[0]["text"], "1")

    # ---- 取消原因

    def test_cancel_with_valid_reason_is_saved(self):
        self.save(order())
        user_api.perform_order_action(self.db, "ORDER-1", "u1", "cancel_order", reason="地址填错了")
        o = self.db.get("orders", "ORDER-1")
        self.assertEqual(o["orderStatus"], "cancelled")
        self.assertEqual(o["cancelReason"], "地址填错了")
        self.assertIn("用户取消未支付订单：地址填错了", [h.get("note") for h in o["statusHistory"]])

    def test_cancel_with_invalid_reason_is_rejected(self):
        self.save(order())
        with self.assertRaises(ValueError):
            user_api.perform_order_action(self.db, "ORDER-1", "u1", "cancel_order", reason="随便写的")
        self.assertEqual(self.db.get("orders", "ORDER-1")["orderStatus"], "pending_confirmation")

    def test_cancel_without_reason_still_works(self):
        self.save(order())
        user_api.perform_order_action(self.db, "ORDER-1", "u1", "cancel_order")
        o = self.db.get("orders", "ORDER-1")
        self.assertEqual(o["orderStatus"], "cancelled")
        self.assertNotIn("cancelReason", o)

    # ---- 去掉手动确认

    def test_unpaid_order_has_no_manual_confirm(self):
        self.save(order())
        allowed = commerce.allowed_order_transitions(self.db.get("orders", "ORDER-1"))
        self.assertNotIn("confirmed", allowed["orderStatus"])
        with self.assertRaisesRegex(ValueError, "付款后会自动确认，不用手动确认"):
            commerce.transition_order_status(self.db, "ORDER-1", "orderStatus", "confirmed")
        self.assertEqual(self.db.get("orders", "ORDER-1")["orderStatus"], "pending_confirmation")

    def test_paid_order_can_still_be_confirmed(self):
        self.save(order(paymentStatus="paid", paidFen=3300))
        allowed = commerce.allowed_order_transitions(self.db.get("orders", "ORDER-1"))
        self.assertIn("confirmed", allowed["orderStatus"])
        commerce.transition_order_status(self.db, "ORDER-1", "orderStatus", "confirmed")
        self.assertEqual(self.db.get("orders", "ORDER-1")["orderStatus"], "confirmed")


class AdminHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db, cls.original_token = app.db, app.ADMIN_TOKEN
        app.db = DB(os.path.join(cls.temp.name, "http.db"))
        app.ADMIN_TOKEN = "test-admin"
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.server.server_port)
        cls.opener = build_opener(ProxyHandler({}))  # 本机请求不走代理
        cls.admin_headers = owner_headers(cls.base)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        app.db.conn.close()
        app.db, app.ADMIN_TOKEN = cls.original_db, cls.original_token
        cls.temp.cleanup()

    def request(self, path, method="PUT", data=None, admin="test-admin"):
        headers = {"Content-Type": "application/json"}
        if admin:
            headers.update(self.admin_headers)
        raw = json.dumps(data).encode() if data is not None else None
        try:
            resp = self.opener.open(Request(self.base + path, data=raw, headers=headers, method=method), timeout=3)
        except HTTPError as e:
            resp = e
        with resp:
            return resp.status, json.loads(resp.read())

    def save(self, o):
        app.db.put("orders", o["no"], o)

    def test_admin_change_address_before_shipping(self):
        self.save(order("ADDR-1", paymentStatus="paid", paidFen=3300, orderStatus="confirmed", fulfillmentStatus="producing"))
        code, body = self.request("/api/admin/orders/ADDR-1/address", data=NEW_ADDR)
        self.assertEqual(code, 200)
        self.assertEqual(body["person"], "李四")
        saved = app.db.get("orders", "ADDR-1")
        self.assertEqual(saved["addr"], NEW_ADDR["addr"])
        self.assertEqual(saved["addressHistory"][-1]["actor"], "测试负责人")
        self.assertEqual(saved["addressHistory"][-1]["person"], "张三")

    def test_admin_change_address_after_shipping_rejected(self):
        self.save(order("ADDR-2", paymentStatus="paid", paidFen=3300, orderStatus="confirmed",
                        fulfillmentStatus="shipped", logisticsStatus="in_transit",
                        logistics={"carrierName": "测试快递", "trackingNo": "T1"}))
        code, body = self.request("/api/admin/orders/ADDR-2/address", data=NEW_ADDR)
        self.assertEqual(code, 400)
        self.assertEqual(app.db.get("orders", "ADDR-2")["person"], "张三")

    def test_admin_routes_require_admin(self):
        self.save(order("ADDR-3"))
        code, _ = self.request("/api/admin/orders/ADDR-3/address", data=NEW_ADDR, admin=None)
        self.assertEqual(code, 401)
        code, _ = self.request("/api/admin/orders/ADDR-3/note", data={"text": "x"}, admin=None)
        self.assertEqual(code, 401)

    def test_admin_note_over_http(self):
        self.save(order("NOTE-1"))
        code, body = self.request("/api/admin/orders/NOTE-1/note", data={"text": "包装加一张卡片"})
        self.assertEqual(code, 200)
        self.assertEqual(body["internalNotes"][-1]["text"], "包装加一张卡片")
        code, _ = self.request("/api/admin/orders/NOTE-1/note", data={"text": "字" * 301})
        self.assertEqual(code, 400)

    def test_admin_manual_confirm_unpaid_rejected_over_http(self):
        self.save(order("CONF-1"))
        code, body = self.request("/api/admin/orders/CONF-1/status", data={"group": "orderStatus", "to": "confirmed"})
        self.assertEqual(code, 400)
        self.assertIn("付款后会自动确认", body.get("error", ""))


if __name__ == "__main__":
    unittest.main()
