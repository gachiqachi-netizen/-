"""B-9 拍照识别：置信度和失败原因（整理函数，模型用假 Provider 代替）"""
import sys
import os
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import ai  # noqa: E402

BEADS = [
    {"id": "a", "name": "粉晶", "mm": 8, "mat": "crystal", "price": 3, "tags": []},
    {"id": "b", "name": "白水晶", "mm": 8, "mat": "crystal", "price": 2, "tags": []},
    {"id": "m", "name": "银隔片", "mm": 6, "mat": "metal", "price": 1, "tags": []},
]


def photo_with(payload):
    class Provider:
        name = "fake"

        def json(self, prompt, schema, image=None):
            return payload

    with mock.patch.object(ai, "provider", return_value=Provider()):
        return ai.photo(BEADS, None)


class PhotoConfidenceTest(unittest.TestCase):
    def test_识别结果带每种珠子的confidence(self):
        out = photo_with({"ok": True, "seen": "粉色主珠配银隔片", "main": "a", "accent": "b", "metal": "m",
                          "every": 4, "mainConfidence": 0.85, "accentConfidence": 0.4, "metalConfidence": 0.9})
        self.assertTrue(out["ok"])
        self.assertEqual({"main": 0.85, "accent": 0.4, "metal": 0.9}, out["confidence"])

    def test_模型给不出confidence就是null不编(self):
        out = photo_with({"ok": True, "seen": "粉色主珠", "main": "a", "accent": "", "metal": "",
                          "every": 4})
        self.assertIsNone(out["confidence"]["main"])
        self.assertIsNone(out["confidence"]["accent"])
        self.assertIsNone(out["confidence"]["metal"])

    def test_乱给的confidence不采信(self):
        for bad in ("0.9", 1.5, -0.2, True):
            out = photo_with({"ok": True, "seen": "粉色主珠", "main": "a", "accent": "", "metal": "",
                              "every": 4, "mainConfidence": bad})
            self.assertIsNone(out["confidence"]["main"], f"confidence={bad!r} 应被丢弃")

    def test_没识别出来的珠子不带confidence(self):
        out = photo_with({"ok": True, "seen": "粉色主珠", "main": "a", "accent": "", "metal": "",
                          "every": 4, "mainConfidence": 0.8, "accentConfidence": 0.9})
        self.assertEqual(0.8, out["confidence"]["main"])
        self.assertIsNone(out["confidence"]["accent"])

    def test_整体失败带模型给的reason(self):
        out = photo_with({"ok": False, "seen": "", "main": "", "accent": "", "metal": "",
                          "every": 4, "reason": "dark"})
        self.assertFalse(out["ok"])
        self.assertEqual("dark", out["reason"])

    def test_ok为false但没给reason按原意归no_bracelet(self):
        out = photo_with({"ok": False, "seen": "", "main": "", "accent": "", "metal": "", "every": 4})
        self.assertFalse(out["ok"])
        self.assertEqual("no_bracelet", out["reason"])

    def test_认不出料包珠子整体失败不再抛错(self):
        out = photo_with({"ok": True, "seen": "一种没见过的石头", "main": "invented-id", "accent": "",
                          "metal": "", "every": 4, "mainConfidence": 0.3})
        self.assertFalse(out["ok"])
        self.assertEqual("unknown_beads", out["reason"])


if __name__ == "__main__":
    unittest.main()
