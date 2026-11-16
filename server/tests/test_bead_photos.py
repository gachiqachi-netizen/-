"""V5 三尺寸单珠照片、文件头验收和成品照。无需图片库。"""
import base64
import os
import struct
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from routes import bead_photos


class MemoryDB:
    def __init__(self):
        self.rows = {'beads': {
            'b6': {'name': '白水晶', 'mm': 6},
            'b8': {'name': '白水晶', 'mm': 8},
            'b9': {'name': '黑曜石', 'mm': 8},
        }, 'orders': {'O1': {'workOrder': {}}},
            'after_sales': {'A1': {'reworkOrder': {'workOrderNo': 'RWO1'}}},
            'uploads': {}, 'audit_logs': {}}

    def get(self, table, rid):
        row = self.rows[table].get(rid)
        return {'id': rid, **row} if row is not None else None

    def list(self, table):
        return [self.get(table, rid) for rid in self.rows[table]]

    def put(self, table, rid, doc):
        self.rows[table][rid] = {key: value for key, value in doc.items() if key != 'id'}
        return self.get(table, rid)


def png(size, width=None, raw=None):
    if raw is None:
        raw = (b'\x89PNG\r\n\x1a\n' + struct.pack('>I', 13) + b'IHDR'
               + struct.pack('>II', width or size, size) + b'\x08\x06\x00\x00\x00' + b'\x00\x00\x00\x00')
    return {'filename': 'bead.png', 'contentType': 'image/png', 'width': size, 'height': size,
            'data': base64.b64encode(raw).decode()}


def jpg(size):
    raw = b'\xff\xd8\xff\xc0\x00\x0b\x08' + struct.pack('>HH', size, size) + b'\x03\x01\x11\x00\xff\xd9'
    return {'filename': 'bead.jpg', 'contentType': 'image/jpeg', 'width': size, 'height': size,
            'data': base64.b64encode(raw).decode()}


def images():
    return {'images': {field: png(size) for field, size in bead_photos.SIZES.items()}}


class BeadPhotoTests(unittest.TestCase):
    def setUp(self):
        self.db = MemoryDB()
        self.tmp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {'UPLOADS_DIR': self.tmp.name, 'PUBLIC_BASE_URL': ''})
        self.env.start()
        self.ctx = SimpleNamespace(db=self.db, admin=True, user_id=None, qs={})

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def match(self, *values):
        return SimpleNamespace(group=lambda n: values[n - 1])

    def test_routes_require_permissions(self):
        self.assertIn(('edit_products', '/api/admin/beads/([\\w-]+)/photo'),
                      [(auth, pattern) for _, pattern, _, auth in bead_photos.ROUTES])
        self.assertTrue(all(auth in ('edit_products', 'quality_gate', 'view_work_orders') for _, _, _, auth in bead_photos.ROUTES))

    def test_all_three_sizes_saved_for_same_name_and_audit(self):
        code, result = bead_photos.upload_bead_photo(self.ctx, self.match('b6'), images())
        self.assertEqual(code, 200)
        self.assertEqual(result['count'], 2)
        for field in bead_photos.SIZES:
            self.assertEqual(self.db.get('beads', 'b6')[field], result[field])
            self.assertEqual(self.db.get('beads', 'b8')[field], result[field])
            self.assertNotIn(field, self.db.get('beads', 'b9'))
        self.assertEqual(len(self.db.list('audit_logs')), 1)

    def test_standard_library_header_accepts_jpeg_and_rejects_wrong_dimensions(self):
        self.assertEqual(bead_photos._image(jpg(480), 480)[0:2], b'\xff\xd8')
        bad = images(); bad['images']['photoMd'] = png(240, width=241)
        with self.assertRaisesRegex(ValueError, '宽高'):
            bead_photos.upload_bead_photo(self.ctx, self.match('b6'), bad)
        self.assertEqual(len(self.db.list('uploads')), 0)

    def test_rejects_format_size_and_missing_variant(self):
        bad = images(); bad['images']['photoSm']['contentType'] = 'image/jpeg'
        with self.assertRaisesRegex(ValueError, '格式'):
            bead_photos.upload_bead_photo(self.ctx, self.match('b6'), bad)
        bad = images(); bad['images']['photoSm'] = png(95)
        with self.assertRaisesRegex(ValueError, '96×96'):
            bead_photos.upload_bead_photo(self.ctx, self.match('b6'), bad)
        bad = images(); bad['images'].pop('photoMd')
        with self.assertRaisesRegex(ValueError, '三种尺寸'):
            bead_photos.upload_bead_photo(self.ctx, self.match('b6'), bad)

    def test_rejects_over_one_megabyte(self):
        bad = images(); bad['images']['photo'] = png(480, raw=b'\x89PNG\r\n\x1a\n' + b'x' * (1024 * 1024))
        with self.assertRaisesRegex(ValueError, '1MB'):
            bead_photos.upload_bead_photo(self.ctx, self.match('b6'), bad)

    def test_finished_photo_saved_to_work_order(self):
        with patch.object(bead_photos.commerce, 'get_work_order', return_value={'workOrderNo': 'WO1'}):
            code, result = bead_photos.upload_finished_photo(self.ctx, self.match('orders', 'O1'), png(800))
        self.assertEqual(code, 200)
        self.assertEqual(self.db.get('orders', 'O1')['workOrder']['finishedPhoto'], result['finishedPhoto'])
        self.assertEqual(bead_photos.finished_photo(self.ctx, self.match('orders', 'O1'), None)[1], result)
        code, result = bead_photos.upload_finished_photo(self.ctx, self.match('after-sales', 'A1'), png(800))
        self.assertEqual(code, 200)
        self.assertEqual(self.db.get('after_sales', 'A1')['reworkOrder']['finishedPhoto'], result['finishedPhoto'])
