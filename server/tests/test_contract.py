"""字段契约（A1）：导出文件新鲜度、状态中文覆盖、与 commerce 的键一致、HTTP 路由。"""
import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "server"))
sys.path.insert(0, os.path.join(ROOT, "tools"))

import app
import commerce
import contract
import export_contract
import status


class ContractExportTest(unittest.TestCase):
    def test_exported_files_are_fresh(self):
        """在临时目录里跑一遍导出，和仓库里的两个文件逐字比较。"""
        with tempfile.TemporaryDirectory() as tmp:
            for rel, text in export_contract.render():
                path = os.path.join(tmp, rel)
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(text)
                with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
                    repo_text = f.read()
                self.assertEqual(repo_text, text,
                                 "%s 过期了：请运行 python3 tools/export_contract.py" % rel)

    def test_status_labels_cover_status_machine(self):
        """status.py 里每组状态的每个代码，在 STATUS_LABELS 里都有中文。"""
        groups = {
            "orderStatus": status.ORDER_STATUSES,
            "paymentStatus": status.PAYMENT_STATUSES,
            "fulfillmentStatus": status.FULFILLMENT_STATUSES,
            "afterSaleStatus": status.AFTER_SALE_STATUSES,
            "logisticsStatus": status.LOGISTICS_STATUSES,
        }
        for field, codes in groups.items():
            labels = contract.STATUS_LABELS.get(field, {})
            for code in codes:
                self.assertIn(code, labels, "%s 的 %s 没有中文" % (field, code))
                self.assertTrue(labels[code], "%s 的 %s 中文为空" % (field, code))

    def test_scenarios_and_qc_match_commerce(self):
        """TERM_SCENARIOS、QUALITY_GATE_ITEMS 的键和 commerce.py 完全一致。"""
        self.assertEqual(set(contract.TERM_SCENARIOS), set(commerce.TERM_SCENARIOS))
        self.assertEqual(set(contract.QUALITY_GATE_ITEMS), set(commerce.QUALITY_GATE_FIELDS))


class ContractHTTPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_http_route(self):
        """GET /api/meta/contract 返回 200、带 version，不需要登录。"""
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(self.base + '/api/meta/contract', timeout=3) as resp:
            self.assertEqual(resp.status, 200)
            body = json.loads(resp.read())
        self.assertIn('version', body)
        self.assertEqual(body['version'], contract.payload()['version'])


if __name__ == '__main__':
    unittest.main()
