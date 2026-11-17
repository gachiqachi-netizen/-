#!/usr/bin/env python3
"""生成任务看板 docs/design/tasks/board.md：每张卡现在什么状态、能不能派、派的提示词。

数据全部来自仓库本身：queue.md（卡、依赖、等负责人）、integration 分支的提交记录（合没合）、
远端 agent/* 分支（有没有人在做）、卡片文件里的标题（这张卡做什么）。
用法（仓库根目录）：
    git fetch origin --prune && python3 tools/board.py
"""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASKS = ROOT / 'docs/design/tasks'
import os
BASE = os.environ.get('BOARD_BASE', 'origin/integration/2026-11')  # 审核在临时目录里合并后用 BOARD_BASE=HEAD
WAVE1 = {'A11', 'A11m', 'C0g', 'C0i', 'C0z', 'C2', 'D2', 'D1b'}
OWNER_ONLY = {'C11b': '负责人在开发者工具和真机上把三条主流程逐屏走一遍（等 V3、W1、U16 都合并后）'}
ADMIN_FILES = {'admin-wave1.md', 'admin-wave2.md'}
MINI_FILES = {'miniprogram-wave1.md', 'miniprogram-wave2.md'}


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True).stdout


def titles():
    found = {}
    for path in TASKS.glob('*.md'):
        for line in path.read_text(encoding='utf-8').splitlines():
            m = (re.match(r'#{2,3} ([A-Z][A-Za-z0-9-]*) (.+)', line)
                 or re.match(r'- \*\*([A-Z][A-Za-z0-9-]*) ([^*]+)\*\*', line))
            if m and m.group(1) not in found:
                found[m.group(1)] = re.sub(r'（[^）]*）', '', m.group(2)).strip()
    return found


def rows():
    out = []
    for line in (TASKS / 'queue.md').read_text(encoding='utf-8').splitlines():
        if not re.match(r'\| [A-Z]', line):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) < 7 or cells[0] == '卡':
            continue
        out.append(dict(card=cells[0], branch=cells[1], file=cells[2],
                        deps=[d for d in cells[3].split('、') if d], who=cells[4],
                        wait=cells[6]))
    return out


def prompt(r, title):
    kind = r['file']
    extra = []
    if kind in MINI_FILES or kind.startswith('followups-ui') or r['card'] in ('V3', 'V6', 'W1'):
        extra.append('页面只用 U0 的 c-page、c-card、c-cell、c-bar 组件拼；交付前跑 python3 tools/check-ui.py；'
                     '用 tools/shoot 截改前改后的图（先登录、等数据加载完；空状态、出错状态也截），提交到 docs/reports/shots/' + r['card'] + '/。')
    if kind in ADMIN_FILES or r['card'] in ('AI2', 'V4', 'V5', 'F1', 'F2', 'F3', 'U11', 'R1'):
        extra.append('改了后台就加跑 npm run build（第一次先 cd admin-web && npm ci），打包文件不提交。')
    deps = '、'.join(r['deps'])
    gate = (f'开工前先跑 git log origin/integration/2026-11 --oneline | grep -E "^[0-9a-f]+ ({"|".join(r["deps"])}):" | grep -v "开工$"，'
            f'{deps} 都有提交才开工，否则停下等我。') if r['deps'] else ''
    return (
        '你是“串个珠”项目的执行者。仓库 https://github.com/gachiqachi-netizen/-.git（私有，HTTPS），'
        f'所有工作从 origin/integration/2026-11 开始。\n'
        f'这次直接领 {r["card"]}（{title}，卡在 docs/design/tasks/{r["file"]}，先读文件开头的共同规矩，再读 {r["card"]} 这一节）。{gate}\n'
        f'从最新的 origin/integration/2026-11 开新目录 ~/chuan-{r["card"]}，读 docs/design/tasks/02-prompts.md 里的“Codex 总提示词”，照它做：'
        f'领卡占位、只改卡上“只能改”的文件、跑三条测试、写交付报告、推送到 {r["branch"]}，不要直接推 integration。'
        + ''.join(extra) + '\n'
        f'交付后回复“{r["card"]} 交了，分支 xxx，没做的：……”然后停下。收到审核意见时在原分支改完再推送。'
    )


def main():
    log = git('log', '--format=%s', BASE)
    merged = {m.group(1) for line in log.splitlines() for m in [re.match(r'([A-Za-z0-9-]+):', line)] if m and not line.rstrip().endswith('开工')}
    heads = git('branch', '-r')
    active = set()
    for line in heads.split():
        m = re.match(r'origin/agent/([A-Za-z0-9]+(?:-\d+[a-z]?)?)-', line)
        if m and git('rev-list', '--count', f'{BASE}..{line}').strip() not in ('', '0'):
            active.add(m.group(1))
    names = titles()
    groups = {'在做或待审': [], '现在能派': [], '等前面的卡': [], '等负责人': [], '已完成': []}
    for r in rows():
        card = r['card']
        if card in WAVE1:
            continue
        title = names.get(card, '')
        if card in merged:
            groups['已完成'].append((r, title, ''))
        elif card in active:
            groups['在做或待审'].append((r, title, '分支上有提交，交了就告诉审核'))
        elif card in OWNER_ONLY:
            groups['等负责人'].append((r, title, OWNER_ONLY[card]))
        elif r['wait']:
            groups['等负责人'].append((r, title, r['wait']))
        else:
            missing = [d for d in r['deps'] if d not in merged]
            if missing:
                groups['等前面的卡'].append((r, title, '等 ' + '、'.join(missing)))
            else:
                groups['现在能派'].append((r, title, ''))
    total = sum(len(v) for v in groups.values())
    lines = ['# 任务看板', '',
             '> 自动生成，别手改。更新：`git fetch origin --prune && python3 tools/board.py`。审核每合并一次都会重新生成并推送。',
             f'> 总共 {total} 张（第一波之外），已完成 {len(groups["已完成"])} 张。', '']
    for name in ('在做或待审', '现在能派', '等前面的卡', '等负责人'):
        items = groups[name]
        lines += [f'## {name}（{len(items)}）', '']
        if not items:
            lines += ['无', '']
            continue
        lines += ['| 卡 | 做什么 | 说明 |', '|---|---|---|']
        lines += [f'| {r["card"]} | {t} | {note} |' for r, t, note in items]
        lines.append('')
        if name == '现在能派':
            lines += ['### 提示词（一张卡一个对话，整段复制）', '']
            for r, t, _ in items:
                lines += [f'<details><summary>{r["card"]} {t}</summary>', '', '```', prompt(r, t), '```', '', '</details>', '']
    lines += [f'## 已完成（{len(groups["已完成"])}）', '', '、'.join(r['card'] for r, _, _ in groups['已完成']), '']
    (TASKS / 'board.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'board.md: 在做 {len(groups["在做或待审"])}，能派 {len(groups["现在能派"])}，'
          f'等卡 {len(groups["等前面的卡"])}，等负责人 {len(groups["等负责人"])}，完成 {len(groups["已完成"])}')


if __name__ == '__main__':
    main()
