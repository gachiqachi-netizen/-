"""B-17: dry-run installer configuration contract."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class SetupScriptTests(unittest.TestCase):
    def test_dry_run_and_preserve(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / 'out'
            out.mkdir()
            for name in ('merchant.pem', 'public.pem', 'cert.crt', 'cert.key'):
                (Path(tmp) / name).write_text('fake file')
            api_key = 'K' * 32
            appsecret = 'SecretOnlyForTest'
            inputs = '\n'.join([
                'api.example.test', 'testmchid', 'wx-test-app', appsecret,
                api_key, 'testserial', 'PUB_KEY_ID_test',
                str(Path(tmp) / 'merchant.pem'), str(Path(tmp) / 'public.pem'),
                str(Path(tmp) / 'cert.crt'), str(Path(tmp) / 'cert.key'), '',
            ]) + '\n'
            env = dict(os.environ, DRY_RUN='1', SETUP_OUTPUT_DIR=str(out))
            command = ['bash', str(ROOT / 'deploy/setup.sh')]
            first = subprocess.run(command, input=inputs, text=True, encoding="utf-8", errors="replace", capture_output=True,
                                   cwd=ROOT, env=env, timeout=30)
            self.assertEqual(first.returncode, 0, first.stderr)
            output = first.stdout + first.stderr
            self.assertNotIn(api_key, output)
            self.assertNotIn(appsecret, output)
            env_file = out / 'app.env'
            self.assertEqual(env_file.stat().st_mode & 0o777, 0o600)
            parsed = dict(line.split('=', 1) for line in env_file.read_text().splitlines()
                          if line and not line.startswith('#'))
            example = dict(line.split('=', 1) for line in (ROOT / 'deploy/app.env.example').read_text().splitlines()
                           if line and not line.startswith('#'))
            self.assertEqual(set(parsed), set(example))
            self.assertEqual(parsed['WXPAY_NOTIFY_URL'], 'https://api.example.test/api/payments/notify')
            self.assertEqual(parsed['WECHAT_APP_ID'], parsed['WXPAY_APPID'])
            self.assertEqual(parsed['PAYMENT_PROVIDER'], 'wechat')
            self.assertEqual(parsed['ENV'], 'production')
            self.assertIn(str(Path(tmp) / 'cert.crt'), (out / 'chuan.conf').read_text())
            before = env_file.read_bytes()
            second = subprocess.run(command, input='\n', text=True, encoding="utf-8", errors="replace", capture_output=True,
                                    cwd=ROOT, env=env, timeout=30)
            self.assertEqual(second.returncode, 0, second.stderr)
            self.assertEqual(env_file.read_bytes(), before)
