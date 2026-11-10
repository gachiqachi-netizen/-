"""001 初始建表：平移 db.py 原有隐式建表 + designs/orders 的 user_id 列与索引。

等价于旧的 `DB.__init__`（server/db.py 约 19–28 行）与 `PostgresDB.initialize`
（server/db_postgres.py 约 27–31 行）在启动时隐式执行的逻辑：
- 建 12 张基础表（beads / templates / banners / orders / users / sessions /
  designs / order_requests / shares / audit_logs / after_sales / terms）；
- designs、orders 两张表补 user_id 归属：SQLite 加列并回填旧数据、建索引；
  PostgreSQL 建 `(doc->>'userId')` 表达式索引（无需物理列）。

表名与 migrations/__init__.py 的 TABLES 保持一致。
"""
from . import TABLES

VERSION = '001'
NAME = 'initial_tables'

_OWNER_TABLES = ('designs', 'orders')


def up(conn, adapter):
    for table in TABLES:
        adapter.create_table(conn, table)
    for table in _OWNER_TABLES:
        adapter.ensure_owner_column(conn, table)
