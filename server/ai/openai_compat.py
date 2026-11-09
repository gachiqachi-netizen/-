"""接国内已备案的大模型（通义千问、DeepSeek、豆包等），走它们兼容 OpenAI 格式的 chat/completions 接口。

环境变量：
  AI_BASE_URL  例：https://dashscope.aliyuncs.com/compatible-mode/v1
  AI_API_KEY   对应平台的 Key
  AI_MODEL     文字模型，例：qwen-plus
  AI_VISION_MODEL  看图模型（拍照做同款用），例：qwen-vl-plus；不填则拍照功能退回本地取色
"""
import json
import os
import re
import urllib.error
import urllib.request


class OpenAICompatProvider:
    name = "openai-compat"

    def __init__(self):
        self.base = os.environ["AI_BASE_URL"].rstrip("/")
        self.key = os.environ["AI_API_KEY"]
        self.model = os.environ.get("AI_MODEL", "qwen-plus")
        self.vision_model = os.environ.get("AI_VISION_MODEL", "")

    def json(self, prompt, schema, image=None):
        if image and not self.vision_model:
            raise RuntimeError("没有配置看图模型 AI_VISION_MODEL")
        if image:
            media_type, data = image
            content = [{"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{data}"}},
                       {"type": "text", "text": prompt}]
        else:
            content = prompt
        body = {
            "model": self.vision_model if image else self.model,
            "messages": [
                {"role": "system", "content": "只输出一个 JSON 对象，结构如下（JSON Schema）：" + json.dumps(schema, ensure_ascii=False)},
                {"role": "user", "content": content},
            ],
            "response_format": {"type": "json_object"},
        }
        req = urllib.request.Request(self.base + "/chat/completions", data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json", "Authorization": "Bearer " + self.key})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                out = json.loads(r.read())
        except urllib.error.HTTPError as exc:
            # Keep credentials out of logs, but preserve the provider's error code/message
            # so model permission and unsupported-parameter failures are diagnosable.
            try:
                payload = json.loads(exc.read())
                detail = payload.get("error") or payload
                if isinstance(detail, dict):
                    code = str(detail.get("code") or "")[:80]
                    message = str(detail.get("message") or "")[:300]
                    detail = ": ".join(x for x in (code, message) if x)
                else:
                    detail = str(detail)[:300]
            except Exception:
                detail = ""
            raise RuntimeError(f"百炼请求失败 HTTP {exc.code}" + (f": {detail}" if detail else "")) from None
        text = out["choices"][0]["message"]["content"]
        text = re.sub(r"^```(?:json)?|```$", "", text.strip()).strip()
        return json.loads(text)
