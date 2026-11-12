"""模拟支付：和真实支付走同一套流程（发起付款 → 回调 → 幂等 → 金额核对 → 状态迁移），
只在开发环境（或显式打开的体验环境）可用；正式环境配成模拟支付时拒绝启动。"""
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import commerce
import env
import payments
import user_api
from db import DB


def _clean_env(**extra):
    base = {k: v for k, v in os.environ.items()
            if k not in ("ENV", "APP_ENV", "DATABASE_URL", "ALLOW_PUBLIC_BIND", "PAYMENT_PROVIDER", "MOCK_PAYMENT_IN_TRIAL")}
    base.update(extra)
    return mock.patch.dict(os.environ, base, clear=True)


class MockPaymentTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, "pay.db"))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    def _order(self, rid, uid="u1"):
        bead_map = {b["id"]: b for b in self.db.list("beads")}
        seq = ["zt8"] * 20
        goods = sum(user_api.bead_price_fen(bead_map[x]) for x in seq)
        sub = goods + 1500
        total = sub + (0 if sub >= 9900 else 800)
        quote = {"totalFen": total, "items": [{"id": "zt8", "unitPriceFen": user_api.bead_price_fen(bead_map["zt8"]), "mm": 8}]}
        order = user_api.make_order(self.db, {
            "requestId": rid, "name": "模拟付款单", "beads": seq, "wrist": 15, "gift": False, "cord": 0,
            "person": "张三", "phone": "13800138000", "addr": "测试地址", "confirmedQuote": quote,
        }, uid)
        return order["no"]

    def test_no_provider_keeps_old_behaviour(self):
        with _clean_env():
            no = self._order("req-mockpay-none-0001")
            pub = user_api.public_order(self.db.get("orders", no))
            self.assertNotIn("pay_order", pub["allowedActions"])
            with self.assertRaises(ValueError):
                user_api.start_payment(self.db, no, "u1")
            with self.assertRaises(KeyError):
                user_api.mock_payment_notify(self.db, no, "u1", "pay_x", "success")

    def test_mock_payment_success_confirms_order_and_allows_production(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._order("req-mockpay-ok-00001")
            self.assertIn("pay_order", user_api.public_order(self.db.get("orders", no))["allowedActions"])
            started = user_api.start_payment(self.db, no, "u1")
            self.assertTrue(started["payment"]["mock"])
            pid = started["payment"]["paymentId"]
            out = user_api.mock_payment_notify(self.db, no, "u1", pid, "success")
            self.assertEqual(out["result"], "paid")
            saved = self.db.get("orders", no)
            self.assertEqual(saved["paymentStatus"], "paid")
            self.assertEqual(saved["orderStatus"], "confirmed")
            self.assertEqual(saved["paymentChannel"], "mock")
            self.assertEqual(saved["paidFen"], payments.payable_fen(saved))
            self.assertNotIn("pay_order", out["order"]["allowedActions"])
            # 重复回调只处理一次
            again = user_api.mock_payment_notify(self.db, no, "u1", pid, "success")
            self.assertEqual(again["result"], "duplicate")
            # 付了款就能开始制作；工单上标明是模拟付款
            commerce.transition_order_status(self.db, no, "fulfillmentStatus", "producing")
            self.assertTrue(commerce.get_work_order(self.db, no)["mockPayment"])

    def test_failed_mock_payment_keeps_order_payable(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._order("req-mockpay-fail-0001")
            pid = user_api.start_payment(self.db, no, "u1")["payment"]["paymentId"]
            out = user_api.mock_payment_notify(self.db, no, "u1", pid, "fail")
            self.assertEqual(out["result"], "failed")
            self.assertEqual(self.db.get("orders", no)["paymentStatus"], "unpaid")
            self.assertIn("pay_order", out["order"]["allowedActions"])
            pid2 = user_api.start_payment(self.db, no, "u1")["payment"]["paymentId"]
            self.assertEqual(user_api.mock_payment_notify(self.db, no, "u1", pid2, "success")["result"], "paid")

    def test_cannot_pay_someone_elses_order_or_tamper_amount(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._order("req-mockpay-own-00001")
            with self.assertRaises(KeyError):
                user_api.start_payment(self.db, no, "u2")
            pid = user_api.start_payment(self.db, no, "u1")["payment"]["paymentId"]
            with self.assertRaises(KeyError):
                user_api.mock_payment_notify(self.db, no, "u2", pid, "success")
            order = self.db.get("orders", no)
            with self.assertRaises(ValueError):
                payments.apply_callback(order, {"id": "cb_x", "paymentId": pid, "provider": "mock",
                                                "amountFen": payments.payable_fen(order) - 1, "result": "success"})
            with self.assertRaises(ValueError):
                payments.apply_callback(order, {"id": "cb_y", "paymentId": "pay_unknown", "provider": "mock",
                                                "amountFen": payments.payable_fen(order), "result": "success"})

    def test_mock_is_off_in_trial_unless_enabled_and_blocked_in_production(self):
        with _clean_env(ENV="trial", PAYMENT_PROVIDER="mock"):
            self.assertEqual(payments.provider(), "none")
        with _clean_env(ENV="trial", PAYMENT_PROVIDER="mock", MOCK_PAYMENT_IN_TRIAL="1"):
            self.assertEqual(payments.provider(), "mock")
        # 其余启动条件都满足（口令、数据库、微信凭证都是测试占位值），只因为模拟支付被拒
        prod = dict(ENV="production", PAYMENT_PROVIDER="mock", MOCK_PAYMENT_IN_TRIAL="1", ADMIN_TOKEN="test-only",
                    DATABASE_URL="postgresql://test-only@localhost/none", WECHAT_APP_ID="test-only", WECHAT_APP_SECRET="test-only")
        with _clean_env(**prod):
            self.assertEqual(payments.provider(), "none")
            with self.assertRaisesRegex(SystemExit, "模拟支付"):
                env.validate_startup()
        prod["PAYMENT_PROVIDER"] = "none"
        with _clean_env(**prod):
            env.validate_startup()   # 不配模拟支付时正常启动

    def test_real_mark_paid_is_still_refused(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            with self.assertRaises(RuntimeError):
                payments.mark_paid({"totalFen": 100}, {"id": "cb-1", "amountFen": 100})



class MockPaymentHTTPTest(unittest.TestCase):
    """走真实 HTTP：用户发起付款 → 模拟回调 → 订单变已支付、已确认；没开模拟支付时回调接口不存在。"""

    def setUp(self):
        import json, threading, time
        from http.server import ThreadingHTTPServer
        import app
        self.json, self.app = json, app
        self.tmp = tempfile.TemporaryDirectory()
        self.original_db = app.db
        app.db = DB(os.path.join(self.tmp.name, "http.db"))
        self.token = "test-session-token-for-mock-payment-0001"
        app.db.put("sessions", user_api.token_hash(self.token), {"userId": "u1", "expiresAt": time.time() + 600})
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = "http://127.0.0.1:%d" % self.server.server_port
        bead_map = {b["id"]: b for b in app.db.list("beads")}
        seq = ["zt8"] * 20
        sub = sum(user_api.bead_price_fen(bead_map[x]) for x in seq) + 1500
        quote = {"totalFen": sub + (0 if sub >= 9900 else 800),
                 "items": [{"id": "zt8", "unitPriceFen": user_api.bead_price_fen(bead_map["zt8"]), "mm": 8}]}
        self.no = user_api.make_order(app.db, {
            "requestId": "req-mockpay-http-0001", "name": "t", "beads": seq, "wrist": 15, "gift": False, "cord": 0,
            "person": "张三", "phone": "13800138000", "addr": "测试地址", "confirmedQuote": quote}, "u1")["no"]

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
        self.app.db.conn.close(); self.app.db = self.original_db
        self.tmp.cleanup()

    def post(self, path, data):
        from urllib.error import HTTPError
        from urllib.request import Request, build_opener, ProxyHandler
        req = Request(self.base + path, data=self.json.dumps(data).encode(), method="POST",
                      headers={"Content-Type": "application/json", "Authorization": "Bearer " + self.token})
        try:
            resp = build_opener(ProxyHandler({})).open(req, timeout=3)   # 本机请求不走代理
        except HTTPError as e:
            resp = e
        with resp:
            return resp.status, self.json.loads(resp.read())

    def test_http_mock_payment_flow(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            code, body = self.post("/api/my/orders/%s/pay" % self.no, {})
            self.assertEqual(code, 200, body)
            pid = body["payment"]["paymentId"]
            code, body = self.post("/api/payments/mock/notify", {"orderNo": self.no, "paymentId": pid, "result": "success"})
            self.assertEqual(code, 200, body)
            self.assertEqual(body["order"]["paymentStatus"], "paid")
            self.assertEqual(body["order"]["orderStatus"], "confirmed")
            self.assertNotIn("workOrder", body["order"])

    def test_http_mock_notify_absent_without_mock(self):
        with _clean_env():
            code, _ = self.post("/api/payments/mock/notify", {"orderNo": self.no, "paymentId": "x", "result": "success"})
            self.assertEqual(code, 404)
            code, _ = self.post("/api/my/orders/%s/pay" % self.no, {})
            self.assertEqual(code, 400)

if __name__ == "__main__":
    unittest.main()
