"""Initialize empty PostgreSQL tables and copy a consistent SQLite snapshot once.

Source must exist; never overwrites destination rows. Stop all writers before
migration for a stable cut-over. DATABASE_URL is passed only through environment.
"""
import argparse
import json
import os
import sqlite3
from pathlib import Path

from db import TABLES
from db_postgres import PostgresDB


def migrate(sqlite_path, url):
    if not os.path.isfile(sqlite_path):
        raise FileNotFoundError('源 SQLite 文件不存在')
    target = PostgresDB(url, initialize=True)
    source = sqlite3.connect(Path(sqlite_path).resolve().as_uri() + '?mode=ro', uri=True)
    try:
        source.execute('BEGIN')
        with target.connect() as conn:
            # Exclude writers and ensure no earlier import, all tables atomically.
            conn.execute('LOCK TABLE ' + ', '.join(TABLES) + ' IN ACCESS EXCLUSIVE MODE')
            for table in TABLES:
                if conn.execute(f'SELECT 1 FROM {table} LIMIT 1').fetchone():
                    raise RuntimeError('目标数据库非空，已停止导入；不会覆盖已有数据')
            counts = {}
            for table in TABLES:
                exists = source.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone()
                rows = source.execute(f'SELECT id,doc FROM {table}').fetchall() if exists else []
                for rid, doc in rows:
                    json.loads(doc)  # Reject corrupt data instead of partially copying.
                    conn.execute(f'INSERT INTO {table} (id,doc) VALUES (%s,%s::jsonb)', (rid, doc))
                counts[table] = len(rows)
        return counts
    finally:
        source.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sqlite', required=True, help='现有 SQLite 数据文件')
    args = parser.parse_args()
    url = os.environ.get('DATABASE_URL')
    if not url:
        parser.error('请在环境变量中配置 DATABASE_URL')
    counts = migrate(args.sqlite, url)
    print('复制完成：' + ', '.join(f'{key}={value}' for key, value in counts.items()))
