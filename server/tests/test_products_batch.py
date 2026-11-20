"""U39 product batch status preview, atomic writes, and route permission."""

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

import accounts
import app
import commerce
from db import DB


def bead(name, status="draft", photo="/uploads/test.png", price=100):
    return {"name": name, "type": "bead", "mat": "crystal", "mm": 8,
            "priceFen": price, "images": [photo] if photo else [], "photo": photo,
            "status": status, "onSale": status == "on_sale"}


class BatchProductStatusTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(":memory:")
        self.addCleanup(self.db.conn.close)
        self.db.put("beads", "u39-a", bead("甲"))
        self.db.put("beads", "u39-b", bead("乙"))

    def request(self, ids, status="on_sale", preview=True):
        return {"ids": ids, "status": status, "preview": preview}

    def test_preview_does_not_write_and_apply_up_down(self):
        before = len(self.db.list("audit_logs"))
        report = commerce.batch_product_status(self.db, self.request(["u39-a", "u39-b"]))
        self.assertEqual(len(report["changes"]), 2)
        self.assertEqual(report["rejected"], [])
        self.assertEqual(self.db.get("beads", "u39-a")["status"], "draft")
        self.assertEqual(len(self.db.list("audit_logs")), before)
        commerce.batch_product_status(self.db, self.request(["u39-a", "u39-b"], preview=False))
        self.assertTrue(all(self.db.get("beads", rid)["onSale"] for rid in ("u39-a", "u39-b")))
        self.assertEqual(len(self.db.list("audit_logs")), before + 2)
        commerce.batch_product_status(self.db, self.request(["u39-a", "u39-b"], "off_sale", False))
        self.assertTrue(all(self.db.get("beads", rid)["status"] == "off_sale" for rid in ("u39-a", "u39-b")))

    def test_archived_missing_photo_and_zero_price_are_rejected(self):
        self.db.put("beads", "u39-old", bead("旧珠", status="archived"))
        self.db.put("beads", "u39-no-photo", bead("无图", photo=""))
        self.db.put("beads", "u39-free", bead("零价", price=0))
        report = commerce.batch_product_status(self.db, self.request(["u39-old", "u39-no-photo", "u39-free"]))
        self.assertEqual(len(report["rejected"]), 3)
        self.assertIn("已归档", str(report["rejected"]))
        self.assertIn("缺少照片", str(report["rejected"]))
        self.assertIn("价格必须大于 0", str(report["rejected"]))

    def test_mixed_batch_writes_nothing_and_limit_is_enforced(self):
        self.db.put("beads", "u39-old", bead("旧珠", status="archived"))
        with self.assertRaisesRegex(ValueError, "整批未写入"):
            commerce.batch_product_status(self.db, self.request(["u39-a", "u39-old"], preview=False))
        self.assertEqual(self.db.get("beads", "u39-a")["status"], "draft")
        with self.assertRaisesRegex(ValueError, "最多 500"):
            commerce.batch_product_status(self.db, self.request([f"x-{i}" for i in range(501)]))

    def test_unexpected_second_write_rolls_back_first_and_audit(self):
        before = len(self.db.list("audit_logs"))
        original = commerce.update_product

        def fail_second(reader, rid, data, actor="admin"):
            if rid == "u39-b":
                raise RuntimeError("write failed")
            return original(reader, rid, data, actor=actor)

        with patch.object(commerce, "update_product", side_effect=fail_second):
            with self.assertRaisesRegex(RuntimeError, "write failed"):
                commerce.batch_product_status(self.db, self.request(["u39-a", "u39-b"], preview=False))
        self.assertEqual(self.db.get("beads", "u39-a")["status"], "draft")
        self.assertEqual(len(self.db.list("audit_logs")), before)


class BatchProductStatusHTTPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db, self.old_audit = app.db, app.ADMIN_AUDIT_PATH
        app.db = DB(os.path.join(self.temp.name, "admin.db"))
        app.ADMIN_AUDIT_PATH = os.path.join(self.temp.name, "audit.jsonl")
        app.db.put("beads", "u39-a", bead("甲"))
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

    def cookie(self, role):
        username, password = "test-" + role, "test-only-password"
        accounts.create_user(app.db, username, "测试账号", role, password)
        request = Request(self.base + "/api/admin/session",
                          data=json.dumps({"username": username, "password": password}).encode(),
                          headers={"Content-Type": "application/json"}, method="POST")
        with self.opener.open(request, timeout=3) as response:
            return response.headers["Set-Cookie"].split(";", 1)[0]

    def post(self, cookie=None):
        headers = {"Content-Type": "application/json"}
        if cookie:
            headers["Cookie"] = cookie
        request = Request(self.base + "/api/admin/beads/status",
                          data=json.dumps({"ids": ["u39-a"], "status": "on_sale", "preview": True}).encode(),
                          headers=headers, method="POST")
        try:
            response = self.opener.open(request, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_edit_products_permission(self):
        self.assertEqual(self.post()[0], 401)
        self.assertEqual(self.post(self.cookie("service"))[0], 403)
        code, body = self.post(self.cookie("operator"))
        self.assertEqual(code, 200)
        self.assertEqual(len(body["changes"]), 1)
