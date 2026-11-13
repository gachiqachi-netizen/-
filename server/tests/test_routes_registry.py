"""A11：新接口注册表（server/routes/）的加载和分发。

验证：public / user / admin 三种登录要求、ValueError→400 / KeyError→404 的转换、
现有路由不受影响、后台写操作记操作记录。
"""
import json
import os
import re
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
import routes
import user_api
from db import DB


def echo_public(ctx, match, data):
    return 200, {"kind": "public", "userId": ctx.user_id, "qs": ctx.qs}


def echo_user(ctx, match, data):
    return 200, {"kind": "user", "userId": ctx.user_id}


def echo_admin(ctx, match, data):
    return 200, {"kind": "admin", "admin": ctx.admin}


def boom_value(ctx, match, data):
    raise ValueError("参数不对")


def boom_key(ctx, match, data):
    raise KeyError("not_found")


def ok_admin(ctx, match, data):
    return 200, {"ok": True, "data": data}


TEST_ROUTES = [
    ("GET", r"^/api/test-routes/ping$", echo_public, "public"),
    ("GET", r"^/api/test-routes/me$", echo_user, "user"),
    ("GET", r"^/api/test-routes/admin-info$", echo_admin, "admin"),
    ("POST", r"^/api/test-routes/boom-value$", boom_value, "public"),
    ("POST", r"^/api/test-routes/boom-key$", boom_key, "public"),
    ("POST", r"^/api/test-routes/admin-write$", ok_admin, "admin"),
]


def compiled(entries):
    return [(m, re.compile(p), f, a) for m, p, f, a in entries]


class LoadTests(unittest.TestCase):
    def test_load_returns_empty_table_when_no_route_modules(self):
        # 仓库里还没有正式路由模块（只有 _example.py，以下划线开头不加载）
        self.assertEqual(app.ROUTE_TABLE, [])

    def test_example_module_is_not_loaded(self):
        names = [m.name for m in __import__("pkgutil").iter_modules(routes.__path__)]
        self.assertIn("_example", names)
        self.assertEqual(app.ROUTE_TABLE, [])


class DispatchHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db = app.db
        cls.original_token = app.ADMIN_TOKEN
        cls.original_table = app.ROUTE_TABLE
        cls.original_audit_path = app.ADMIN_AUDIT_PATH
        app.db = DB(os.path.join(cls.temp.name, "http.db"))
        app.ADMIN_TOKEN = "test-admin"
        app.ADMIN_AUDIT_PATH = os.path.join(cls.temp.name, "audit.jsonl")
        app.ROUTE_TABLE = cls.original_table + compiled(TEST_ROUTES)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.server.server_port)
        cls.opener = build_opener(ProxyHandler({}))  # 本机请求不走代理

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        app.db.conn.close()
        app.db, app.ADMIN_TOKEN = cls.original_db, cls.original_token
        app.ROUTE_TABLE = cls.original_table
        app.ADMIN_AUDIT_PATH = cls.original_audit_path
        cls.temp.cleanup()

    def request(self, path, method="GET", data=None, token=None, admin=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        if admin:
            headers["X-Admin-Token"] = admin
        raw = json.dumps(data).encode() if data is not None else None
        try:
            resp = self.opener.open(Request(self.base + path, data=raw, headers=headers, method=method), timeout=3)
        except HTTPError as e:
            resp = e
        with resp:
            return resp.status, json.loads(resp.read())

    def login_user(self, uid="u1"):
        token = user_api.secrets.token_urlsafe(32)
        app.db.put("sessions", user_api.token_hash(token), {"userId": uid, "expiresAt": time.time() + 3600})
        return token

    def test_public_route_without_login(self):
        code, body = self.request("/api/test-routes/ping")
        self.assertEqual(code, 200)
        self.assertEqual(body["kind"], "public")
        self.assertIsNone(body["userId"])

    def test_public_route_sees_logged_in_user(self):
        token = self.login_user()
        code, body = self.request("/api/test-routes/ping", token=token)
        self.assertEqual(code, 200)
        self.assertEqual(body["userId"], "u1")

    def test_user_route_requires_login(self):
        code, _ = self.request("/api/test-routes/me")
        self.assertEqual(code, 401)
        token = self.login_user("u2")
        code, body = self.request("/api/test-routes/me", token=token)
        self.assertEqual(code, 200)
        self.assertEqual(body["userId"], "u2")

    def test_admin_route_requires_admin(self):
        code, _ = self.request("/api/test-routes/admin-info")
        self.assertEqual(code, 401)
        code, body = self.request("/api/test-routes/admin-info", admin="test-admin")
        self.assertEqual(code, 200)
        self.assertEqual(body, {"kind": "admin", "admin": True})

    def test_value_error_becomes_400(self):
        code, body = self.request("/api/test-routes/boom-value", method="POST", data={})
        self.assertEqual(code, 400)
        self.assertEqual(body["error"], "参数不对")

    def test_key_error_becomes_404(self):
        code, _ = self.request("/api/test-routes/boom-key", method="POST", data={})
        self.assertEqual(code, 404)

    def test_admin_write_is_audited(self):
        code, body = self.request("/api/test-routes/admin-write", method="POST", data={"x": 1}, admin="test-admin")
        self.assertEqual(code, 200)
        self.assertEqual(body["data"], {"x": 1})
        with open(app.ADMIN_AUDIT_PATH, encoding="utf-8") as stream:
            records = [json.loads(line) for line in stream if line.strip()]
        self.assertTrue(any(r.get("path") == "/api/test-routes/admin-write" and r.get("method") == "POST" for r in records))

    def test_existing_route_still_works(self):
        # 现有公开路由不受影响（注册表查不到的路径仍走原有逻辑）
        code, body = self.request("/api/meta/contract")
        self.assertEqual(code, 200)
        self.assertIn("version", body)

    def test_unknown_path_still_404(self):
        code, _ = self.request("/api/test-routes/nope")
        self.assertEqual(code, 404)


if __name__ == "__main__":
    unittest.main()
