"""Knowledge-base checks for the file audit and for saving one bead."""
import glob
import json
import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'kb'))
DATA = os.path.join(ROOT, 'data')
DIMS = {'color', 'clarity', 'purity', 'effect', 'pattern', 'inclusion', 'texture', 'origin',
        'age', 'shape', 'treatment', 'count'}
REQUIRED = ['id', 'name', 'std', 'category', 'summary', 'look', 'identify', 'confusables',
            'dims', 'grades', 'sizes', 'treatments', 'compliance', 'meaning', 'sources', 'confidence']
BANNED_ONLY = ['id', 'name', 'std', 'category', 'summary', 'look', 'identify', 'confusables',
               'compliance', 'sources']
FALLBACK_BANNED = ['招财', '转运', '辟邪', '避邪', '挡煞', '能量', '净化', '消磁', '开光', '加持',
                   '护身', '安神', '助眠', '治疗', '保佑']
ALLOW = {'转运珠', '本命年'}


def taxonomy_items():
    with open(os.path.join(ROOT, 'taxonomy.json'), encoding='utf-8') as source:
        tax = json.load(source)
    return {item['id']: (cat['id'], item) for cat in tax['categories'] for item in cat['items']}


def _texts(item):
    meaning = item.get('meaning') or {}
    yield 'summary', item.get('summary', '')
    yield 'meaning', meaning.get('text', '')
    yield 'meaning.tags', ' '.join(meaning.get('tags', []))
    yield 'story', item.get('story', '')
    yield 'look', item.get('look', '')


def _hits(text, banned):
    text = str(text or '')
    for allowed in ALLOW:
        text = text.replace(allowed, '')
    return [word for word in banned if word and word in text]


def check_bead(item, dicts, mode='save'):
    """Return field/message errors. `existing` reproduces the file validator."""
    if mode not in ('existing', 'save'):
        raise ValueError('mode 应为 existing 或 save')
    errors = []

    def add(field, message):
        errors.append({'field': field, 'message': message})

    want = dicts.get('_taxonomy') or taxonomy_items()
    bid = item.get('id', '?')
    if bid not in want:
        add('id', 'taxonomy 里没有这个 id')
    else:
        cat, definition = want[bid]
        if item.get('category') != cat:
            add('category', f'category 应为 {cat}')
        if item.get('name') != definition['name']:
            add('name', f"name 应为 {definition['name']}")
        flags = definition.get('flags', [])
        level = (item.get('compliance') or {}).get('level')
        if cat == 'banned' and level != 'banned':
            add('compliance.level', '禁售大类 compliance.level 应为 banned')
        if '合规' in flags and cat != 'banned' and level != 'restricted':
            add('compliance.level', 'taxonomy 标了合规，compliance.level 应为 restricted')
        if '名称易混' in flags and not item.get('confusables'):
            add('confusables', 'taxonomy 标了名称易混，confusables 不能空')
        if '常见处理' in flags and not item.get('treatments'):
            add('treatments', 'taxonomy 标了常见处理，treatments 不能空')
        if '待核' in flags and 'high' in (item.get('confidence') or {}).values():
            add('confidence', 'taxonomy 标了待核，confidence 里不该有 high')
        needed = BANNED_ONLY if cat == 'banned' else REQUIRED
        missing = [key for key in needed if key not in item]
        if missing:
            add(missing[0], '缺字段：' + '、'.join(missing))
    bad_dims = [key for key in (item.get('dims') or {}) if key not in DIMS]
    if bad_dims:
        add('dims', 'dims 里有不认识的维度：' + '、'.join(bad_dims))
    for grade in item.get('grades') or []:
        if re.search(r'\dA|AA|A级', str(grade.get('label', ''))):
            add('grades', '品级用了 A 数：' + str(grade.get('label')))
    banned = [entry['word'] for entry in dicts.get('banned', []) if entry.get('word')] or FALLBACK_BANNED
    for field, text in _texts(item):
        hits = _hits(text, banned)
        if hits:
            add(field, f'{field} 里有功效词：' + '、'.join(hits))
    if not item.get('sources'):
        add('sources', '没有 sources')
    if mode == 'existing':
        return errors

    for field in ('name', 'category', 'summary', 'look'):
        if not item.get(field):
            add(field, f'{field} 不能为空')
    tags = (item.get('meaning') or {}).get('tags') or []
    allowed_tags = set(dicts.get('meaning_tags') or [])
    for tag in tags:
        if tag not in allowed_tags:
            add('meaning.tags', f'寓意关键词“{tag}”不在词典里')
    if len(tags) > 3:
        add('meaning.tags', '寓意关键词最多 3 个')
    if any(value in ('mid', 'high') for value in (item.get('confidence') or {}).values()):
        if not any(source != '常识' for source in item.get('sources') or []):
            add('sources', '把握为中或高，至少要有一条不是“常识”的来源')
    return errors


def audit():
    """Print the current on-save violations without changing data."""
    with open(os.path.join(DATA, 'attributes.json'), encoding='utf-8') as source:
        attrs = json.load(source)
    summary = {'unknown_tags': 0, 'common_only': 0, 'missing_core': 0}
    for path in sorted(glob.glob(os.path.join(DATA, 'beads', '*.json'))):
        with open(path, encoding='utf-8') as source:
            rows = json.load(source)
        for item in rows:
            errors = check_bead(item, attrs, mode='save')
            on_save = [error for error in errors if error['message'] in ('name 不能为空', 'category 不能为空',
                        'summary 不能为空', 'look 不能为空') or error['message'].startswith(('寓意关键词', '把握为中或高'))]
            if not on_save:
                continue
            if any(error['message'].startswith('寓意关键词') for error in on_save):
                summary['unknown_tags'] += 1
            if any(error['message'].startswith('把握为中或高') for error in on_save):
                summary['common_only'] += 1
            if any(error['message'].endswith('不能为空') for error in on_save):
                summary['missing_core'] += 1
            print(item.get('id', '?') + '：' + '；'.join(error['message'] for error in on_save))
    print(f"汇总：词典外寓意 {summary['unknown_tags']} 种；中高把握仅常识来源 {summary['common_only']} 种；必填内容为空 {summary['missing_core']} 种")
    return summary
