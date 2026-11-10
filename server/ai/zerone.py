"""ZerOne Agent provider.

业务服务只持有 Agent 独立运行密钥，不使用管理级 CLI Token。Agent 负责理解与生成，
Beadloop 仍负责目录校验、颗数、尺寸和价格等确定性规则。
"""
import base64
import json
import os
import re
import uuid
import urllib.error
import urllib.request


def _mode(schema):
    required = set(schema.get("required") or [])
    if {"audience", "occasion", "meaning", "style", "colors", "budget", "gender"} <= required:
        return "tags"
    if {"reply", "designs"} <= required:
        return "design"
    if {"ok", "seen", "main", "accent", "metal", "every"} <= required:
        return "photo"
    if {"praise", "meaning", "sugg"} <= required:
        return "review"
    return "json"


def _json_text(text):
    text = str(text or "").strip()
    fenced = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```$", text, re.I)
    if fenced:
        text = fenced.group(1).strip()
    value = json.loads(text)
    if not isinstance(value, dict):
        raise RuntimeError("ZerOne Agent 未返回 JSON 对象")
    return value


class ZerOneProvider:
    name = "zerone-agent"

    def __init__(self):
        self.base_url = os.environ.get("ZERONE_AGENT_URL", "").rstrip("/")
        self.api_key = os.environ.get("ZERONE_AGENT_API_KEY", "")
        self.agent = os.environ.get("ZERONE_AGENT_NAME", "beadloop")
        self.timeout = int(os.environ.get("ZERONE_AGENT_TIMEOUT", "180"))
        if not self.base_url or not self.api_key:
            raise RuntimeError("ZerOne Agent 地址或运行密钥未配置")
        self.model = self.agent
        self.vision_model = self.agent

    def _open(self, request):
        try:
            return urllib.request.urlopen(request, timeout=self.timeout)
        except urllib.error.HTTPError as exc:
            try:
                body = json.loads(exc.read().decode("utf-8", "replace"))
                detail = body.get("message") or body.get("error") or ""
                if isinstance(detail, dict):
                    detail = detail.get("message") or detail.get("code") or ""
            except Exception:
                detail = ""
            suffix = f"：{str(detail)[:160]}" if detail else ""
            raise RuntimeError(f"ZerOne Agent 请求失败 HTTP {exc.code}{suffix}") from None
        except Exception as exc:
            raise RuntimeError(f"ZerOne Agent 连接失败：{type(exc).__name__}") from None

    def _upload(self, image):
        mime, encoded = image
        raw = base64.b64decode(encoded, validate=True)
        ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(mime)
        if not ext:
            raise RuntimeError("ZerOne Agent 不支持该图片格式")
        boundary = "----beadloop" + uuid.uuid4().hex
        filename = f"beadloop-photo.{ext}"
        head = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"files\"; filename=\"{filename}\"\r\n"
                f"Content-Type: {mime}\r\n\r\n").encode()
        body = head + raw + f"\r\n--{boundary}--\r\n".encode()
        request = urllib.request.Request(
            self.base_url + "/v1/files/uploads", data=body, method="POST",
            headers={"x-api-key": self.api_key, "Content-Type": f"multipart/form-data; boundary={boundary}"},
        )
        with self._open(request) as response:
            payload = json.loads(response.read().decode("utf-8"))
        files = payload.get("files") or []
        if not files:
            raise RuntimeError("ZerOne Agent 图片上传失败")
        return files

    @staticmethod
    def _assistant_text(stream):
        final = ""
        partial = []
        event = ""
        data_lines = []

        def consume(current_event, lines):
            nonlocal final
            if not lines:
                return
            try:
                payload = json.loads("\n".join(lines))
            except json.JSONDecodeError:
                return
            if current_event == "assistant" or payload.get("type") == "assistant":
                message = payload.get("message") or payload
                blocks = message.get("content") or []
                texts = [x.get("text", "") for x in blocks if isinstance(x, dict) and x.get("type") == "text"]
                if texts:
                    final = "".join(texts)
            elif current_event in ("partial_message", "message_delta"):
                value = payload.get("text") or payload.get("delta") or payload.get("content")
                if isinstance(value, str):
                    partial.append(value)

        for raw in stream:
            line = raw.decode("utf-8", "replace").rstrip("\r\n")
            if not line:
                consume(event, data_lines)
                event, data_lines = "", []
            elif line.startswith("event:"):
                event = line[6:].strip()
            elif line.startswith("data:"):
                data_lines.append(line[5:].lstrip())
        consume(event, data_lines)
        return final or "".join(partial)

    def json(self, prompt, schema, image=None):
        message = json.dumps({
            "mode": _mode(schema),
            "taskPrompt": prompt,
            "outputSchema": schema,
            "rules": [
                "只输出一个符合 outputSchema 的 JSON 对象，不要 Markdown",
                "只能使用 taskPrompt 商品目录中的完整珠子 id，不得编造 SKU",
                "金额按 taskPrompt 的口径处理；只讲寓意，不宣称功效",
            ],
        }, ensure_ascii=False)
        payload = {"message": message}
        if image:
            payload["attachments"] = self._upload(image)
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}/v1/agents/{self.agent}/runs", data=data, method="POST",
            headers={"x-api-key": self.api_key, "Content-Type": "application/json", "Accept": "text/event-stream"},
        )
        with self._open(request) as response:
            text = self._assistant_text(response)
        if not text:
            raise RuntimeError("ZerOne Agent 未返回结果")
        return _json_text(text)
