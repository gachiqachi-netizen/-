"""知识库格式检查：python3 kb/validate.py

查机器能查的：品种和 taxonomy 对得上、字段齐、维度 key 合法、功效词、合规级别、把握标注。
内容对不对交给审校 agent。结果写到 kb/data/validate.json。
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
DIMS = {"color", "clarity", "purity", "effect", "pattern", "inclusion", "texture", "origin", "age", "shape", "treatment", "count"}
REQUIRED = ["id", "name", "std", "category", "summary", "look", "identify", "confusables", "dims", "grades", "sizes",
            "treatments", "compliance", "meaning", "sources", "confidence"]
BANNED_ONLY = ["id", "name", "std", "category", "summary", "look", "identify", "confusables", "compliance", "sources"]
FALLBACK_BANNED = ["招财", "转运", "辟邪", "避邪", "挡煞", "能量", "净化", "消磁", "开光", "加持", "护身", "安神", "助眠", "治疗", "保佑"]

tax = json.load(open(os.path.join(HERE, "taxonomy.json"), encoding="utf-8"))
want = {it["id"]: (c["id"], it) for c in tax["categories"] for it in c["items"]}
attrs_path = os.path.join(DATA, "attributes.json")
attrs = json.load(open(attrs_path, encoding="utf-8")) if os.path.exists(attrs_path) else {}
banned = [b["word"] for b in attrs.get("banned", []) if b.get("word")] or FALLBACK_BANNED
# 本身是文化说法、在禁用词里只是词根的，不按子串误伤
ALLOW = {"转运珠", "本命年"}


def texts(b):
    m = b.get("meaning") or {}
    yield "summary", b.get("summary", "")
    yield "meaning", m.get("text", "")
    yield "meaning.tags", " ".join(m.get("tags", []))
    yield "story", b.get("story", "")
    yield "look", b.get("look", "")


def hits(t):
    t = str(t or "")
    for a in ALLOW:
        t = t.replace(a, "")
    return [w for w in banned if w and w in t]


report, seen = {}, {}
for f in sorted(glob.glob(os.path.join(DATA, "beads", "*.json"))):
    try:
        rows = json.load(open(f, encoding="utf-8"))
    except Exception as e:
        report[os.path.basename(f)] = [f"文件不是合法 JSON：{e}"]
        continue
    for b in rows:
        bid = b.get("id", "?")
        issues = []
        if bid not in want:
            issues.append("taxonomy 里没有这个 id")
        else:
            cat, it = want[bid]
            seen[bid] = True
            if b.get("category") != cat:
                issues.append(f"category 应为 {cat}")
            if b.get("name") != it["name"]:
                issues.append(f"name 应为 {it['name']}")
            flags = it.get("flags", [])
            lvl = (b.get("compliance") or {}).get("level")
            if cat == "banned" and lvl != "banned":
                issues.append("禁售大类 compliance.level 应为 banned")
            if "合规" in flags and cat != "banned" and lvl != "restricted":
                issues.append("taxonomy 标了合规，compliance.level 应为 restricted")
            if "名称易混" in flags and not b.get("confusables"):
                issues.append("taxonomy 标了名称易混，confusables 不能空")
            if "常见处理" in flags and not b.get("treatments"):
                issues.append("taxonomy 标了常见处理，treatments 不能空")
            if "待核" in flags and "high" in (b.get("confidence") or {}).values():
                issues.append("taxonomy 标了待核，confidence 里不该有 high")
            need = BANNED_ONLY if cat == "banned" else REQUIRED
            miss = [k for k in need if k not in b]
            if miss:
                issues.append("缺字段：" + "、".join(miss))
        bad_dims = [k for k in (b.get("dims") or {}) if k not in DIMS]
        if bad_dims:
            issues.append("dims 里有不认识的维度：" + "、".join(bad_dims))
        for g in b.get("grades") or []:
            if re.search(r"\dA|AA|A级", str(g.get("label", ""))):
                issues.append("品级用了 A 数：" + str(g.get("label")))
        for field, t in texts(b):
            h = hits(t)
            if h:
                issues.append(f"{field} 里有功效词：" + "、".join(h))
        if not b.get("sources"):
            issues.append("没有 sources")
        if issues:
            report[bid] = issues

missing = [k for k in want if k not in seen]
out = {"total": len(seen), "expected": len(want), "missing": missing, "issues": report}
json.dump(out, open(os.path.join(DATA, "validate.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"已填 {len(seen)}/{len(want)} 种，有问题 {len(report)} 条，缺 {len(missing)} 种")
for k, v in list(report.items())[:40]:
    print(" -", k, "：", "；".join(v))
sys.exit(1 if report or missing else 0)
