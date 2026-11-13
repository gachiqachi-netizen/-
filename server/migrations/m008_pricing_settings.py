"""Initialize editable pricing settings without changing today's prices."""
import json
from datetime import datetime, timezone

VERSION = '008'
NAME = 'pricing_settings'
NEW_TABLES = ('settings',)


def up(conn, adapter):
    adapter.create_table(conn, 'settings')
    placeholder = '%s' if adapter.name == 'postgres' else '?'
    if conn.execute(f'SELECT id FROM settings WHERE id = {placeholder}', ('pricing',)).fetchone():
        return
    doc = {
        'handwork': {'enabled': True, 'fen': 1500},
        'shipping': {'enabled': True, 'fen': 800, 'freeThresholdFen': 9900},
        'updatedBy': '导入',
        'updatedAt': datetime.now(timezone.utc).isoformat(),
    }
    raw = json.dumps(doc, ensure_ascii=False)
    doc_placeholder = '%s::jsonb' if adapter.name == 'postgres' else '?'
    conn.execute(f'INSERT INTO settings (id, doc) VALUES ({placeholder}, {doc_placeholder})',
                 ('pricing', raw))
