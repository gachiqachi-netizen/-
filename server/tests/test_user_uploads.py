"""B-1 用户上传照片：格式、大小、每日上限、审核状态与可见性、微信回调。"""
import base64
import hashlib
import os
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import app
import content_security
import uploads
from routes import uploads as upload_routes


def b64(raw):
    return base64.b64encode(raw).decode()


class UserUploadTests(unittest.TestCase):
    def setUp(self):
        self.db = uploads_db()
        self.tmp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"UPLOADS_DIR": os.path.join(self.tmp.name, "uploads")},
                              clear=False)
        self.env.start()
        for key in ("WECHAT_APP_ID", "WECHAT_APP_SECRET", "WECHAT_MSG_TOKEN", "WECHAT_TOKEN"):
            os.environ.pop(key, None)
        self.old_checker = content_security._image_checker

    def tearDown(self):
        content_security._image_checker = self.old_checker
        self.env.stop()
        self.tmp.cleanup()
        self.db.conn.close()

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


def uploads_db():
    from db import DB
    return DB(":memory:")


if __name__ == "__main__":
    unittest.main()
