import os
import sys
import tempfile
import time
import threading
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import user_api

class UserAPITest(unittest.TestCase):
    @staticmethod
    def quote(bead):
        goods = round(bead['price'] * 100) * 6
        sub = goods + 1500
        return {'totalFen': sub + (0 if sub >= 9900 else 800), 'items': [{'id': bead['id'], 'unitPriceFen': round(bead['price'] * 100), 'mm': bead['mm']}]}
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, 'test.db'))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    def test_login_fails_closed_without_credentials(self):
        with patch.dict(os.environ, {'WECHAT_APP_ID': '', 'WECHAT_APP_SECRET': ''}):
            self.assertEqual(user_api.login(self.db, 'abc')[0], 503)

    def test_session_uses_hash_and_expires(self):
        token = 'a' * 43
        self.db.put('sessions', user_api.token_hash(token), {'userId': 'u1', 'expiresAt': time.time() + 60})
        self.assertEqual(user_api.owner(self.db, 'Bearer ' + token), 'u1')
        self.assertIsNone(user_api.owner(self.db, 'Bearer ' + 'b' * 43))
        self.db.put('sessions', user_api.token_hash(token), {'userId': 'u1', 'expiresAt': time.time() - 1})
        self.assertIsNone(user_api.owner(self.db, 'Bearer ' + token))

    def test_owner_index_logout_and_expired_session_cleanup(self):
        self.db.put('designs', 'a', {'userId': 'u1', 'name': '甲'})
        self.db.put('designs', 'b', {'userId': 'u2', 'name': '乙'})
        self.assertEqual([row['id'] for row in self.db.list_by_owner('designs', 'u1')], ['a'])
        token = 'c' * 43
        key = user_api.token_hash(token)
        self.db.put('sessions', key, {'userId': 'u1', 'expiresAt': time.time() + 60})
        self.assertTrue(user_api.logout(self.db, 'Bearer ' + token))
        self.assertIsNone(user_api.owner(self.db, 'Bearer ' + token))
        self.db.put('sessions', 'expired', {'userId': 'u1', 'expiresAt': time.time() - 1})
        self.db.put('sessions', 'active', {'userId': 'u1', 'expiresAt': time.time() + 60})
        self.assertEqual(user_api.cleanup_sessions(self.db), 1)
        self.assertIsNone(self.db.get('sessions', 'expired'))
        self.assertIsNotNone(self.db.get('sessions', 'active'))

    def test_share_is_random_private_snapshot(self):
        d = {'name': '测试', 'wrist': 15, 'beads': ['a', 'b'], 'phone': '13800138000', 'userId': 'exposed'}
        one = user_api.create_share(self.db, d, 'owner')['shareId']
        two = user_api.create_share(self.db, d, 'owner')['shareId']
        self.assertNotEqual(one, two)
        self.assertEqual(user_api.read_share(self.db, one), {'name': '测试', 'wrist': 15, 'beads': ['a', 'b']})
        self.assertIsNone(user_api.read_share(self.db, 'bad'))
        self.assertIsNone(user_api.read_share(self.db, 'a' * 43))

    def test_share_keeps_reflow_metadata(self):
        data = {'name': '测试', 'wrist': 15, 'beads': ['a'] * 17, 'pattern': ['a'], 'special': [], 'tail': [], 'meaning': '祝福'}
        share_id = user_api.create_share(self.db, data, 'owner')['shareId']
        shared = user_api.read_share(self.db, share_id)
        self.assertEqual(shared['pattern'], ['a'])
        self.assertEqual(shared['meaning'], '祝福')
        self.assertNotIn('fixed', shared)

    def test_order_snapshots_and_pending_payment(self):
        b = self.db.list('beads')[0]
        req = {'requestId': 'test-order-00000001', 'name': '测试', 'beads': [b['id']] * 6, 'wrist': 15, 'person': '测试', 'phone': '13800138000', 'addr': '测试地址', 'confirmedQuote': self.quote(b)}
        order = user_api.make_order(self.db, req, 'u1')
        self.assertEqual(order['status'], '待支付')
        self.assertFalse(order['paymentAvailable'])
        self.assertEqual(len(order['items']), 6)
        self.assertNotIn('userId', order)
        b['onSale'] = False
        self.db.put('beads', b['id'], b)
        self.assertEqual(user_api.make_order(self.db, req, 'u1')['no'], order['no'])
        with self.assertRaises(user_api.IdempotencyConflict):
            user_api.make_order(self.db, {**req, 'name': '不同设计'}, 'u1')
        with self.assertRaises(ValueError):
            user_api.make_order(self.db, {**req, 'requestId': 'test-order-00000002'}, 'u1')
        saved = self.db.get('orders', order['no'])
        self.assertEqual(saved['items'][0]['name'], b['name'])

    def test_toxic_materials_keep_real_knowledge_warnings(self):
        for kid in ('yuanbao', 'zhusha'):
            bead = self.db.list('beads')[0]
            bead['kb'] = kid
            self.db.put('beads', bead['id'], bead)
            req = {'requestId': 'safety-real-' + kid, 'beads': [bead['id']] * 6,
                   'wrist': 15, 'person': '测试', 'phone': '1' + '0' * 10,
                   'addr': '测试占位', 'confirmedQuote': self.quote(bead)}
            saved = user_api.make_order(self.db, req, 'test-owner')['items'][0]
            self.assertEqual(saved['kb'], kid)
            self.assertTrue(saved['safety'])
            self.assertTrue(saved['meaning'])

    def test_order_material_knowledge_snapshot_is_frozen(self):
        b = self.db.list('beads')[0]
        req = {'requestId': 'safety-snapshot-001', 'name': '测试', 'beads': [b['id']] * 6,
               'wrist': 15, 'person': '测试', 'phone': '1' + '0' * 10, 'addr': '测试占位',
               'confirmedQuote': self.quote(b)}
        knowledge = {**b, 'kb': 'test-material', 'points': ['圆珠', '红色'],
                     'meaning': '寓意美好', 'summary': '材料说明', 'safety': '不可入口'}
        with patch.object(user_api.kb, 'enrich', return_value=knowledge):
            order = user_api.make_order(self.db, req, 'u-safety')
        knowledge['points'].append('新说明')
        knowledge['safety'] = '已修改'
        saved = self.db.get('orders', order['no'])['items'][0]
        self.assertEqual(saved['kb'], 'test-material')
        self.assertEqual(saved['points'], ['圆珠', '红色'])
        self.assertEqual(saved['safety'], '不可入口')
        self.assertEqual(saved['meaning'], '寓意美好')
        self.assertEqual(saved['summary'], '材料说明')
        self.assertEqual(saved['unitPriceFen'], round(b['price'] * 100))

    def test_order_idempotency_across_connections(self):
        bead = self.db.list('beads')[0]
        req = {'requestId': 'concurrent-order-01', 'beads': [bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址', 'confirmedQuote': self.quote(bead)}
        other = DB(os.path.join(self.tmp.name, 'test.db'))
        barrier = threading.Barrier(2)
        results = []
        def create(db):
            barrier.wait()
            results.append(user_api.make_order(db, req, 'u1'))
        a = threading.Thread(target=create, args=(self.db,))
        b = threading.Thread(target=create, args=(other,))
        a.start(); b.start(); a.join(); b.join()
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['no'], results[1]['no'])
        self.assertEqual(len(self.db.list('orders')), 1)
        self.assertNotEqual(user_api.make_order(self.db, req, 'u2')['no'], results[0]['no'])
        other.conn.close()

    def test_first_order_discount_is_unavailable_until_payment_integrated(self):
        bead = self.db.list('beads')[0]
        req = {'requestId': 'first-order-000001', 'beads': [bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址', 'confirmedQuote': self.quote(bead)}
        discounted = {**req, 'confirmedQuote': {**req['confirmedQuote'], 'totalFen': req['confirmedQuote']['totalFen'] - 1000}}
        with self.assertRaises(user_api.PriceChanged):
            user_api.make_order(self.db, discounted, 'u1')
        self.assertEqual(self.db.list('orders'), [])
        first = user_api.make_order(self.db, req, 'u1')
        second = user_api.make_order(self.db, {**req, 'requestId': 'first-order-000002'}, 'u1')
        for order in (first, second):
            self.assertEqual(order['promo'], 0)
            self.assertEqual(order['promotion']['firstOrder'], {'available': False, 'discountFen': 0, 'reason': 'payment_not_integrated'})
        self.assertEqual(user_api.make_order(self.db, req, 'u1')['no'], first['no'])

    def test_changed_quote_cannot_create_order(self):
        bead = self.db.list('beads')[0]
        req = {'requestId': 'quote-test-000001', 'beads': [bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址', 'confirmedQuote': self.quote(bead)}
        bead['price'] += 1
        self.db.put('beads', bead['id'], bead)
        with self.assertRaises(user_api.PriceChanged):
            user_api.make_order(self.db, req, 'u1')
        self.assertEqual(self.db.list('orders'), [])

    def test_order_uses_price_fen_over_stale_display_price(self):
        bead = self.db.list('beads')[0]
        bead['priceFen'] = 101
        bead['price'] = 999
        self.db.put('beads', bead['id'], bead)
        unit_prices = [{'unitPriceFen': 101} for _ in range(6)]
        import pricing
        quote = pricing.quote(unit_prices)
        quote['items'] = [{'id': bead['id'], 'unitPriceFen': 101, 'mm': bead['mm']}]
        req = {'requestId': 'fen-authority-0001', 'beads': [bead['id']] * 6, 'wrist': 15,
               'person': '测试', 'phone': '13800138000', 'addr': '测试地址',
               'confirmedQuote': quote}
        order = user_api.make_order(self.db, req, 'u1')
        self.assertEqual(order['items'][0]['unitPriceFen'], 101)
        self.assertEqual(order['items'][0]['priceFen'], 101)

    def test_catalog_rechecked_during_order_transaction(self):
        bead = self.db.list('beads')[0]
        old = {'id': bead['id'], 'name': bead['name'], 'mm': bead['mm'], 'price': bead['price'], 'photo': bead.get('photo')}
        bead['price'] += 1
        self.db.put('beads', bead['id'], bead)
        state, _ = self.db.idempotent_order('race', 'fingerprint', {'no': 'racing', 'items': [old]})
        self.assertEqual(state, 'price_changed')
        self.assertEqual(self.db.list('orders'), [])

    def test_design_input(self):
        self.assertEqual(user_api.design_data({'beads':['zt8'], 'wrist':15}, 'u1')['userId'], 'u1')
        with self.assertRaises(ValueError):
            user_api.design_data({'beads':['zt8'], 'wrist':1}, 'u1')

    def test_design_template_metadata_and_legacy_update(self):
        rid = 'b' * 32
        original = user_api.design_data({'name': '模板', 'beads': ['a', 'b'], 'wrist': 15,
                                         'pattern': ['a', 'b'], 'special': ['c'], 'tail': [],
                                         'fixed': 18, 'source': 'tpl', 'tplId': 't1', 'meaning': '祝福', 'edited': False}, 'u1')
        self.db.put('designs', rid, original)
        legacy = user_api.design_data({'name': '更名', 'beads': ['a'], 'wrist': 16}, 'u1')
        status, saved = self.db.update_design_if_version(rid, 'u1', original['updatedAt'], legacy)
        self.assertEqual(status, 'updated')
        self.assertEqual(saved['pattern'], ['a', 'b'])
        self.assertEqual(saved['fixed'], 18)
        self.assertEqual(saved['meaning'], '祝福')
        clear = user_api.design_data({'name': '自由创作', 'beads': ['a'], 'wrist': 16, 'pattern': [], 'fixed': None}, 'u1')
        status, saved = self.db.update_design_if_version(rid, 'u1', saved['updatedAt'], clear)
        self.assertEqual(status, 'updated')
        self.assertEqual(saved['pattern'], [])
        self.assertIsNone(saved['fixed'])
        for invalid in ({'pattern': ['a', 3]}, {'fixed': True}, {'fixed': 501}, {'edited': 'yes'}):
            with self.assertRaises(ValueError):
                user_api.design_data({'name': '模板', 'beads': ['a'], 'wrist': 15, **invalid}, 'u1')

    def test_concurrent_design_updates_do_not_overwrite(self):
        rid = 'a' * 32
        original = user_api.design_data({'name': '原设计', 'beads': ['zt8'], 'wrist': 15}, 'u1')
        self.db.put('designs', rid, original)
        other = DB(os.path.join(self.tmp.name, 'test.db'))
        barrier = threading.Barrier(2)
        results = []
        def update(db, name):
            candidate = user_api.design_data({'name': name, 'beads': ['zt8'], 'wrist': 15}, 'u1')
            barrier.wait()
            results.append(db.update_design_if_version(rid, 'u1', original['updatedAt'], candidate))
        a = threading.Thread(target=update, args=(self.db, '设备一'))
        b = threading.Thread(target=update, args=(other, '设备二'))
        a.start(); b.start(); a.join(); b.join()
        self.assertEqual(sorted(r[0] for r in results), ['conflict', 'updated'])
        saved = self.db.get('designs', rid)
        self.assertGreater(saved['updatedAt'], original['updatedAt'])
        self.assertIn(saved['name'], ('设备一', '设备二'))
        self.assertEqual(other.update_design_if_version(rid, 'u2', saved['updatedAt'], saved)[0], 'missing')
        other.conn.close()

if __name__ == '__main__':
    unittest.main()
