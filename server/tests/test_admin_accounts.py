"""A8a：账号、密码、角色、首次登录及数据库会话。"""
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
from db import DB


class AdminAccountsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db, self.old_token = app.db, app.ADMIN_TOKEN
        app.db = DB(os.path.join(self.temp.name, "admin.db"))
        app.ADMIN_TOKEN = "test-bootstrap-token"
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        self.opener = build_opener(ProxyHandler({}))

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        app.db.conn.close()
        app.db, app.ADMIN_TOKEN = self.old_db, self.old_token
        self.temp.cleanup()

    def request(self, path, method="GET", data=None, cookie=None, token=None):
        headers = {"Content-Type": "application/json"}
        if cookie:
            headers["Cookie"] = cookie
        if token:
            headers["X-Admin-Token"] = token
        raw = json.dumps(data).encode() if data is not None else None
        req = Request(self.base + path, data=raw, headers=headers, method=method)
        try:
            response = self.opener.open(req, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read()), response.headers.get("Set-Cookie")

    def bootstrap(self):
        code, _, cookie = self.request("/api/admin/session", "POST", {"password": "test-bootstrap-token"})
        self.assertEqual(code, 200)
        return cookie.split(";", 1)[0]

    def owner(self):
        bootstrap_cookie = self.bootstrap()
        code, _, _ = self.request("/api/admin/accounts/bootstrap", "POST",
                                  {"username": "owner", "name": "负责人", "password": "owner-pass-123"},
                                  cookie=bootstrap_cookie)
        self.assertEqual(code, 201)
        code, body, cookie = self.request("/api/admin/session", "POST",
                                          {"username": "owner", "password": "owner-pass-123"})
        self.assertEqual(code, 200)
        return cookie.split(";", 1)[0], body

    def test_default_roles_and_password_scrypt(self):
        roles = {r["id"]: r for r in app.db.list("admin_roles")}
        self.assertEqual(set(roles), set(accounts.ROLE_NAMES))
        self.assertEqual(len(roles["owner"]["permissions"]), 21)
        self.assertEqual(roles["maker"]["permissions"], list(accounts.ROLE_PERMISSIONS["maker"]))
        hashed = accounts.hash_password("long-pass")
        self.assertTrue(hashed.startswith("scrypt$"))
        self.assertTrue(accounts.verify_password("long-pass", hashed))
        self.assertFalse(accounts.verify_password("wrong-pass", hashed))
        with self.assertRaises(ValueError):
            accounts.hash_password("short")

    def test_bootstrap_token_only_creates_first_owner(self):
        cookie = self.bootstrap()
        self.assertEqual(self.request("/api/admin/accounts", cookie=cookie)[0], 401)
        self.assertEqual(self.request("/api/admin/accounts/bootstrap", "POST",
                                      {"username": "owner", "name": "负责人", "password": "owner-pass-123"},
                                      cookie=cookie)[0], 201)
        self.assertEqual(self.request("/api/admin/session", "POST", {"password": "test-bootstrap-token"})[0], 401)
        self.assertEqual(self.request("/api/admin/accounts/bootstrap", "POST",
                                      {"username": "another", "name": "另一人", "password": "another-pass"},
                                      cookie=cookie)[0], 401)
        self.assertEqual(self.request("/api/admin/accounts", token="test-bootstrap-token")[0], 401)

    def test_session_persists_and_disabled_user_loses_access(self):
        cookie, _ = self.owner()
        self.assertEqual(self.request("/api/admin/accounts", cookie=cookie)[0], 200)
        self.assertEqual(len(app.db.list("admin_sessions")), 2)
        user = accounts.find_user(app.db, "owner")
        user["status"] = "disabled"
        app.db.put("admin_users", user["id"], user)
        self.assertEqual(self.request("/api/admin/accounts", cookie=cookie)[0], 401)

    def test_temporary_password_forces_change(self):
        owner_cookie, _ = self.owner()
        code, body, _ = self.request("/api/admin/accounts", "POST",
                                      {"username": "worker", "name": "做单师傅", "roleId": "maker"},
                                      cookie=owner_cookie)
        self.assertEqual(code, 201)
        temporary = body["temporaryPassword"]
        self.assertTrue(body["user"]["mustChangePassword"])
        code, _, cookie = self.request("/api/admin/session", "POST",
                                       {"username": "worker", "password": temporary})
        self.assertEqual(code, 200)
        worker_cookie = cookie.split(";", 1)[0]
        self.assertEqual(self.request("/api/admin/accounts", cookie=worker_cookie)[0], 401)
        self.assertEqual(self.request("/api/admin/accounts/me/password", "PUT",
                                      {"oldPassword": temporary, "newPassword": "new-pass-123"},
                                      cookie=worker_cookie)[0], 200)
        self.assertFalse(accounts.find_user(app.db, "worker")["mustChangePassword"])

    def test_last_active_owner_cannot_disable_or_demote(self):
        cookie, _ = self.owner()
        uid = accounts.find_user(app.db, "owner")["id"]
        self.assertEqual(self.request(f"/api/admin/accounts/{uid}/disable", "POST", {}, cookie=cookie)[0], 400)
        self.assertEqual(self.request(f"/api/admin/accounts/{uid}", "PUT",
                                      {"roleId": "operator"}, cookie=cookie)[0], 400)

    def test_five_failed_logins_lock_for_ten_minutes(self):
        self.owner()
        for _ in range(5):
            self.assertEqual(self.request("/api/admin/session", "POST",
                                          {"username": "owner", "password": "bad-pass"})[0], 401)
        self.assertEqual(self.request("/api/admin/session", "POST",
                                      {"username": "owner", "password": "owner-pass-123"})[0], 429)
