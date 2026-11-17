"""V9 template cover upload and persistence."""
import base64
import os
import struct
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import commerce
from db import DB
from routes import uploads as route


def jpeg(size):
    raw = b'\xff\xd8\xff\xc0\x00\x0b\x08' + struct.pack('>HH', size, size) + b'\x03\x01\x11\x00\xff\xd9'
    return {'filename': 'cover.jpg', 'contentType': 'image/jpeg', 'width': size,
            'height': size, 'data': base64.b64encode(raw).decode()}


class TemplateCoverTests(unittest.TestCase):
    def test_upload_dimensions_format_and_public_paths(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {'UPLOADS_DIR': directory}):
            images = {key: jpeg(size) for key, size in {'lg': 1080, 'md': 540, 'sm': 240}.items()}
            ctx = SimpleNamespace(db=None)
            status, result = route.upload_template_cover(ctx, None, {'images': images})
            self.assertEqual(status, 200)
            for url in result['cover'].values():
                self.assertTrue(os.path.isfile(os.path.join(directory, url.rsplit('/', 1)[-1])))
            images['md']['width'] = 539
            with self.assertRaisesRegex(ValueError, '宽高'):
                route.upload_template_cover(ctx, None, {'images': images})
            images['md'] = {**jpeg(540), 'contentType': 'image/png'}
            with self.assertRaisesRegex(ValueError, '格式'):
                route.upload_template_cover(ctx, None, {'images': images})

    def test_save_and_remove_cover_audited(self):
        with tempfile.TemporaryDirectory() as directory:
            db = DB(os.path.join(directory, 'test.db'))
            bead = db.list('beads')[0]
            base = {'name': '测试模板', 'pattern': [bead['id']], 'status': 'draft'}
            cover = {key: '/uploads/test-' + key + '.jpg' for key in ('lg', 'md', 'sm')}
            created = commerce.create_template(db, {**base, 'cover': cover})
            self.assertEqual(created['cover'], cover)
            commerce.update_template(db, created['id'], {**base, 'cover': ''})
            self.assertEqual(db.get('templates', created['id'])['cover'], '')
            self.assertTrue(any(row.get('action') == 'update_cover' for row in db.list('audit_logs')))
            with self.assertRaisesRegex(ValueError, '封面'):
                commerce.update_template(db, created['id'], {**base, 'cover': {'lg': '/uploads/a.jpg'}})
            db.conn.close()
