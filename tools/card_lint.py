#!/usr/bin/env python3
"""Check task cards against the integration tree and queue."""
import argparse
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASKS = ROOT / 'docs/design/tasks'
TOP = ('server/', 'miniprogram/', 'admin-web/', 'tools/', 'deploy/', 'docs/', 'kb/')
CODE = re.compile(r'`([^`]+)`')
ENV = re.compile(r'\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b')
HEADING = re.compile(r'^#{2,3} ([A-Z][A-Za-z0-9-]*)\b|^- \*\*([A-Z][A-Za-z0-9-]*)\b')


def git_text(base, path):
    result = subprocess.run(['git', 'show', f'{base}:{path}'], cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        raise ValueError(f'无法读取 {base}:{path}: {result.stderr.strip()}')
    return result.stdout


def queue_rows(text):
    rows = {}
    for line in text.splitlines():
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if line.startswith('| ') and len(cells) >= 7 and re.fullmatch(r'[A-Z][A-Za-z0-9-]*', cells[0]) and cells[0] != '卡':
            rows[cells[0]] = (cells[2], [x.strip() for x in re.split(r'[、,，\s]+', cells[3]) if x.strip()])
    return rows


def section(text, card):
    lines = text.splitlines()
    start = next((i for i, line in enumerate(lines) if (m := HEADING.match(line)) and card in m.groups()), None)
    if start is None:
        return []
    level = len(lines[start]) - len(lines[start].lstrip('#')) if lines[start].startswith('#') else 0
    end = next((i for i in range(start + 1, len(lines)) if (m := HEADING.match(lines[i])) and
                (level == 0 or (lines[i].startswith('#') and len(lines[i]) - len(lines[i].lstrip('#')) <= level))), len(lines))
    return list(enumerate(lines[start:end], start + 1))


def lint_card(card, card_text, queue, exists, env_text):
    problems = []
    if not section(card_text, card):
        return ['卡片章节不存在']
    for dep in queue[card][1]:
        if dep not in queue:
            problems.append(f'依赖卡号不存在：{dep}')
    for number, line in section(card_text, card):
        for raw in CODE.findall(line):
            path = raw.strip().rstrip('.,:：；;）)')
            if path.startswith(TOP) and '/' in path and not any(c in path for c in '*{}<> '):
                if '新建' not in line and not exists(path):
                    problems.append(f'{number} 行路径不存在：{path}')
            for name in ENV.findall(raw):
                if '新增' not in line and '新环境变量' not in line and name not in env_text:
                    problems.append(f'{number} 行环境变量不存在：{name}')
    return problems


def check(cards=None, base='origin/integration/2026-11', tasks=TASKS, exists=None, env_text=None):
    queue = queue_rows((tasks / 'queue.md').read_text(encoding='utf-8'))
    if exists is None:
        def exists(path):
            return subprocess.run(['git', 'cat-file', '-e', f'{base}:{path}'], cwd=ROOT, capture_output=True).returncode == 0
    if env_text is None:
        env_text = git_text(base, 'deploy/app.env.example') + '\n' + '\n'.join(
            p.read_text(encoding='utf-8', errors='replace') for p in (ROOT / 'server').rglob('*.py'))
    results = {}
    for card in cards or queue:
        if card not in queue:
            results[card] = ['卡号不在 queue.md']
            continue
        path = tasks / queue[card][0]
        results[card] = lint_card(card, path.read_text(encoding='utf-8') if path.is_file() else '', queue, exists, env_text)
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cards', nargs='*')
    parser.add_argument('--base', default='origin/integration/2026-11')
    args = parser.parse_args()
    try:
        results = check(args.cards, args.base)
    except ValueError as exc:
        parser.error(str(exc))
    for card, problems in results.items():
        print(f'{card}: ' + ('；'.join(problems) if problems else '通过'))
    return int(any(results.values()))


if __name__ == '__main__':
    raise SystemExit(main())
