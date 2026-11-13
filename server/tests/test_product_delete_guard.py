"""D6a: 商品删除前检查模板和订单引用。"""
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
import app
from db import DB
from admin_helpers import owner_headers


class ProductDeleteGuardTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db = app.db
        app.db = DB(os.path.join(self.temp.name, "product-delete.db"))
        self.product_id = "guard-test-bead"
        app.db.put("beads", self.product_id, {"name": "测试珠", "mm": 8, "priceFen": 100})
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        self.headers = owner_headers(self.base)
        self.opener = build_opener(ProxyHandler({}))

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        app.db.conn.close()
        app.db = self.old_db
        self.temp.cleanup()

    def delete(self, product_id=None):
        request = Request(self.base + "/api/admin/beads/" + (product_id or self.product_id),
                          headers=self.headers, method="DELETE")
        try:
            response = self.opener.open(request, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_template_reference_returns_400_and_keeps_product(self):
        app.db.put("templates", "guard-template", {"name": "引用模板",
                   "special": [self.product_id], "pattern": [], "tail": []})
        code, body = self.delete()
        self.assertEqual(code, 400)
        self.assertIn("1 个模板、0 个订单", body["error"])
        self.assertIsNotNone(app.db.get("beads", self.product_id))

    def test_order_beads_or_items_reference_returns_400_and_keeps_product(self):
        app.db.put("orders", "guard-order-beads", {"beads": [self.product_id], "items": []})
        app.db.put("orders", "guard-order-items", {"beads": [], "items": [{"id": self.product_id}]})
        code, body = self.delete()
        self.assertEqual(code, 400)
        self.assertIn("0 个模板、2 个订单", body["error"])
        self.assertNotIn("guard-order", body["error"])
        self.assertIsNotNone(app.db.get("beads", self.product_id))

    def test_missing_product_returns_404(self):
        code, body = self.delete("missing-guard-bead")
        self.assertEqual(code, 404)
        self.assertIn("商品不存在", body["error"])

    def test_unreferenced_product_deletes_and_writes_audit(self):
        code, body = self.delete()
        self.assertEqual(code, 200)
        self.assertTrue(body["ok"])
        self.assertIsNone(app.db.get("beads", self.product_id))
        logs = [row for row in app.db.list("audit_logs")
                if row.get("action") == "delete" and row.get("target") == "product"
                and row.get("targetId") == self.product_id]
        self.assertEqual(len(logs), 1)
