"""A4a：已签收也能确认收货；签收 7 天后自动完成。"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db import DB
import commerce
import user_api

DAY = 24 * 3600 * 1000
NOW = 1_800_000_000_000


def order(no="ORDER-1", owner="owner-a", **changes):
    """已付款、已发货、运输中的最小订单。"""
    result = {
        "no": no,
        "userId": owner,
        "name": "测试手串",
        "beads": ["zt8"] * 6,
        "items": [{"id": "zt8", "unitPriceFen": 300}],
        "totalFen": 3300,
        "payableFen": 3300,
        "paidFen": 3300,
        "refundFen": 0,
        "status": "已发货",
        "orderStatus": "confirmed",
        "paymentStatus": "paid",
        "fulfillmentStatus": "shipped",
        "afterSaleStatus": "none",
        "logisticsStatus": "in_transit",
        "qualityGate": {"passed": True},
        "statusHistory": [],
        "logisticsHistory": [],
        "logistics": {"company": "测试快递", "trackingNo": "T1", "shippedAt": NOW - 10 * DAY},
    }
    result.update(changes)
    return result


def delivered(no="ORDER-1", signed_days_ago=8, **changes):
    o = order(no, logisticsStatus="delivered",
              logistics={"company": "测试快递", "trackingNo": "T1",
                         "shippedAt": NOW - 10 * DAY, "signedAt": NOW - signed_days_ago * DAY})
    o.update(changes)
    return o


class ReceiptTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, "orders.db"))

    def tearDown(self):
        self.tmp.cleanup()

    def save(self, o):
        self.db.put("orders", o["no"], o)

    def get(self, no="ORDER-1"):
        return self.db.get("orders", no)

    # ---- 手动确认收货

    def test_in_transit_can_confirm(self):
        self.save(order())
        self.assertIn("confirm_receipt", user_api.order_allowed_actions(self.get()))
        commerce.customer_order_action(self.db, "ORDER-1", "owner-a", "confirm_receipt")
        o = self.get()
        self.assertEqual(o["orderStatus"], "completed")
        self.assertEqual(o["logisticsStatus"], "delivered")
        self.assertEqual(o["fulfillmentStatus"], "delivered")
        self.assertTrue(o["logistics"].get("signedAt"))

    def test_delivered_can_confirm_and_keeps_signed_at(self):
        self.save(delivered(signed_days_ago=2))
        signed_at = self.get()["logistics"]["signedAt"]
        self.assertIn("confirm_receipt", user_api.order_allowed_actions(self.get()))
        commerce.customer_order_action(self.db, "ORDER-1", "owner-a", "confirm_receipt")
        o = self.get()
        self.assertEqual(o["orderStatus"], "completed")
        self.assertEqual(o["logisticsStatus"], "delivered")
        self.assertEqual(o["logistics"]["signedAt"], signed_at)
        # 物流已经是签收，不能再记一条 delivered → delivered
        self.assertFalse([h for h in o["statusHistory"]
                          if h.get("group") == "logisticsStatus" and h.get("from") == "delivered"])

    def test_after_sale_hides_confirm(self):
        self.save(delivered(afterSaleStatus="requested"))
        self.assertNotIn("confirm_receipt", user_api.order_allowed_actions(self.get()))
        with self.assertRaises(ValueError):
            commerce.customer_order_action(self.db, "ORDER-1", "owner-a", "confirm_receipt")

    def test_other_user_cannot_confirm(self):
        self.save(delivered())
        with self.assertRaises(KeyError):
            commerce.customer_order_action(self.db, "ORDER-1", "owner-b", "confirm_receipt")

    # ---- 自动完成

    def test_auto_complete_after_seven_days(self):
        self.save(delivered("OLD", signed_days_ago=8))
        self.save(delivered("NEW", signed_days_ago=6))
        self.save(delivered("AS", signed_days_ago=8, afterSaleStatus="requested"))
        self.save(delivered("DONE", signed_days_ago=8, orderStatus="completed", fulfillmentStatus="delivered"))
        self.save(order("TRANSIT"))
        done = commerce.auto_complete_delivered(self.db, now_ms=NOW)
        self.assertEqual(done, ["OLD"])
        self.assertEqual(self.get("OLD")["orderStatus"], "completed")
        self.assertEqual(self.get("OLD")["fulfillmentStatus"], "delivered")
        self.assertEqual(self.get("NEW")["orderStatus"], "confirmed")
        self.assertEqual(self.get("AS")["orderStatus"], "confirmed")
        self.assertEqual(self.get("TRANSIT")["orderStatus"], "confirmed")

    def test_auto_complete_records_system_actor(self):
        self.save(delivered(signed_days_ago=8))
        commerce.auto_complete_delivered(self.db, now_ms=NOW)
        o = self.get()
        last = o["statusHistory"][-1]
        self.assertEqual(last.get("actor"), "system")
        self.assertIn("签收 7 天后自动确认收货", last.get("note", ""))
        audits = [a for a in self.db.list("audit_logs") if a.get("action") == "auto_complete"]
        self.assertEqual([a["targetId"] for a in audits], ["ORDER-1"])

    def test_auto_complete_is_idempotent(self):
        self.save(delivered(signed_days_ago=8))
        self.assertEqual(commerce.auto_complete_delivered(self.db, now_ms=NOW), ["ORDER-1"])
        self.assertEqual(commerce.auto_complete_delivered(self.db, now_ms=NOW), [])

    def test_auto_complete_skips_order_without_signed_at(self):
        self.save(order(logisticsStatus="delivered"))
        self.assertEqual(commerce.auto_complete_delivered(self.db, now_ms=NOW), [])

    def test_jobs_cli_runs(self):
        import jobs
        os.environ["DATABASE_PATH"] = os.path.join(self.tmp.name, "cli.db")
        try:
            self.assertEqual(jobs.main(["auto-complete"]), 0)
        finally:
            del os.environ["DATABASE_PATH"]


if __name__ == "__main__":
    unittest.main()
