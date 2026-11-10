import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import pricing


class PricingTest(unittest.TestCase):
    def test_quote_and_public_config_share_one_integer_fen_rule(self):
        items = [{'unitPriceFen': 300, 'quantity': 6}]
        result = pricing.quote(items, {'cord': 1, 'gift': True})
        self.assertEqual(result, {
            'goodsFen': 1800,
            'handworkFen': 1500,
            'cordFen': 500,
            'giftFen': 1000,
            'subtotalFen': 4800,
            'shippingFen': 800,
            'discountFen': 0,
            'payableFen': 5600,
            'totalFen': 5600,
        })
        self.assertEqual(pricing.public_config(), {
            'handworkFen': 1500,
            'cordFen': 500,
            'giftFen': 1000,
            'freeShippingThresholdFen': 9900,
            'shippingFen': 800,
        })

    def test_free_shipping_threshold_uses_subtotal_before_shipping(self):
        result = pricing.quote([{'unitPriceFen': 8400, 'quantity': 1}], {'gift': False, 'cord': 0})
        self.assertEqual(result['shippingFen'], 0)
        self.assertEqual(result['totalFen'], 9900)

    def test_prices_must_be_integer_fen(self):
        with self.assertRaises(ValueError):
            pricing.quote([{'unitPriceFen': 1.5, 'quantity': 1}], {})

