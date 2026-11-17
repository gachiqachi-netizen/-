"""微信支付签名、回调、金额和通道边界。密钥仅测试时临时生成。"""
import base64
import contextlib
import hashlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import threading
import time
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import payments
import commerce
import user_api
import wechat_pay
from db import DB

HAS_CRYPTO = importlib.util.find_spec("cryptography") is not None


class ConfigTest(unittest.TestCase):
    def test_wechat_missing_environment_fails_startup(self):
        with mock.patch.dict(os.environ, {"PAYMENT_PROVIDER": "wechat"}, clear=True):
            with self.assertRaisesRegex(SystemExit, "WXPAY_MCHID"):
                wechat_pay.validate_config()

    def test_wechat_missing_cryptography_fails_with_install_hint(self):
        values = {"WXPAY_MCHID": "test-merchant", "WXPAY_APPID": "test-app",
                  "WXPAY_API_V3_KEY": "a" * 32, "WXPAY_CERT_SERIAL": "test-cert",
                  "WXPAY_PRIVATE_KEY_PATH": "/tmp/test-private", "WXPAY_NOTIFY_URL": "https://example.invalid/notify",
                  "WXPAY_PLATFORM_PUBLIC_KEY_PATH": "/tmp/test-public",
                  "WXPAY_PLATFORM_PUBLIC_KEY_ID": "test-public"}
        with mock.patch.dict(os.environ, values, clear=True), mock.patch.dict(sys.modules, {"cryptography": None}):
            with self.assertRaisesRegex(SystemExit, "缺少 cryptography，请 pip install -r server/requirements.txt"):
                wechat_pay.validate_config()

    def test_mock_never_exchanges_code(self):
        with mock.patch.dict(os.environ, {"PAYMENT_PROVIDER": "mock"}):
            with mock.patch.object(user_api, "exchange_wechat_code", side_effect=AssertionError):
                with mock.patch("commerce.start_payment", return_value=({"no": "N"}, {"mock": True})):
                    user_api.start_payment(None, "N", "u")

    def test_mismatched_openid_rejected_before_order(self):
        with mock.patch.dict(os.environ, {"PAYMENT_PROVIDER": "wechat"}):
            with mock.patch.object(user_api, "exchange_wechat_code", return_value=(200, {"appid": "test-app", "openid": "test-openid"})):
                with mock.patch("commerce.start_payment", side_effect=AssertionError("must not order")):
                    with self.assertRaises(PermissionError):
                        user_api.start_payment(None, "N", "wrong", "code")

    def test_openid_only_passes_in_memory_and_is_not_logged(self):
        openid = "temporary-openid-test"
        uid = hashlib.sha256(("test-app:" + openid).encode()).hexdigest()
        out = io.StringIO()
        with mock.patch.dict(os.environ, {"PAYMENT_PROVIDER": "wechat"}):
            with mock.patch.object(user_api, "exchange_wechat_code", return_value=(200, {"appid": "test-app", "openid": openid})):
                with mock.patch("commerce.start_payment", return_value=({"no": "N"}, {"provider": "wechat"})) as start:
                    with mock.patch.object(user_api, "public_order", return_value={"no": "N"}):
                        with contextlib.redirect_stderr(out):
                            result = user_api.start_payment(None, "N", uid, "one-use-code")
        self.assertEqual(start.call_args.kwargs["openid"], openid)
        self.assertNotIn(openid, repr(result) + out.getvalue())


@unittest.skipUnless(HAS_CRYPTO, "cryptography 未安装")
class CryptoTest(unittest.TestCase):
    def setUp(self):
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        self.temp = tempfile.TemporaryDirectory()
        self.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private_path = os.path.join(self.temp.name, "private.pem")
        public_path = os.path.join(self.temp.name, "public.pem")
        with open(private_path, "wb") as f:
            f.write(self.key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                           serialization.NoEncryption()))
        with open(public_path, "wb") as f:
            f.write(self.key.public_key().public_bytes(serialization.Encoding.PEM,
                                                       serialization.PublicFormat.SubjectPublicKeyInfo))
        self.env = mock.patch.dict(os.environ, {
            "WXPAY_MCHID": "test-merchant", "WXPAY_APPID": "test-app", "WXPAY_API_V3_KEY": "a" * 32,
            "WXPAY_CERT_SERIAL": "test-cert", "WXPAY_PRIVATE_KEY_PATH": private_path,
            "WXPAY_PLATFORM_PUBLIC_KEY_PATH": public_path, "WXPAY_PLATFORM_PUBLIC_KEY_ID": "test-public",
            "WXPAY_NOTIFY_URL": "https://example.invalid/api/payments/notify"})
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.temp.cleanup()

    def _notify(self, event):
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        nonce, associated = b"123456789012", b"test"
        ciphertext = AESGCM(b"a" * 32).encrypt(nonce, json.dumps(event).encode(), associated)
        raw = json.dumps({"id": "callback-test", "resource": {"nonce": nonce.decode(),
                          "associated_data": associated.decode(), "ciphertext": base64.b64encode(ciphertext).decode()}}).encode()
        stamp, header_nonce = str(int(time.time())), "header-nonce"
        signature = wechat_pay._sign(stamp + "\n" + header_nonce + "\n" + raw.decode() + "\n")
        headers = {"Wechatpay-Timestamp": stamp, "Wechatpay-Nonce": header_nonce,
                   "Wechatpay-Serial": "test-public", "Wechatpay-Signature": signature}
        return headers, raw

    def test_jsapi_amount_and_request_payment_signature(self):
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import padding
        with mock.patch.object(wechat_pay, "_request", return_value={"prepay_id": "prepay-test"}) as req:
            self.assertEqual(wechat_pay.jsapi("ORDER", 123, "temporary-openid"), "prepay-test")
            self.assertEqual(req.call_args.args[2]["amount"]["total"], 123)
            self.assertEqual(req.call_args.args[2]["payer"]["openid"], "temporary-openid")
        params = wechat_pay.payment_params("prepay-test")
        message = "\n".join(("test-app", params["timeStamp"], params["nonceStr"], params["package"], ""))
        self.key.public_key().verify(base64.b64decode(params["paySign"]), message.encode(),
                                     padding.PKCS1v15(), hashes.SHA256())

    def test_unexpired_prepay_is_reused(self):
        order = {"no": "ORDER", "payableFen": 123, "paymentStatus": "unpaid",
                 "orderStatus": "pending_confirmation", "paymentAttempts": [{"id": "old", "provider": "wechat",
                 "amountFen": 123, "createdAt": int(time.time() * 1000), "result": None, "prepayId": "prepay-test"}]}
        with mock.patch.dict(os.environ, {"PAYMENT_PROVIDER": "wechat"}), mock.patch.object(wechat_pay, "jsapi", side_effect=AssertionError):
            attempt, params = payments.create_payment(order, "temporary-openid")
        self.assertEqual(attempt["id"], "old")
        self.assertEqual(params["package"], "prepay_id=prepay-test")

    def test_notify_signature_and_decryption(self):
        headers, raw = self._notify({"out_trade_no": "ORDER", "amount": {"total": 123}})
        callback_id, event = wechat_pay.decode_notify(headers, raw)
        self.assertEqual(callback_id, "callback-test")
        self.assertEqual(event["amount"]["total"], 123)
        headers["Wechatpay-Signature"] = base64.b64encode(b"invalid").decode()
        with self.assertRaises(Exception):
            wechat_pay.decode_notify(headers, raw)

    def test_amount_mismatch_and_duplicate_callback(self):
        order = {"payableFen": 123, "paymentStatus": "unpaid", "orderStatus": "pending_confirmation",
                 "paymentAttempts": [{"id": "attempt", "provider": "wechat", "amountFen": 123}]}
        callback = {"id": "callback", "paymentId": "attempt", "provider": "wechat",
                    "amountFen": 124, "result": "success"}
        with self.assertRaises(ValueError):
            payments.apply_callback(order, callback)
        callback["amountFen"] = 123
        self.assertEqual(payments.apply_callback(order, callback)[0], "paid")
        self.assertEqual(payments.apply_callback(order, callback)[0], "duplicate")

    def test_refund_cannot_exceed_paid_amount(self):
        with self.assertRaises(ValueError):
            payments.validate_refund_amount({"paymentChannel": "wechat", "paidFen": 100,
                                             "payableFen": 200}, 101)


@unittest.skipUnless(HAS_CRYPTO, "cryptography 未安装")
class RefundFlowTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.temp.name, "refund.db"))
        bead = self.db.list("beads")[0]
        unit = user_api.bead_price_fen(bead)
        amount = unit * 6 + 2300
        self.order = user_api.make_order(self.db, {"requestId": "wechat-refund-test-001", "name": "测试",
            "beads": [bead["id"]] * 6, "wrist": 15, "person": "测试", "phone": "13800138000",
            "addr": "测试地址", "confirmedQuote": {"totalFen": amount,
            "items": [{"id": bead["id"], "unitPriceFen": unit, "mm": bead["mm"]}]}}, "test-user")
        self.no = self.order["no"]
        saved = self.db.get("orders", self.no)
        saved.update(paymentStatus="paid", paidFen=amount, paymentChannel="wechat", orderStatus="confirmed")
        self.db.put("orders", self.no, saved)
        self.amount = 100
        rec = commerce.create_after_sale(self.db, {"orderNo": self.no, "type": "仅退款",
                                                 "reason": "测试", "refundFen": self.amount})
        self.sale = rec["no"]
        commerce.transition_after_sale(self.db, self.sale, "approve")
        commerce.transition_after_sale(self.db, self.sale, "approve")

    def tearDown(self):
        self.db.conn.close()
        self.temp.cleanup()

    def _event(self, state):
        rec = self.db.get("after_sales", self.sale)
        return {"out_trade_no": self.no, "out_refund_no": rec["refundAttempts"][-1]["id"],
                "amount": {"refund": self.amount}, "refund_status": state}

    def test_processing_then_success_and_duplicate(self):
        with mock.patch.object(payments, "handle_refund", return_value="refunding"):
            rec = commerce.transition_after_sale(self.db, self.sale, "refund")
        self.assertEqual(rec["status"], "refunding")
        self.assertEqual(self.db.get("orders", self.no)["paymentStatus"], "refunding")
        event = self._event("SUCCESS")
        self.assertEqual(commerce.refund_callback(self.db, "cb-1", event), "refunded")
        self.assertEqual(commerce.refund_callback(self.db, "cb-1", event), "duplicate")
        self.assertEqual(self.db.get("orders", self.no)["refundFen"], self.amount)

    def test_processing_then_failure_and_retry(self):
        with mock.patch.object(payments, "handle_refund", return_value="refunding"):
            commerce.transition_after_sale(self.db, self.sale, "refund")
        self.assertEqual(commerce.refund_callback(self.db, "cb-2", self._event("ABNORMAL")), "refund_failed")
        self.assertEqual(self.db.get("after_sales", self.sale)["status"], "refunding")
        with mock.patch.object(payments, "handle_refund", return_value="refunded"):
            commerce.transition_after_sale(self.db, self.sale, "refund")
        self.assertEqual(self.db.get("orders", self.no)["paymentStatus"], "refunded")

    def test_refund_callback_amount_mismatch(self):
        with mock.patch.object(payments, "handle_refund", return_value="refunding"):
            commerce.transition_after_sale(self.db, self.sale, "refund")
        event = self._event("SUCCESS")
        event["amount"]["refund"] += 1
        with self.assertRaises(ValueError):
            commerce.refund_callback(self.db, "cb-3", event)
        self.assertEqual(self.db.get("orders", self.no)["paymentStatus"], "refunding")

    def test_callback_arriving_before_api_return(self):
        results = []
        threads = []
        def refund_before_return(order, amount, refund_id):
            event = {"out_trade_no": self.no, "out_refund_no": refund_id,
                     "amount": {"refund": amount}, "refund_status": "SUCCESS"}
            thread = threading.Thread(target=lambda: results.append(
                commerce.refund_callback(self.db, "early-callback", event)))
            thread.start()
            threads.append(thread)
            return "refunding"
        with mock.patch.object(payments, "handle_refund", side_effect=refund_before_return):
            commerce.transition_after_sale(self.db, self.sale, "refund")
        threads[0].join(timeout=5)
        self.assertFalse(threads[0].is_alive())
        self.assertEqual(results, ["refunded"])
