"""尺寸规则：后端和小程序工作台用同一套（2026-11-13 负责人定，以 miniprogram/pages/editor/logic.js 为准）。

用例在 tests/fixtures/size_rule_cases.json，小程序的 miniprogram/tests/size-rule-shared.test.js 读同一份。
这里失败说明后端的主珠、目标长度或排珠和小程序不一致了：先想清楚是哪边错，不要只改期望值。
"""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import plans

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "size_rule_cases.json")


class SharedSizeRuleTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(FIXTURE, encoding="utf-8") as f:
            cls.data = json.load(f)
        cls.item = {b["id"]: b for b in cls.data["catalog"]}

    def test_main_and_target(self):
        for case in self.data["stats"]:
            with self.subTest(case["name"]):
                main, target = plans.target_mm(case["ids"], self.item, case["wrist"])
                self.assertEqual(main, case["main"])
                self.assertEqual(target, case["target"])
                self.assertEqual(sum(self.item[x]["mm"] for x in case["ids"]), case["length"])

    def test_fill(self):
        for case in self.data["fill"]:
            with self.subTest(case["name"]):
                beads = plans._fill(case["special"], case["pattern"], case["tail"], self.item, case["wrist"])
                self.assertEqual(beads, case["beads"])

    def test_js_round_half_up(self):
        self.assertEqual(plans.target_for(15.5, 9), 173)   # 172.5 进位（Python 的 round 会得到 172）
        self.assertEqual(plans.target_for(15, 8), 165)


if __name__ == "__main__":
    unittest.main()
