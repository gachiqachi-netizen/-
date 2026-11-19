import importlib.util
import tempfile
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location('card_lint', Path(__file__).resolve().parents[2] / 'tools/card_lint.py')
card_lint = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(card_lint)


class CardLintTest(unittest.TestCase):
    def check(self, body, deps='', paths=(), env=''):
        with tempfile.TemporaryDirectory() as directory:
            tasks = Path(directory)
            (tasks / 'queue.md').write_text(f'| H3 | agent/H3-x | cards.md | {deps} | Codex | | |\n', encoding='utf-8')
            (tasks / 'cards.md').write_text('## H3 test\n' + body, encoding='utf-8')
            return card_lint.check(['H3'], tasks=tasks, exists=lambda path: path in paths, env_text=env)['H3']

    def test_missing_repository_path(self):
        self.assertIn('路径不存在', ' '.join(self.check('`server/missing.py`')))

    def test_new_path_exemption(self):
        self.assertEqual([], self.check('新建 `tools/new.py`'))

    def test_missing_environment_variable(self):
        self.assertIn('环境变量不存在', ' '.join(self.check('`MISSING_PROVIDER`')))

    def test_new_environment_variable_exemption(self):
        self.assertEqual([], self.check('新增 `MISSING_PROVIDER`'))

    def test_missing_dependency(self):
        self.assertIn('依赖卡号不存在', ' '.join(self.check('', deps='Z99')))

    def test_existing_path_and_variable(self):
        self.assertEqual([], self.check('`server/app.py` `PAYMENT_PROVIDER`', paths={'server/app.py'}, env='PAYMENT_PROVIDER'))
