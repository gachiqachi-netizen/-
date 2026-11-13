"""A8c：按后台角色打码订单与工单，显示全号要留操作记录。"""
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import accounts
import app
import commerce
from db import DB


PHONE = "13800008000"
ADDRESS = "测试省测试市测试区测试路一号"


class MaskTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(":memory:")

    def tearDown(self):
        self.db.conn.close()

    def as_role(self, role_id):
        return accounts.CURRENT_ADMIN.set({"roleId": role_id, "status": "active"})

    def test_operator_and_maker_see_masked_contact_and_no_cost(self):
        sample = {"phone": PHONE, "addr": ADDRESS, "costFen": 123,
                  "nested": {"phone": PHONE, "costFen": 20}}
        for role_id in ("operator", "maker"):
            token = self.as_role(role_id)
            try:
                result = accounts.mask_order(self.db, sample)
                self.assertEqual(result["phone"], "138****8000")
                self.assertEqual(result["addr"], "测试省测试市测试区***")
                self.assertEqual(result["nested"]["phone"], "138****8000")
                self.assertNotIn("costFen", result)
                self.assertNotIn("costFen", result["nested"])
            finally:
                accounts.CURRENT_ADMIN.reset(token)
        self.assertEqual(sample["phone"], PHONE)
        self.assertEqual(sample["costFen"], 123)

    def test_service_sees_contact_but_not_cost_and_owner_sees_all(self):
        sample = {"phone": PHONE, "addr": ADDRESS, "costFen": 123}
        for role_id, expected in (("service", False), ("owner", True)):
            token = self.as_role(role_id)
            try:
                result = accounts.mask_order(self.db, sample)
                self.assertEqual(result["phone"], PHONE)
                self.assertEqual(result["addr"], ADDRESS)
                self.assertEqual("costFen" in result, expected)
            finally:
                accounts.CURRENT_ADMIN.reset(token)

    def test_four_commerce_return_paths_apply_mask(self):
        self.db.put("orders", "TEST-1", {
            "no": "TEST-1", "userId": "u1", "phone": PHONE, "addr": ADDRESS,
            "orderStatus": "confirmed", "paymentStatus": "paid",
            "fulfillmentStatus": "producing", "logisticsStatus": "not_shipped",
            "afterSaleStatus": "none", "createdAt": 1,
            "designSnapshot": {"sequence": [{"id": "test"}], "materials": [{"id": "test", "costFen": 23}],
                               "wrist": 15, "count": 0, "customerNote": ""},
        })
        token = self.as_role("operator")
        try:
            detail = commerce.order_detail(self.db, "TEST-1")
            listed = commerce.list_orders(self.db)[0]
            work = commerce.get_work_order(self.db, "TEST-1")
            works = commerce.list_work_orders(self.db)[0]
            for order in (detail, listed):
                self.assertEqual(order["phone"], "138****8000")
                self.assertEqual(order["addr"], "测试省测试市测试区***")
                self.assertNotIn("costFen", order["designSnapshot"]["materials"][0])
            for work_order in (work, works):
                self.assertNotIn("costFen", work_order["materials"][0])
        finally:
            accounts.CURRENT_ADMIN.reset(token)
        self.assertEqual(self.db.get("orders", "TEST-1")["phone"], PHONE)


class RevealHTTPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db, self.old_audit = app.db, app.ADMIN_AUDIT_PATH
        app.db = DB(os.path.join(self.temp.name, "admin.db"))
        app.ADMIN_AUDIT_PATH = os.path.join(self.temp.name, "audit.jsonl")
        app.db.put("orders", "TEST-2", {"no": "TEST-2", "phone": PHONE, "addr": ADDRESS, "person": "测试人"})
        self.iterations = patch.object(accounts, "PBKDF2_ITERATIONS", 1000)
        self.iterations.start()
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        self.opener = build_opener(ProxyHandler({}))

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.iterations.stop()
        app.db.conn.close()
        app.db, app.ADMIN_AUDIT_PATH = self.old_db, self.old_audit
        self.temp.cleanup()

    def cookie_for(self, role):
        username = "test-" + role
        password = "test-only-password"
        accounts.create_user(app.db, username, "测试账号", role, password)
        request = Request(self.base + "/api/admin/session",
                          data=json.dumps({"username": username, "password": password}).encode(),
                          headers={"Content-Type": "application/json"}, method="POST")
        with self.opener.open(request, timeout=3) as response:
            return response.headers["Set-Cookie"].split(";", 1)[0]

    def reveal(self, cookie=None):
        headers = {"Content-Type": "application/json"}
        if cookie:
            headers["Cookie"] = cookie
        request = Request(self.base + "/api/admin/orders/TEST-2/reveal", data=b"{}",
                          headers=headers, method="POST")
        try:
            response = self.opener.open(request, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_service_reveal_returns_full_contact_and_audits(self):
        self.assertEqual(self.reveal()[0], 401)
        self.assertEqual(self.reveal(self.cookie_for("operator"))[0], 403)
        code, body = self.reveal(self.cookie_for("service"))
        self.assertEqual(code, 200)
        self.assertEqual(body["phone"], PHONE)
        self.assertEqual(body["addr"], ADDRESS)
        with open(app.ADMIN_AUDIT_PATH, encoding="utf-8") as stream:
            records = [json.loads(line) for line in stream]
        self.assertTrue(any(r["method"] == "POST" and r["path"] == "/api/admin/orders/TEST-2/reveal"
                            for r in records))
