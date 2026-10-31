"""把 taxonomy.txt（人好改的格式）转成 taxonomy.json（程序用）。"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
FLAGS = {"名称易混", "常见处理", "合规", "待核"}
cats, cur, ids, errs = [], None, set(), []
for n, line in enumerate(open(os.path.join(HERE, "taxonomy.txt"), encoding="utf8"), 1):
    line = line.rstrip("\n")
    if not line.strip() or line.startswith("#   ") or line.startswith("# 格式") or line.startswith("# 标记") or line.startswith("# 珠子"):
        continue
    if line.startswith("# "):
        cid, name, desc = line[2:].split("|")
        cur = {"id": cid, "name": name, "desc": desc, "items": []}; cats.append(cur); continue
    f = line.split("|")
    if len(f) != 7:
        errs.append(f"第 {n} 行有 {len(f)} 段：{line}"); continue
    iid, name, std, aliases, sub, note, flags = f
    if iid in ids: errs.append(f"第 {n} 行 id 重复：{iid}")
    ids.add(iid)
    fl = [x for x in flags.split(",") if x]
    bad = [x for x in fl if x not in FLAGS]
    if bad: errs.append(f"第 {n} 行未知标记：{bad}")
    groups = []
    for g in [g for g in sub.split(";") if g]:
        k, _, v = g.partition(":")
        groups.append({"name": k, "values": [x for x in v.split(",") if x]})
    cur["items"].append({"id": iid, "name": name, "std": std, "aliases": [x for x in aliases.split(",") if x],
                         "sub": groups, "note": note, "flags": fl})
if errs:
    print("\n".join(errs)); sys.exit(1)
out = {"version": "0.1", "standard": "GB/T 16552-2017《珠宝玉石 名称》（玉石类）；木、植物籽用通用中文名", "categories": cats}
json.dump(out, open(os.path.join(HERE, "taxonomy.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
items = sum(len(c["items"]) for c in cats)
subs = sum(len(g["values"]) for c in cats for i in c["items"] for g in i["sub"])
print(f"{len(cats)} 大类 / {items} 品种 / {subs} 个细分", {fl: sum(fl in i["flags"] for c in cats for i in c["items"]) for fl in FLAGS})
# 审阅页：把数据和待核实清单嵌进模板
def fill_pending(t):
    import html
    p = os.path.join(HERE, "check", "missing.txt")
    txt = open(p, encoding="utf8").read().strip() if os.path.exists(p) else "（暂无）"
    n = sum(1 for l in txt.splitlines() if l.strip() and not l.startswith("##"))
    return t.replace("/*PENDING_N*/", str(n)).replace("/*PENDING*/", html.escape(txt.replace("## ", "")))
tpl = open(os.path.join(HERE, "review.template.html"), encoding="utf8").read()
open(os.path.join(HERE, "review.html"), "w", encoding="utf8").write(fill_pending(tpl).replace("/*KB_JSON*/null", json.dumps(out, ensure_ascii=False)))
