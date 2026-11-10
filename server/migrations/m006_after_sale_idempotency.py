"""006 售后幂等唯一约束：同一订单 + 同一 idempotencyKey 只能有一条售后。

字段契约（跨 Agent 约定）：售后记录同时有 orderNo 与 idempotencyKey；
idempotencyKey 可缺省（历史记录/未传幂等键的记录不受约束）。

- SQLite 无法对 JSON 文本建表达式索引，改为给 after_sales 加两列物理列
  order_no / idempotency_key，从 doc 回填，再建部分唯一索引
  (order_no, idempotency_key) WHERE idempotency_key IS NOT NULL。
- PostgreSQL 用表达式部分唯一索引
  ((doc->>'orderNo'), (doc->>'idempotencyKey')) WHERE doc->>'idempotencyKey' IS NOT NULL。

自包含：不 import 业务模块；幂等：ALTER/CREATE 前先判存在 + IF NOT EXISTS。
"""
import json

VERSION = '006'
NAME = 'after_sale_idempotency'


def up(conn, adapter):
    if adapter.name == 'sqlite':
        columns = {row[1] for row in conn.execute("PRAGMA table_info(after_sales)")}
        if 'order_no' not in columns:
            conn.execute("ALTER TABLE after_sales ADD COLUMN order_no TEXT")
        if 'idempotency_key' not in columns:
            conn.execute("ALTER TABLE after_sales ADD COLUMN idempotency_key TEXT")
        # 回填：仅补缺失列的行，已回填的保持不变
        rows = conn.execute(
            "SELECT id, doc FROM after_sales WHERE order_no IS NULL OR idempotency_key IS NULL"
        ).fetchall()
        for rid, raw in rows:
            doc = json.loads(raw)
            conn.execute(
                "UPDATE after_sales SET order_no = ?, idempotency_key = ? WHERE id = ?",
                (doc.get('orderNo'), doc.get('idempotencyKey'), rid))
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_after_sales_idem "
            "ON after_sales(order_no, idempotency_key) WHERE idempotency_key IS NOT NULL")
    else:
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_after_sales_idem "
            "ON after_sales ((doc->>'orderNo'), (doc->>'idempotencyKey')) "
            "WHERE doc->>'idempotencyKey' IS NOT NULL")
