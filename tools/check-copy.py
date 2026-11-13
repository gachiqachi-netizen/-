#!/usr/bin/env python3
"""文案禁用词检查（C0d 建，C11 用）。

扫 miniprogram/ 下所有 .wxml、.js 的中文文案，命中 kb/data/attributes.json
的 banned 词表就列出 文件:行号 并退出码 1。"转运珠""本命年"两个词不查。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOW = ('转运珠', '本命年')
EXTS = ('*.wxml', '*.js')


def main():
    banned = [b['word'] for b in json.loads(
        (ROOT / 'kb' / 'data' / 'attributes.json').read_text(encoding='utf-8'))['banned']]
    pattern = re.compile('|'.join(re.escape(w) for w in banned))
    hits = []
    for ext in EXTS:
        for path in sorted((ROOT / 'miniprogram').rglob(ext)):
            text = path.read_text(encoding='utf-8', errors='replace')
            for lineno, line in enumerate(text.splitlines(), 1):
                scrubbed = line
                for word in ALLOW:
                    scrubbed = scrubbed.replace(word, '')
                found = sorted(set(m.group(0) for m in pattern.finditer(scrubbed)))
                for word in found:
                    hits.append(f'{path.relative_to(ROOT)}:{lineno}: {word}')
    if hits:
        print('\n'.join(hits))
        sys.exit(1)
    print('copy ok: no banned words')
    sys.exit(0)


if __name__ == '__main__':
    main()
