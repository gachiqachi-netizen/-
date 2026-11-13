"""B-11c 作品删除：软删除、只能删自己的、列表不返回、带 designId 的分享随作品删除而隐藏。"""
import base64
import http.client
import os
import re
import sys
import tempfile
import threading
import time
import unittest
from http.server import ThreadingHTTPServer
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import app
import user_api
from db import DB
from routes import designs as design_routes
from user_api import token_hash

OWNER, OTHER = "user-owner", "user-other"
DID = "d" * 32


def design_payload(name="我的手串"):
    return {"name": name, "beads": ["b1", "b2", "b3", "b4", "b5", "b6"],
            "wrist": 15, "source": "ai", "tplId": "t1"}


def match(did=DID):
    return re.fullmatch(r"/api/designs/([a-f0-9]{32})", "/api/designs/" + did)


class DesignDeleteTests(unittest.TestCase):
    """逻辑层：删除路由 + create_share/read_share 的 designId 语义。"""

    def setUp(self):
        self.db = DB(":memory:")
        self.db.put("users", OWNER, {"createdAt": 1})
        self.db.put("users", OTHER, {"createdAt": 2})

    def tearDown(self):
        self.db.conn.close()

    def ctx(self, uid):
        return SimpleNamespace(db=self.db, user_id=uid, admin=False, qs={})

    def create_design(self, owner=OWNER, did=DID, name="我的手串"):
        doc = design_payload(name)
        doc["userId"] = owner
        self.db.put("designs", did, doc)
        return self.db.get("designs", did)

    # ---- 路由与基本行为 ----
    def test_route_is_loaded(self):
        self.assertTrue(any(m == "DELETE" and p.fullmatch("/api/designs/" + "a" * 32)
                            for m, p, _, _ in app.ROUTE_TABLE))

    def test_owner_delete_soft_deletes(self):
        self.create_design()
        code, body = design_routes.delete(self.ctx(OWNER), match(), None)
        self.assertEqual((code, body), (200, {"ok": True}))
        saved = self.db.get("designs", DID)
        self.assertIn("deletedAt", saved)            # 记录还在，只是标了 deletedAt
        self.assertEqual(saved["beads"], ["b1", "b2", "b3", "b4", "b5", "b6"])  # 内容没丢

    def test_other_user_cannot_delete(self):
        self.create_design()
        with self.assertRaises(KeyError):
            design_routes.delete(self.ctx(OTHER), match(), None)

    def test_missing_design_is_404(self):
        with self.assertRaises(KeyError):
            design_routes.delete(self.ctx(OWNER), match("e" * 32), None)

    def test_delete_twice_is_404(self):
        self.create_design()
        design_routes.delete(self.ctx(OWNER), match(), None)
        with self.assertRaises(KeyError):
            design_routes.delete(self.ctx(OWNER), match(), None)

    def test_delete_does_not_touch_shares(self):
        """删除只标作品，分享表原样（隐藏由 read_share 按 designId 判断）。"""
        self.create_design()
        share = user_api.create_share(self.db, {**design_payload(), "id": DID}, OWNER)
        design_routes.delete(self.ctx(OWNER), match(), None)
        self.assertNotIn("deletedAt", self.db.get("shares", share["shareId"]))

    # ---- 分享与 designId ----
    def test_deleted_design_share_disappears(self):
        self.create_design()
        share = user_api.create_share(self.db, {**design_payload(), "id": DID}, OWNER)
        self.assertEqual(self.db.get("shares", share["shareId"]).get("designId"), DID)
        self.assertIsNotNone(user_api.read_share(self.db, share["shareId"]))
        design_routes.delete(self.ctx(OWNER), match(), None)
        self.assertIsNone(user_api.read_share(self.db, share["shareId"]))

    def test_identical_share_from_other_user_still_readable(self):
        """别人一模一样的分享照常能看（不做内容匹配）。"""
        self.create_design()
        other_share = user_api.create_share(self.db, design_payload(), OTHER)
        self.create_design(did="f" * 32, owner=OTHER)
        my_share = user_api.create_share(self.db, {**design_payload(), "id": DID}, OWNER)
        design_routes.delete(self.ctx(OWNER), match(), None)
        self.assertIsNone(user_api.read_share(self.db, my_share["shareId"]))
        self.assertIsNotNone(user_api.read_share(self.db, other_share["shareId"]))

    def test_legacy_share_without_designId_not_hidden(self):
        """旧分享没有 designId，作品删了也不隐藏。"""
        self.create_design()
        legacy = user_api.create_share(self.db, design_payload(), OWNER)   # 不带 id
        self.assertNotIn("designId", self.db.get("shares", legacy["shareId"]))
        design_routes.delete(self.ctx(OWNER), match(), None)
        self.assertIsNotNone(user_api.read_share(self.db, legacy["shareId"]))

    def test_share_deleted_design_is_rejected(self):
        self.create_design()
        design_routes.delete(self.ctx(OWNER), match(), None)
        with self.assertRaises(KeyError):
            user_api.create_share(self.db, {**design_payload(), "id": DID}, OWNER)

    def test_share_other_users_design_is_rejected(self):
        self.create_design(owner=OTHER, did="f" * 32)
        with self.assertRaises(KeyError):
            user_api.create_share(self.db, {**design_payload(), "id": "f" * 32}, OWNER)

    def test_taken_down_share_still_hidden(self):
        share = user_api.create_share(self.db, design_payload(), OWNER)
        doc = self.db.get("shares", share["shareId"])
        doc["takenDownAt"] = 1
        self.db.put("shares", share["shareId"], doc)
        self.assertIsNone(user_api.read_share(self.db, share["shareId"]))


class DesignDeleteHttpTests(unittest.TestCase):
    """HTTP 层：删除走注册表（app.py 旧硬删块已删），列表过滤 deletedAt，分享落地页 404。"""

    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.original_db = app.db
        from db import DB as _DB
        app.db = _DB(os.path.join(cls.temp.name, "http.db"))
        for uid, tok in [(OWNER, "o" * 43), (OTHER, "s" * 43)]:
            app.db.put("sessions", token_hash(tok), {"userId": uid, "expiresAt": time.time() + 600})
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        app.db.conn.close()
        app.db = cls.original_db
        cls.temp.cleanup()

    def req(self, method, path, token=None):
        conn = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        headers = {"Authorization": "Bearer " + token} if token else {}
        conn.request(method, path, headers=headers)
        resp = conn.getresponse()
        body = resp.read()
        conn.close()
        return resp.status, body

    def create_design(self, owner=OWNER, name="我的手串"):
        doc = design_payload(name)
        doc["userId"] = owner
        app.db.put("designs", DID, doc)
        return app.db.get("designs", DID)

    def test_delete_endpoints(self):
        self.create_design()
        # 未登录 401
        self.assertEqual(self.req("DELETE", "/api/designs/" + DID)[0], 401)
        # 别人 404
        self.assertEqual(self.req("DELETE", "/api/designs/" + DID, token="s" * 43)[0], 404)
        # 本人 200，且是软删除
        self.assertEqual(self.req("DELETE", "/api/designs/" + DID, token="o" * 43)[0], 200)
        saved = app.db.get("designs", DID)
        self.assertIn("deletedAt", saved)
        # 再删 404
        self.assertEqual(self.req("DELETE", "/api/designs/" + DID, token="o" * 43)[0], 404)

    def test_list_hides_deleted(self):
        self.create_design(name="留着的")
        app.db.put("designs", "c" * 32, {**design_payload(name="删掉的"), "userId": OWNER,
                                         "deletedAt": int(time.time())})
        status, body = self.req("GET", "/api/designs", token="o" * 43)
        self.assertEqual(status, 200)
        import json
        names = [row["name"] for row in json.loads(body)]
        self.assertIn("留着的", names)
        self.assertNotIn("删掉的", names)

    def test_share_page_404_after_design_deleted(self):
        self.create_design()
        share = user_api.create_share(app.db, {**design_payload(), "id": DID}, OWNER)
        path = "/api/shares/" + share["shareId"]
        self.assertEqual(self.req("GET", path)[0], 200)
        self.req("DELETE", "/api/designs/" + DID, token="o" * 43)
        self.assertEqual(self.req("GET", path)[0], 404)


if __name__ == "__main__":
    unittest.main()
