"""B-11a 地址簿的归属、上限、默认地址与输入检查。"""
import os
import re
import sys
import unittest
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import app
import addresses
from db import DB
from routes import addresses as address_routes


def payload(number=0, default=False):
    return {"person": "测试收货人", "phone": "13900000000", "region": ["测试省", "测试市", "测试区"],
            "detail": f"测试路 {number} 号", "isDefault": default}


class AddressTests(unittest.TestCase):
    def setUp(self):
        self.db = DB(":memory:")
        self.alice = SimpleNamespace(db=self.db, user_id="alice")
        self.bob = SimpleNamespace(db=self.db, user_id="bob")

    def tearDown(self):
        self.db.conn.close()

    def test_all_four_routes_require_user(self):
        expected = {("GET", "/api/my/addresses"), ("POST", "/api/my/addresses"),
                    ("PUT", "/api/my/addresses"), ("DELETE", "/api/my/addresses"),
                    ("PUT", "/api/my/addresses/" + "a" * 32),
                    ("DELETE", "/api/my/addresses/" + "a" * 32)}
        for method, path in expected:
            self.assertTrue(any(m == method and auth == "user" and pattern.fullmatch(path)
                                for m, pattern, _, auth in app.ROUTE_TABLE))

    def test_create_list_update_delete_and_owner_isolation(self):
        code, row = address_routes.create_address(self.alice, None, payload())
        self.assertEqual(code, 201)
        self.assertTrue(row["isDefault"])
        self.assertEqual(address_routes.list_addresses(self.alice, None, None)[1]["addresses"][0]["id"], row["id"])
        self.assertEqual(address_routes.list_addresses(self.bob, None, None)[1]["addresses"], [])
        match = re.fullmatch(r"/api/my/addresses/([a-f0-9]{32})", "/api/my/addresses/" + row["id"])
        with self.assertRaises(KeyError):
            address_routes.update_address(self.bob, match, {"detail": "别人的地址"})
        with self.assertRaises(KeyError):
            address_routes.delete_address(self.bob, match, None)
        code, changed = address_routes.update_address(self.alice, match, {"detail": "新测试路 2 号"})
        self.assertEqual((code, changed["detail"]), (200, "新测试路 2 号"))
        self.assertEqual(address_routes.delete_address(self.alice, match, None), (200, {"ok": True}))
        self.assertEqual(addresses.list_for(self.db, "alice"), [])

    def test_collection_put_and_delete_accept_id(self):
        row = addresses.create(self.db, "alice", payload())
        match = re.fullmatch(r"/api/my/addresses", "/api/my/addresses")
        self.assertEqual(address_routes.update_address(self.alice, match,
                         {"id": row["id"], "detail": "新测试路"})[1]["detail"], "新测试路")
        self.alice.qs = {"id": [row["id"]]}
        self.assertEqual(address_routes.delete_address(self.alice, match, None), (200, {"ok": True}))

    def test_setting_default_clears_previous(self):
        first = addresses.create(self.db, "alice", payload(1))
        second = addresses.create(self.db, "alice", payload(2, default=True))
        self.assertFalse(self.db.get("addresses", first["id"])["isDefault"])
        self.assertTrue(self.db.get("addresses", second["id"])["isDefault"])

    def test_max_twenty_per_user(self):
        for number in range(20):
            addresses.create(self.db, "alice", payload(number))
        with self.assertRaisesRegex(ValueError, "20"):
            addresses.create(self.db, "alice", payload(21))
        self.assertEqual(len(addresses.list_for(self.db, "alice")), 20)
        self.assertEqual(len(addresses.list_for(self.db, "bob")), 0)

    def test_phone_and_required_fields_are_checked(self):
        bad = payload()
        bad["phone"] = "123"
        with self.assertRaisesRegex(ValueError, "手机号"):
            addresses.create(self.db, "alice", bad)
        bad = payload()
        bad["region"] = []
        with self.assertRaisesRegex(ValueError, "地区"):
            addresses.create(self.db, "alice", bad)
