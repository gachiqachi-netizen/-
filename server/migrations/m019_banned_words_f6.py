"""Add F6 medical claims to the versioned banned-word dictionary."""
import json
import os
from datetime import datetime, timezone

VERSION = '019'
NAME = 'banned_words_f6'
NEW_TABLES = ()
WORDS = ('治失眠', '治病', '根治', '疗效', '药效', '改善睡眠')
ATTRIBUTES = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'kb', 'data', 'attributes.json'))


def up(conn, adapter):
    placeholder = '%s' if adapter.name == 'postgres' else '?'
    doc_placeholder = '%s::jsonb' if adapter.name == 'postgres' else '?'
    row = conn.execute(f'SELECT doc FROM kb_items WHERE id = {placeholder}', ('dict:banned',)).fetchone()
    if row is None:
        return
    item = json.loads(row[0]) if isinstance(row[0], str) else row[0]
    present = {entry.get('word') for entry in item.get('data', []) if isinstance(entry, dict)}
    with open(ATTRIBUTES, encoding='utf-8') as source:
        current = json.load(source)['banned']
    additions = [entry for entry in current if entry.get('word') in WORDS and entry['word'] not in present]
    if not additions:
        return
    item['data'] = list(item['data']) + additions
    item['version'] = int(item.get('version') or 0) + 1
    item['updatedBy'] = '迁移 F6'
    now = datetime.now(timezone.utc).isoformat()
    item['updatedAt'] = now
    version = {'itemId': 'dict:banned', 'version': item['version'], 'data': item['data'],
               'savedBy': '迁移 F6', 'savedAt': now, 'note': '补功效类禁用词'}
    conn.execute(f'UPDATE kb_items SET doc = {doc_placeholder} WHERE id = {placeholder}',
                 (json.dumps(item, ensure_ascii=False), 'dict:banned'))
    conn.execute(f'INSERT INTO kb_versions (id, doc) VALUES ({placeholder}, {doc_placeholder})',
                 (f'dict:banned:{item["version"]}', json.dumps(version, ensure_ascii=False)))
