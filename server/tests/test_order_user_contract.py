"""Customer-facing order state contract and guarded order actions."""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db import DB
import user_api


class OrderUserContractTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, "orders.db"))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    @staticmethod
    def order(no="ORDER-1", owner="owner-a", **changes):
        result = {
            "no": no,
            "userId": owner,
            "name": "测试手串",
            "beads": ["zt8"] * 6,
            "items": [{"id": "zt8", "unitPriceFen": 300}],
            "totalFen": 3300,
            "payableFen": 3300,
            "paidFen": 0,
            "refundFen": 0,
            "status": "待支付",
            "orderStatus": "pending_confirmation",
            "paymentStatus": "unpaid",
            "fulfillmentStatus": "unfulfilled",
            "afterSaleStatus": "none",
            "logisticsStatus": "not_shipped",
            "statusHistory": [],
            "logisticsHistory": [],
            "logistics": None,
        }
        result.update(changes)
        return result

    def save(self, order):
        self.db.put("orders", order["no"], order)
        return order

    def test_public_order_has_normalized_state_and_never_advertises_pay(self):
        public = user_api.public_order(self.order(paymentAvailable=True))
        self.assertNotIn("userId", public)
        self.assertEqual(public["state"], {
            "order": {"code": "pending_confirmation", "label": "待确认"},
            "payment": {"code": "unpaid", "label": "待支付"},
            "fulfillment": {"code": "unfulfilled", "label": "待履约"},
            "afterSale": {"code": "none", "label": "无售后"},
            "logistics": {"code": "not_shipped", "label": "未发货"},
        })
        self.assertEqual(public["allowedActions"], ["cancel_order", "edit_address", "reorder"])
        self.assertNotIn("pay", public["allowedActions"])

        legacy = user_api.public_order({"no": "OLD", "status": "已发货", "beads": ["zt8"]})
        self.assertEqual(legacy["state"]["logistics"]["code"], "shipped")
        self.assertNotIn("pay", legacy["allowedActions"])

    def test_cancel_unpaid_order_updates_both_states_and_history_atomically(self):
        self.save(self.order())
        public = user_api.perform_order_action(self.db, "ORDER-1", "owner-a", "cancel_order")
        self.assertEqual(public["orderStatus"], "cancelled")
        self.assertEqual(public["paymentStatus"], "closed")
        self.assertEqual(public["status"], "已取消")
        self.assertEqual(public["allowedActions"], ["reorder"])
        self.assertEqual(
            [entry["group"] for entry in public["statusHistory"][-2:]],
            ["orderStatus", "paymentStatus"],
        )
        saved = self.db.get("orders", "ORDER-1")
        self.assertEqual((saved["orderStatus"], saved["paymentStatus"]), ("cancelled", "closed"))

        before = dict(saved)
        with self.assertRaisesRegex(ValueError, "不能取消"):
            user_api.perform_order_action(self.db, "ORDER-1", "owner-a", "cancel_order")
        self.assertEqual(self.db.get("orders", "ORDER-1"), before)

    def test_cancel_requires_owner_and_exact_unpaid_state(self):
        original = self.save(self.order(paymentStatus="paid", paidFen=3300))
        with self.assertRaises(KeyError):
            user_api.perform_order_action(self.db, "ORDER-1", "owner-b", "cancel_order")
        with self.assertRaisesRegex(ValueError, "不能取消"):
            user_api.perform_order_action(self.db, "ORDER-1", "owner-a", "cancel_order")
        self.assertEqual(self.db.get("orders", "ORDER-1"), original)

    def test_confirm_receipt_completes_order_fulfillment_and_logistics(self):
        shipped = self.order(
            status="已发货",
            orderStatus="confirmed",
            paymentStatus="paid",
            fulfillmentStatus="shipped",
            logisticsStatus="in_transit",
            paidFen=3300,
            logistics={"carrierName": "测试快递", "trackingNo": "TRACK-1"},
        )
        self.save(shipped)
        before = user_api.public_order(shipped)
        self.assertEqual(before["allowedActions"], ["confirm_receipt", "view_logistics", "reorder", "request_after_sale"])

        public = user_api.perform_order_action(self.db, "ORDER-1", "owner-a", "confirm_receipt")
        self.assertEqual(public["orderStatus"], "completed")
        self.assertEqual(public["fulfillmentStatus"], "delivered")
        self.assertEqual(public["logisticsStatus"], "delivered")
        self.assertEqual(public["paymentStatus"], "paid")
        self.assertEqual(public["status"], "已完成")
        self.assertIn("signedAt", public["logistics"])
        self.assertEqual(public["allowedActions"], ["view_logistics", "reorder"])
        self.assertEqual(
            [entry["group"] for entry in public["statusHistory"][-3:]],
            ["logisticsStatus", "fulfillmentStatus", "orderStatus"],
        )

    def test_unknown_customer_action_does_not_mutate_order(self):
        original = self.save(self.order())
        with self.assertRaisesRegex(ValueError, "不支持"):
            user_api.perform_order_action(self.db, "ORDER-1", "owner-a", "pay")
        self.assertEqual(self.db.get("orders", "ORDER-1"), original)


if __name__ == "__main__":
    unittest.main()
