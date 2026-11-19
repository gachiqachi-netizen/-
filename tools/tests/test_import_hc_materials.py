import csv
import hashlib
import os
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from import_hc_materials import run
from import_beads import open_database


class FakeDB:
    def __init__(self):
        self.items = []

    def list(self, name):
        return self.items

    def get(self, name, id):
        return None


class ImportHcTest(unittest.TestCase):
    def test_preview_images_and_duplicate(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            material = base / "materials_export"
            images = material / "images"
            images.mkdir(parents=True)
            out = base / "uploads"
            for i, size in enumerate(((100, 100), (100, 100), (80, 300)), 1):
                im = Image.new("RGBA", size, "white" if i == 2 else (0, 0, 0, 0))
                draw = ImageDraw.Draw(im)
                draw.ellipse((25, 25, 65, 65), fill="blue")
                if i == 2:
                    draw.ellipse((40, 40, 45, 45), fill="white")
                im.save(images / f"{i}.png")
            with (material / "materials_summary.csv").open("w", encoding="utf-8", newline="") as stream:
                writer = csv.writer(stream)
                writer.writerow(["名称", "长(mm)", "宽(mm)", "重量(g)", "价格(元)", "简介", "详情", "图片文件名"])
                for i, mm in enumerate((6, 8, 10), 1):
                    writer.writerow(["蓝月光", mm, mm, 1, "12.34", "禁止文案", "禁止详情", f"{i}.png"])
            db = FakeDB()
            groups = run(material, out, db, output=lambda _: None)
            def processed(i):
                digest = hashlib.sha256((images / f"{i}.png").read_bytes()).hexdigest()[:20]
                return out / f"hc-{digest}.png"
            self.assertEqual(len(groups["将新增"]), 3)
            self.assertEqual(db.items, [])
            with Image.open(processed(1)) as cropped:
                self.assertLess(cropped.width, 100)
            white = Image.open(processed(2)).convert("RGBA")
            self.assertEqual(white.getpixel((0, 0))[3], 0)
            self.assertTrue(any(white.getpixel((x, y))[:3] == (255, 255, 255)
                                and white.getpixel((x, y))[3] == 255
                                for y in range(white.height) for x in range(white.width)))
            with Image.open(processed(3)) as pendant:
                self.assertLessEqual(max(pendant.size), 512)
            self.assertEqual(len(run(material, out, db, output=lambda _: None)["将新增"]), 3)
            old = os.environ.get("DATABASE_PATH")
            os.environ["DATABASE_PATH"] = str(base / "test.sqlite3")
            try:
                real_db = open_database()
                self.assertEqual(len(run(material, out, real_db, apply=True, output=lambda _: None)["将新增"]), 3)
                saved = real_db.list("beads")
                self.assertEqual({item["mm"] for item in saved}, {6, 8, 10})
                self.assertTrue(all(item["priceFen"] == 1234 for item in saved))
                self.assertTrue(all(item["photo"].startswith("/uploads/") for item in saved))
                self.assertTrue(all("禁止" not in str(item) for item in saved))
                self.assertEqual(len(run(material, out, real_db, apply=True, output=lambda _: None)["跳过"]), 3)
            finally:
                if old is None:
                    os.environ.pop("DATABASE_PATH", None)
                else:
                    os.environ["DATABASE_PATH"] = old
