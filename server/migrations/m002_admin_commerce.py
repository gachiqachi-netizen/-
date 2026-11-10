"""002 电商后台结构占位：确保 audit_logs / after_sales / terms 三张表存在。

001 已经建了这三张表，本迁移是幂等占位（CREATE TABLE IF NOT EXISTS），
保留该版本号作为「电商后台结构已就位」的标记，后续电商字段迁移可挂靠到此
版本之后。不做任何字段级改动，重复运行无副作用。
"""
from . import TABLES

VERSION = '002'
NAME = 'admin_commerce'

_COMMERCE_TABLES = ('audit_logs', 'after_sales', 'terms')


def up(conn, adapter):
    for table in _COMMERCE_TABLES:
        adapter.create_table(conn, table)
