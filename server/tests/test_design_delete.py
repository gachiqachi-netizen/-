"""B-11c 作品删除：软删除、只能删自己的、分享落地页随之不可见。"""
import os
import sys
import unittest
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import app
import user_api
from db import DB
from routes import designs as design_routes

OWNER, OTHER = "user-owner", "user-other"


def design_payload(name="我的手串"):
    return {"name": name, "beads": ["b1", "b2", "b3", "b4", "b5", "b6"],
            "wrist": 15, "source": "ai", "tplId": "t1"}


class DesignDeleteTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(":memory:")
        self.db.put("users", OWNER, {"createdAt": 1})
        self.db.put("users", OTHER, {"createdAt": 2})

    def tearDown(self):
        self.db.conn.close()

    def ctx(self, uid):
        return SimpleNamespace(db=self.db, user_id=uid, admin=False, qs={})

    def create_design(self, owner=OWNER, name="我的手串"):
        doc = design_payload(name)
        doc["userId"] = owner
        self.db.put("designs", "d" * 32, doc)
        return self.db.get("designs", "d" * 32)

    def delete(self, uid=OWNER):
        return design_routes.delete(self.ctx(uid), _match(), None)

    # ---- 路由与基本行为 ----
    def test_route_is_loaded(self):
        self.assertTrue(any(m == "DELETE" and p.fullmatch("/api/designs/" + "a" * 32)
                            for m, p, _, _ in app.ROUTE_TABLE))

    def test_owner_delete_soft_deletes(self):
        self.create_design()
        code, body = self.delete()
        self.assertEqual((code, body), (200, {"ok": True}))
        saved = self.db.get("designs", "d" * 32)
        self.assertIn("deletedAt", saved)            # 记录还在，只是标了 deletedAt
        self.assertEqual(saved["beads"], ["b1", "b2", "b3", "b4", "b5", "b6"])  # 内容没丢

    def test_other_user_cannot_delete(self):
        self.create_design()
        with self.assertRaises(KeyError):
            self.delete(OTHER)

    def test_missing_design_is_404(self):
        with self.assertRaises(KeyError):
            design_routes.delete(self.ctx(OWNER), _match("e" * 32), None)

    def test_delete_twice_is_404(self):
        self.create_design()
        self.delete()
        with self.assertRaises(KeyError):
            self.delete()   # 已删除的按不存在处理

    # ---- 分享落地页 ----
    def test_deleted_design_share_disappears(self):
        self.create_design()
        share = user_api.create_share(self.db, design_payload(), OWNER)
        self.assertIsNotNone(user_api.read_share(self.db, share["shareId"]))
        self.delete()
        self.assertIsNone(user_api.read_share(self.db, share["shareId"]))

    def test_other_design_share_still_readable(self):
        self.create_design(name="我的手串")
        share = user_api.create_share(self.db, design_payload(), OWNER)
        self.db.put("designs", "f" * 32, {**design_payload(name="别的手串"), "userId": OTHER})
        design_routes.delete(self.ctx(OTHER), _match("f" * 32), None)
        self.assertIsNotNone(user_api.read_share(self.db, share["shareId"]))

    def test_taken_down_share_still_hidden_after_change(self):
        share = user_api.create_share(self.db, design_payload(), OWNER)
        doc = self.db.get("shares", share["shareId"])
        doc["takenDownAt"] = 1
        self.db.put("shares", share["shareId"], doc)
        self.assertIsNone(user_api.read_share(self.db, share["shareId"]))


def _match(did="d" * 32):
    import re
    return re.fullmatch(r"/api/designs/([a-f0-9]{32})", "/api/designs/" + did)


if __name__ == "__main__":
    unittest.main()
