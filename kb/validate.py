"""知识库格式检查：python3 kb/validate.py。结果写到 kb/data/validate.json。"""
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
sys.path.insert(0, os.path.normpath(os.path.join(HERE, '..', 'server')))
import kb_rules  # noqa: E402

want = kb_rules.taxonomy_items()
attrs_path = os.path.join(DATA, 'attributes.json')
attrs = json.load(open(attrs_path, encoding='utf-8')) if os.path.exists(attrs_path) else {}
dicts = {**attrs, '_taxonomy': want}

report, seen = {}, {}
for path in sorted(glob.glob(os.path.join(DATA, 'beads', '*.json'))):
    try:
        rows = json.load(open(path, encoding='utf-8'))
    except Exception as exc:
        report[os.path.basename(path)] = [f'文件不是合法 JSON：{exc}']
        continue
    for bead in rows:
        bid = bead.get('id', '?')
        if bid in want:
            seen[bid] = True
        issues = [error['message'] for error in kb_rules.check_bead(bead, dicts, mode='existing')]
        if issues:
            report[bid] = issues

missing = [key for key in want if key not in seen]
out = {'total': len(seen), 'expected': len(want), 'missing': missing, 'issues': report}
json.dump(out, open(os.path.join(DATA, 'validate.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'已填 {len(seen)}/{len(want)} 种，有问题 {len(report)} 条，缺 {len(missing)} 种')
for key, messages in list(report.items())[:40]:
    print(' -', key, '：', '；'.join(messages))
sys.exit(1 if report or missing else 0)
