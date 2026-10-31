"""用 Claude 做 AI 配珠、点评、拍照做同款（官方 Anthropic Python SDK）。

需要：Python 3.10+、`pip install anthropic`，并设置 ANTHROPIC_API_KEY（或 `ant auth login`）。
注意：面向中国大陆公众上线时，需使用已备案的国内模型（见 openai_compat.py），本文件适合海外部署或内部测试。
"""
import json
import os

import anthropic

MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-5-5")


class ClaudeProvider:
    name = "claude"

    def __init__(self):
        self.client = anthropic.Anthropic()
        self.model = MODEL

    def json(self, prompt, schema, image=None):
        """发一条消息，按 schema 拿回 JSON。image = (media_type, base64 字符串) 或 None。"""
        content = []
        if image:
            media_type, data = image
            content.append({"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}})
        content.append({"type": "text", "text": prompt})
        response = self.client.beta.messages.create(
            model=self.model,
            max_tokens=16000,
            # 被安全策略拒绝时，服务端自动换推荐的模型重跑
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            # 配珠是轻任务，低思考强度换更快的响应；JSON 结构由 schema 保证
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": schema}},
            messages=[{"role": "user", "content": content}],
        )
        if response.stop_reason == "refusal":
            raise RuntimeError("AI 拒绝了这次请求")
        text = next(b.text for b in response.content if b.type == "text")
        return json.loads(text)
