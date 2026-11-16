import os
import sys
import threading
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import commerce
import user_api
from bead_visual import PLACEHOLDER_COLORS, visual_of
from db import DB


class BeadVisualTest(unittest.TestCase):
    def setUp(self):
        self.db = DB(':memory:')
        self.bead = next(bead for bead in self.db.list('beads') if bead.get('c'))

    def tearDown(self):
        self.db.conn.close()

    def test_visual_of_returns_stable_fields_and_missing_values(self):
        self.assertEqual(visual_of(self.bead)['colors'], self.bead['c'][:2])
        self.assertEqual(visual_of({'id': 'old'}), {
            'id': 'old', 'name': None, 'mm': None, 'spacer': None,
            'mat': None, 'colors': [None, None], 'photo': None,
            'photoMd': None, 'photoSm': None,
        })

    def test_visual_sizes_are_frozen_in_order_snapshot(self):
        bead = dict(self.bead, photo='/480.png', photoMd='/240.png', photoSm='/96.png')
        self.db.put('beads', bead['id'], bead)
        unit = user_api.bead_price_fen(bead)
        goods = unit * 6
        total = goods + 1500 + (0 if goods + 1500 >= 9900 else 800)
        order = user_api.make_order(self.db, {
            'requestId': 'visual-sizes-00001', 'beads': [bead['id']] * 6,
            'wrist': 15, 'person': '测试', 'phone': '10000000000', 'addr': '测试地址',
            'gift': False, 'confirmedQuote': {'totalFen': total, 'items': [
                {'id': bead['id'], 'unitPriceFen': unit, 'mm': bead['mm']}]},
        }, 'owner')
        frozen = self.db.get('orders', order['no'])['designSnapshot']['sequence'][0]
        self.assertEqual([frozen[k] for k in ('photo', 'photoMd', 'photoSm')],
                         ['/480.png', '/240.png', '/96.png'])
        self.db.put('beads', bead['id'], dict(bead, photo='/new.png', photoMd='/new-md.png'))
        self.assertEqual(commerce.build_design_snapshot(self.db, self.db.get('orders', order['no']))['sequence'][0]['photoMd'], '/240.png')

    def test_order_snapshot_keeps_colors_after_product_changes(self):
        bead = self.bead
        unit = user_api.bead_price_fen(bead)
        goods = unit * 6
        total = goods + 1500 + (0 if goods + 1500 >= 9900 else 800)
        order = user_api.make_order(self.db, {
            'requestId': 'visual-order-00001', 'name': '测试手串',
            'beads': [bead['id']] * 6, 'wrist': 15,
            'person': '测试', 'phone': '10000000000', 'addr': '测试地址',
            'gift': False, 'confirmedQuote': {'totalFen': total, 'items': [
                {'id': bead['id'], 'unitPriceFen': unit, 'mm': bead['mm']}]},
        }, 'owner')
        saved = self.db.get('orders', order['no'])
        self.assertTrue(all(item['colors'] == bead['c'][:2]
                            for item in saved['designSnapshot']['sequence']))
        original = list(saved['designSnapshot']['sequence'][0]['colors'])
        changed = dict(bead, c=['#123456', '#654321'], photo='/new-photo.png')
        self.db.put('beads', bead['id'], changed)
        self.assertEqual(commerce.build_design_snapshot(self.db, saved)['sequence'][0]['colors'], original)
        self.assertNotEqual(original, changed['c'])

    def test_order_snapshot_with_catalog_lock_uses_frozen_colors(self):
        bead = self.bead
        frozen = dict(bead, priceFen=user_api.bead_price_fen(bead))
        result, errors = [], []

        def make_snapshot():
            try:
                result.append(commerce.build_design_snapshot(
                    self.db, {'beads': [bead['id']] * 6, 'wrist': 15},
                    frozen_items=[frozen] * 6))
            except Exception as error:
                errors.append(error)

        worker = threading.Thread(target=make_snapshot, daemon=True)
        self.db.lock.acquire()  # 另一个请求正在读写商品目录
        try:
            worker.start()
            worker.join(1)
            self.assertFalse(worker.is_alive(), '冻结快照不应等待商品目录锁')
        finally:
            self.db.lock.release()
            worker.join(1)
        self.assertFalse(errors)
        self.assertTrue(all(item['colors'] == bead['c'][:2]
                            for item in result[0]['sequence']))

    def test_old_order_fills_visual_from_catalog_and_missing_product_is_gray(self):
        legacy = {'designSnapshot': {'sequence': [
            {'seq': 1, 'id': self.bead['id'], 'mm': self.bead['mm']},
            {'seq': 2, 'id': 'missing', 'mm': 4},
        ], 'materials': []}}
        restored = commerce.build_design_snapshot(self.db, legacy)
        self.assertEqual(restored['sequence'][0]['colors'], self.bead['c'][:2])
        self.assertEqual(restored['sequence'][1]['colors'], list(PLACEHOLDER_COLORS))
        self.assertNotIn('colors', legacy['designSnapshot']['sequence'][0])

    def test_share_freezes_visual_and_old_share_falls_back(self):
        bead = self.bead
        token = user_api.create_share(self.db, {
            'name': '测试手串', 'beads': [bead['id']], 'wrist': 15,
        }, 'owner')['shareId']
        stored = self.db.get('shares', token)
        self.assertEqual(stored['visual'][0]['colors'], bead['c'][:2])
        self.db.put('beads', bead['id'], dict(bead, c=['#123456', '#654321']))
        self.assertEqual(user_api.read_share(self.db, token)['visual'][0]['colors'], bead['c'][:2])

        old_token = 'o' * 43
        self.db.put('shares', old_token, {'name': '旧分享', 'beads': [bead['id'], 'missing']})
        legacy = user_api.read_share(self.db, old_token)['visual']
        self.assertEqual(legacy[0]['colors'], ['#123456', '#654321'])
        self.assertEqual(legacy[1]['colors'], list(PLACEHOLDER_COLORS))


if __name__ == '__main__':
    unittest.main()
