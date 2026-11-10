import io
import json
import os
import sys
import unittest
import urllib.error
from unittest import mock


SERVER = os.path.dirname(os.path.dirname(__file__))
if SERVER not in sys.path:
    sys.path.insert(0, SERVER)

from ai.openai_compat import OpenAICompatProvider
import ai


class OpenAICompatProviderTest(unittest.TestCase):
    def test_vision_can_use_separate_provider_url_and_key(self):
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = b'{"choices":[{"message":{"content":"{\\"ok\\":true}"}}]}'
        with mock.patch.dict(os.environ, {
            "AI_BASE_URL": "https://api.deepseek.test/v1",
            "AI_API_KEY": "deepseek-secret",
            "AI_MODEL": "deepseek-chat",
            "AI_VISION_BASE_URL": "https://dashscope.test/compatible-mode/v1",
            "AI_VISION_API_KEY": "dashscope-secret",
            "AI_VISION_MODEL": "qwen3-vl-plus",
        }, clear=False), mock.patch("urllib.request.urlopen", return_value=response) as opened:
            out = OpenAICompatProvider().json("look", {"type": "object"}, image=("image/jpeg", "abc"))
        self.assertTrue(out["ok"])
        request = opened.call_args.args[0]
        self.assertEqual("https://dashscope.test/compatible-mode/v1/chat/completions", request.full_url)
        self.assertEqual("Bearer dashscope-secret", request.headers["Authorization"])
        body = json.loads(request.data)
        self.assertEqual("qwen3-vl-plus", body["model"])

    def test_http_error_keeps_safe_provider_detail(self):
        body = io.BytesIO(b'{"error":{"code":"Model.NotFound","message":"model is not enabled"}}')
        error = urllib.error.HTTPError("https://example.invalid", 400, "Bad Request", {}, body)
        with mock.patch.dict(os.environ, {
            "AI_BASE_URL": "https://example.invalid/v1",
            "AI_API_KEY": "secret-key-must-not-appear",
            "AI_MODEL": "test-model",
        }, clear=False), mock.patch("urllib.request.urlopen", side_effect=error):
            with self.assertRaisesRegex(RuntimeError, "Model.NotFound: model is not enabled") as raised:
                OpenAICompatProvider().json("JSON please", {"type": "object"})
        self.assertNotIn("secret-key-must-not-appear", str(raised.exception))

    def test_design_retries_once_with_allowed_sku_ids(self):
        class Provider:
            name = "fake"

            def __init__(self):
                self.prompts = []

            def json(self, prompt, schema, image=None):
                self.prompts.append(prompt)
                if len(self.prompts) == 1:
                    return {"reply": "第一次", "designs": [{
                        "name": "无效", "meaning": "祝福", "special": [], "pattern": ["粉晶", "invented-id"]
                    }]}
                return {"reply": "已按料包重配", "designs": [{
                    "name": "浅色祝福", "meaning": "温柔的祝福", "special": [], "pattern": ["a", "b"]
                }]}

        provider = Provider()
        beads = [
            {"id": "a", "name": "粉晶", "mm": 8, "mat": "crystal", "price": 3, "tags": []},
            {"id": "b", "name": "白水晶", "mm": 8, "mat": "crystal", "price": 2, "tags": []},
        ]
        with mock.patch.object(ai, "provider", return_value=provider):
            result = ai.design(beads, "喜欢浅色", [], 15)
        self.assertEqual(["a", "b"], result["designs"][0]["pattern"])
        self.assertEqual(2, len(provider.prompts))
        self.assertIn("a=粉晶", provider.prompts[1])


if __name__ == "__main__":
    unittest.main()
