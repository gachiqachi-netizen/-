"""方案库：先查库，再按手围和预算微调。

流程：听懂需求（抽标签）→ 在 kb/data/plans 里打分找最贴近的方案 → 把方案里的“品种 + 尺寸”换成料包里在卖的珠子
→ 按手围算颗数 → 超预算就换替代珠或小一号 → 返回 3 条。AI 只负责抽标签和把话说顺，配方和价格都由这里算。
"""
import glob
import json
import os
import re

import kb

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb", "data"))
_cache = {"stamp": None, "plans": [], "rules": {}}
HANDWORK = 15

# ---------- 读取 ----------

def _load():
    files = sorted(glob.glob(os.path.join(ROOT, "plans", "*.json")))
    rp = os.path.join(ROOT, "rules.json")
    stamp = tuple((f, os.path.getmtime(f)) for f in files + ([rp] if os.path.exists(rp) else []))
    if stamp == _cache["stamp"]:
        return _cache
    plans = []
    for f in files:
        try:
            with open(f, encoding="utf-8") as source:
                plans += [p for p in json.load(source) if isinstance(p, dict) and p.get("id")]
        except Exception:
            pass
    rules = {}
    if os.path.exists(rp):
        try:
            with open(rp, encoding="utf-8") as source:
                rules = json.load(source)
        except Exception:
            rules = {}
    _cache.update(stamp=stamp, plans=plans, rules=rules)
    return _cache


def rules():
    return _load()["rules"]


def all_plans():
    return _load()["plans"]

# ---------- 听懂需求：从一句话里抽标签（没有 AI 时用；有 AI 时由 AI 抽，格式相同） ----------

AUDIENCE = [("男朋友", "男友"), ("男友", "男友"), ("老公", "老公"), ("丈夫", "老公"), ("女朋友", "女友"), ("女友", "女友"), ("老婆", "老婆"),
            ("媳妇", "老婆"), ("闺蜜", "闺蜜"), ("姐妹", "闺蜜"), ("兄弟", "兄弟"), ("哥们", "兄弟"), ("妈妈", "妈妈"), ("母亲", "妈妈"), ("老妈", "妈妈"),
            ("爸爸", "爸爸"), ("父亲", "爸爸"), ("老爸", "爸爸"), ("爷爷", "长辈"), ("奶奶", "长辈"), ("外婆", "长辈"), ("外公", "长辈"), ("长辈", "长辈"),
            ("婆婆", "长辈"), ("岳", "长辈"), ("孩子", "孩子"), ("宝宝", "孩子"), ("女儿", "孩子"), ("儿子", "孩子"), ("学生", "学生"), ("同学", "学生"),
            ("同事", "同事"), ("领导", "领导"), ("老板", "领导"), ("老师", "领导"), ("情侣", "情侣"), ("一对", "情侣"), ("自己", "自己")]
OCCASION = [("生日", "生日"), ("纪念日", "纪念日"), ("周年", "纪念日"), ("情人节", "情人节"), ("520", "情人节"), ("七夕", "七夕"), ("新年", "新年"),
            ("春节", "新年"), ("过年", "新年"), ("本命年", "本命年"), ("考试", "考试"), ("考研", "考试"), ("高考", "考试"), ("考公", "考试"),
            ("毕业", "毕业"), ("升职", "升职"), ("晋升", "升职"), ("新工作", "新工作"), ("入职", "新工作"), ("跳槽", "新工作"), ("出行", "出行"),
            ("旅行", "出行"), ("出远门", "出行"), ("出差", "出行"), ("结婚", "新婚"), ("新婚", "新婚"), ("乔迁", "乔迁"), ("搬家", "乔迁"),
            ("母亲节", "母亲节"), ("父亲节", "父亲节"), ("教师节", "教师节"), ("康复", "康复"), ("出院", "康复"), ("通勤", "日常"), ("上班", "日常")]
STYLE = [("简约", "简约"), ("简单", "简约"), ("素", "简约"), ("多宝", "多宝"), ("文玩", "文玩"), ("盘玩", "文玩"), ("新中式", "新中式"), ("国风", "新中式"),
         ("少女", "少女"), ("可爱", "少女"), ("甜", "少女"), ("复古", "复古"), ("轻奢", "轻奢"), ("高级", "轻奢"), ("清冷", "清冷"), ("森系", "森系")]
# 用户说的心愿 → 寓意标签（文化说法）。“财、运”这类映射到吉祥寓意，不承诺效果
WISH = [("平安", "平安"), ("健康", "平安"), ("顺利", "吉祥"), ("好运", "吉祥"), ("运气", "吉祥"), ("转运", "吉祥"), ("财", "富足"), ("钱", "富足"),
        ("富", "富贵"), ("红火", "红火"), ("喜庆", "喜庆"), ("事业", "稳重"), ("工作", "稳重"), ("学业", "书卷气"), ("考", "书卷气"),
        ("爱情", "爱情"), ("恋爱", "爱情"), ("桃花", "浪漫"), ("甜", "甜蜜"), ("温柔", "温柔"), ("沉稳", "沉稳"), ("稳重", "稳重"),
        ("安静", "宁静"), ("静心", "宁静"), ("长寿", "长寿"), ("友谊", "友谊"), ("人缘", "好人缘"), ("清透", "清透"), ("干净", "纯净"),
        ("圆满", "圆满"), ("团圆", "团圆"), ("话少", "内敛"), ("内向", "内敛"), ("低调", "内敛"), ("稳", "沉稳"), ("优雅", "优雅"),
        ("大气", "大气"), ("阳光", "阳光"), ("活泼", "活力"), ("文艺", "雅致"), ("书生", "书卷气"), ("清冷", "清雅"), ("仙", "梦幻")]
COLORS = [("粉", "粉"), ("红", "红"), ("紫", "紫"), ("蓝", "蓝"), ("绿", "绿"), ("黑", "黑"), ("白", "白"), ("黄", "黄"), ("金", "金")]
MALE = ("男", "他", "老公", "男友", "男朋友", "爸", "父亲", "兄弟", "哥", "爷爷", "外公")
FEMALE = ("女", "她", "老婆", "女友", "女朋友", "妈", "母亲", "闺蜜", "姐", "妹", "奶奶", "外婆", "婆婆")


def extract(text, history=None):
    """把一句话（加上之前说过的）抽成标签。后说的覆盖先说的预算和性别。"""
    t = " ".join([*(history or []), text or ""])
    pick = lambda table: list(dict.fromkeys(v for k, v in table if k in t))
    tags = {"audience": pick(AUDIENCE), "occasion": pick(OCCASION), "style": pick(STYLE), "meaning": pick(WISH), "colors": pick(COLORS)}
    if "自己" in tags["audience"]:
        tags["audience"].remove("自己")
        tags["audience"].append("自己（男）" if any(w in t for w in ("男生", "男士", "我是男")) else "自己（女）")
    m = None
    for m in re.finditer(r"(\d{2,4})\s*(?:元|块)?\s*(?:以内|以下|之内|左右|预算|内)", t):
        pass
    tags["budget"] = int(m.group(1)) if m else None
    last = text or t
    g = None
    for src in (last, t):
        male = any(w in src for w in MALE)
        female = any(w in src for w in FEMALE)
        if male != female:
            g = "male" if male else "female"
            break
    tags["gender"] = g
    return tags

# ---------- 打分 ----------

TIER = {"low": (0, 100), "mid": (100, 300), "high": (300, 99999)}


def score(p, tags):
    s = 0.0
    aud = set(p.get("audience") or [])
    if tags["audience"]:
        s += 6 if aud & set(tags["audience"]) else -2
    s += 3 * len(set(p.get("occasion") or []) & set(tags["occasion"]))
    s += 2 * len(set(p.get("meaning") or []) & set(tags["meaning"]))
    s += 1.5 * len(set(p.get("style") or []) & set(tags["style"]))
    if tags["gender"] and p.get("gender") not in ("any", tags["gender"]):
        s -= 8
    if tags["budget"]:
        lo, hi = TIER.get(p.get("budget"), (0, 99999))
        s += 1.5 if lo <= tags["budget"] else -1.5
    if tags["colors"]:
        words = json.dumps([p.get("name"), p.get("story")], ensure_ascii=False)
        s += 0.8 * sum(1 for c in tags["colors"] if c in words)
    return s

# ---------- 配到料包里的珠子 ----------

def _match_slot(slot, beads, swaps):
    """槽位（品种 + 尺寸 + 属性）→ (料包珠子 id, 换成的品种或 None)。
    同品种先换尺寸；料包里根本没有这个品种，才用方案写的替代品种。隔珠按颜色配。"""
    want_mm = slot.get("mm") or 8
    attrs = slot.get("attrs") or {}
    small = slot.get("role") in ("隔珠", "隔片", "点缀")

    def pick(kid):
        cands = [b for b in beads if b.get("kb") == kid]
        if not cands and small:   # 没有指定的配件就用任意在卖的金属隔珠
            cands = [b for b in beads if b.get("mat") == "metal" or b.get("spacer")]
        if not cands:
            return None
        def key(b):
            hit = sum(1 for k, v in attrs.items() if (b.get("attrs") or {}).get(k) == v)
            dm = abs((b.get("mm") or 0) - want_mm)
            return (-hit, dm, b.get("price") or 0) if small else (dm, -hit, b.get("price") or 0)
        return min(cands, key=key)

    b = pick(slot.get("kb"))
    if b:
        return b["id"], None
    for alt in swaps.get(slot.get("kb"), []):
        b = pick(alt)
        if b:
            return b["id"], alt
    return None, None


def _fixed(p):
    """108 颗这类按颗数串的方案：颗数写在主珠的 attrs.count 里。"""
    for slot in p.get("pattern") or []:
        m = re.search(r"(\d+)\s*颗", str((slot.get("attrs") or {}).get("count", "")))
        if m:
            return int(m.group(1))
    return None


def _fill(special, pattern, tail, item, wrist, fixed=None):
    if fixed:   # 按颗数串：不看手围
        n = max(0, fixed - len(special) - len(tail))
        return list(special) + [pattern[i % len(pattern)] for i in range(n)] + list(tail)
    mids = [item[x]["mm"] for x in special + pattern + tail if not item[x].get("spacer")]
    main = max(set(mids), key=mids.count) if mids else 8
    target = round(wrist * 10 + max(8, 2.5 * main - 5)) - sum(item[x]["mm"] for x in tail)
    out, i = list(special), 0
    while sum(item[x]["mm"] for x in out) + item[pattern[i % len(pattern)]]["mm"] / 2 < target and len(out) < 80:
        out.append(pattern[i % len(pattern)]); i += 1
    return out + list(tail)


def realize(p, beads, wrist, budget=None):
    item = {b["id"]: b for b in beads}
    swaps = p.get("substitutes") or {}
    parts, swapped = {}, []
    for k in ("special", "pattern", "tail"):
        ids = []
        for slot in p.get(k) or []:
            bid, alt = _match_slot(slot, beads, swaps)
            if alt:
                o, n = kb.get(slot.get("kb")), kb.get(alt)
                note = f"料包暂缺{(o or {}).get('name', slot.get('kb'))}，换成了{(n or {}).get('name', alt)}"
                if note not in swapped:
                    swapped.append(note)
            if bid is None:
                if k == "pattern":
                    return None   # 主花型配不出来，这条方案料包里暂时没货
                continue
            ids.append(bid)
        parts[k] = ids
    if not parts["pattern"]:
        return None
    # 主花型尺寸统一：主珠各自配到的尺寸不一致时，都换成料包里共有的、最接近方案的尺寸
    mains = [i for i, slot in enumerate(p.get("pattern") or []) if slot.get("role") not in ("隔珠", "隔片", "点缀") and i < len(parts["pattern"])]
    if len({item[parts["pattern"][i]]["mm"] for i in mains}) > 1:
        want = (p["pattern"][mains[0]].get("mm") or 8)
        kinds = {item[parts["pattern"][i]].get("kb") for i in mains}
        common = set.intersection(*[{b["mm"] for b in beads if b.get("kb") == k} for k in kinds]) if kinds else set()
        if common:
            mm = min(common, key=lambda d: abs(d - want))
            for i in mains:
                k = item[parts["pattern"][i]].get("kb")
                parts["pattern"][i] = min((b for b in beads if b.get("kb") == k and b["mm"] == mm), key=lambda b: b.get("price") or 0)["id"]
    fixed = _fixed(p)
    seq = _fill(parts["special"], parts["pattern"], parts["tail"], item, wrist, fixed)
    price = round(sum(item[x].get("price") or 0 for x in seq) + HANDWORK)
    notes = []
    if budget and price > budget:   # 超预算：先换替代品种里更便宜的，再试小一号
        for k in ("pattern", "special"):
            for i, bid in enumerate(parts[k]):
                cur = item[bid]
                alts = [b for b in beads if b.get("kb") in swaps.get(cur.get("kb"), []) and abs((b.get("mm") or 0) - cur["mm"]) <= 2
                        and (b.get("price") or 0) < (cur.get("price") or 0)]
                if alts:
                    alt = min(alts, key=lambda b: b.get("price") or 0)
                    parts[k][i] = alt["id"]
                    notes.append(f"{cur['name']}换成{alt['name']}")
        seq = _fill(parts["special"], parts["pattern"], parts["tail"], item, wrist, fixed)
        price = round(sum(item[x].get("price") or 0 for x in seq) + HANDWORK)
        if price > budget:
            smaller = []
            for bid in parts["pattern"]:
                cur = item[bid]
                same = sorted([b for b in beads if b.get("kb") == cur.get("kb") and b["mm"] < cur["mm"]], key=lambda b: -b["mm"])
                smaller.append(same[0]["id"] if same else bid)
            if smaller != parts["pattern"]:
                parts["pattern"] = smaller
                notes.append("主珠换小一号")
                seq = _fill(parts["special"], parts["pattern"], parts["tail"], item, wrist, fixed)
                price = round(sum(item[x].get("price") or 0 for x in seq) + HANDWORK)
    return {"id": p["id"], "src": "plan", "name": kb.clean(p.get("name", "")), "meaning": kb.clean(p.get("story", "")) + (f"（{'；'.join(swapped)}）" if swapped else ""),
            "tips": kb.clean(p.get("tips", "")), "special": parts["special"], "pattern": parts["pattern"], "tail": parts["tail"],
            "price": price, "count": len(seq), "fixed": fixed, "length": sum(item[x]["mm"] for x in seq), "notes": notes,
            "overBudget": bool(budget and price > budget), "swapped": swapped, "tags": p.get("meaning", [])}


def match(text, beads, wrist=15, history=None, exclude=(), tags=None, n=3):
    tags = tags or extract(text, history)
    ranked = sorted(all_plans(), key=lambda p: -score(p, tags))
    pool, seen_names = [], set()
    for p in ranked:   # 先按贴合度取前十条配得出来的，再把不超预算的排前面
        if p["id"] in exclude:
            continue
        r = realize(p, beads, wrist, tags.get("budget"))
        if not r or r["name"] in seen_names:
            continue
        r["_score"] = score(p, tags)
        pool.append(r); seen_names.add(r["name"])
        if len(pool) >= max(10, n):
            break
    # 先保贴合：只在和最佳方案分差不大的里面优先不超预算的；不够 3 条再往下补
    top = pool[0]["_score"] if pool else 0
    close = [r for r in pool if r["_score"] >= top - 3]
    rest = [r for r in pool if r not in close]
    out = (sorted(close, key=lambda r: r["overBudget"]) + rest)[:n]
    for r in pool:
        r.pop("_score", None)
    return {"tags": tags, "results": out, "reply": reply(tags, out)}


def reply(tags, out):
    if not out:
        return "库里暂时没有合适的现成方案，我按你的要求重新搭几条。"
    who = "、".join(tags["audience"]) if tags["audience"] else ""
    bits = [f"送{who}" if who and "自己" not in who else "", "、".join(tags["occasion"]), f"{tags['budget']} 以内" if tags.get("budget") else ""]
    head = "，".join(b for b in bits if b)
    over = [r for r in out if r["overBudget"]]
    tail = f"其中 {len(over)} 条略超预算，可以接着让我换便宜的。" if over else "都按你的手围算好了颗数。"
    return (f"按{head}挑了 {len(out)} 条现成搭配，" if head else f"挑了 {len(out)} 条现成搭配，") + tail


# ---------- 指定颗数：反推珠径 ----------

def size_for_count(count, sizes, wrist):
    """在可选的珠径里挑一个，让 count 颗串起来最接近合适长度。"""
    best = None
    for d in sizes:
        target = wrist * 10 + max(8, 2.5 * d - 5)
        diff = count * d - target
        if best is None or abs(diff) < abs(best[1]):
            best = (d, diff)
    return {"mm": best[0], "diff": round(best[1], 1), "ok": -4 <= best[1] <= 6} if best else None
