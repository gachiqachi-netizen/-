"""Versioned knowledge-base documents shared by SQLite and PostgreSQL."""
import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

DICT_KEYS = frozenset(('banned', 'meaning_tags', 'terms', 'dims', 'grade_families'))


@contextmanager
def _connection():
    url = os.environ.get('DATABASE_URL')
    if url:
        import psycopg
        with psycopg.connect(url, connect_timeout=10) as conn:
            yield conn, '%s'
    else:
        path = os.environ.get('DATABASE_PATH') or os.path.join(os.path.dirname(__file__), 'data.sqlite3')
        with sqlite3.connect(path, timeout=10) as conn:
            yield conn, '?'


def _rows(conn):
    try:
        return conn.execute('SELECT id, doc FROM kb_items').fetchall()
    except sqlite3.OperationalError as exc:
        if 'no such table' in str(exc):
            return []
        raise


def snapshot():
    """Return the effective bead and dictionary data, or None before import."""
    with _connection() as (conn, _):
        rows = _rows(conn)
    if not rows:
        return None
    beads, attrs = {}, {}
    for _, raw in rows:
        item = json.loads(raw) if isinstance(raw, str) else raw
        if item['kind'] == 'bead':
            beads[item['key']] = item['data']
        elif item['kind'] == 'dict':
            attrs[item['key']] = item['data']
    return {'beads': beads, 'attrs': attrs}


def stamp():
    """A stable cache marker that changes after every save."""
    with _connection() as (conn, _):
        rows = _rows(conn)
    if not rows:
        return None
    return tuple(sorted((rid, (json.loads(raw) if isinstance(raw, str) else raw)['version']) for rid, raw in rows))


def save(key, data, by, note):
    kind = 'dict' if key in DICT_KEYS else 'bead'
    item_id = f'{kind}:{key}'
    with _connection() as (conn, placeholder):
        if not isinstance(conn, sqlite3.Connection):
            row = conn.execute(f'SELECT doc FROM kb_items WHERE id = {placeholder} FOR UPDATE', (item_id,)).fetchone()
        else:
            conn.execute('BEGIN IMMEDIATE')
            row = conn.execute(f'SELECT doc FROM kb_items WHERE id = {placeholder}', (item_id,)).fetchone()
        if row is None:
            raise KeyError(key)
        item = json.loads(row[0]) if isinstance(row[0], str) else row[0]
        version = item['version'] + 1
        now = datetime.now(timezone.utc).isoformat()
        item.update(data=data, version=version, updatedBy=by, updatedAt=now)
        history = dict(itemId=item_id, version=version, data=data, savedBy=by, savedAt=now, note=note)
        raw_item = json.dumps(item, ensure_ascii=False)
        raw_history = json.dumps(history, ensure_ascii=False)
        doc_placeholder = '%s::jsonb' if placeholder == '%s' else '?'
        conn.execute(f'UPDATE kb_items SET doc = {doc_placeholder} WHERE id = {placeholder}', (raw_item, item_id))
        conn.execute(f'INSERT INTO kb_versions (id, doc) VALUES ({placeholder}, {doc_placeholder})',
                     (f'{item_id}:{version}', raw_history))
    return version
