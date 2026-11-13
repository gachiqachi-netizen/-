import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import commerce
import content_security
import user_api


class GiftTest(unittest.TestCase):
    @staticmethod
    def quote(bead, gift_box=False):
        goods = round(bead['price'] * 100) * 6
        sub = goods + 1500 + (1000 if gift_box else 0)
        return {'totalFen': sub + (0 if sub >= 9900 else 800), 'items': [{'id': bead['id'], 'unitPriceFen': round(bead['price'] * 100), 'mm': bead['mm']}]}

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, 'test.db'))
        self.bead = self.db.list('beads')[0]

    def tearDown(self):
        content_security.set_checker(None)
        self.db.conn.close()
        self.tmp.cleanup()

    def _order(self, gift, request_id='gift-order-0000001', quote_gift=False):
        req = {'requestId': request_id, 'name': '送礼', 'beads': [self.bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址',
               'gift': gift, 'confirmedQuote': self.quote(self.bead, quote_gift)}
        return user_api.make_order(self.db, req, 'u1')

    def test_bool_gift_normalized_to_dict(self):
        order = self._order(True, quote_gift=True)
        raw = self.db.get('orders', order['no'])
        self.assertEqual(raw['gift'], {'box': True, 'card': '', 'hidePrice': False})
        self.assertTrue(raw['designSnapshot']['gift'])

    def test_dict_gift_stored_and_shown_on_work_order(self):
        gift = {'box': True, 'card': '生日快乐，岁岁平安', 'hidePrice': True}
        order = self._order(gift, quote_gift=True)
        raw = self.db.get('orders', order['no'])
        self.assertEqual(raw['gift'], gift)
        wo = commerce.build_work_order(raw, db=self.db)
        self.assertEqual(wo['giftCard'], '生日快乐，岁岁平安')
        self.assertTrue(wo['hidePrice'])
        self.assertTrue(wo['gift'])

    def test_gift_false_no_fee(self):
        order = self._order(False)
        raw = self.db.get('orders', order['no'])
        self.assertEqual(raw['gift'], {'box': False, 'card': '', 'hidePrice': False})
        wo = commerce.build_work_order(raw, db=self.db)
        self.assertEqual(wo['giftCard'], '')
        self.assertFalse(wo['hidePrice'])
        self.assertFalse(wo['gift'])

    def test_card_over_50_chars_rejected(self):
        with self.assertRaises(ValueError):
            self._order({'box': True, 'card': 'x' * 51, 'hidePrice': False})

    def test_card_content_checked(self):
        content_security.set_checker(lambda text: False)
        with self.assertRaises(content_security.ContentRejected):
            self._order({'box': True, 'card': '触发拦截', 'hidePrice': False})

    def test_invalid_gift_values_rejected(self):
        with self.assertRaises(ValueError):
            self._order('yes')
        with self.assertRaises(ValueError):
            self._order({'box': 'yes', 'card': '', 'hidePrice': False}, request_id='gift-order-0000002')
        with self.assertRaises(ValueError):
            self._order({'box': True, 'card': 123, 'hidePrice': False}, request_id='gift-order-0000003')


if __name__ == '__main__':
    unittest.main()
