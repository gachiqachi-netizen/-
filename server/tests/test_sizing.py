import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from plans import _fill


class SizingTest(unittest.TestCase):
    def test_common_sizes_match_client_rule_and_document_discrete_exceptions(self):
        exceptions = {(13, 14): -6, (16, 12): -5}
        for wrist in range(13, 20):
            for mm in (6, 8, 10, 12, 14):
                items = {'main': {'id': 'main', 'mm': mm}}
                ids = _fill([], ['main'], [], items, wrist)
                target = round(wrist * 10 + max(8, 2.5 * mm - 5))
                diff = len(ids) * mm - target
                if (wrist, mm) in exceptions:
                    self.assertEqual(diff, exceptions[(wrist, mm)])
                else:
                    self.assertGreaterEqual(diff, -4, (wrist, mm, diff))
                    self.assertLessEqual(diff, 6, (wrist, mm, diff))

    def test_fixed_prayer_bead_count_ignores_wrist(self):
        items = {'head': {'mm': 12}, 'main': {'mm': 8}, 'tail': {'mm': 6}}
        for wrist in (13, 15, 19):
            result = _fill(['head'], ['main'], ['tail'], items, wrist, fixed=108)
            self.assertEqual(len(result), 108)
            self.assertEqual(result[0], 'head')
            self.assertEqual(result[-1], 'tail')

