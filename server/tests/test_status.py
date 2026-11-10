"""四组订单状态（英文枚举）、合法迁移、旧 status 兼容推导的单元测试。"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import status


class StatusModelTest(unittest.TestCase):
    def test_new_order_status_defaults(self):
        g = status.new_order_status()
        self.assertEqual(g, {"orderStatus": "pending_confirmation", "paymentStatus": "unpaid",
                             "fulfillmentStatus": "unfulfilled", "afterSaleStatus": "none",
                             "logisticsStatus": "not_shipped"})

    def test_derive_legacy_status(self):
        cases = {
            "待支付": ("pending_confirmation", "unpaid", "unfulfilled", "none", "not_shipped"),
            "待串制": ("confirmed", "paid", "unfulfilled", "none", "not_shipped"),
            "串制中": ("confirmed", "paid", "producing", "none", "not_shipped"),
            "已发货": ("confirmed", "paid", "shipped", "none", "shipped"),
            "已完成": ("completed", "paid", "delivered", "none", "delivered"),
            "已取消": ("cancelled", "unpaid", "unfulfilled", "none", "not_shipped"),
        }
        for legacy, expected in cases.items():
            self.assertEqual(tuple(status.derive_status({"status": legacy})[k] for k in status.GROUP_FIELDS), expected)

    def test_derive_keeps_explicit_groups(self):
        order = {"status": "待支付", "orderStatus": "confirmed", "paymentStatus": "paid",
                 "fulfillmentStatus": "producing", "afterSaleStatus": "requested"}
        self.assertEqual(status.derive_status(order)["orderStatus"], "confirmed")
        self.assertEqual(status.derive_status(order)["paymentStatus"], "paid")

    def test_derive_unknown_legacy_defaults(self):
        self.assertEqual(status.derive_status({"status": "不存在的状态"})["orderStatus"], "pending_confirmation")

    def test_status_label_mapping(self):
        self.assertEqual(status.status_label("orderStatus", "pending_confirmation"), "待确认")
        self.assertEqual(status.status_label("orderStatus", "completed"), "已完成")
        self.assertEqual(status.status_label("afterSaleStatus", "completed"), "售后完成")
        self.assertEqual(status.status_label("fulfillmentStatus", "shipped"), "已发货")
        self.assertEqual(status.status_label("orderStatus", "unknown"), "unknown")

    def test_order_transitions(self):
        status.validate_transition("orderStatus", "pending_confirmation", "confirmed")
        status.validate_transition("orderStatus", "pending_confirmation", "cancelled")
        status.validate_transition("orderStatus", "confirmed", "completed")
        status.validate_transition("orderStatus", "confirmed", "closed")
        status.validate_transition("orderStatus", "pending_confirmation", "pending_confirmation")  # 幂等

    def test_illegal_order_transitions(self):
        for bad in (("pending_confirmation", "completed"), ("cancelled", "confirmed"),
                    ("completed", "confirmed"), ("pending_confirmation", "closed")):
            with self.assertRaises(ValueError):
                status.validate_transition("orderStatus", *bad)
        with self.assertRaises(ValueError):
            status.validate_transition("orderStatus", "pending_confirmation", "不存在的状态")

    def test_fulfillment_transitions(self):
        status.validate_transition("fulfillmentStatus", "unfulfilled", "producing")
        status.validate_transition("fulfillmentStatus", "producing", "ready_to_ship")
        status.validate_transition("fulfillmentStatus", "ready_to_ship", "shipped")
        status.validate_transition("fulfillmentStatus", "shipped", "delivered")
        status.validate_transition("fulfillmentStatus", "shipped", "exception")
        status.validate_transition("fulfillmentStatus", "exception", "shipped")
        status.validate_transition("fulfillmentStatus", "shipped", "returned")

    def test_illegal_fulfillment_transitions(self):
        for bad in (("ready_to_ship", "delivered"), ("unfulfilled", "shipped"), ("delivered", "shipped")):
            with self.assertRaises(ValueError):
                status.validate_transition("fulfillmentStatus", *bad)

    def test_after_sale_transitions(self):
        status.validate_transition("afterSaleStatus", "requested", "reviewing")
        status.validate_transition("afterSaleStatus", "reviewing", "approved")
        status.validate_transition("afterSaleStatus", "approved", "returning")
        status.validate_transition("afterSaleStatus", "returning", "refunding")
        status.validate_transition("afterSaleStatus", "refunding", "completed")
        status.validate_transition("afterSaleStatus", "requested", "rejected")

    def test_product_status_and_type_derivation(self):
        self.assertEqual(status.product_status({"onSale": True}), "on_sale")
        self.assertEqual(status.product_status({"onSale": False}), "off_sale")
        self.assertEqual(status.product_status({"status": "archived"}), "archived")
        self.assertEqual(status.product_type({"spacer": True}), "spacer")
        self.assertEqual(status.product_type({}), "bead")
        self.assertEqual(status.product_type({"type": "cord"}), "cord")
        self.assertTrue(status.product_on_sale({"status": "on_sale"}))
        self.assertFalse(status.product_on_sale({"status": "draft"}))


if __name__ == '__main__':
    unittest.main()
