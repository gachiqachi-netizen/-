"""AI 服务：选模型、拼提示词、校验结果。

分工：AI 只负责从料包里挑珠子、起名字、写寓意；颗数、长度、价格由前台按手围计算，
后端只认目录里“在售”的珠子 id。没有配置任何模型时返回 None，前台自动用本地规则兜底。
"""
import json
import math
import os
import re
import time

import ai_logs
import kb
import money
import plans
import pricing
from photo_match import match_kind

_provider = None
_provider_err = None


def provider(feature="design"):
    """选择 AI provider；生产推荐 AI_PROVIDER=zerone，并使用 Agent 独立运行密钥。"""
    global _provider, _provider_err
    import ai_settings
    if feature not in ('design', 'photo'):
        raise ValueError('AI 功能不正确')
    settings = ai_settings.current()
    if not settings['photoEnabled' if feature == 'photo' else 'designEnabled']:
        return None
    want = settings['provider'] or os.environ.get('AI_PROVIDER', '').lower()
    selected = (want, settings['model'], settings['visionModel'])
    if getattr(provider, '_selected', None) != selected:
        _provider = None
        _provider_err = None
        provider._selected = selected
    if _provider or _provider_err:
        return ai_settings.PhotoUsageProvider(_provider) if feature == 'photo' and _provider else _provider
    try:
        if want and not ai_settings.configured().get(want, {}).get('configured'):
            _provider_err = '所选 AI 服务未配置'
            return None
        if want == "zerone" or (not want and os.environ.get("ZERONE_AGENT_URL") and os.environ.get("ZERONE_AGENT_API_KEY")):
            from .zerone import ZerOneProvider
            _provider = ZerOneProvider()
        elif want == "claude" or (not want and os.environ.get("ANTHROPIC_API_KEY")):
            from .claude import ClaudeProvider
            _provider = ClaudeProvider()
        elif want == "openai" or (not want and os.environ.get("AI_BASE_URL") and os.environ.get("AI_API_KEY")):
            from .openai_compat import OpenAICompatProvider
            _provider = OpenAICompatProvider()
        else:
            _provider_err = "未配置 AI 模型"
        if _provider is not None:
            if settings['model']:
                _provider.model = settings['model']
                if want == 'zerone':
                    _provider.agent = settings['model']
            if settings['visionModel']:
                _provider.vision_model = settings['visionModel']
    except Exception:   # Do not expose configuration details or secrets in the public status endpoint.
        _provider_err = "AI 初始化失败，请检查服务配置"
    return ai_settings.PhotoUsageProvider(_provider) if feature == 'photo' and _provider else _provider


def status():
    p = provider()
    if p:
        return {"enabled": True, "provider": p.name, "model": getattr(p, "model", ""),
                "visionModel": getattr(p, "vision_model", "")}
    return {"enabled": False, "reason": _provider_err or "未配置 AI 模型"}


# 广告法和平台审核敏感词：AI 输出里出现就去掉。正式版还要过微信内容安全接口 msgSecCheck。
BANNED = ["功效", "治愈", "治疗", "能量", "磁场", "必备", "保证", "一定会", "包过", "旺夫", "开光"]


def clean(text, limit):
    text = str(text or "")
    for w in BANNED:
        text = text.replace(w, "")
    return text[:limit]


MATS = {"wood": "木质", "bodhi": "菩提", "stone": "玉石", "crystal": "水晶", "metal": "金属配件"}


def catalog_text(beads):
    lines = []
    for b in beads:
        kind = "隔片" if b.get("spacer") else "珠"
        lines.append(f'{b["id"]}|{b["name"]} {b["mm"]}mm|{MATS.get(b["mat"], "")}|{kind}|¥{b["price"]}|{"/".join(b.get("tags") or []) or "装饰"}')
    return "\n".join(lines)


DESIGN_ITEM = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "meaning": {"type": "string"},
        "special": {"type": "array", "items": {"type": "string"}},
        "pattern": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["name", "meaning", "special", "pattern"],
    "additionalProperties": False,
}
DESIGNS_SCHEMA = {
    "type": "object",
    "properties": {"reply": {"type": "string"}, "designs": {"type": "array", "items": DESIGN_ITEM}},
    "required": ["reply", "designs"],
    "additionalProperties": False,
}
# 拍照做同款：AI 只认珠子，不做设计（对看图模型要求低，认错了用户在页面上点一下就能换）
PHOTO_FAILURE_REASONS = ("dark", "blurry", "blur", "no_bracelet", "unknown_beads")

PHOTO_SCHEMA = {
    "type": "object",
    "properties": {
        "ok": {"type": "boolean"}, "seen": {"type": "string"},
        "kinds": {"type": "array", "maxItems": 6, "items": {"type": "object", "properties": {
            "role": {"type": "string", "enum": ["main", "accent", "metal", "center", "pendant"]},
            "color": {"type": "string"}, "colorName": {"type": "string"},
            "clarity": {"type": "string", "enum": ["clear", "translucent", "opaque"]},
            "pattern": {"type": "string", "enum": ["plain", "cracked", "striped", "speckled", "banded", "metallic"]},
            "material": {"type": "string", "enum": ["crystal", "stone", "wood", "bodhi", "metal", "other"]},
            "mmGuess": {"type": ["number", "null"]}, "count": {"type": "integer"}, "confidence": {"type": "number"},
        }, "required": ["role", "color", "colorName", "clarity", "pattern", "material", "mmGuess", "count", "confidence"], "additionalProperties": False}},
        "layout": {"type": "object", "properties": {"symmetric": {"type": "boolean"},
            "every": {"type": ["integer", "null"]}, "sequence": {"type": "array", "maxItems": 30, "items": {"type": "string"}}},
        "required": ["symmetric", "every", "sequence"], "additionalProperties": False},
        "reason": {"type": "string", "enum": list(PHOTO_FAILURE_REASONS)},
    },
    "required": ["ok", "seen", "kinds", "layout"],
    "additionalProperties": False,
}
REVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "praise": {"type": "string"},
        "meaning": {"type": "string"},
        "sugg": {"type": "array", "items": {
            "type": "object",
            "properties": {
                "op": {"type": "string", "enum": ["accent", "swapAll"]},
                "text": {"type": "string"},
                "id": {"type": "string"}, "count": {"type": "integer"},
                "from": {"type": "string"}, "to": {"type": "string"},
            },
            "required": ["op", "text", "id", "count", "from", "to"],
            "additionalProperties": False,
        }},
    },
    "required": ["praise", "meaning", "sugg"],
    "additionalProperties": False,
}

RULES = "只说寓意，不说功效；不用“能量”“磁场”“必备”“保证”这类词。"


def _valid_designs(raw, ids, min_names, names_of):
    out = []
    for d in raw or []:
        pattern = [x for x in d.get("pattern") or []]
        special = [x for x in d.get("special") or []]
        if not pattern or any(x not in ids for x in pattern + special):
            continue
        if len({names_of[x] for x in pattern + special}) < min_names:
            continue
        out.append({"src": "ai", "name": clean(d.get("name") or "心愿手串", 10), "meaning": clean(d.get("meaning"), 80),
                    "special": special[:2], "pattern": pattern[:8]})
    return out[:3]


TAGS_SCHEMA = {
    "type": "object",
    "properties": {k: {"type": "array", "items": {"type": "string"}} for k in ("audience", "occasion", "meaning", "style", "colors")}
    | {"budget": {"type": ["integer", "null"]}, "gender": {"type": ["string", "null"]}},
    "required": ["audience", "occasion", "meaning", "style", "colors", "budget", "gender"],
    "additionalProperties": False,
}


def extract_tags(text, history, vocab):
    """AI 配第一步：把用户的话抽成方案库的标签。取值只能从 vocab 里选，选不到就空着。"""
    p = provider()
    if not p:
        return None
    prompt = ("把用户想要的手串需求抽成标签，只能从给定取值里选，没提到的留空数组；budget 是整串预算上限（数字，没说就 null）；"
              "gender 是佩戴者性别 male/female，没法判断就 null。\n"
              f"可选取值：{json.dumps(vocab, ensure_ascii=False)}\n之前说过：{' / '.join(history[-6:]) or '（无）'}\n用户刚说：{text}")
    return p.json(prompt, TAGS_SCHEMA)


def _log_design(text, reply, designs, started, p, ok=True, error=None):
    """B-12：AI 配结束记一次对话记录；记录本身任何失败都不影响返回。"""
    try:
        ai_logs.record(None, text, reply, designs, int((time.time() - started) * 1000), p.name,
                       ok=ok, error="" if error is None else str(error)[:200])
    except Exception:
        pass


def design(beads, text, history, wrist):
    """AI 配：根据心愿（含之前的对话）给 3 条候选。"""
    p = provider()
    if not p:
        return None
    started = time.time()
    hist = "\n".join(history[-6:]) or "（无）"
    prompt = (f"你是手串设计师，在和用户聊天帮她配手串。只用下面目录里的珠子，每颗单独卖、可以自由组合。{RULES}\n"
              f"目录（id|名称尺寸|材质|类型|单价|寓意）：\n{catalog_text(beads)}\n\n"
              f"用户手围 {wrist}cm，价格由服务端计算。\n之前的对话：\n{hist}\n用户刚说：{text}\n\n"
              "给 3 条不同的手串，和之前给过的不要重复。每条至少 2 种不同名称的珠子，主珠直径一致。"
              "pattern 是循环花型（3-8 颗），special 是只出现一次的开头珠（0-2 颗）。用户提了预算时，按大约 20 颗估算，别超预算。\n"
              "reply 是一句 20-40 字的口语回应，先讲寓意且不要写数字；meaning 20-40 字。")
    ids = {b["id"] for b in beads}
    names = {b["id"]: b["name"] for b in beads}
    try:
        out = p.json(prompt, DESIGNS_SCHEMA)
        designs = _valid_designs(out.get("designs"), ids, 2, names)
        if not designs:
            # JSON-only mode guarantees syntax, not that a model copies opaque SKU ids
            # exactly. Retry once with a compact allow-list; never accept invented ids.
            allowed = ", ".join(f'{b["id"]}={b["name"]}' for b in beads)
            retry_prompt = (prompt + "\n\n上一次结果未通过商品目录校验，请重新输出。"
                            "special 和 pattern 的每个值必须是下列完整 id 之一，不能写珠子名称、颜色、对象或新 id：\n"
                            + allowed)
            out = p.json(retry_prompt, DESIGNS_SCHEMA)
            designs = _valid_designs(out.get("designs"), ids, 2, names)
            if not designs:
                raise RuntimeError("AI 给的珠子不在料包里")
        result = {"message": str(out.get("message") or out.get("reply") or ""), "designs": designs, "by": p.name}
    except Exception as exc:
        _log_design(text, "", [], started, p, ok=False, error=exc)
        raise
    _log_design(text, result.get("message") or result.get("reply") or "", result["designs"], started, p)
    return result


def _plan_tags(sequence, item):
    """Only meaning tags from knowledge-base records for selected beads."""
    tags = []
    for bid in sequence:
        bead = item[bid]
        record = kb.get(bead.get('kb')) if bead.get('kb') else None
        for tag in ((record or {}).get('meaning') or {}).get('tags') or []:
            if tag not in tags:
                tags.append(tag)
    return tags


def design_response(result, beads, wrist):
    """Turn model recipes into three priced, sized plans without trusting model numbers."""
    recipes = result.get('designs') or []
    if len(recipes) < 3:
        raise RuntimeError('AI 没有给出三条可用方案')
    item = {b['id']: b for b in beads}
    output = []
    for recipe in recipes[:3]:
        sequence = plans._fill(recipe['special'], recipe['pattern'], [], item, wrist)
        _, length_mm = plans.target_mm(sequence, item, wrist)
        tags = _plan_tags(sequence, item)
        prices = [{'unitPriceFen': (money.parse_fen(item[bid]['priceFen'])
                   if item[bid].get('priceFen') is not None else money.yuan_to_fen(item[bid]['price']))}
                  for bid in sequence]
        output.append({
            'name': recipe['name'],
            'line': '、'.join(tags[:2]) if tags else '为这条搭配留一份心意',
            'beads': sequence,
            'count': len(sequence),
            'lengthMm': length_mm,
            'payableFen': pricing.quote(prices)['payableFen'],
        })
    model_message = result.get('message') or ''
    if re.search(r'\d', model_message) or kb.banned_in(model_message):
        message = '为你配了三条，先看第一条。'
    else:
        message = model_message or '为你配了三条，先看第一条。'
    return {'message': message, 'plans': output,
            'quickReplies': ['换一组珠子', '看看别的风格', '再调一下预算']}


def _confidence(v):
    """模型自报的把握 0–1；给不出（缺字段、字符串、越界）就返回 None，不编数字。"""
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return None
    v = float(v)
    if not math.isfinite(v) or v < 0 or v > 1:
        return None
    return v


def photo(beads, image):
    """Describe visible kinds, then match them against the current on-sale catalog."""
    p = provider(feature="photo")
    if not p:
        return None
    prompt = ("请只描述照片中的手串，不选择商品 id。ok 表示能否看清完整手串；失败给 reason：dark、blur、no_bracelet 或 unknown_beads。"
              "seen 用 15–30 字描述颜色、材质和排法。kinds 最多六种，按主珠、配珠、金属、佛头、吊坠分别描述："
              "role 为 main/accent/metal/center/pendant，color 为 #rrggbb，colorName 为中文颜色，"
              "clarity 为 clear/translucent/opaque，pattern 为 plain/cracked/striped/speckled/banded/metallic，"
              "material 为 crystal/stone/wood/bodhi/metal/other，mmGuess 是 4–20mm 的估计或 null，"
              "count 为大约颗数，confidence 为 0–1。layout.symmetric 表示左右对称，every 为 2–6 或 null，"
              "sequence 最多 30 个 role，从 12 点钟方向顺时针列出。看不清的细节不要猜。")
    out = p.json(prompt, PHOTO_SCHEMA, image=image)
    seen = clean(out.get("seen"), 30)
    if not out.get("ok"):
        reason = out.get("reason") if out.get("reason") in PHOTO_FAILURE_REASONS else "no_bracelet"
        return {"ok": False, "reason": reason, "seen": seen, "by": p.name}
    roles = {"main", "accent", "metal", "center", "pendant"}
    materials = {"crystal", "stone", "wood", "bodhi", "metal", "other"}
    clarity = {"clear", "translucent", "opaque"}
    patterns = {"plain", "cracked", "striped", "speckled", "banded", "metallic"}
    kinds = []
    for raw in (out.get("kinds") if isinstance(out.get("kinds"), list) else [])[:6]:
        if not isinstance(raw, dict) or not isinstance(raw.get("role"), str) or raw.get("role") not in roles:
            continue
        color = raw.get("color")
        if not isinstance(color, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", color):
            continue
        mm = raw.get("mmGuess")
        mm = float(mm) if isinstance(mm, (int, float)) and not isinstance(mm, bool) and 4 <= mm <= 20 else None
        count = raw.get("count")
        count = max(0, min(80, count)) if isinstance(count, int) and not isinstance(count, bool) else 0
        kind = {"role": raw["role"], "color": color.lower(), "colorName": clean(raw.get("colorName"), 20),
                "clarity": raw.get("clarity") if isinstance(raw.get("clarity"), str) and raw.get("clarity") in clarity else "opaque",
                "pattern": raw.get("pattern") if isinstance(raw.get("pattern"), str) and raw.get("pattern") in patterns else "plain",
                "material": raw.get("material") if isinstance(raw.get("material"), str) and raw.get("material") in materials else "other",
                "mmGuess": mm, "count": count, "confidence": _confidence(raw.get("confidence"))}
        kind["candidates"] = match_kind(kind, beads)
        kinds.append(kind)
    layout_raw = out.get("layout") if isinstance(out.get("layout"), dict) else {}
    every = layout_raw.get("every")
    every = every if isinstance(every, int) and not isinstance(every, bool) and 2 <= every <= 6 else None
    sequence = layout_raw.get("sequence")
    sequence = [role for role in sequence[:30] if isinstance(role, str) and role in roles] if isinstance(sequence, list) else []
    layout = {"symmetric": layout_raw.get("symmetric") is True, "every": every, "sequence": sequence}
    first = lambda role: next((k["candidates"][0]["id"] for k in kinds if k["role"] == role and k["candidates"]), "")
    main, accent, metal = first("main"), first("accent"), first("metal")
    if not main:
        return {"ok": False, "reason": "unknown_beads", "seen": seen, "by": p.name}
    return {"ok": True, "seen": seen, "kinds": kinds, "layout": layout, "by": p.name,
            "main": main, "accent": accent, "metal": metal, "every": every or 4,
            "confidence": {role: next((k["confidence"] for k in kinds if k["role"] == role and k["candidates"]), None)
                           for role in ("main", "accent", "metal")}}


def review(beads, chosen, wrist, fit_ok):
    """AI 帮你看看：先肯定，再给最多 2 条能一键采纳的建议。"""
    p = provider()
    if not p:
        return None
    by_id = {b["id"]: b for b in beads}
    counts = {}
    for x in chosen:
        counts[x] = counts.get(x, 0) + 1
    now = "、".join(f'{x}({by_id[x]["name"]} {by_id[x]["mm"]}mm)×{n}' for x, n in counts.items() if x in by_id)
    prompt = (f"你是手串搭配师，帮用户看看她自己串的手串。语气像懂行的朋友：先真诚肯定，再给最多 2 条小建议。{RULES}\n"
              f"可用珠子（id|名称尺寸|材质|类型|单价|寓意）：\n{catalog_text(beads)}\n\n"
              f"她的手串（共 {len(chosen)} 颗）：{now}\n手围 {wrist}cm，长度{'合适' if fit_ok else '不太合适'}。\n\n"
              "每条建议必须能一键执行，只能用两种操作：op=accent（id=珠子id, count=2-4，在一圈里均匀换上几颗做点缀，from/to 填空字符串）；"
              "op=swapAll（from=她手串里的珠子id, to=珠子id，把某种珠子全部换掉，id 填空字符串、count 填 0）。串得已经很好时 sugg 可以为空。\n"
              "praise 20-40 字；meaning 25-50 字，说整体寓意和适合送谁；text 20-40 字。")
    out = p.json(prompt, REVIEW_SCHEMA)
    ids = set(by_id)
    sugg = []
    for s in out.get("sugg") or []:
        if s.get("op") == "accent" and s.get("id") in ids:
            sugg.append({"op": "accent", "id": s["id"], "count": max(1, min(6, int(s.get("count") or 2))), "text": clean(s.get("text"), 60)})
        elif s.get("op") == "swapAll" and s.get("from") in chosen and s.get("to") in ids and s["from"] != s["to"]:
            sugg.append({"op": "swapAll", "from": s["from"], "to": s["to"], "text": clean(s.get("text"), 60)})
    return {"praise": clean(out.get("praise"), 80), "meaning": clean(out.get("meaning"), 100), "sugg": sugg[:2], "by": p.name}
