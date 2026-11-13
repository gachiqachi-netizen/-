"""珠子知识库：读 kb/data 下的珠子表和属性词典，给后台上架、前台展示、AI 用。

文件改了会自动重新读，不用重启服务。格式见 kb/SCHEMA.md。
"""
import glob
import json
import os
import warnings

import kb_store

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb", "data"))
_cache = {"stamp": None}

# 知识库大类 → 料包材质（决定 3D 质感）
CAT_MAT = {"crystal": "crystal", "feldspar": "crystal", "colored": "crystal", "manmade": "crystal",
           "agate": "stone", "jade": "stone", "gem": "stone", "organic": "stone",
           "wood": "wood", "incense": "wood", "bodhi": "bodhi", "kernel": "bodhi", "fitting": "metal"}
# 卖点拼接顺序：先产地，再颜色、种水、光效……处理只在“天然”时说
POINT_ORDER = ["origin", "color", "clarity", "purity", "effect", "pattern", "inclusion", "texture", "age"]
# 字段 → confidence 里对应的键；把握为 low 的字段不给用户看
GUARDED = ["summary", "look", "identify", "confusables", "meaning", "story", "care"]
FALLBACK_BANNED = ["招财", "转运", "辟邪", "避邪", "挡煞", "能量", "净化", "消磁", "开光", "加持", "护身", "安神", "助眠", "治疗", "保佑"]


def _files():
    return sorted(glob.glob(os.path.join(ROOT, "beads", "*.json"))) + [os.path.join(ROOT, "attributes.json")]


def _load():
    current_stamp = kb_store.stamp()
    if current_stamp is not None:
        if current_stamp == _cache['stamp']:
            return _cache
        data = kb_store.snapshot()
        if data is not None:
            beads, attrs = data['beads'], data['attrs']
            banned = [x['word'] for x in attrs.get('banned', []) if x.get('word')] or FALLBACK_BANNED
            _cache.update(stamp=current_stamp, beads=beads, attrs=attrs, errors=[],
                          dims={d['key']: d for d in attrs.get('dims', []) if d.get('key')},
                          banned=sorted(set(banned), key=len, reverse=True))
            return _cache
    if not _cache.get('warned_fallback'):
        warnings.warn('知识库数据库无数据，退回读取 kb/data/*.json', RuntimeWarning)
        _cache['warned_fallback'] = True
    files = [f for f in _files() if os.path.exists(f)]
    stamp = tuple((f, os.path.getmtime(f)) for f in files)
    if stamp == _cache["stamp"]:
        return _cache
    beads, errors = {}, []
    for f in [f for f in files if os.sep + "beads" + os.sep in f]:
        try:
            with open(f, encoding="utf-8") as source:
                entries = json.load(source)
            for b in entries:
                if isinstance(b, dict) and b.get("id"):
                    beads[b["id"]] = b
        except Exception as e:   # 一个文件坏了不影响别的
            errors.append(f"{os.path.basename(f)}: {e}")
    attrs = {}
    ap = os.path.join(ROOT, "attributes.json")
    if os.path.exists(ap):
        try:
            with open(ap, encoding="utf-8") as source:
                attrs = json.load(source)
        except Exception as e:
            errors.append(f"attributes.json: {e}")
    banned = [x["word"] for x in attrs.get("banned", []) if x.get("word")] or FALLBACK_BANNED
    _cache.update(stamp=stamp, beads=beads, attrs=attrs, errors=errors,
                  dims={d["key"]: d for d in attrs.get("dims", []) if d.get("key")},
                  banned=sorted(set(banned), key=len, reverse=True))
    return _cache


def status():
    c = _load()
    return {"beads": len(c["beads"]), "dims": len(c["dims"]), "terms": len(c["attrs"].get("terms", [])),
            "banned": len(c["banned"]), "errors": c["errors"]}


def banned_in(text):
    text = str(text or "")
    return [w for w in _load()["banned"] if w and w in text]


KEEP = ["转运珠", "本命年"]   # 本身是品名或文化说法，含禁用词的字根但不是功效说法


def clean(text):
    text = str(text or "")
    for i, k in enumerate(KEEP):
        text = text.replace(k, f"\x00{i}\x00")
    for w in _load()["banned"]:
        text = text.replace(w, "")
    for i, k in enumerate(KEEP):
        text = text.replace(f"\x00{i}\x00", k)
    return text


def get(kid):
    return _load()["beads"].get(kid)


def public(b):
    """给用户看的版本：去掉把握低的字段和内部字段。"""
    if not b:
        return None
    if b.get("status") == "draft":   # 来源没查清的条目：只给名称、提示和合规，不给寓意和讲解
        return {k: b.get(k) for k in ("id", "name", "std", "category", "aliases", "summary", "compliance", "safety", "dims", "grades", "status")}
    conf = b.get("confidence") or {}
    out = {k: v for k, v in b.items() if k not in ("sources", "confidence", "review")}
    for k in GUARDED:
        if conf.get(k) == "low":
            out[k] = [] if isinstance(b.get(k), list) else ({} if isinstance(b.get(k), dict) else "")
    if isinstance(out.get("meaning"), dict):
        out["meaning"] = {"tags": [clean(t) for t in out["meaning"].get("tags", []) if clean(t)],
                          "text": clean(out["meaning"].get("text", ""))}
    return out


def index():
    """后台选品种用的精简清单。"""
    c = _load()
    words = {}   # 商家叫法也能搜到品种：输入“马粉”找到粉晶
    for t in c["attrs"].get("terms", []):
        for bid in t.get("beads") or []:
            words.setdefault(bid, []).append(t.get("term", ""))
    rows = []
    for b in c["beads"].values():
        al = list(dict.fromkeys([*(b.get("aliases") or []), *words.get(b["id"], [])]))
        rows.append({"id": b["id"], "name": b.get("name", ""), "std": b.get("std", ""), "category": b.get("category", ""),
                     "aliases": [a for a in al if a], "compliance": (b.get("compliance") or {}).get("level", "none"),
                     "draft": b.get("status") == "draft",
                     "mat": CAT_MAT.get(b.get("category"), "stone")})
    rows.sort(key=lambda r: (r["category"], r["name"]))
    return rows


def attributes():
    a = _load()["attrs"]
    return {"dims": a.get("dims", []), "grade_families": a.get("grade_families", []), "meaning_tags": a.get("meaning_tags", [])}


def points(bead):
    """料包商品的卖点：按顺序拼属性取值，例如“马达加斯加 · 冰透 · 星光”。"""
    attrs = bead.get("attrs") or {}
    out = [str(attrs[k]) for k in POINT_ORDER if attrs.get(k)]
    if attrs.get("treatment") == "天然":
        out.append("天然")
    kb = get(bead.get("kb"))
    if kb and bead.get("grade"):
        g = next((g for g in kb.get("grades", []) if g.get("level") == bead["grade"]), None)
        if g and g.get("label") and g["label"] not in out:
            out.append(g["label"])
    return [clean(p) for p in out if clean(p)][:4]


def enrich(bead):
    """料包商品带上知识库里的东西：卖点、寓意、讲解。原数据不改。"""
    b = dict(bead)
    kb = public(get(b.get("kb")))
    tags = [clean(t) for t in (b.get("tags") or []) if clean(t)]
    if kb:
        mt = (kb.get("meaning") or {}).get("tags") or []
        tags = mt[:3] or tags
        b["kbName"] = kb.get("name", "")
        b["meaning"] = (kb.get("meaning") or {}).get("text", "")
        b["summary"] = kb.get("summary", "")
        if (kb.get("safety") or {}).get("note"):
            b["safety"] = kb["safety"]["note"]
    b["tags"] = tags[:3]
    b["points"] = points(b)
    return b
