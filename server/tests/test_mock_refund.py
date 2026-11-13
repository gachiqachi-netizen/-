"""A5b：模拟付款的订单可以模拟退款；真实通道仍然报错，状态不变。"""
import os
import sys
import tempfile
import time
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import commerce
import payments
import user_api
from db import DB


def _clean_env(**extra):
    base = {k: v for k, v in os.environ.items()
            if k not in ("ENV", "APP_ENV", "DATABASE_URL", "ALLOW_PUBLIC_BIND", "PAYMENT_PROVIDER", "MOCK_PAYMENT_IN_TRIAL")}
    base.update(extra)
    return mock.patch.dict(os.environ, base, clear=True)


class MockRefundTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, "refund.db"))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    def _paid_order(self, rid):
        """建单，用模拟支付付掉。"""
        bead_map = {b["id"]: b for b in self.db.list("beads")}
        seq = ["zt8"] * 20
        unit = user_api.bead_price_fen(bead_map["zt8"])
        sub = unit * len(seq) + 1500  # 和 test_mock_payment 一样按现行计价（手工费 A3 去掉后一起改）
        quote = {"totalFen": sub + (0 if sub >= 9900 else 800), "items": [{"id": "zt8", "unitPriceFen": unit, "mm": 8}]}
        order = user_api.make_order(self.db, {
            "requestId": rid, "name": "模拟退款单", "beads": seq, "wrist": 15, "gift": False, "cord": 0,
            "person": "张三", "phone": "13800138000", "addr": "测试地址", "confirmedQuote": quote,
        }, "u1")
        pid = user_api.start_payment(self.db, order["no"], "u1")["payment"]["paymentId"]
        user_api.mock_payment_notify(self.db, order["no"], "u1", pid, "success")
        return order["no"]

    def _delivered(self, no):
        o = self.db.get("orders", no)
        now = int(time.time() * 1000)
        self.db.put("orders", no, {**o, "fulfillmentStatus": "delivered", "logisticsStatus": "delivered",
                                   "qualityGate": {"passed": True},
                                   "logistics": {"carrierName": "测试快递", "trackingNo": "T1",
                                                 "shippedAt": now - 3 * 86400000, "signedAt": now - 86400000}})

    def _apply(self, no, atype, reason):
        out = user_api.request_after_sale(self.db, no, "u1", {"type": atype, "reason": reason,
                                                              "idempotencyKey": "idem-" + no})
        return out["afterSale"]["no"]

    def _approve(self, sale):
        commerce.transition_after_sale(self.db, sale, "approve")  # requested → reviewing
        commerce.transition_after_sale(self.db, sale, "approve")  # reviewing → approved

    def test_refund_only_completes_and_refunds(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._paid_order("req-mockrefund-0001")
            paid = self.db.get("orders", no)["paidFen"]
            sale = self._apply(no, "仅退款", "不想要了")
            self._approve(sale)
            self.assertIn("refund", commerce.after_sale_allowed_actions(self.db.get("after_sales", sale)))
            rec = commerce.transition_after_sale(self.db, sale, "refund")
            self.assertEqual(rec["status"], "completed")
            self.assertEqual(rec["refundedFen"], paid)
            self.assertEqual(rec["reservedFen"], 0)
            o = self.db.get("orders", no)
            self.assertEqual(o["paymentStatus"], "refunded")
            self.assertEqual(o["afterSaleStatus"], "completed")
            self.assertIn("模拟退款", [h.get("note") for h in o["statusHistory"]])

    def test_return_refund_needs_return_logistics_first(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._paid_order("req-mockrefund-0002")
            self._delivered(no)
            paid = self.db.get("orders", no)["paidFen"]
            sale = self._apply(no, "退货退款", "珠子有裂纹或瑕疵")
            self._approve(sale)
            with self.assertRaises(ValueError):
                commerce.transition_after_sale(self.db, sale, "refund")  # 还没记录退货物流
            commerce.transition_after_sale(self.db, sale, "returning",
                                           return_logistics={"carrierName": "测试快递", "trackingNo": "R1"})
            rec = commerce.transition_after_sale(self.db, sale, "refund")
            self.assertEqual(rec["status"], "completed")
            self.assertEqual(rec["refundedFen"], paid)
            self.assertEqual(self.db.get("orders", no)["paymentStatus"], "refunded")

    def test_no_mock_provider_refund_fails_and_nothing_changes(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._paid_order("req-mockrefund-0003")
            sale = self._apply(no, "仅退款", "不想要了")
            self._approve(sale)
        with _clean_env():  # 关掉模拟支付
            with self.assertRaisesRegex(ValueError, "真实退款服务尚未接入"):
                commerce.transition_after_sale(self.db, sale, "refund")
        self.assertEqual(self.db.get("after_sales", sale)["status"], "approved")
        self.assertEqual(self.db.get("orders", no)["paymentStatus"], "paid")

    def test_non_mock_order_refund_fails_and_nothing_changes(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._paid_order("req-mockrefund-0004")
            sale = self._apply(no, "仅退款", "不想要了")
            self._approve(sale)
            o = self.db.get("orders", no)
            self.db.put("orders", no, {**o, "paymentChannel": "wechat"})
            with self.assertRaisesRegex(ValueError, "真实退款服务尚未接入"):
                commerce.transition_after_sale(self.db, sale, "refund")
            self.assertEqual(self.db.get("after_sales", sale)["status"], "approved")
            self.assertEqual(self.db.get("orders", no)["paymentStatus"], "paid")

    def test_production_never_uses_mock(self):
        with _clean_env(ENV="production", PAYMENT_PROVIDER="mock"):
            self.assertEqual(payments.provider(), "none")
            with self.assertRaises(RuntimeError):
                payments.handle_refund({"paymentChannel": "mock", "totalFen": 100, "payableFen": 100}, 100)

    def test_non_refund_type_cannot_refund(self):
        with _clean_env(PAYMENT_PROVIDER="mock"):
            no = self._paid_order("req-mockrefund-0005")
            self._delivered(no)
            sale = self._apply(no, "补寄配件", "少件或漏发")
            self._approve(sale)
            self.assertNotIn("refund", commerce.after_sale_allowed_actions(self.db.get("after_sales", sale)))
            with self.assertRaises(ValueError):
                commerce.transition_after_sale(self.db, sale, "refund")


if __name__ == "__main__":
    unittest.main()
