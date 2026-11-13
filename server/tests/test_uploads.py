"""B-1 用户上传照片：格式、大小、每日上限、审核状态与可见性、微信回调、HTTP 读图访问控制。"""
import base64
import hashlib
import http.client
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import app
import content_security
import uploads
from routes import uploads as upload_routes
from user_api import token_hash


def b64(raw):
    return base64.b64encode(raw).decode()


class UserUploadTests(unittest.TestCase):
    def setUp(self):
        self.db = uploads_db()
        self.tmp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"UPLOADS_DIR": os.path.join(self.tmp.name, "uploads"),
                                           "PUBLIC_BASE_URL": "https://files.test"},
                              clear=False)
        self.env.start()
        for key in ("WECHAT_APP_ID", "WECHAT_APP_SECRET", "WECHAT_MSG_TOKEN", "WECHAT_TOKEN"):
            os.environ.pop(key, None)
        self.old_checker = content_security._image_checker

    def ctx(self, uid="u1"):
        return SimpleNamespace(db=self.db, user_id=uid, admin=False, qs={})

    def png_payload(self, size=32, **kw):
        payload = {"filename": "a.png", "contentType": "image/png", "data": b64(b"x" * size)}
        payload.update(kw)
        return payload

    # ---- 路由注册 ----
    def test_routes_are_loaded(self):
        self.assertTrue(any(m == "POST" and p.fullmatch("/api/my/uploads") for m, p, _, _ in app.ROUTE_TABLE))
        self.assertTrue(any(m == "POST" and p.fullmatch("/api/wechat/media-check") for m, p, _, _ in app.ROUTE_TABLE))

    # ---- 格式 ----
    def test_reject_unsupported_content_type(self):
        with self.assertRaises(ValueError) as e:
            upload_routes.create(self.ctx(), None, self.png_payload(contentType="image/gif"))
        self.assertIn("png / jpg / webp", str(e.exception))

    def test_reject_bad_base64_and_empty(self):
        with self.assertRaises(ValueError):
            upload_routes.create(self.ctx(), None, self.png_payload(data="!!!not-base64!!!"))
        with self.assertRaises(ValueError):
            upload_routes.create(self.ctx(), None, self.png_payload(data=b64(b"")))

    def test_accept_jpg_webp_by_content_type_or_filename(self):
        for payload in (self.png_payload(contentType="image/jpeg"),
                        self.png_payload(contentType="image/webp"),
                        self.png_payload(filename="pic.webp", contentType="")):
            code, body = upload_routes.create(self.ctx(), None, payload)
            self.assertEqual(code, 200)
            self.assertTrue(body["url"].startswith("/uploads/user/"))
            record = uploads.get_by_url_path(self.db, body["url"].split("/uploads/")[1])
            self.assertEqual(record["userId"], "u1")
            self.assertIn(record["checkStatus"], ("pending", "passed"))

    # ---- 大小 ----
    def test_reject_over_5mb(self):
        big = base64.b64encode(os.urandom(uploads.MAX_BYTES + 1)).decode()
        with self.assertRaises(ValueError) as e:
            upload_routes.create(self.ctx(), None, self.png_payload(data=big))
        self.assertIn("5MB", str(e.exception))

    def test_accept_exactly_5mb(self):
        content_security.set_image_checker(lambda url: ("passed", None))
        code, _ = upload_routes.create(self.ctx(), None,
                                       self.png_payload(data=b64(b"x" * uploads.MAX_BYTES)))
        self.assertEqual(code, 200)

    # ---- 每日上限 ----
    def test_daily_limit_50(self):
        content_security.set_image_checker(lambda url: ("passed", None))
        for i in range(uploads.DAILY_LIMIT):
            code, _ = upload_routes.create(self.ctx(), None, self.png_payload())
            self.assertEqual(code, 200)
        with self.assertRaises(ValueError) as e:
            upload_routes.create(self.ctx(), None, self.png_payload())
        self.assertIn("明天", str(e.exception))

    def test_daily_limit_counts_per_user(self):
        content_security.set_image_checker(lambda url: ("passed", None))
        upload_routes.create(self.ctx("u1"), None, self.png_payload())
        code, _ = upload_routes.create(self.ctx("u2"), None, self.png_payload())
        self.assertEqual(code, 200)

    # ---- 审核状态与可见性 ----
    def test_dev_no_credentials_directly_passed(self):
        code, body = upload_routes.create(self.ctx(), None, self.png_payload())
        record = self.db.get("uploads", body["id"])
        self.assertEqual(record["checkStatus"], "passed")
        self.assertTrue(uploads.viewer_can_see(record, "stranger", False))

    def test_pending_hidden_from_others_visible_to_owner_and_admin(self):
        content_security.set_image_checker(lambda url: ("pending", "trace-1"))
        _, body = upload_routes.create(self.ctx("owner"), None, self.png_payload())
        record = self.db.get("uploads", body["id"])
        self.assertEqual(record["checkStatus"], "pending")
        self.assertTrue(uploads.viewer_can_see(record, "owner", False))
        self.assertTrue(uploads.viewer_can_see(record, None, True))    # 后台
        self.assertFalse(uploads.viewer_can_see(record, "stranger", False))
        self.assertFalse(uploads.viewer_can_see(record, None, False))  # 未登录

    def test_rejected_hidden_from_everyone_except_owner_and_admin(self):
        content_security.set_image_checker(lambda url: ("pending", "trace-1"))
        _, body = upload_routes.create(self.ctx("owner"), None, self.png_payload())
        record = self.db.get("uploads", body["id"])
        record["checkStatus"] = "rejected"
        self.db.put("uploads", body["id"], record)
        self.assertFalse(uploads.viewer_can_see(record, "stranger", False))
        self.assertTrue(uploads.viewer_can_see(record, "owner", False))
        self.assertTrue(uploads.viewer_can_see(record, None, True))

    def test_file_saved_under_user_date_dir(self):
        _, body = upload_routes.create(self.ctx(), None, self.png_payload())
        rel = body["url"].split("/uploads/")[1]
        self.assertTrue(rel.startswith("user/"))
        self.assertTrue(os.path.isfile(os.path.join(uploads.uploads_root(), rel)))

    # ---- 微信回调 ----
    def signed_qs(self, token="tok"):
        qs = {"timestamp": ["1700000000"], "nonce": ["abc"]}
        sig = hashlib.sha1("".join(sorted([token, "1700000000", "abc"])).encode()).hexdigest()
        qs["signature"] = [sig]
        return qs

    def test_callback_marks_rejected_and_passed(self):
        content_security.set_image_checker(lambda url: ("pending", "trace-9"))
        _, body = upload_routes.create(self.ctx(), None, self.png_payload())
        ctx = SimpleNamespace(db=self.db, user_id=None, admin=False,
                              qs=self.signed_qs())
        with patch.dict(os.environ, {"WECHAT_MSG_TOKEN": "tok"}):
            code, resp = upload_routes.media_check(
                ctx, None, {"result": {"trace_id": "trace-9", "suggest": "risky"}})
            self.assertEqual((code, resp["checkStatus"]), (200, "rejected"))
            code, resp = upload_routes.media_check(
                ctx, None, {"result": {"trace_id": "trace-9", "suggest": "pass"}})
            self.assertEqual((code, resp["checkStatus"]), (200, "passed"))
        record = self.db.get("uploads", body["id"])
        self.assertEqual(record["checkStatus"], "passed")

    def test_callback_bad_signature_rejected(self):
        content_security.set_image_checker(lambda url: ("pending", "trace-9"))
        upload_routes.create(self.ctx(), None, self.png_payload())
        ctx = SimpleNamespace(db=self.db, user_id=None, admin=False,
                              qs={"signature": ["bad"], "timestamp": ["1"], "nonce": ["n"]})
        with patch.dict(os.environ, {"WECHAT_MSG_TOKEN": "tok"}):
            with self.assertRaises(ValueError):
                upload_routes.media_check(ctx, None, {"result": {"trace_id": "trace-9", "suggest": "pass"}})

    def test_callback_unknown_trace_is_404(self):
        ctx = SimpleNamespace(db=self.db, user_id=None, admin=False, qs={})
        with self.assertRaises(KeyError):
            upload_routes.media_check(ctx, None, {"result": {"trace_id": "nope", "suggest": "pass"}})

    def test_callback_dev_without_token_allowed(self):
        content_security.set_image_checker(lambda url: ("pending", "trace-7"))
        _, body = upload_routes.create(self.ctx(), None, self.png_payload())
        ctx = SimpleNamespace(db=self.db, user_id=None, admin=False, qs={})
        code, _ = upload_routes.media_check(ctx, None, {"result": {"trace_id": "trace-7", "suggest": "pass"}})
        self.assertEqual(code, 200)

    def test_callback_trace_id_does_not_fall_back_to_record_id(self):
        upload_routes.create(self.ctx(), None, self.png_payload())   # dev fail-open，记录没有 traceId
        rid = self.db.list("uploads")[0]["id"]
        ctx = SimpleNamespace(db=self.db, user_id=None, admin=False, qs={})
        with self.assertRaises(KeyError):
            upload_routes.media_check(ctx, None, {"result": {"trace_id": rid, "suggest": "pass"}})

    def test_wechat_87014_means_rejected(self):
        """内容违规 87014 和文字检查一致：直接不通过（rejected），不当成放行。"""
        content_security._image_checker = None
        content_security._token, content_security._expires_at = None, 0
        responses = iter([
            json.dumps({"access_token": "tok", "expires_in": 7200}).encode(),
            json.dumps({"errcode": 87014, "errmsg": "risky content"}).encode(),
        ])

        class Resp:
            def __init__(self, body):
                self.body = body
            def read(self):
                return self.body
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False

        envs = {"WECHAT_APP_ID": "wx-test", "WECHAT_APP_SECRET": "sec",
                "PUBLIC_BASE_URL": "https://files.example.com"}
        with patch.dict(os.environ, envs, clear=False), \
             patch.object(content_security.urllib.request, "urlopen",
                          lambda req, timeout=8: Resp(next(responses))):
            code, body = upload_routes.create(self.ctx(), None, self.png_payload())
        self.assertEqual(code, 200)
        self.assertEqual(self.db.get("uploads", body["id"])["checkStatus"], "rejected")

    def test_no_public_base_url_non_dev_fails_closed(self):
        with patch.object(content_security.env, "is_dev", return_value=False):
            with self.assertRaises(content_security.ContentRejected):
                upload_routes.create(self.ctx(), None, self.png_payload())
        self.assertEqual(self.db.list("uploads"), [])   # 没写文件也没登记

    def tearDown(self):
        content_security._image_checker = self.old_checker
        content_security._token, content_security._expires_at = None, 0
        self.env.stop()
        self.tmp.cleanup()
        self.db.conn.close()


def uploads_db():
    from db import DB
    return DB(":memory:")


class UserUploadHttpTests(unittest.TestCase):
    """app.py /uploads/user/ 接线的 HTTP 层测试：本人/后台可见，别人 404，防穿越。"""

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = os.path.join(cls.temp.name, "uploads")
        cls.env = patch.dict(os.environ, {"UPLOADS_DIR": cls.root,
                                          "PUBLIC_BASE_URL": "https://files.test"}, clear=False)
        cls.env.start()
        for key in ("WECHAT_APP_ID", "WECHAT_APP_SECRET", "WECHAT_MSG_TOKEN", "WECHAT_TOKEN"):
            os.environ.pop(key, None)
        cls.original_db = app.db
        cls.original_uploads = app.UPLOADS
        cls.original_token = app.ADMIN_TOKEN
        from db import DB
        app.db = DB(os.path.join(cls.temp.name, "http.db"))
        app.UPLOADS = cls.root
        app.ADMIN_TOKEN = "test-admin"
        cls.old_checker = content_security._image_checker
        for uid, tok in [("owner-1", "o" * 43), ("stranger-1", "s" * 43)]:
            app.db.put("sessions", token_hash(tok), {"userId": uid, "expiresAt": time.time() + 600})
        # A8a 之后后台登录走 accounts：直接造一个管理员用户和会话，用 Cookie 访问
        app.db.put("admin_users", "adm1", {"username": "admin", "name": "测试管理员",
                                           "roleId": "owner", "status": "active", "passwordHash": "x"})
        app.db.put("admin_sessions", "test-admin-sid", {"userId": "adm1", "expiresAt": time.time() + 600})
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db, app.UPLOADS, app.ADMIN_TOKEN = cls.original_db, cls.original_uploads, cls.original_token
        content_security._image_checker = cls.old_checker
        cls.env.stop()
        cls.temp.cleanup()

    def get(self, path, token=None, cookie=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        headers = {}
        if token:
            headers["Authorization"] = "Bearer " + token
        if cookie:
            headers["Cookie"] = cookie
        conn.request("GET", path, headers=headers)
        resp = conn.getresponse()
        body = resp.read()
        out = (resp.status, dict(resp.getheaders()), body)
        conn.close()
        return out

    def make_upload(self, owner="owner-1", status="pending"):
        trace = "http-" + os.urandom(4).hex()   # 每条上传的 trace_id 必须唯一，否则回调会找错记录
        content_security._image_checker = lambda url: ("pending", trace)
        payload = {"filename": "a.png", "contentType": "image/png",
                   "data": base64.b64encode(b"\x89PNG http-test").decode()}
        body = uploads.create(app.db, owner, payload)
        if status == "passed":
            uploads.apply_media_check(app.db, {"result": {"trace_id": trace, "suggest": "pass"}}, {})
        if status == "rejected":
            uploads.apply_media_check(app.db, {"result": {"trace_id": trace, "suggest": "risky"}}, {})
        return app.db.get("uploads", body["id"])

    def test_owner_can_view_pending(self):
        record = self.make_upload()
        status, headers, body = self.get("/uploads/" + record["path"], token="o" * 43)
        self.assertEqual(status, 200)
        self.assertEqual(headers.get("Content-Type"), "image/png")
        self.assertEqual(headers.get("Cache-Control"), "private, no-store")
        self.assertTrue(body.startswith(b"\x89PNG"))

    def test_stranger_and_anonymous_get_404(self):
        record = self.make_upload()
        self.assertEqual(self.get("/uploads/" + record["path"], token="s" * 43)[0], 404)
        self.assertEqual(self.get("/uploads/" + record["path"])[0], 404)

    def test_admin_can_view_pending(self):
        record = self.make_upload()
        status, _, _ = self.get("/uploads/" + record["path"], cookie="beadloop_admin=test-admin-sid")
        self.assertEqual(status, 200)

    def test_passed_visible_to_everyone(self):
        record = self.make_upload(status="passed")
        status, headers, _ = self.get("/uploads/" + record["path"], token="s" * 43)
        self.assertEqual(status, 200)
        self.assertNotEqual(headers.get("Cache-Control"), "private, no-store")

    def test_valid_k_reads_pending_image(self):
        """送审时给微信的临时取图链接：合法且没过期的 k 不看 checkStatus。"""
        record = self.make_upload()   # pending
        rel = record["path"]
        expires, k = uploads.link_params(rel)
        status, _, _ = self.get(f"/uploads/{rel}?e={expires}&k={k}", token="s" * 43)
        self.assertEqual(status, 200)

    def test_bad_or_expired_k_falls_back_to_permissions(self):
        record = self.make_upload()
        rel = record["path"]
        expires, _ = uploads.link_params(rel)
        # k 被改过：陌生人照旧 404，本人按权限仍能看到
        status, _, _ = self.get(f"/uploads/{rel}?e={expires}&k={'0' * 64}", token="s" * 43)
        self.assertEqual(status, 404)
        status, _, _ = self.get(f"/uploads/{rel}?e={expires}&k={'0' * 64}", token="o" * 43)
        self.assertEqual(status, 200)
        # k 对但已过期：陌生人 404
        past = int(time.time()) - 10
        past_k = uploads.sign_link(rel, past)
        status, _, _ = self.get(f"/uploads/{rel}?e={past}&k={past_k}", token="s" * 43)
        self.assertEqual(status, 404)
        # 链接是给另一条路径签的：404
        other_exp, other_k = uploads.link_params("user/2099-01-01/other.png")
        status, _, _ = self.get(f"/uploads/{rel}?e={other_exp}&k={other_k}", token="s" * 43)
        self.assertEqual(status, 404)

    def test_rejected_hidden_from_stranger(self):
        record = self.make_upload(status="rejected")
        self.assertEqual(self.get("/uploads/" + record["path"], token="s" * 43)[0], 404)
        self.assertEqual(self.get("/uploads/" + record["path"], token="o" * 43)[0], 200)

    def test_traversal_dotdot_and_encoded_are_404(self):
        self.make_upload(status="passed")
        os.makedirs(self.root, exist_ok=True)
        with open(os.path.join(self.root, "outside.png"), "wb") as f:
            f.write(b"secret")
        day = uploads._today()
        self.assertEqual(self.get(f"/uploads/user/{day}/../outside.png", token="s" * 43)[0], 404)
        self.assertEqual(self.get(f"/uploads/user/{day}/%2e%2e/outside.png", token="s" * 43)[0], 404)
        self.assertEqual(self.get("/uploads/user/%2e%2e/outside.png", token="s" * 43)[0], 404)

    def test_legacy_basename_upload_untouched(self):
        os.makedirs(self.root, exist_ok=True)
        with open(os.path.join(self.root, "legacy.png"), "wb") as f:
            f.write(b"legacy")
        status, _, body = self.get("/uploads/legacy.png")
        self.assertEqual((status, body), (200, b"legacy"))

    def test_unknown_ext_and_missing_file_are_404(self):
        record = self.make_upload(status="passed")
        os.makedirs(os.path.join(self.root, "user", uploads._today()), exist_ok=True)
        txt_rel = "user/" + uploads._today() + "/note.txt"
        with open(os.path.join(self.root, txt_rel), "wb") as f:
            f.write(b"not an image")
        app.db.put("uploads", "txt1", {"userId": "owner-1", "path": txt_rel,
                                       "checkStatus": "passed", "createdAt": int(time.time())})
        self.assertEqual(self.get("/uploads/" + txt_rel, token="o" * 43)[0], 404)  # 扩展名不认
        self.assertEqual(self.get("/uploads/" + record["path"] + "x", token="o" * 43)[0], 404)  # 无记录
        app.db.delete("uploads", "txt1")


if __name__ == "__main__":
    unittest.main()
