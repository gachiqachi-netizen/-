"""A8f：角色管理与当前账号权限。"""
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
from db import DB


class AdminRoleTests(unittest.TestCase):
    def setUp(self):
        self.iterations = patch.object(accounts, "PBKDF2_ITERATIONS", 1000)
        self.iterations.start()
        self.temp = tempfile.TemporaryDirectory()
        self.old_db, self.old_token = app.db, app.ADMIN_TOKEN
        app.db = DB(os.path.join(self.temp.name, "roles.db"))
        app.ADMIN_TOKEN = "test-bootstrap-token"
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        self.opener = build_opener(ProxyHandler({}))
        code, _, cookie = self.request("/api/admin/session", "POST", {"password": "test-bootstrap-token"})
        self.assertEqual(code, 200)
        code, _, _ = self.request("/api/admin/accounts/bootstrap", "POST",
                                  {"username": "owner", "name": "负责人", "password": "owner-pass-123"}, cookie)
        self.assertEqual(code, 201)
        self.owner_cookie = self.login("owner", "owner-pass-123")

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
        app.db.conn.close(); app.db, app.ADMIN_TOKEN = self.old_db, self.old_token
        self.temp.cleanup(); self.iterations.stop()

    def request(self, path, method="GET", data=None, cookie=None):
        headers = {"Content-Type": "application/json"}
        if cookie: headers["Cookie"] = cookie
        req = Request(self.base + path, data=json.dumps(data).encode() if data is not None else None,
                      headers=headers, method=method)
        try: response = self.opener.open(req, timeout=3)
        except HTTPError as error: response = error
        with response: return response.status, json.loads(response.read()), response.headers.get("Set-Cookie")

    def login(self, username, password):
        code, _, cookie = self.request("/api/admin/session", "POST", {"username": username, "password": password})
        self.assertEqual(code, 200)
        return cookie.split(";", 1)[0]

    def create(self, name="自定义", permissions=None, scope="own"):
        return self.request("/api/admin/roles", "POST",
                            {"name": name, "permissions": permissions if permissions is not None else ["view_work_orders"],
                             "dataScope": scope}, self.owner_cookie)

    def test_create_update_delete_custom_role(self):
        code, body, _ = self.create(); self.assertEqual(code, 201)
        role = body["role"]; self.assertFalse(role["builtin"]); self.assertEqual(role["dataScope"], "own")
        path = "/api/admin/roles/" + role["id"]
        code, body, _ = self.request(path, "PUT", {"name": "改名", "permissions": ["view_orders"], "dataScope": "all"}, self.owner_cookie)
        self.assertEqual(code, 200); self.assertEqual(body["role"]["permissions"], ["view_orders"])
        code, body, _ = self.request(path, "DELETE", cookie=self.owner_cookie)
        self.assertEqual(code, 200); self.assertIsNone(app.db.get("admin_roles", role["id"]))

    def test_builtin_and_owner_protection(self):
        for role_id in accounts.ROLE_NAMES:
            code, _, _ = self.request("/api/admin/roles/" + role_id, "DELETE", cookie=self.owner_cookie)
            self.assertEqual(code, 400)
            code, _, _ = self.request("/api/admin/roles/" + role_id, "PUT", {"name": "改名"}, self.owner_cookie)
            self.assertEqual(code, 400)
        code, _, _ = self.request("/api/admin/roles/owner", "PUT", {"permissions": []}, self.owner_cookie)
        self.assertEqual(code, 400)
        code, body, _ = self.request("/api/admin/roles/operator", "PUT", {"permissions": ["view_work_orders"]}, self.owner_cookie)
        self.assertEqual(code, 200); self.assertEqual(body["role"]["permissions"], ["view_work_orders"])

    def test_invalid_values_and_duplicate_name(self):
        self.assertEqual(self.create()[0], 201)
        for name, perms, scope in [("", [], "all"), ("a" * 21, [], "all"), ("自定义", [], "all"),
                                   ("错权限", ["unknown"], "all"), ("错范围", [], "team")]:
            self.assertEqual(self.create(name, perms, scope)[0], 400)
        role = next(r for r in app.db.list("admin_roles") if r["name"] == "自定义")
        self.assertEqual(self.request("/api/admin/roles/" + role["id"], "PUT",
                                      {"permissions": ["unknown"]}, self.owner_cookie)[0], 400)

    def test_role_in_use_cannot_be_deleted(self):
        role = self.create()[1]["role"]
        app.db.put("admin_users", "test-user", {"name": "测试", "roleId": role["id"], "status": "active"})
        code, body, _ = self.request("/api/admin/roles/" + role["id"], "DELETE", cookie=self.owner_cookie)
        self.assertEqual(code, 400); self.assertIn("有 1 个账号在用这个角色", body["error"])

    def test_permissions_and_current_account(self):
        code, body, _ = self.request("/api/admin/me", cookie=self.owner_cookie)
        self.assertEqual(code, 200); self.assertEqual(body["permissions"], list(accounts.PERMISSIONS))
        self.assertEqual(body["roleName"], "负责人")
        custom = self.create()[1]["role"]
        for role_id in ("operator", "maker"):
            name = "user-" + role_id
            code, created, _ = self.request("/api/admin/accounts", "POST",
                                            {"username": name, "name": role_id, "roleId": role_id}, self.owner_cookie)
            self.assertEqual(code, 201)
            cookie = self.login(name, created["temporaryPassword"])
            # New accounts must change their temporary password before calling protected routes.
            user = accounts.find_user(app.db, name); user["mustChangePassword"] = False
            app.db.put("admin_users", user["id"], user)
            code, _, _ = self.request("/api/admin/roles", "POST",
                                      {"name": "不许", "permissions": [], "dataScope": "all"}, cookie)
            self.assertEqual(code, 403)
            self.assertEqual(self.request("/api/admin/roles/" + custom["id"], "PUT", {"name": "不许"}, cookie)[0], 403)
            self.assertEqual(self.request("/api/admin/roles/" + custom["id"], "DELETE", cookie=cookie)[0], 403)
            code, body, _ = self.request("/api/admin/me", cookie=cookie)
            self.assertEqual(code, 200); self.assertEqual(body["permissions"], list(accounts.ROLE_PERMISSIONS[role_id]))
            self.assertEqual(body["permissionNames"], [accounts.PERMISSIONS[p] for p in body["permissions"]])


if __name__ == "__main__": unittest.main()
