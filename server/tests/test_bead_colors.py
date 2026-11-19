"""B-22 local color extraction and database patch rules."""
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
sys.path.insert(0, str(ROOT / 'server'))
import bead_colors
import patch_beads
from db import DB
from PIL import Image, ImageDraw


def jpeg(background, center=None):
    image = Image.new('RGB', (96, 96), background)
    if center:
        ImageDraw.Draw(image).ellipse((15, 15, 81, 81), fill=center)
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG')
    return buffer.getvalue()


class BeadColorsTest(unittest.TestCase):
    def test_solid_photo(self):
        colors = bead_colors.photo_color(jpeg('#639379'))
        expected = bead_colors.shade('#639379')
        self.assertTrue(all(abs(int(actual[i:i+2], 16) - int(reference[i:i+2], 16)) <= 2
                            for actual, reference in zip(colors, expected) for i in (1, 3, 5)))

    def test_white_background_center_color(self):
        colors = bead_colors.photo_color(jpeg('white', '#a35672'))
        self.assertIsNotNone(colors)
        self.assertGreater(int(colors[0][1:3], 16), int(colors[0][3:5], 16))

    def test_near_black_empty_photo_falls_back(self):
        self.assertIsNone(bead_colors.photo_color(jpeg('#101010')))
        self.assertEqual(bead_colors.process({'id': 'x', 'name': '海蓝宝', 'photoSm': ''}, 'https://example.test/')[0]['source'], 'name')

    def test_name_palette_and_metal(self):
        for name in ('粉晶', '紫晶', '海蓝宝', '月光石', '曜石', '发晶', '草莓晶', '茶晶', '银珠'):
            self.assertEqual(len(bead_colors.name_color(name)), 2)
        self.assertNotEqual(bead_colors.name_color('金珠', 'metal'), bead_colors.name_color('银珠', 'metal'))


class PatchBeadsTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.db = DB(str(Path(temporary.name) / 'beads.sqlite3'))
        self.addCleanup(self.db.conn.close)
        self.rid = self.db.list('beads')[0]['id']
        bead = self.db.get('beads', self.rid)
        bead.pop('c', None)
        bead.pop('kb', None)
        self.db.put('beads', self.rid, bead)
        self.rows = [{'id': self.rid, 'c': ['#aabbcc', '#112233'], 'source': 'photo'}]

    def test_preview_does_not_write_then_apply_fills(self):
        self.assertEqual(patch_beads.load(self.db, self.rows, output=lambda _: None)['filled'], 1)
        self.assertNotIn('c', self.db.get('beads', self.rid))
        self.assertEqual(patch_beads.load(self.db, self.rows, apply=True, output=lambda _: None)['filled'], 1)
        self.assertEqual(self.db.get('beads', self.rid)['c'], self.rows[0]['c'])

    def test_existing_value_stays_and_repeat_skips(self):
        patch_beads.load(self.db, self.rows, apply=True, output=lambda _: None)
        self.assertEqual(patch_beads.load(self.db, self.rows, apply=True, output=lambda _: None)['skipped'], 1)
        self.assertEqual(self.db.get('beads', self.rid)['c'], self.rows[0]['c'])
        kb_row = [{'id': self.rid, 'kb': 'mila'}]
        self.db.put('beads', self.rid, {**self.db.get('beads', self.rid), 'kb': 'custom'})
        patch_beads.load(self.db, kb_row, apply=True, output=lambda _: None)
        self.assertEqual(self.db.get('beads', self.rid)['kb'], 'custom')

    def test_reject_unknown_field_and_duplicate_id(self):
        with self.assertRaises(ValueError):
            patch_beads.load(self.db, [{'id': self.rid, 'priceFen': 1}], apply=True)
        with self.assertRaises(ValueError):
            patch_beads.load(self.db, self.rows * 2, apply=True)

    def test_missing_id_is_reported_not_written(self):
        output = []
        counts = patch_beads.load(self.db, [{'id': 'missing', 'kb': 'mila'}], apply=True, output=output.append)
        self.assertEqual(counts['missing'], 1)
        self.assertIsNone(self.db.get('beads', 'missing'))
        self.assertTrue(any('id 不存在' in line for line in output))
