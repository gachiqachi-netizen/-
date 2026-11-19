"""Preview or fill missing allowed fields on existing beads."""
import argparse
import json
import re
import sys
from pathlib import Path

import load_seed

ALLOWED = {'c', 'kb'}
COLOR = re.compile(r'^#[0-9a-fA-F]{6}$')


def validate(rows):
    if not isinstance(rows, list):
        raise ValueError('补丁文件必须是列表')
    seen = set()
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get('id'), str) or not row['id']:
            raise ValueError('每条补丁都必须有 id')
        if row['id'] in seen:
            raise ValueError(f"重复 id：{row['id']}")
        seen.add(row['id'])
        fields = set(row) - {'id', 'source'}
        if not fields or not fields <= ALLOWED or set(row) - {'id', 'source'} - ALLOWED:
            raise ValueError(f"{row['id']} 包含不允许的字段或没有可补字段")
        if 'c' in row and (not isinstance(row['c'], list) or len(row['c']) != 2
                           or any(not isinstance(value, str) or not COLOR.fullmatch(value) for value in row['c'])):
            raise ValueError(f"{row['id']} 的 c 必须是两个 #rrggbb 颜色")
        if 'kb' in row and (not isinstance(row['kb'], str) or not row['kb'].strip()):
            raise ValueError(f"{row['id']} 的 kb 必须是非空字符串")
        if 'source' in row and row['source'] not in ('photo', 'name'):
            raise ValueError(f"{row['id']} 的 source 不合法")


def load(db, rows, apply=False, output=print):
    validate(rows)
    current = {bead['id']: bead for bead in db.list('beads')}
    missing = [row['id'] for row in rows if row['id'] not in current]
    for rid in missing:
        output(f'{rid}：id 不存在，不写')
    counts = {'filled': 0, 'skipped': 0, 'missing': len(missing)}
    for row in rows:
        rid = row['id']
        if rid not in current:
            continue
        # Re-read on apply so an edit made after preview never gets overwritten.
        bead = db.get('beads', rid) if apply else current[rid]
        additions = {field: row[field] for field in ALLOWED if field in row and not bead.get(field)}
        if not additions:
            counts['skipped'] += 1
            output(f'{rid}：已有字段，跳过')
            continue
        if apply:
            db.put('beads', rid, {**bead, **additions})
        counts['filled'] += 1
        output(f"{rid}：{'已补' if apply else '将补'} {','.join(sorted(additions))}")
    output(f"汇总：{'已补' if apply else '将补'} {counts['filled']}，跳过 {counts['skipped']}，id 不存在 {counts['missing']}")
    return counts


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('path', type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args(argv)
    try:
        rows = json.loads(args.path.read_text(encoding='utf-8'))
        db = load_seed.open_database()
        print('执行补缺' if args.apply else '预览（不写入）')
        load(db, rows, apply=args.apply)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    except Exception:
        print('数据库连接或写入失败，请检查服务端日志和数据库配置。', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
