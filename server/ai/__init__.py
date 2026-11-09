"""AI 服务：选模型、拼提示词、校验结果。

分工：AI 只负责从料包里挑珠子、起名字、写寓意；颗数、长度、价格由前台按手围计算，
后端只认目录里“在售”的珠子 id。没有配置任何模型时返回 None，前台自动用本地规则兜底。
"""
import json
import os

_provider = None
_provider_err = None


def provider():
    """AI_PROVIDER=claude / openai；不填时：有 ANTHROPIC_API_KEY 用 Claude，有 AI_BASE_URL+AI_API_KEY 用国内模型。"""
    global _provider, _provider_err
    if _provider or _provider_err:
        return _provider
    want = os.environ.get("AI_PROVIDER", "").lower()
    try:
        if want == "claude" or (not want and os.environ.get("ANTHROPIC_API_KEY")):
            from .claude import ClaudeProvider
            _provider = ClaudeProvider()
        elif want == "openai" or (not want and os.environ.get("AI_BASE_URL") and os.environ.get("AI_API_KEY")):
            from .openai_compat import OpenAICompatProvider
            _provider = OpenAICompatProvider()
        else:
            _provider_err = "未配置 AI 模型"
    except Exception:   # Do not expose configuration details or secrets in the public status endpoint.
        _provider_err = "AI 初始化失败，请检查服务配置"
    return _provider


def status():
    p = provider()
    if p:
        return {"enabled": True, "provider": p.name, "model": getattr(p, "model", "")}
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
PHOTO_SCHEMA = {
    "type": "object",
    "properties": {
        "ok": {"type": "boolean"}, "seen": {"type": "string"},
        "main": {"type": "string"}, "accent": {"type": "string"}, "metal": {"type": "string"},
        "every": {"type": "integer"},
    },
    "required": ["ok", "seen", "main", "accent", "metal", "every"],
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


def design(beads, text, history, wrist):
    """AI 配：根据心愿（含之前的对话）给 3 条候选。"""
    p = provider()
    if not p:
        return None
    hist = "\n".join(history[-6:]) or "（无）"
    prompt = (f"你是手串设计师，在和用户聊天帮她配手串。只用下面目录里的珠子，每颗单独卖、可以自由组合。{RULES}\n"
              f"目录（id|名称尺寸|材质|类型|单价|寓意）：\n{catalog_text(beads)}\n\n"
              f"用户手围 {wrist}cm，手工费 ¥15。\n之前的对话：\n{hist}\n用户刚说：{text}\n\n"
              "给 3 条不同的手串，和之前给过的不要重复。每条至少 2 种不同名称的珠子，主珠直径一致。"
              "pattern 是循环花型（3-8 颗），special 是只出现一次的开头珠（0-2 颗）。用户提了预算时，按大约 20 颗估算，别超预算。\n"
              "reply 是一句 20-40 字的口语回应；meaning 20-40 字。")
    ids = {b["id"] for b in beads}
    names = {b["id"]: b["name"] for b in beads}
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
    return {"reply": clean(out.get("reply"), 60), "designs": designs, "by": p.name}


def photo(beads, image):
    """拍照做同款：认出照片里的主珠、配珠、金属点缀各最像料包里哪一颗。排法和颗数由前台按手围算。"""
    p = provider()
    if not p:
        return None
    prompt = ("用户拍了一张喜欢的手串照片，想用我们料包里的珠子做同款。你只需要认珠子，不用设计。\n"
              f"目录（id|名称尺寸|材质|类型|单价|寓意）：\n{catalog_text(beads)}\n\n"
              "看照片里的手串，回答：ok=照片里有没有手串；main=数量最多的那种珠子在目录里最像的 id（颜色优先，其次材质）；"
              "accent=第二种珠子最像的 id，没有填空字符串；metal=金属隔珠或隔片最像的 id（只能是金属配件），没有填空字符串；"
              "every=配珠或隔珠大约每几颗出现一次（2-6）；seen=一句 15-30 字的话，说看到的颜色、材质和排法。")
    out = p.json(prompt, PHOTO_SCHEMA, image=image)
    by_id = {b["id"]: b for b in beads}
    body = {i for i, b in by_id.items() if not b.get("spacer") and b.get("mat") != "metal" and "佛头" not in b["name"]}
    metal = {i for i, b in by_id.items() if b.get("mat") == "metal"}
    main = out.get("main") if out.get("main") in body else ""
    if out.get("ok") and not main:
        raise RuntimeError("AI 给的珠子不在料包里")
    accent = out.get("accent") if out.get("accent") in body and out.get("accent") != main else ""
    return {"ok": bool(out.get("ok")), "seen": clean(out.get("seen"), 60), "main": main, "accent": accent,
            "metal": out.get("metal") if out.get("metal") in metal else "",
            "every": max(2, min(6, int(out.get("every") or 4))), "by": p.name}


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
