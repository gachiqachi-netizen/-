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
RULE = re.compile(r'([^{}]+)\{([^{}]*)\}')
IMAGE_SELECTOR = re.compile(r'image|img|photo|banner|cover|thumb|grid|swiper', re.I)
SHAPE_EXCEPTION = re.compile(r'add-photo|photo-add|ai-recommend', re.I)
BUTTON_SELECTOR = re.compile(r'btn|button|action', re.I)
BUTTON_TAG = re.compile(r'<button\b[^>]*>', re.S)
CLASS_ATTR = re.compile(r'\bclass="([^"]*)"')
ICON_BUTTONS = {'miniprogram/pages/photo/photo.wxml': {'shutter'}, 'miniprogram/ar-hand/index.wxml': {'shutter'}, 'miniprogram/pages/wrist/wrist.wxml': {'step'}}
LEGACY_BUTTON_EXCEPTIONS = {
    'miniprogram/ar-hand/index.wxss': ('.actions>view',),
    'miniprogram/components/state/index.wxss': ('.c-state__action',),
    'miniprogram/styles/components.wxss': ('.c-stepper__btn',),
    'miniprogram/pages/diy/diy.wxss': ('.side-action',),
    'miniprogram/pages/photo/photo.wxss': ('.camera-actions text',),
}

def violations(path):
    content = COMMENT.sub('', path.read_text())
    found = []
    for number, line in enumerate(content.splitlines(), 1):
        if COLOR.search(line):
            found.append(f'{path.relative_to(ROOT)}:color:{line.strip()}')
        for match in DECL.finditer(line):
            if not re.fullmatch(r'var\(--[a-z0-9-]+\)', match.group(2).strip()):
                found.append(f'{path.relative_to(ROOT)}:{match.group(1)}:{match.group(2).strip()}')
    for rule in RULE.finditer(content):
        selector, body = rule.groups()
        if not IMAGE_SELECTOR.search(selector) or SHAPE_EXCEPTION.search(selector):
            continue
        for match in re.finditer(r'\bborder-radius\s*:\s*([^;{}]+)', body, re.I):
            radius = match.group(1).strip()
            if radius != 'var(--r-panel)':
                found.append(f'{path.relative_to(ROOT)}:shape:{selector.strip()}:{radius}')
    for rule in RULE.finditer(content):
        selector, body = rule.groups()
        if not BUTTON_SELECTOR.search(selector):
            continue
        if selector.strip() in LEGACY_BUTTON_EXCEPTIONS.get(str(path.relative_to(ROOT)), ()):
            continue
        for prop, value in re.findall(r'(?<![-\w])(height|width)\s*:\s*([^;{}]+)', body, re.I):
            value = value.strip()
            if prop.lower() == 'height' and value not in ('var(--h-btn)', 'var(--h-btn-s)'):
                found.append(f'{path.relative_to(ROOT)}:button-height:{selector.strip()}:{value}')
            if prop.lower() == 'width' and re.fullmatch(r'\d+(?:\.\d+)?(?:r?px|vw|vh|%)?', value) and value not in ('50%', '100%'):
                found.append(f'{path.relative_to(ROOT)}:button-width:{selector.strip()}:{value}')
    return found

def markup_violations(path):
    relative = str(path.relative_to(ROOT))
    content = path.read_text()
    found = []
    for tag in BUTTON_TAG.finditer(content):
        classes = set((CLASS_ATTR.search(tag.group()) or ['', ''])[1].split())
        if 'c-btn' not in classes and not classes.intersection(ICON_BUTTONS.get(relative, set())):
            found.append(f'{relative}:button-class:{tag.start()}')
    stylesheet = path.with_suffix('.wxss')
    if not stylesheet.exists():
        return found
    css = COMMENT.sub('', stylesheet.read_text())
    vertical = set()
    flexible = set()
    for selector, body in RULE.findall(css):
        selectors = re.findall(r'\.([a-zA-Z][\w-]*)', selector)
        if re.search(r'flex-direction\s*:\s*column\b', body):
            vertical.update(selectors)
        if re.search(r'\bflex\s*:\s*none\b', body):
            flexible.update(selectors)
    for parent in re.finditer(r'<view\b([^>]*)>\s*(<button\b[^>]*>)', content, re.S):
        parent_classes = set((CLASS_ATTR.search(parent.group(1)) or ['', ''])[1].split())
        button_classes = set((CLASS_ATTR.search(parent.group(2)) or ['', ''])[1].split())
        if parent_classes.intersection(vertical) and not button_classes.intersection(flexible):
            found.append(f'{relative}:vertical-button:{parent.start()}')
    return found

def main():
    paths = [Path(arg).resolve() for arg in sys.argv[1:]] if len(sys.argv) > 1 else list((ROOT / 'miniprogram').rglob('*.wxss')) + list((ROOT / 'miniprogram').rglob('*.wxml'))
    old = set(json.loads(BASELINE.read_text())) if BASELINE.exists() else set()
    current = {item for path in paths if path.name != 'tokens.wxss' for item in (markup_violations(path) if path.suffix == '.wxml' else violations(path))}
    added = sorted(current - old)
    for item in added: print(item)
    print(f'UI check: {len(current)} violations, {len(added)} new')
    return bool(added)

if __name__ == '__main__':
    sys.exit(main())
