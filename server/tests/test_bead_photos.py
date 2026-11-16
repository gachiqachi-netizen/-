"""V5 单珠照片按料共用、图片验收和质检成品照。"""
import base64
import io
import os
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from PIL import Image
from routes import bead_photos


class MemoryDB:
    def __init__(self):
        self.rows = {'beads': {
            'b6': {'name': '白水晶', 'mm': 6},
            'b8': {'name': '白水晶', 'mm': 8},
            'b9': {'name': '黑曜石', 'mm': 8},
        }, 'orders': {'O1': {'workOrder': {}}}, 'after_sales': {'A1': {'reworkOrder': {'workOrderNo': 'RWO1'}}},
                     'uploads': {}, 'audit_logs': {}}

    def get(self, table, rid):
        row = self.rows[table].get(rid)
        return {'id': rid, **row} if row is not None else None

    def list(self, table):
        return [self.get(table, rid) for rid in self.rows[table]]

    def put(self, table, rid, doc):
        self.rows[table][rid] = {key: value for key, value in doc.items() if key != 'id'}
        return self.get(table, rid)


def payload(size=800, background='white', center=True, fmt='PNG'):
    mode = 'RGBA' if background == 'transparent' else 'RGB'
    bg = (255, 255, 255, 0) if mode == 'RGBA' else (255, 255, 255)
    width, height = (size, size) if isinstance(size, int) else size
    img = Image.new(mode, (width, height), bg)
    size = min(width, height)
    if center:
        from PIL import ImageDraw
        ImageDraw.Draw(img).ellipse((size // 8, size // 8, size * 7 // 8, size * 7 // 8), fill=(70, 50, 30, 255) if mode == 'RGBA' else (70, 50, 30))
    output = io.BytesIO()
    img.save(output, fmt)
    return {'filename': 'bead.' + ('jpg' if fmt == 'JPEG' else 'png'),
            'contentType': 'image/jpeg' if fmt == 'JPEG' else 'image/png',
            'data': base64.b64encode(output.getvalue()).decode()}


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

    def test_same_name_sizes_share_photo_and_audit(self):
        code, result = bead_photos.upload_bead_photo(self.ctx, self.match('b6'), payload())
        self.assertEqual(code, 200)
        self.assertEqual(result['count'], 2)
        self.assertEqual(self.db.get('beads', 'b6')['photo'], result['photo'])
        self.assertEqual(self.db.get('beads', 'b8')['photo'], result['photo'])
        self.assertNotIn('photo', self.db.get('beads', 'b9'))
        self.assertEqual(len(self.db.list('audit_logs')), 1)

    def test_accepts_jpeg_and_transparent_png(self):
        for image in (payload(fmt='JPEG'), payload(background='transparent')):
            self.assertEqual(bead_photos.upload_bead_photo(self.ctx, self.match('b6'), image)[0], 200)

    def test_rejects_size_background_and_empty_center(self):
        for image, message in ((payload(600), '800×800'), (payload((900, 800)), '正方形'), (payload(center=False), '中央')):
            with self.subTest(message=message), self.assertRaisesRegex(ValueError, message):
                bead_photos.upload_bead_photo(self.ctx, self.match('b6'), image)
        dark = payload()
        raw = base64.b64decode(dark['data'])
        image = Image.open(io.BytesIO(raw))
        image.putpixel((0, 0), (0, 0, 0))
        out = io.BytesIO(); image.save(out, 'PNG')
        dark['data'] = base64.b64encode(out.getvalue()).decode()
        with self.assertRaisesRegex(ValueError, '四角'):
            bead_photos.upload_bead_photo(self.ctx, self.match('b6'), dark)
        self.assertEqual(len(self.db.list('uploads')), 0)

    def test_finished_photo_saved_to_work_order(self):
        with patch.object(bead_photos.commerce, 'get_work_order', return_value={'workOrderNo': 'WO1'}):
            code, result = bead_photos.upload_finished_photo(self.ctx, self.match('orders', 'O1'), payload())
        self.assertEqual(code, 200)
        self.assertEqual(self.db.get('orders', 'O1')['workOrder']['finishedPhoto'], result['finishedPhoto'])
        self.assertEqual(bead_photos.finished_photo(self.ctx, self.match('orders', 'O1'), None)[1], result)
        code, result = bead_photos.upload_finished_photo(self.ctx, self.match('after-sales', 'A1'), payload())
        self.assertEqual(code, 200)
        self.assertEqual(self.db.get('after_sales', 'A1')['reworkOrder']['finishedPhoto'], result['finishedPhoto'])
