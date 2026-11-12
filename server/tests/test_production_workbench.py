"""生产工作台三大模块单元测试与 HTTP 路由契约测试：
1. 模板工作台（Template Workbench）：模板配方（special/pattern/tail/fixed）与展开设计（编号珠序、总长、合手度、物料清单 BOM）
2. 订单/条款后台（Orders & Terms Admin）：规则适用范围（global / productIds / templateIds / scenarios）与下单条款快照冻结
3. 生产做单与快照（Production Work Order, Design Snapshot & Quality Gate）：
   - 下单冻结完整设计快照（编号珠序、SKU、尺寸、数量、手围、客户备注），后续商品/模板修改绝不改写快照
   - 生产工单生成与更新（负责人、工序、进度、备注），严禁自行替换用料或篡改珠序
   - 质检关口（珠序、尺寸、用料、外观四项检查记录），质检不通过时不得进入待发货（ready_to_ship）或发货（shipped）
"""
import io
import json
import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app
import commerce
import user_api
from db import DB
from user_api import token_hash


class ProductionWorkbenchTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, "workbench.db"))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    def _quote_for_beads(self, beads_seq, cord=0, gift=False):
        bead_map = {b["id"]: b for b in self.db.list("beads")}
        goods = sum(user_api.bead_price_fen(bead_map[bid]) for bid in beads_seq)
        sub = goods + 1500 + (500 if cord == 1 else 0) + (1000 if gift else 0)
        ship = 0 if sub >= 9900 else 800
        uniq = []
        seen = set()
        for bid in beads_seq:
            if bid not in seen:
                seen.add(bid)
                uniq.append({
                    "id": bid,
                    "unitPriceFen": user_api.bead_price_fen(bead_map[bid]),
                    "mm": bead_map[bid]["mm"],
                })
        return {"totalFen": sub + ship, "items": uniq}

    def _set_paid(self, no):
        order = self.db.get("orders", no)
        order["paymentStatus"] = "paid"
        order["paidFen"] = order.get("totalFen", 0)
        self.db.put("orders", no, order)

    def test_template_recipe_expansion_and_bom(self):
        beads = [b for b in self.db.list("beads") if b.get("onSale", True) and not b.get("spacer")]
        b1, b2 = beads[0], beads[1]
        tpl = commerce.create_template(self.db, {
            "id": "tpl-wb-01",
            "name": "测试配方",
            "meaning": "平安喜乐",
            "special": [b1["id"]],
            "pattern": [b1["id"], b2["id"]],
            "tail": [b2["id"]],
            "status": "on_sale",
        })
        self.assertEqual(tpl["recipe"]["special"], [b1["id"]])
        self.assertEqual(tpl["recipe"]["pattern"], [b1["id"], b2["id"]])
        self.assertIsNotNone(tpl["expandedPreview"])

        exp15 = commerce.expand_template_recipe(self.db, tpl, wrist=15)
        exp18 = commerce.expand_template_recipe(self.db, tpl, wrist=18)
        self.assertGreater(exp18["count"], exp15["count"])
        self.assertEqual(exp15["sequence"][0]["id"], b1["id"])
        self.assertEqual(exp15["sequence"][0]["seq"], 1)
        self.assertEqual(exp15["sequence"][-1]["id"], b2["id"])
        self.assertEqual(sum(m["count"] for m in exp15["materials"]), exp15["count"])
        self.assertEqual(exp15["totalFen"], exp15["goodsFen"] + 1500)

        rosary = commerce.expand_template_recipe(self.db, {
            "special": [b1["id"]],
            "pattern": [b2["id"]],
            "tail": [],
            "fixed": 108,
        }, wrist=14)
        self.assertEqual(rosary["count"], 108)
        self.assertTrue(rosary["isRosary"])
        self.assertTrue(rosary["fitOk"])

    def test_scoped_terms_filtering_and_snapshot_freeze(self):
        beads = [b for b in self.db.list("beads") if b.get("onSale", True) and not b.get("spacer")]
        b_target, b_other = beads[0], beads[1]
        for t in self.db.list("terms"):
            self.db.delete("terms", t["id"])

        commerce.create_term(self.db, {
            "id": "term-global",
            "title": "全局售前须知",
            "type": "售前说明",
            "version": "1.0.0",
            "body": "所有订单均适用",
            "status": "published",
            "scope": {"mode": "global"},
        })
        commerce.create_term(self.db, {
            "id": "term-prod",
            "title": "特定木珠养护说明",
            "type": "天然材料差异说明",
            "version": "1.1.0",
            "body": "仅特定珠子适用",
            "status": "published",
            "scope": {"mode": "scoped", "productIds": [b_target["id"]], "templateIds": [], "scenarios": []},
        })
        commerce.create_term(self.db, {
            "id": "term-tpl",
            "title": "指定模板定制说明",
            "type": "定制商品说明",
            "version": "1.0.0",
            "body": "仅模板 tpl-special 适用",
            "status": "published",
            "scope": {"mode": "scoped", "productIds": [], "templateIds": ["tpl-special"], "scenarios": []},
        })
        commerce.create_term(self.db, {
            "id": "term-gift",
            "title": "礼盒包装说明",
            "type": "发货与物流说明",
            "version": "1.0.0",
            "body": "仅礼盒订单适用",
            "status": "published",
            "scope": {"mode": "scoped", "productIds": [], "templateIds": [], "scenarios": ["gift"]},
        })

        with self.assertRaises(ValueError):
            commerce.create_term(self.db, {
                "id": "term-empty-scope",
                "title": "空范围条款",
                "type": "售前说明",
                "version": "1.0.0",
                "body": "不应创建成功",
                "status": "published",
                "scope": {"mode": "scoped", "productIds": [], "templateIds": [], "scenarios": []},
            })

        seq1 = [b_other["id"]] * 6
        order1 = user_api.make_order(self.db, {
            "requestId": "req-scoped-term-0001",
            "name": "普通单",
            "beads": seq1,
            "wrist": 15,
            "gift": False,
            "cord": 0,
            "person": "张三",
            "phone": "13800138000",
            "addr": "南京市玄武区",
            "confirmedQuote": self._quote_for_beads(seq1, cord=0, gift=False),
        }, "u1")
        titles1 = [t["title"] for t in order1["termsSnapshot"]]
        self.assertEqual(titles1, ["全局售前须知"])

        seq2 = [b_target["id"]] * 6
        order2 = user_api.make_order(self.db, {
            "requestId": "req-scoped-term-0002",
            "name": "全命中单",
            "beads": seq2,
            "wrist": 16,
            "gift": True,
            "cord": 0,
            "tplId": "tpl-special",
            "customerNote": "请挑纹路对称的珠子",
            "person": "李四",
            "phone": "13900139000",
            "addr": "北京市朝阳区",
            "confirmedQuote": self._quote_for_beads(seq2, cord=0, gift=True),
        }, "u1")
        titles2 = [t["title"] for t in order2["termsSnapshot"]]
        self.assertEqual(set(titles2), {"全局售前须知", "特定木珠养护说明", "指定模板定制说明", "礼盒包装说明"})

    def test_design_snapshot_work_order_and_quality_gate(self):
        beads = [b for b in self.db.list("beads") if b.get("onSale", True) and not b.get("spacer")]
        b1, b2 = beads[0], beads[1]
        seq = [b1["id"], b2["id"], b1["id"], b2["id"], b1["id"], b2["id"]]
        order = user_api.make_order(self.db, {
            "requestId": "req-workorder-qc-0001",
            "name": "快照测试手串",
            "beads": seq,
            "wrist": 15.5,
            "customerNote": "绳结藏在第二颗珠孔内",
            "tplId": "tpl-demo",
            "person": "王五",
            "phone": "13700137000",
            "addr": "上海市徐汇区",
            "confirmedQuote": self._quote_for_beads(seq),
        }, "u1")
        no = order["no"]
        orig_b1_name = b1["name"]

        commerce.update_product(self.db, b1["id"], {
            **b1,
            "name": "改名后的珠子",
            "legal": b1.get("legal") or "合法来源证书-2026",
            "price": b1["price"] + 10,
            "priceFen": user_api.bead_price_fen(b1) + 1000,
            "status": "on_sale",
        })
        detail = commerce.order_detail(self.db, no)
        snap = detail["designSnapshot"]
        self.assertEqual(snap["customerNote"], "绳结藏在第二颗珠孔内")
        self.assertEqual(snap["wrist"], 15.5)
        self.assertEqual(len(snap["sequence"]), 6)
        self.assertEqual(snap["sequence"][0]["name"], orig_b1_name)
        self.assertEqual(snap["materials"][0]["count"], 3)
        self.assertEqual(snap["materials"][0]["positions"], [1, 3, 5])

        for forbidden_payload in (
            {"materials": []},
            {"sequence": []},
            {"replaceMaterial": b2["id"]},
            {"beads": [b2["id"]] * 6},
        ):
            with self.assertRaises(ValueError):
                commerce.update_work_order(self.db, no, forbidden_payload)

        self._set_paid(no)
        commerce.transition_order_status(self.db, no, "fulfillmentStatus", "producing")
        wo = commerce.update_work_order(self.db, no, {
            "assignee": "陈师傅",
            "step": "穿制打结",
            "progress": 80,
            "operatorNote": "已配齐全部珠子",
        })
        self.assertEqual(wo["assignee"], "陈师傅")
        self.assertEqual(wo["progress"], 80)
        self.assertFalse(wo["allowMaterialSubstitution"])

        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, "fulfillmentStatus", "ready_to_ship")

        failed_detail = commerce.record_quality_gate(self.db, no, {
            "sequenceOk": True,
            "sizeOk": True,
            "materialOk": True,
            "appearanceOk": False,
            "inspector": "质检小李",
            "note": "第 3 颗珠子孔道有微裂，需同批次更换重检",
        })
        self.assertFalse(failed_detail["qualityGate"]["passed"])
        self.assertEqual(failed_detail["workOrder"]["status"], "qc_failed")
        self.assertNotIn("ready_to_ship", failed_detail["allowedTransitions"]["fulfillmentStatus"])
        with self.assertRaises(ValueError):
            commerce.transition_order_status(self.db, no, "fulfillmentStatus", "ready_to_ship")

        passed_detail = commerce.record_quality_gate(self.db, no, {
            "sequenceOk": True,
            "sizeOk": True,
            "materialOk": True,
            "appearanceOk": True,
            "inspector": "质检小李",
            "note": "复检全部合格",
        })
        self.assertTrue(passed_detail["qualityGate"]["passed"])
        self.assertEqual(passed_detail["workOrder"]["status"], "qc_passed")
        self.assertIn("ready_to_ship", passed_detail["allowedTransitions"]["fulfillmentStatus"])

        ready_order = commerce.transition_order_status(self.db, no, "fulfillmentStatus", "ready_to_ship")
        self.assertEqual(ready_order["fulfillmentStatus"], "ready_to_ship")


class ProductionWorkbenchHandlerTest(unittest.TestCase):
    """直接驱动 app.Handler 验证新后台接口（无需绑定本机端口，兼容沙盒环境）。"""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.original_db, self.original_token, self.original_audit = app.db, app.ADMIN_TOKEN, app.ADMIN_AUDIT_PATH
        app.db = DB(os.path.join(self.temp.name, "wb_handler.db"))
        app.ADMIN_TOKEN = "wb-admin-secret"
        app.ADMIN_AUDIT_PATH = os.path.join(self.temp.name, "admin-audit.jsonl")
        app.db.put("sessions", token_hash("u" * 43), {"userId": "wb-user", "expiresAt": time.time() + 300})

    def tearDown(self):
        app.db.conn.close()
        app.db, app.ADMIN_TOKEN, app.ADMIN_AUDIT_PATH = self.original_db, self.original_token, self.original_audit
        self.temp.cleanup()

    def call_handler(self, path, method="GET", data=None, admin=False, token=None):
        raw_body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data is not None else b""
        headers = {}
        if admin:
            headers["X-Admin-Token"] = "wb-admin-secret"
        if token:
            headers["Authorization"] = "Bearer " + token
        if data is not None:
            headers["Content-Type"] = "application/json"
            headers["Content-Length"] = str(len(raw_body))

        handler = app.Handler.__new__(app.Handler)
        handler.path = path
        handler.command = method
        handler.headers = headers
        handler.rfile = io.BytesIO(raw_body)
        handler.wfile = io.BytesIO()
        handler.client_address = ("127.0.0.1", 8801)
        captured = {}

        def send_response(code, message=None):
            captured["status"] = code

        def send_header(k, v):
            captured.setdefault("headers", {})[k] = v

        def end_headers():
            pass

        handler.send_response = send_response
        handler.send_header = send_header
        handler.end_headers = end_headers
        getattr(handler, "do_" + method)()
        body = json.loads(handler.wfile.getvalue().decode("utf-8"))
        return captured["status"], body

    def test_handler_template_expand_work_order_and_quality_gate(self):
        bead = app.db.list("beads")[0]
        code, exp = self.call_handler("/api/admin/templates/expand", "POST", {
            "special": [],
            "pattern": [bead["id"]],
            "tail": [],
            "wrist": 16,
        }, admin=True)
        self.assertEqual(code, 200)
        self.assertGreaterEqual(exp["count"], 6)
        self.assertTrue(exp["materials"])

        goods = round(bead["price"] * 100) * 6
        sub = goods + 1500
        total = sub + (0 if sub >= 9900 else 800)
        code, order = self.call_handler("/api/my/orders", "POST", {
            "requestId": "wb-http-order-00001",
            "name": "HTTP工单手串",
            "beads": [bead["id"]] * 6,
            "wrist": 15,
            "customerNote": "测试备注",
            "person": "赵六",
            "phone": "13600136000",
            "addr": "杭州市西湖区",
            "confirmedQuote": {
                "totalFen": total,
                "items": [{"id": bead["id"], "unitPriceFen": round(bead["price"] * 100), "mm": bead["mm"]}],
            },
        }, token="u" * 43)
        self.assertEqual(code, 201)
        no = order["no"]

        stored = app.db.get("orders", no)
        stored["paymentStatus"] = "paid"
        stored["paidFen"] = total
        app.db.put("orders", no, stored)
        self.assertEqual(
            self.call_handler(f"/api/admin/orders/{no}/status", "PUT", {"group": "fulfillmentStatus", "to": "producing"}, admin=True)[0],
            200,
        )

        code, _ = self.call_handler(f"/api/admin/orders/{no}/work-order", "PUT", {"replaceMaterial": "bad"}, admin=True)
        self.assertEqual(code, 400)

        code, wo = self.call_handler(
            f"/api/admin/orders/{no}/work-order", "PUT",
            {"assignee": "周师傅", "progress": 60, "step": "穿制打结"},
            admin=True,
        )
        self.assertEqual(code, 200)
        self.assertEqual(wo["assignee"], "周师傅")

        code, wo_list = self.call_handler("/api/admin/work-orders?assignee=周师傅", "GET", admin=True)
        self.assertEqual(code, 200)
        self.assertEqual(len(wo_list), 1)

        code, _ = self.call_handler(f"/api/admin/orders/{no}/quality-gate", "PUT", {
            "sequenceOk": True, "sizeOk": False, "materialOk": True, "appearanceOk": True,
            "inspector": "质检王", "note": "长度偏短2mm",
        }, admin=True)
        self.assertEqual(code, 200)
        code, _ = self.call_handler(f"/api/admin/orders/{no}/status", "PUT", {"group": "fulfillmentStatus", "to": "ready_to_ship"}, admin=True)
        self.assertEqual(code, 400)

        code, _ = self.call_handler(f"/api/admin/orders/{no}/quality-gate", "PUT", {
            "sequenceOk": True, "sizeOk": True, "materialOk": True, "appearanceOk": True,
            "inspector": "质检王", "note": "复检合格",
        }, admin=True)
        self.assertEqual(code, 200)
        code, updated_order = self.call_handler(
            f"/api/admin/orders/{no}/status", "PUT",
            {"group": "fulfillmentStatus", "to": "ready_to_ship"},
            admin=True,
        )
        self.assertEqual(code, 200)
        self.assertEqual(updated_order["fulfillmentStatus"], "ready_to_ship")


if __name__ == "__main__":
    unittest.main()
