"""金额统一整数分（server/money.py）与订单金额字段不变量测试。"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import money
import pricing


class MoneyTest(unittest.TestCase):
    def test_yuan_to_fen_exact_no_float_error(self):
        # 0.1 + 0.2 这类浮点误差，用 Decimal 精确转分后必须等于 30 分
        self.assertEqual(money.yuan_to_fen(0.1), 10)
        self.assertEqual(money.yuan_to_fen(0.2), 20)
        self.assertEqual(money.yuan_to_fen(0.1) + money.yuan_to_fen(0.2), 30)
        self.assertEqual(money.yuan_to_fen(3.5), 350)
        self.assertEqual(money.yuan_to_fen('12.34'), 1234)
        self.assertEqual(money.yuan_to_fen(100), 10000)

    def test_yuan_to_fen_rejects_invalid_values(self):
        for bad in (None, True, False, 'abc', '', float('nan'), float('inf'),
                    float('-inf'), -1, -0.01):
            with self.assertRaises(ValueError, msg=f"应拒绝 {bad!r}"):
                money.yuan_to_fen(bad)

    def test_yuan_to_fen_rejects_over_limit(self):
        # 超过 9_999_999_999 分（约 1 亿元）视为异常
        with self.assertRaises(ValueError):
            money.yuan_to_fen(100_000_000)  # 1 亿元 = 100 亿分
        with self.assertRaises(ValueError):
            money.yuan_to_fen('1e99')

    def test_parse_fen_accepts_nonnegative_int(self):
        self.assertEqual(money.parse_fen(0), 0)
        self.assertEqual(money.parse_fen(1234), 1234)
        self.assertEqual(money.parse_fen(money.MAX_FEN), money.MAX_FEN)

    def test_parse_fen_rejects_everything_else(self):
        for bad in (None, True, False, 1.5, '100', -1, money.MAX_FEN + 1):
            with self.assertRaises(ValueError, msg=f"应拒绝 {bad!r}"):
                money.parse_fen(bad)

    def test_fen_to_yuan_display(self):
        self.assertEqual(money.fen_to_yuan(350), '3.50')
        self.assertEqual(money.fen_to_yuan(0), '0.00')
        self.assertEqual(money.fen_to_yuan(5), '0.05')

    def test_quote_exposes_unified_fields_and_invariant(self):
        result = pricing.quote([{'unitPriceFen': 300, 'quantity': 6}], {'cord': 1, 'gift': True})
        self.assertEqual(result['subtotalFen'], 4800)
        self.assertEqual(result['shippingFen'], 800)
        self.assertEqual(result['discountFen'], 0)
        self.assertEqual(result['payableFen'], 5600)
        # 不变量：payableFen = subtotalFen + shippingFen - discountFen
        self.assertEqual(result['payableFen'],
                         result['subtotalFen'] + result['shippingFen'] - result['discountFen'])
        # totalFen 作为兼容别名等于 payableFen
        self.assertEqual(result['totalFen'], result['payableFen'])

    def test_validate_amounts_invariant_and_bounds(self):
        # 合法：payable = subtotal + shipping - discount，paid/refund 不越界
        amounts = money.validate_order_amounts(4800, 800, 0, 5600, 5600, 100)
        self.assertEqual(amounts['payableFen'], 5600)
        self.assertEqual(amounts['refundFen'], 100)
        # 不变量破坏
        with self.assertRaises(ValueError):
            money.validate_order_amounts(4800, 800, 0, 5601, 0, 0)
        # paidFen 超过 payableFen
        with self.assertRaises(ValueError):
            money.validate_order_amounts(4800, 800, 0, 5600, 5601, 0)
        # 累计 refundFen 超过 paidFen
        with self.assertRaises(ValueError):
            money.validate_order_amounts(4800, 800, 0, 5600, 1000, 1001)

    def test_normalize_order_amounts_legacy_compat(self):
        # 旧订单：只有 goodsFen/shipFen/totalFen（旧 user_api 写入格式）
        amounts = money.normalize_order_amounts({'goodsFen': 1800, 'shipFen': 800, 'totalFen': 5600})
        self.assertEqual(amounts['subtotalFen'], 4800)
        self.assertEqual(amounts['shippingFen'], 800)
        self.assertEqual(amounts['discountFen'], 0)
        self.assertEqual(amounts['payableFen'], 5600)
        # 更旧订单：只有浮点元字段 total/ship
        amounts = money.normalize_order_amounts({'total': 56.0, 'ship': 8.0})
        self.assertEqual(amounts['payableFen'], 5600)
        self.assertEqual(amounts['shippingFen'], 800)
        self.assertEqual(amounts['subtotalFen'], 4800)
        # 新订单：新字段优先，不被旧字段干扰
        amounts = money.normalize_order_amounts({
            'subtotalFen': 4800, 'shippingFen': 800, 'discountFen': 0,
            'payableFen': 5600, 'paidFen': 0, 'refundFen': 0,
            'totalFen': 9999, 'shipFen': 9999})
        self.assertEqual(amounts['payableFen'], 5600)
        self.assertEqual(amounts['shippingFen'], 800)


if __name__ == '__main__':
    unittest.main()
