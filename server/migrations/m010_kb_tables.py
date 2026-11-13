"""Import the file knowledge base once into versioned document tables."""
import glob
import json
import os
from datetime import datetime, timezone

VERSION = '010'
NAME = 'kb_tables'
NEW_TABLES = ('kb_items', 'kb_versions')
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'kb', 'data'))
DICT_KEYS = ('banned', 'meaning_tags', 'terms', 'dims', 'grade_families')


def up(conn, adapter):
    for table in NEW_TABLES:
        adapter.create_table(conn, table)
    if conn.execute('SELECT id FROM kb_items LIMIT 1').fetchone():
        return
    now = datetime.now(timezone.utc).isoformat()
    entries = []
    for path in sorted(glob.glob(os.path.join(ROOT, 'beads', '*.json'))):
        with open(path, encoding='utf-8') as source:
            entries.extend(('bead', item['id'], item) for item in json.load(source))
    with open(os.path.join(ROOT, 'attributes.json'), encoding='utf-8') as source:
        attrs = json.load(source)
    entries.extend(('dict', key, attrs[key]) for key in DICT_KEYS)
    placeholder = '%s' if adapter.name == 'postgres' else '?'
    for kind, key, data in entries:
        item_id = f'{kind}:{key}'
        item = dict(kind=kind, key=key, data=data, version=1, updatedBy='导入', updatedAt=now)
        version = dict(itemId=item_id, version=1, data=data, savedBy='导入', savedAt=now, note='首次导入')
        for table, rid, doc in (('kb_items', item_id, item), ('kb_versions', f'{item_id}:1', version)):
            raw = json.dumps(doc, ensure_ascii=False)
            conn.execute(f'INSERT INTO {table} (id, doc) VALUES ({placeholder}, {placeholder})', (rid, raw))
