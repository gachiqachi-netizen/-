import base64
import io
import json
import os
import sys
import unittest
from unittest import mock


SERVER = os.path.dirname(os.path.dirname(__file__))
if SERVER not in sys.path:
    sys.path.insert(0, SERVER)

import ai
from ai.zerone import ZerOneProvider, _mode


class FakeResponse:
    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self.body

    def __iter__(self):
        return iter(self.body.splitlines(keepends=True))


class ZerOneProviderTest(unittest.TestCase):
    def setUp(self):
        ai._provider = None
        ai._provider_err = None
        self.env = {
            "AI_PROVIDER": "zerone",
            "ZERONE_AGENT_URL": "https://agents.example.test/zerone/beadloop",
            "ZERONE_AGENT_API_KEY": "runtime-secret",
            "ZERONE_AGENT_NAME": "beadloop",
        }

    def tearDown(self):
        ai._provider = None
        ai._provider_err = None

    def test_provider_selection_uses_agent_runtime_key(self):
        with mock.patch.dict(os.environ, self.env, clear=True):
            provider = ai.provider()
        self.assertEqual("zerone-agent", provider.name)
        self.assertEqual("beadloop", provider.model)

    def test_mode_matches_existing_contracts(self):
        self.assertEqual("tags", _mode(ai.TAGS_SCHEMA))
        self.assertEqual("design", _mode(ai.DESIGNS_SCHEMA))
        self.assertEqual("photo", _mode(ai.PHOTO_SCHEMA))
        self.assertEqual("review", _mode(ai.REVIEW_SCHEMA))

    def test_run_parses_final_assistant_json(self):
        event = {"message": {"content": [{"type": "text", "text": "```json\n{\"reply\":\"好\",\"designs\":[]}\n```"}]}}
        response = FakeResponse(("event: assistant\ndata: " + json.dumps(event, ensure_ascii=False) + "\n\n").encode())
        with mock.patch.dict(os.environ, self.env, clear=True), mock.patch("urllib.request.urlopen", return_value=response) as opened:
            result = ZerOneProvider().json("配一条", ai.DESIGNS_SCHEMA)
        self.assertEqual("好", result["reply"])
        request = opened.call_args.args[0]
        self.assertEqual("runtime-secret", request.headers["X-api-key"])
        body = json.loads(request.data)
        message = json.loads(body["message"])
        self.assertEqual("design", message["mode"])
        self.assertEqual(ai.DESIGNS_SCHEMA, message["outputSchema"])

    def test_photo_uploads_attachment_before_run(self):
        upload = FakeResponse(json.dumps({"files": [{"id": "f1", "name": "beadloop-photo.png", "mime": "image/png", "path": ".zerone-uploads/f1.png"}]}).encode())
        answer = {"message": {"content": [{"type": "text", "text": "{\"ok\":false,\"seen\":\"\",\"main\":\"\",\"accent\":\"\",\"metal\":\"\",\"every\":4}"}]}}
        run = FakeResponse(("event: assistant\ndata: " + json.dumps(answer) + "\n\n").encode())
        with mock.patch.dict(os.environ, self.env, clear=True), mock.patch("urllib.request.urlopen", side_effect=[upload, run]) as opened:
            result = ZerOneProvider().json("识别", ai.PHOTO_SCHEMA, image=("image/png", base64.b64encode(b"png").decode()))
        self.assertFalse(result["ok"])
        self.assertTrue(opened.call_args_list[0].args[0].full_url.endswith("/v1/files/uploads"))
        run_body = json.loads(opened.call_args_list[1].args[0].data)
        self.assertEqual("f1", run_body["attachments"][0]["id"])


if __name__ == "__main__":
    unittest.main()
