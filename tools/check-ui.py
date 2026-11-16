#!/usr/bin/env python3
"""Report new literal colors, font sizes and radii in mini program styles."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / 'tools/check-ui-baseline.json'
COLOR = re.compile(r'#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(', re.I)
DECL = re.compile(r'\b(font-size|border-radius)\s*:\s*([^;{}]+);', re.I)
COMMENT = re.compile(r'/\*.*?\*/', re.S)

def violations(path):
    content = COMMENT.sub('', path.read_text())
    found = []
    for number, line in enumerate(content.splitlines(), 1):
        if COLOR.search(line):
            found.append(f'{path.relative_to(ROOT)}:color:{line.strip()}')
        for match in DECL.finditer(line):
            if not re.fullmatch(r'var\(--[a-z0-9-]+\)', match.group(2).strip()):
                found.append(f'{path.relative_to(ROOT)}:{match.group(1)}:{match.group(2).strip()}')
    return found

def main():
    paths = [Path(arg).resolve() for arg in sys.argv[1:]] if len(sys.argv) > 1 else list((ROOT / 'miniprogram').rglob('*.wxss'))
    old = set(json.loads(BASELINE.read_text())) if BASELINE.exists() else set()
    current = {item for path in paths if path.name != 'tokens.wxss' for item in violations(path)}
    added = sorted(current - old)
    for item in added: print(item)
    print(f'UI check: {len(current)} violations, {len(added)} new')
    return bool(added)

if __name__ == '__main__':
    sys.exit(main())
