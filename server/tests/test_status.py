"""四组订单状态、合法迁移、旧 status 兼容推导的单元测试。"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import status


class StatusModelTest(unittest.TestCase):
    def test_new_order_status_defaults(self):
        g = status.new_order_status()
        self.assertEqual(g, {"orderStatus": "待确认", "paymentStatus": "待支付",
                             "fulfillmentStatus": "待履约", "afterSaleStatus": "无售后"})

    def test_derive_legacy_status(self):
        cases = {
            "待支付": ("待确认", "待支付", "待履约", "无售后"),
            "待串制": ("已确认", "已支付", "待履约", "无售后"),
            "串制中": ("已确认", "已支付", "制作中", "无售后"),
            "已发货": ("已确认", "已支付", "已发货", "无售后"),
            "已完成": ("已完成", "已支付", "已签收", "无售后"),
            "已取消": ("已取消", "待支付", "待履约", "无售后"),
        }
        for legacy, expected in cases.items():
            self.assertEqual(tuple(status.derive_status({"status": legacy})[k] for k in status.GROUP_FIELDS), expected)

    def test_derive_keeps_explicit_groups(self):
        order = {"status": "待支付", "orderStatus": "已确认", "paymentStatus": "已支付",
                 "fulfillmentStatus": "制作中", "afterSaleStatus": "申请中"}
        self.assertEqual(status.derive_status(order)["orderStatus"], "已确认")
        self.assertEqual(status.derive_status(order)["paymentStatus"], "已支付")

    def test_order_transitions(self):
        status.validate_transition("orderStatus", "待确认", "已确认")
        status.validate_transition("orderStatus", "待确认", "已取消")
        status.validate_transition("orderStatus", "已确认", "已完成")
        status.validate_transition("orderStatus", "已确认", "已关闭")
        status.validate_transition("orderStatus", "待确认", "待确认")  # 幂等

    def test_illegal_order_transitions(self):
        for bad in (("待确认", "已完成"), ("已取消", "已确认"), ("已完成", "已确认"), ("待确认", "已关闭")):
            with self.assertRaises(ValueError):
                status.validate_transition("orderStatus", *bad)
        with self.assertRaises(ValueError):
            status.validate_transition("orderStatus", "待确认", "不存在的状态")

    def test_fulfillment_transitions(self):
        status.validate_transition("fulfillmentStatus", "待履约", "制作中")
        status.validate_transition("fulfillmentStatus", "制作中", "待发货")
        status.validate_transition("fulfillmentStatus", "待发货", "已发货")
        status.validate_transition("fulfillmentStatus", "已发货", "已签收")
        status.validate_transition("fulfillmentStatus", "已发货", "物流异常")
        status.validate_transition("fulfillmentStatus", "物流异常", "已发货")
        status.validate_transition("fulfillmentStatus", "已发货", "已退回")

    def test_illegal_fulfillment_transitions(self):
        for bad in (("待发货", "已签收"), ("待履约", "已发货"), ("已签收", "已发货")):
            with self.assertRaises(ValueError):
                status.validate_transition("fulfillmentStatus", *bad)

    def test_after_sale_transitions(self):
        status.validate_transition("afterSaleStatus", "申请中", "已同意")
        status.validate_transition("afterSaleStatus", "已同意", "退货中")
        status.validate_transition("afterSaleStatus", "退货中", "退款中")
        status.validate_transition("afterSaleStatus", "退款中", "售后完成")
        status.validate_transition("afterSaleStatus", "申请中", "已拒绝")

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
