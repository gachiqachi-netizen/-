"""Only a shipped owner's order detail exposes the finished photo URL."""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import user_api


class CustomerQcPhotoTest(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.folder.name, 'v6.db'))
        self.order = {
            'no': 'V6-ORDER', 'userId': 'owner-a', 'name': '演示手串', 'beads': ['b1'],
            'orderStatus': 'confirmed', 'paymentStatus': 'paid',
            'fulfillmentStatus': 'producing', 'afterSaleStatus': 'none', 'logisticsStatus': 'not_shipped',
            'workOrder': {'finishedPhoto': '/api/uploads/qc-photo.png', 'assignee': '内部师傅', 'note': '内部备注'},
            'qualityGate': {'inspector': '质检员', 'note': '内部质检记录'},
        }

    def tearDown(self):
        self.db.conn.close()
        self.folder.cleanup()

    def detail(self):
        self.db.put('orders', self.order['no'], self.order)
        return user_api.get_my_order(self.db, self.order['no'], 'owner-a')

    def test_photo_hidden_before_shipping_and_internal_fields_never_return(self):
        detail = self.detail()
        self.assertEqual(detail['qcPhotos'], [])
        for field in ('workOrder', 'qualityGate', 'assignee', 'inspector'):
            self.assertNotIn(field, detail)
        with self.assertRaises(KeyError):
            user_api.get_my_order(self.db, self.order['no'], 'someone-else')

    def test_photo_visible_after_shipping_and_missing_photo_is_empty(self):
        self.order.update(fulfillmentStatus='shipped', logisticsStatus='shipped')
        detail = self.detail()
        self.assertEqual(detail['qcPhotos'], ['/api/uploads/qc-photo.png'])
        self.assertNotIn('workOrder', detail)
        self.order['fulfillmentStatus'] = 'delivered'
        self.assertEqual(self.detail()['qcPhotos'], ['/api/uploads/qc-photo.png'])
        self.order['workOrder'].pop('finishedPhoto')
        self.assertEqual(self.detail()['qcPhotos'], [])
