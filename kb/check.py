"""覆盖率检查：拿一份外部名单（每行 大类|名字|叫法），看骨架里能不能找到每一种。

用法：python3 kb/check.py kb/check/blind_list.txt
输出：命中数、覆盖率，以及没找到的名字（按外部名单的大类分组），写到 kb/check/missing.txt。
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
kb = json.load(open(os.path.join(HERE, "taxonomy.json"), encoding="utf8"))

def norm(s):
    s = re.sub(r"[（(][^）)]*[）)]", "", s)          # 去掉括号注释
    s = s.replace("?", "").replace("？", "").strip()
    return re.sub(r"\s+", "", s).lower()

# 骨架里所有能认出来的词：品种名、规范名、叫法、细分值
index = {}
for c in kb["categories"]:
    for it in c["items"]:
        words = [it["name"], it["std"], *it["aliases"], *[v for g in it["sub"] for v in g["values"]]]
        for w in words:
            for part in re.split(r"[/、]", w):
                if norm(part):
                    index.setdefault(norm(part), f'{c["name"]} › {it["name"]}')

def find(names):
    for n in names:
        k = norm(n)
        if not k: continue
        if k in index: return index[k]
        # 宽松匹配：去掉常见后缀再比（“南红玛瑙”≈“南红”，“小叶紫檀手串”≈“小叶紫檀”）
        for suf in ["手串", "珠子", "珠", "石", "玉", "菩提", "木"]:
            if k.endswith(suf) and k[: -len(suf)] in index and len(k) - len(suf) >= 2:
                return index[k[: -len(suf)]]
    return None

src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "check", "blind_list.txt")
rows = [l.rstrip("\n").split("|") for l in open(src, encoding="utf8") if l.strip() and "|" in l and not l.startswith("#")]
hit, miss = [], {}
for r in rows:
    cat, name = r[0].strip(), r[1].strip()
    aliases = [a for a in (r[2].split(",") if len(r) > 2 else []) if a.strip()]
    where = find([name, *aliases])
    if where: hit.append((name, where))
    else: miss.setdefault(cat, []).append(name + (f"（{'、'.join(a.strip() for a in aliases[:4])}）" if aliases else ""))

total = len(rows)
print(f"外部名单 {total} 种，骨架里找到 {len(hit)} 种，覆盖率 {len(hit) / max(total, 1):.0%}，没找到 {total - len(hit)} 种")
out = os.path.join(HERE, "check", "missing.txt")
with open(out, "w", encoding="utf8") as f:
    for cat, names in miss.items():
        f.write(f"## {cat}（{len(names)}）\n" + "\n".join(names) + "\n\n")
print("没找到的清单：", out)
