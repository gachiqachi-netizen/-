"""方案库检查：python3 kb/validate_plans.py

查 kb/data/plans/*.json 里机器能查的问题，有错误时退出码 1：
- 格式：字段齐、标签取值在 SCHEMA 第 4 节的词表里、meaning 只用 attributes.json 的 meaning_tags、role 合法
- 品种：kb 存在，不是 draft、没有 safety、不是 banned、不是 combo（组合款式不是一种料）
- 受限料：只能出现在 high 档，必须有非受限替代，tips 要提醒合法来源
- 尺寸：mm 在 sizes.common 里或差 2mm 内；主珠直径统一；循环花型里的主珠和配珠同径（程序会把它们拉成同径）
- 佛头：不小于主珠、最多大 4mm；108 颗要有佛头和 3 颗隔珠，10mm 以上不写绕腕
- 文案：story / name / tips 没有 attributes.json 的 banned 词（“转运珠”“本命年”除外）和内部说明
- 串法禁忌：珍珠等软料紧挨硬石没隔片、绿松石配木珠/菩提/香珠、易掉色料紧挨白色浅色珠
- 孩子款：所有珠子 ≥8mm，不用易碎、易掉色材质，tips 写编绳、每颗打结
- 替代：替代品种合法、有方案用到的尺寸（差 2mm 内）、按 server/seed.py 单价不比原料贵（查不到就跳过）
- 预算：low 档按 seed.py 单价估 15cm 手围整串（含手工费 15）不超 ¥100；满串南红、绿松石、和田玉、蜜蜡、珍珠不能是 low；
  同一种料同尺寸的素串预算档一致
- 重复：配方完全相同、同名、同 id
警告（不影响退出码）：story 长度、替代品价位档比原料高（seed.py 里查不到单价时按 price_band 粗比）。
"""
import glob
import json
import os
import re
import runpy
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
ROOT = os.path.dirname(HERE)

AUDIENCE = {"自己（女）", "自己（男）", "女友", "男友", "老婆", "老公", "闺蜜", "兄弟", "妈妈", "爸爸", "长辈", "孩子", "学生",
            "同事", "领导", "老师", "情侣"}
OCCASION = {"日常", "生日", "纪念日", "情人节", "七夕", "新年", "本命年", "考试", "毕业", "升职", "新工作", "出行", "新婚", "乔迁",
            "母亲节", "父亲节", "教师节", "康复"}
STYLE = {"简约", "多宝", "文玩", "新中式", "少女", "复古", "轻奢", "清冷", "森系"}
GENDER = {"female", "male", "any"}
BUDGET = {"low", "mid", "high"}
ROLES = {"主珠", "配珠", "隔珠", "隔片", "佛头", "点缀"}
DIMS = {"color", "clarity", "purity", "effect", "pattern", "inclusion", "texture", "origin", "age", "shape", "treatment", "count"}
REQUIRED = ["id", "name", "audience", "occasion", "meaning", "style", "gender", "budget", "special", "pattern", "tail",
            "substitutes", "story", "tips", "sources", "confidence"]

METAL = {"gezhu", "zhuanyun"}                       # 金属配件：算隔片；配件大类（含佛头三通）不需要替代
SOFT = {"zhenzhu", "beike", "mila", "hupo", "shanhu", "cheqv"}   # 莫氏 2–4.5 的有机宝石
HARD_CATS = {"crystal", "agate", "feldspar", "colored"}
HARD_IDS = {"hetian-yu", "feicui", "dushan-yu", "dongling-yu", "shiyingyan-yu", "huanglong-yu", "jinsi-yu", "lantian-yu",
            "meihua", "qilian", "lvsong", "qingjin", "heiyao", "fangna", "chitie", "huangtie", "putao-shi", "kongque",
            "jinsha", "liuli", "boli"}
WOODY_CATS = {"wood", "bodhi", "incense", "kernel"}  # 要盘玩、会出油的
POROUS = {"lvsong"}                                 # 会吸油变色的
DYE_PRONE = {"putong-manao", "qingjin", "chansi", "lan-shuijing", "baisong", "huoshan", "liyunmu", "bi-shi", "xiangyaguo",
             "lvsong", "yeke"}
NATURAL = {"天然", "天然原矿", "天然白色", "A货（天然）", "加热", "加热（增透）"}   # 加热不掉色
LIGHT_IDS = {"bai-shuijing", "xingyue", "baiyu-puti", "zhenzhu", "beike", "xiangyaguo", "puti-gen", "yueguang-shi", "baisong",
             "gu-zhu", "huangyang", "lianzi"}
LIGHT_WORDS = ("白", "乳", "米黄", "浅黄", "顺白", "奶")
FRAGILE = {"ying-shi", "yueguang-shi", "zhenzhu", "beike", "liuli", "boli", "oubo", "lachang-shi", "fangjie", "taoci",
           "hupo", "mila", "kongque", "boli-maoyan"}
PRICY_MAIN = {"nanhong", "lvsong", "hetian-yu", "mila", "hupo", "zhenzhu", "feicui"}
BAND = {"低": 1, "中": 2, "高": 3, "很高": 4}
EXTRA_WORDS = ["心静", "静心", "模板", "小程序", "参照", "kb/"]
ALLOW = {"转运珠", "本命年"}
HANDWORK = 15

errors, warns = [], []


def err(pid, msg):
    m = f"{pid}：{msg}"
    if m not in errors:
        errors.append(m)


def warn(pid, msg):
    m = f"{pid}：{msg}"
    if m not in warns:
        warns.append(m)


# ---------- 读资料 ----------
beads = {}
for f in glob.glob(os.path.join(DATA, "beads", "*.json")):
    for b in json.load(open(f, encoding="utf-8")):
        beads[b["id"]] = b
attrs = json.load(open(os.path.join(DATA, "attributes.json"), encoding="utf-8"))
MEANING = set(attrs.get("meaning_tags", []))
BANNED = [b["word"] for b in attrs.get("banned", []) if b.get("word")]
rules = json.load(open(os.path.join(DATA, "rules.json"), encoding="utf-8"))
RULE_COUNTS = {int(c["count"]) for c in rules.get("counts", []) if str(c.get("count", "")).isdigit()}

seed = runpy.run_path(os.path.join(ROOT, "server", "seed.py"))
PRICE = defaultdict(dict)
for b in seed["BEADS"]:
    if b.get("kb"):
        PRICE[b["kb"]].setdefault(b["mm"], b["price"])


def price(kb, mm):
    """seed.py 单价：同尺寸优先，否则取差 2mm 内最近的；查不到返回 None。"""
    t = PRICE.get(kb) or {}
    if mm in t:
        return t[mm]
    near = sorted((abs(d - mm), d) for d in t if abs(d - mm) <= 2)
    return t[near[0][1]] if near else None


def band(kb):
    s = str(beads.get(kb, {}).get("price_band", "") or "")
    for k in ("很高", "高", "中", "低"):
        if s.startswith(k):
            return BAND[k]
    return None


def size_ok(kb, mm):
    common = (beads.get(kb, {}).get("sizes") or {}).get("common") or []
    return any(abs(c - mm) <= 2 for c in common)


def hits(t):
    t = str(t or "")
    for a in ALLOW:
        t = t.replace(a, "")
    return [w for w in BANNED + EXTRA_WORDS if w and w in t]


def natural(slot):
    return (slot.get("attrs") or {}).get("treatment") in NATURAL


def is_light(slot):
    kb = slot["kb"]
    color = str((slot.get("attrs") or {}).get("color", ""))
    if kb in LIGHT_IDS:
        return True
    return any(w in color for w in LIGHT_WORDS)


def is_hard(kb):
    return kb in HARD_IDS or beads.get(kb, {}).get("category") in HARD_CATS


def count_of(slot):
    m = re.search(r"(\d+)\s*颗", str((slot.get("attrs") or {}).get("count", "")))
    return int(m.group(1)) if m else None


def estimate(p):
    """按 server/plans.py 的铺法估 15cm 手围整串价；有槽位查不到单价就返回 None。"""
    sp, pt, tl = p["special"], p["pattern"], p["tail"]
    for s in sp + pt + tl:
        if price(s["kb"], s["mm"]) is None:
            return None
    fixed = next((count_of(s) for s in pt if count_of(s)), None)
    if fixed:
        n = max(0, fixed - len(sp) - len(tl))
        seq = sp + [pt[i % len(pt)] for i in range(n)] + tl
    else:
        mids = [s["mm"] for s in sp + pt + tl if s["kb"] not in METAL]
        main = max(set(mids), key=mids.count) if mids else 8
        target = round(150 + max(8, 2.5 * main - 5)) - sum(s["mm"] for s in tl)
        seq, i = list(sp), 0
        while sum(s["mm"] for s in seq) + pt[i % len(pt)]["mm"] / 2 < target and len(seq) < 80:
            seq.append(pt[i % len(pt)])
            i += 1
        seq += tl
    return round(sum(price(s["kb"], s["mm"]) for s in seq) + HANDWORK)


# ---------- 逐条检查 ----------
plans = []
for f in sorted(glob.glob(os.path.join(DATA, "plans", "*.json"))):
    try:
        rows = json.load(open(f, encoding="utf-8"))
    except Exception as e:
        err(os.path.basename(f), f"不是合法 JSON：{e}")
        continue
    plans += rows

ids, names, recipes = Counter(), Counter(), defaultdict(list)
budget_by_mat = defaultdict(set)

for p in plans:
    pid = p.get("id", "?")
    ids[pid] += 1
    miss = [k for k in REQUIRED if k not in p]
    if miss:
        err(pid, "缺字段：" + "、".join(miss))
        continue
    names[p["name"]] += 1
    if not 4 <= len(p["name"]) <= 8:
        err(pid, f"name 应为 4–8 字：{p['name']}")
    for key, vocab in (("audience", AUDIENCE), ("occasion", OCCASION), ("meaning", MEANING), ("style", STYLE)):
        v = p[key]
        if not isinstance(v, list) or not 1 <= len(v) <= 3:
            err(pid, f"{key} 要 1–3 个")
        bad = [x for x in v if x not in vocab]
        if bad:
            err(pid, f"{key} 取值不在词表：" + "、".join(bad))
    if p["gender"] not in GENDER:
        err(pid, f"gender 取值不对：{p['gender']}")
    if p["budget"] not in BUDGET:
        err(pid, f"budget 取值不对：{p['budget']}")
    if not p.get("sources"):
        err(pid, "没有 sources")
    if not 1 <= len(p["pattern"]) <= 8:
        err(pid, "pattern 要 1–8 颗")
    for k in ("special", "tail"):
        if len(p[k]) > 2:
            err(pid, f"{k} 最多 2 颗")

    slots = [(k, s) for k in ("special", "pattern", "tail") for s in p[k]]
    used = set()
    for k, s in slots:
        kb, mm, role = s.get("kb"), s.get("mm"), s.get("role")
        b = beads.get(kb)
        if not b:
            err(pid, f"{k} 里的品种不存在：{kb}")
            continue
        used.add(kb)
        if b.get("status") == "draft" or b.get("safety") or (b.get("compliance") or {}).get("level") == "banned" \
                or b.get("category") in ("combo", "banned"):
            err(pid, f"{kb} 不能入方案（draft / safety / banned / 组合款式）")
        if role not in ROLES:
            err(pid, f"{kb} 的 role 不对：{role}")
        if not isinstance(mm, (int, float)) or not size_ok(kb, mm):
            err(pid, f"{kb} {mm}mm 不在常见尺寸 {b.get('sizes', {}).get('common')} 的 2mm 内")
        for dk, dv in (s.get("attrs") or {}).items():
            if dk not in DIMS:
                err(pid, f"{kb} attrs 维度不认识：{dk}")
            elif dv not in (b.get("dims") or {}).get(dk, []):
                n = count_of(s) if dk == "count" else None
                handrope = n is not None and n <= 5 and ("手绳" in p["name"] + p["tips"] + p["story"])
                if not (n and (n in RULE_COUNTS or handrope)):
                    err(pid, f"{kb} attrs {dk}={dv} 不在该品种 dims 里")

    # 受限料
    restricted = [kb for kb in used if (beads.get(kb, {}).get("compliance") or {}).get("level") == "restricted"]
    for kb in restricted:
        if p["budget"] != "high":
            err(pid, f"受限料 {kb} 只能出现在 high 档")
        subs = p["substitutes"].get(kb) or []
        if not any((beads.get(x, {}).get("compliance") or {}).get("level") != "restricted" for x in subs):
            err(pid, f"受限料 {kb} 要给非受限替代")
        if "来源" not in p["tips"]:
            err(pid, f"用了受限料 {kb}，tips 要提醒合法来源")

    # 主珠
    mains = [s for k, s in slots if s.get("role") == "主珠"]
    if not any(s.get("role") == "主珠" for s in p["pattern"]):
        err(pid, "pattern 里没有主珠")
    main_mm = {s["mm"] for s in mains}
    if len(main_mm) > 1:
        err(pid, f"主珠直径不统一：{sorted(main_mm)}")
    mm0 = mains[0]["mm"] if mains else None
    pm = {s["mm"] for s in p["pattern"] if s.get("role") in ("主珠", "配珠")}
    if len(pm) > 1:
        err(pid, f"循环花型里主珠、配珠要同径（程序会拉成同径）：{sorted(pm)}")
    for k, s in slots:
        if s.get("role") == "佛头" and mm0 and not 0 <= s["mm"] - mm0 <= 4:
            err(pid, f"佛头 {s['mm']}mm 和主珠 {mm0}mm 不配（应同径或大 2–4mm）")

    # 108 颗
    fixed = next((count_of(s) for s in p["pattern"] if count_of(s)), None)
    text = p["story"] + p["tips"]
    if fixed == 108:
        if not any(s.get("role") == "佛头" for k, s in slots):
            err(pid, "108 颗要有佛头")
        if sum(1 for k, s in slots if s.get("role") == "隔珠") < 3:
            err(pid, "108 颗要有 3 颗分段隔珠")
        if mm0 and mm0 >= 10 and ("绕腕" in text or not ("挂颈" in text or "手持" in text)):
            err(pid, "10mm 以上 108 颗只能写挂颈或手持")

    # 文案
    for field in ("name", "story", "tips"):
        h = hits(p[field])
        if h:
            err(pid, f"{field} 里有禁用词：" + "、".join(h))
    if not 50 <= len(p["story"]) <= 140:
        warn(pid, f"story {len(p['story'])} 字，建议 60–120")

    # 串法禁忌：按“开头 + 花型×3 + 结尾”首尾相接看相邻
    seq = p["special"] + p["pattern"] * 3 + p["tail"]
    pairs = list(zip(seq, seq[1:] + seq[:1]))
    for a, c in pairs:
        if a["kb"] in METAL or c["kb"] in METAL or a["kb"] == c["kb"]:
            continue
        for x, y in ((a, c), (c, a)):
            if x["kb"] in SOFT and is_hard(y["kb"]):
                err(pid, f"{x['kb']} 紧挨硬石 {y['kb']}，中间要垫隔片")
            if x["kb"] in DYE_PRONE and not natural(x) and is_light(y):
                err(pid, f"易掉色的 {x['kb']} 紧挨浅色 {y['kb']}，要限定天然色或垫隔片")
    cats = {beads.get(kb, {}).get("category") for kb in used}
    if used & POROUS and cats & WOODY_CATS:
        err(pid, "绿松石不能和要盘玩的木珠、菩提、香珠同串")

    # 孩子款
    if "孩子" in p["audience"]:
        small = [f"{s['kb']}{s['mm']}" for k, s in slots if s["mm"] < 8]
        if small:
            err(pid, "孩子款珠子要 ≥8mm：" + "、".join(small))
        bad = [kb for kb in used if kb in FRAGILE]
        if bad:
            err(pid, "孩子款不用易碎材质：" + "、".join(bad))
        dyed = [s["kb"] for k, s in slots if s["kb"] in DYE_PRONE and not natural(s)]
        if dyed:
            err(pid, "孩子款不用易掉色材质：" + "、".join(dyed))
        if "编绳" not in p["tips"] or "打结" not in p["tips"]:
            err(pid, "孩子款 tips 要写编绳、每颗打结")

    # 替代
    sizes_of = defaultdict(set)
    for k, s in slots:
        sizes_of[s["kb"]].add(s["mm"])
    for kb in used - METAL:
        if beads.get(kb, {}).get("category") != "fitting" and not p["substitutes"].get(kb):
            err(pid, f"{kb} 没有替代")
    for kb, subs in p["substitutes"].items():
        if kb not in used:
            err(pid, f"substitutes 里的 {kb} 方案里没用到")
            continue
        for x in subs:
            bx = beads.get(x)
            if not bx:
                err(pid, f"替代品种不存在：{x}")
                continue
            if bx.get("status") == "draft" or bx.get("safety") or (bx.get("compliance") or {}).get("level") in ("banned", "restricted") \
                    or bx.get("category") in ("combo", "banned"):
                err(pid, f"替代 {x} 不能用（draft / safety / 受限 / 禁售）")
            if x == kb:
                err(pid, f"{kb} 替代成了自己")
            for mm in sizes_of[kb]:
                if not size_ok(x, mm):
                    err(pid, f"替代 {x} 没有 {mm}mm（差 2mm 内）")
                po, px = price(kb, mm), price(x, mm)
                if po is not None and px is not None:
                    if px > po:
                        err(pid, f"替代 {x}（¥{px}）比 {kb}（¥{po}）贵")
                elif band(x) and band(kb) and band(x) > band(kb):
                    warn(pid, f"替代 {x} 价位档比 {kb} 高（seed.py 里查不到单价，按 price_band 比）")

    # 预算
    est = estimate(p)
    if p["budget"] == "low" and est is not None and est > 100:
        err(pid, f"low 档按 seed.py 单价估 15cm 整串约 ¥{est}，超过 ¥100")
    handrope = bool(fixed and fixed <= 5)              # 手绳款只有几颗，不算满串
    if p["budget"] == "low" and not handrope and any(s["kb"] in PRICY_MAIN for s in mains):
        err(pid, "满串南红、绿松石、和田玉、蜜蜡、珍珠不能标 low")
    main_kbs = {s["kb"] for s in mains}
    if len(main_kbs) == 1 and mm0 and not handrope and all(s["kb"] in METAL or s["kb"] in main_kbs for s in p["pattern"]):
        budget_by_mat[(next(iter(main_kbs)), mm0)].add((p["budget"], pid))

    sig = json.dumps([[(s["kb"], s["mm"], s.get("role"), sorted((s.get("attrs") or {}).items())) for s in p[k]]
                      for k in ("special", "pattern", "tail")], ensure_ascii=False)
    recipes[sig].append(pid)

for k, v in ids.items():
    if v > 1:
        err(k, f"id 重复 {v} 次")
for k, v in names.items():
    if v > 1:
        err(k, f"方案名重复 {v} 次")
for sig, v in recipes.items():
    if len(v) > 1:
        err("、".join(v), "配方完全相同")
for (kb, mm), s in budget_by_mat.items():
    if len({b for b, _ in s}) > 1:
        err("、".join(sorted(pid for _, pid in s)), f"同为 {mm}mm {kb} 素串，预算档不一致：" + "、".join(sorted({b for b, _ in s})))

print(f"方案 {len(plans)} 条，错误 {len(errors)} 条，警告 {len(warns)} 条")
for e in errors:
    print(" ✗", e)
for w in warns:
    print(" !", w)
sys.exit(1 if errors else 0)
