"""数据库迁移框架：版本化、可重复、事务化、失败回滚。

用 schema_migrations 表记录已应用的版本号（version PRIMARY KEY, applied_at）。
迁移脚本位于 server/migrations/，按版本号升序执行；已应用的版本跳过，重复运行
不破坏数据。每个迁移在单独事务中执行，失败回滚，不留半迁移状态，并抛含版本号
的 RuntimeError。

备份说明（迁移前必须先备份，迁移不可逆）：
- SQLite：先复制数据库文件备份，例如
    cp server/data.sqlite3 server/data.sqlite3.bak-$(date +%Y%m%d%H%M%S)
- PostgreSQL：用 pg_dump 备份，例如
    pg_dump "$DATABASE_URL" -f backup-$(date +%Y%m%d%H%M%S).sql

统一入口：run_migrations(conn, adapter)，conn 是底层连接，adapter 是
SQLiteAdapter / PostgresAdapter，负责方言差异。

命令行用法（在仓库根目录）：
    python3 -m server.migrate [--database PATH] [--url URL]
    python3 server/migrate.py [--database PATH] [--url URL]
未指定 --url 且未设置 DATABASE_URL 时，按 --database（默认 server/data.sqlite3）
执行 SQLite 迁移；设置 DATABASE_URL 或 --url 时执行 PostgreSQL 迁移。
"""
import argparse
import datetime
import json
import os
import sqlite3
import sys
from contextlib import contextmanager

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from migrations import MIGRATIONS  # noqa: E402

SCHEMA_MIGRATIONS_TABLE = 'schema_migrations'

# 迁移全局锁 key：固定 advisory lock，跨实例串行化迁移，避免两个实例并发执行
# 同一迁移（先拿锁再重读已执行版本）。取值与业务数据无关，只作互斥令牌。
MIGRATION_LOCK_KEY = 0x63677A2D6D696772  # b"cgz-migr"（串个珠迁移锁）


def _now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


@contextmanager
def _sqlite_transaction(conn):
    conn.execute('BEGIN IMMEDIATE')
    try:
        yield
    except BaseException:
        conn.rollback()
        raise
    else:
        conn.commit()


class SQLiteAdapter:
    """SQLite 方言适配器：TEXT 文档表、user_id 物理列回填、BEGIN IMMEDIATE 事务。"""

    name = 'sqlite'

    def create_table(self, conn, table):
        conn.execute(f"CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, doc TEXT NOT NULL)")

    def ensure_owner_column(self, conn, table):
        columns = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
        if 'user_id' not in columns:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN user_id TEXT")
        rows = conn.execute(f"SELECT id, doc FROM {table} WHERE user_id IS NULL").fetchall()
        for rid, raw in rows:
            conn.execute(f"UPDATE {table} SET user_id = ? WHERE id = ?",
                         (json.loads(raw).get('userId'), rid))
        conn.execute(f"CREATE INDEX IF NOT EXISTS idx_{table}_user_id ON {table}(user_id)")

    def iter_docs(self, conn, table):
        rows = conn.execute(f"SELECT id, doc FROM {table}").fetchall()
        return [(rid, json.loads(raw)) for rid, raw in rows]

    def update_doc(self, conn, table, rid, doc):
        conn.execute(f"UPDATE {table} SET doc = ? WHERE id = ?",
                     (json.dumps(doc, ensure_ascii=False), rid))

    def ensure_schema_migrations(self, conn):
        conn.execute(f"CREATE TABLE IF NOT EXISTS {SCHEMA_MIGRATIONS_TABLE} "
                     "(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
        conn.commit()

    def applied_versions(self, conn):
        rows = conn.execute(f"SELECT version FROM {SCHEMA_MIGRATIONS_TABLE}").fetchall()
        return {row[0] for row in rows}

    def record_version(self, conn, version):
        conn.execute(f"INSERT INTO {SCHEMA_MIGRATIONS_TABLE} (version, applied_at) VALUES (?, ?)",
                     (version, _now_iso()))

    def transaction(self, conn):
        return _sqlite_transaction(conn)


class PostgresAdapter:
    """PostgreSQL 方言适配器：JSONB 文档表、表达式索引、psycopg 事务。"""

    name = 'postgres'

    def create_table(self, conn, table):
        conn.execute(f"CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, doc JSONB NOT NULL)")

    def ensure_owner_column(self, conn, table):
        conn.execute(f"CREATE INDEX IF NOT EXISTS idx_{table}_user_id ON {table} ((doc->>'userId'))")

    def iter_docs(self, conn, table):
        rows = conn.execute(f"SELECT id, doc FROM {table}").fetchall()
        return [(rid, doc) for rid, doc in rows]

    def update_doc(self, conn, table, rid, doc):
        conn.execute(f"UPDATE {table} SET doc = %s::jsonb WHERE id = %s",
                     (json.dumps(doc, ensure_ascii=False, allow_nan=False), rid))

    def ensure_schema_migrations(self, conn):
        conn.execute(f"CREATE TABLE IF NOT EXISTS {SCHEMA_MIGRATIONS_TABLE} "
                     "(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
        conn.commit()

    def applied_versions(self, conn):
        # psycopg 3 默认 autocommit=False，SELECT 也会开启隐式事务；用 transaction()
        # 包住读取，退出即提交，保证下一个迁移事务从 IDLE 状态开始。
        with conn.transaction():
            rows = conn.execute(f"SELECT version FROM {SCHEMA_MIGRATIONS_TABLE}").fetchall()
        return {row[0] for row in rows}

    def record_version(self, conn, version):
        conn.execute(f"INSERT INTO {SCHEMA_MIGRATIONS_TABLE} (version, applied_at) VALUES (%s, %s)",
                     (version, _now_iso()))

    def transaction(self, conn):
        return conn.transaction()


def run_migrations(conn, adapter, migrations=None):
    """按版本号升序执行迁移，已应用版本跳过。返回本次实际应用的版本号列表。

    失败时抛 RuntimeError（含失败版本号），事务已回滚，不留下半迁移状态。
    PostgreSQL 下先取会话级 advisory lock，拿到锁后重读已执行版本，避免两个
    实例并发执行同一迁移；锁在 finally 中释放（连接关闭时也会自动释放）。
    """
    if migrations is None:
        migrations = MIGRATIONS
    if adapter.name == 'postgres':
        conn.execute('SELECT pg_advisory_lock(%s)', (MIGRATION_LOCK_KEY,))
        try:
            return _apply_migrations(conn, adapter, migrations)
        finally:
            conn.execute('SELECT pg_advisory_unlock(%s)', (MIGRATION_LOCK_KEY,))
    return _apply_migrations(conn, adapter, migrations)


def _apply_migrations(conn, adapter, migrations):
    adapter.ensure_schema_migrations(conn)
    applied = adapter.applied_versions(conn)
    applied_now = []
    for migration in sorted(migrations, key=lambda m: m.VERSION):
        version = migration.VERSION
        if version in applied:
            continue
        try:
            with adapter.transaction(conn):
                migration.up(conn, adapter)
                adapter.record_version(conn, version)
        except Exception as exc:
            raise RuntimeError(f"数据库迁移版本 {version} 失败：{exc}") from exc
        applied.add(version)
        applied_now.append(version)
    return applied_now


def _connect_postgres(url):
    try:
        import psycopg
    except ImportError as exc:
        raise RuntimeError('PostgreSQL 需要安装 psycopg 3（见 server/requirements-postgres.txt）') from exc
    return psycopg.connect(url, connect_timeout=10)


def main(argv=None):
    parser = argparse.ArgumentParser(description='执行数据库迁移（版本化、事务化、失败回滚）')
    parser.add_argument('--database', help='SQLite 数据库文件路径（默认 server/data.sqlite3）')
    parser.add_argument('--url', help='PostgreSQL 连接串（也可用 DATABASE_URL 环境变量）')
    args = parser.parse_args(argv)

    url = args.url or os.environ.get('DATABASE_URL')
    if url:
        conn = _connect_postgres(url)
        try:
            with conn:
                applied = run_migrations(conn, PostgresAdapter())
        finally:
            conn.close()
        print('PostgreSQL 迁移完成，本次应用：' + (', '.join(applied) if applied else '（无新版本）'))
        return

    path = args.database or os.environ.get('DATABASE_PATH') or os.path.join(_HERE, 'data.sqlite3')
    conn = sqlite3.connect(path)
    try:
        applied = run_migrations(conn, SQLiteAdapter())
    finally:
        conn.close()
    print(f'SQLite 迁移完成（{path}），本次应用：' + (', '.join(applied) if applied else '（无新版本）'))


if __name__ == '__main__':
    main()
