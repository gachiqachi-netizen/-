# 数据库迁移与备份

迁移机制在 `server/migrate.py` + `server/migrations/`，启动时由 `server/db.py`
（SQLite）或 `server/db_postgres.py`（PostgreSQL，`initialize=True` 时）自动调用
`run_migrations()`。迁移按版本号升序执行，已应用版本跳过，可重复运行；每个迁移
在单独事务中执行，失败回滚并抛含版本号的 `RuntimeError`，不会留下半迁移状态。

## 迁移前必须先备份

迁移一旦应用不可逆（尤其字段回填会改写旧订单文档），执行任何迁移前先备份：

- SQLite：复制数据库文件
  ```sh
  cp server/data.sqlite3 server/data.sqlite3.bak-$(date +%Y%m%d%H%M%S)
  ```
- PostgreSQL：用 pg_dump 备份
  ```sh
  pg_dump "$DATABASE_URL" -f backup-$(date +%Y%m%d%H%M%S).sql
  ```

## 手动执行迁移命令

在仓库根目录：

```sh
# SQLite（默认 server/data.sqlite3，可用 --database 或 DATABASE_PATH 指定）
python3 -m server.migrate
python3 server/migrate.py --database /path/to/data.sqlite3

# PostgreSQL（--url 或 DATABASE_URL 环境变量）
python3 -m server.migrate --url "$DATABASE_URL"
DATABASE_URL="$DATABASE_URL" python3 server/migrate.py
```

## 版本清单

| 版本 | 文件 | 说明 |
|---|---|---|
| 001 | `migrations/m001_initial_tables.py` | 建 12 张基础表 + designs/orders 的 user_id 归属与索引（平移旧 db.py 隐式逻辑） |
| 002 | `migrations/m002_admin_commerce.py` | 电商三表占位（幂等） |
| 003 | `migrations/m003_payment_status.py` | 旧订单补 `paymentStatus` 默认 `unpaid` |
| 004 | `migrations/m004_money_fen.py` | 旧订单补整数分金额字段（含 `payableFen` 不变量） |
| 005 | `migrations/m005_logistics_status.py` | 旧订单补 `logisticsStatus` 默认 `not_shipped` |

003/004/005 是字段级文档回填迁移，字段契约以集成分支最终对齐为准（见各文件头注释）。
