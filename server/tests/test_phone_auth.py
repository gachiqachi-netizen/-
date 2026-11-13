"""A7 手机号绑定、账号合并与公开字段。"""
import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db import DB
import phone_auth
from routes import auth_phone
import user_api


class PhoneAuthTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(":memory:")
        self.db.put("users", "first", {"createdAt": 1})
        self.db.put("users", "second", {"createdAt": 2})
        self.old_exchanger = phone_auth._exchanger
        phone_auth._exchanger = lambda code: "13800008000"
        self.salt = patch.dict(os.environ, {"PHONE_SALT": "test-only-salt"})
        self.salt.start()

    def tearDown(self):
        phone_auth._exchanger = self.old_exchanger
        self.salt.stop()
        self.db.conn.close()

    def context(self, uid):
        return SimpleNamespace(db=self.db, user_id=uid)

    def test_bind_success_and_no_plain_phone_in_response_or_storage(self):
        code, body = auth_phone.bind(self.context("first"), None, {"code": "ok"})
        self.assertEqual((code, body), (200, {"phoneMasked": "138****8000", "merged": False}))
        self.assertEqual(auth_phone.me(self.context("first"), None, None), (200, {"phoneMasked": "138****8000"}))
        self.assertNotIn("13800008000", str(body) + str(self.db.get("users", "first")))

    def test_second_device_merges_designs_and_session(self):
        phone_auth.bind_phone(self.db, "first", "13800008000")
        self.db.put("designs", "work", {"userId": "second", "name": "test"})
        self.db.put("sessions", "token-hash", {"userId": "second", "expiresAt": 9999999999})
        code, body = auth_phone.bind(self.context("second"), None, {"code": "ok"})
        self.assertEqual((code, body), (200, {"phoneMasked": "138****8000", "merged": True}))
        self.assertEqual(self.db.get("designs", "work")["userId"], "first")
        self.assertEqual(self.db.get("sessions", "token-hash")["userId"], "first")

    def test_exchange_failure_returns_502(self):
        def failed(code):
            raise RuntimeError("upstream")
        phone_auth._exchanger = failed
        self.assertEqual(auth_phone.bind(self.context("first"), None, {"code": "bad"}),
                         (502, {"error": "没登录上，网络不太好，再点一次试试"}))

    def test_unbound_me_has_null_phone(self):
        self.assertEqual(auth_phone.me(self.context("first"), None, None), (200, {"phoneMasked": None}))

    def test_dev_code_fallback(self):
        phone_auth._exchanger = None
        with patch.object(phone_auth.env, "is_dev", return_value=True), \
             patch.object(phone_auth.content_security, "configured", return_value=False):
            self.assertEqual(phone_auth.exchange_code("dev-00008000"), "13800008000")
