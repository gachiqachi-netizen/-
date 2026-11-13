"""B-7 商品分组和批量调价。"""
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
import pricing_admin
from db import DB


class PricingAdminTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(":memory:")
        self.db.put("beads", "test-8", {"name": "测试珠", "mm": 8, "priceFen": 1000, "costFen": 400})
        self.db.put("beads", "test-10", {"name": "测试珠", "mm": 10, "priceFen": 1500, "costFen": 600})

    def tearDown(self):
        self.db.conn.close()

    def test_group_by_name_and_size(self):
        groups = pricing_admin.group_beads([self.db.get("beads", "test-10"),
                                            self.db.get("beads", "test-8")])
        self.assertEqual(groups[0]["name"], "测试珠")
        self.assertEqual([b["mm"] for b in groups[0]["sizes"]], [8, 10])

    def test_add_preview_matches_execution(self):
        request = {"mode": "add", "addFen": 200, "ids": ["test-8", "test-10"], "preview": True}
        preview = pricing_admin.reprice(self.db, request)
        self.assertEqual(preview, [{"id": "test-8", "name": "测试珠", "oldFen": 1000, "newFen": 1200},
                                   {"id": "test-10", "name": "测试珠", "oldFen": 1500, "newFen": 1700}])
        self.assertEqual(self.db.get("beads", "test-8")["priceFen"], 1000)
        self.assertEqual(pricing_admin.reprice(self.db, {**request, "preview": False}), preview)
        self.assertEqual(self.db.get("beads", "test-8")["priceFen"], 1200)
        self.assertEqual(self.db.get("beads", "test-8")["price"], "12.00")

    def test_csv_preview_and_invalid_batch(self):
        request = {"mode": "csv", "csv": "id,priceFen\ntest-8,900\ntest-10,1800\n", "preview": True}
        preview = pricing_admin.reprice(self.db, request)
        self.assertEqual([r["newFen"] for r in preview], [900, 1800])
        self.assertEqual(pricing_admin.reprice(self.db, {**request, "preview": False}), preview)
        with self.assertRaises(ValueError):
            pricing_admin.reprice(self.db, {"mode": "add", "ids": ["test-8", "test-8"],
                                             "addFen": 100, "preview": False})
        with self.assertRaises(KeyError):
            pricing_admin.reprice(self.db, {"mode": "csv", "csv": "id,priceFen\nmissing,10\n",
                                             "preview": False})


class RepriceHTTPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db, self.old_audit = app.db, app.ADMIN_AUDIT_PATH
        app.db = DB(os.path.join(self.temp.name, "admin.db"))
        app.ADMIN_AUDIT_PATH = os.path.join(self.temp.name, "audit.jsonl")
        app.db.put("beads", "test-8", {"name": "测试珠", "mm": 8, "priceFen": 1000})
        app.db.put("beads", "test-10", {"name": "测试珠", "mm": 10, "priceFen": 1500, "costFen": 600})
        bead = app.db.get("beads", "test-8")
        bead["costFen"] = 400
        app.db.put("beads", "test-8", bead)
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
        request = Request(self.base + "/api/admin/beads/reprice",
                          data=json.dumps({"mode": "add", "addFen": 200, "ids": ["test-8"],
                                           "preview": False}).encode(), headers=headers, method="POST")
        try:
            response = self.opener.open(request, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def get_beads(self, cookie, grouped=False):
        url = self.base + "/api/admin/beads" + ("?group=1" if grouped else "")
        request = Request(url, headers={"Cookie": cookie}, method="GET")
        with self.opener.open(request, timeout=3) as response:
            return response.status, json.loads(response.read())

    def test_grouped_and_ungrouped_cost_visibility(self):
        operator = self.cookie_for("operator")
        owner = self.cookie_for("owner")
        for grouped in (False, True):
            code, rows = self.get_beads(operator, grouped)
            self.assertEqual(code, 200)
            beads = next(g["sizes"] for g in rows if g["name"] == "测试珠") if grouped else [
                b for b in rows if b["name"] == "测试珠"]
            self.assertEqual(len(beads), 2)
            self.assertTrue(all("costFen" not in b for b in beads))
            code, rows = self.get_beads(owner, grouped)
            self.assertEqual(code, 200)
            beads = next(g["sizes"] for g in rows if g["name"] == "测试珠") if grouped else [
                b for b in rows if b["name"] == "测试珠"]
            self.assertEqual({b["costFen"] for b in beads}, {400, 600})

    def test_edit_prices_permission_and_one_batch_audit(self):
        self.assertEqual(self.post()[0], 401)
        self.assertEqual(self.post(self.cookie_for("operator"))[0], 403)
        code, body = self.post(self.cookie_for("owner"))
        self.assertEqual(code, 200)
        self.assertEqual(body[0]["newFen"], 1200)
        with open(app.ADMIN_AUDIT_PATH, encoding="utf-8") as stream:
            records = [json.loads(line) for line in stream]
        writes = [r for r in records if r["path"] == "/api/admin/beads/reprice" and r["method"] == "POST"]
        self.assertEqual(len(writes), 1)
