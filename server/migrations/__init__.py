"""数据库迁移脚本包：按版本号有序执行，自包含、不 import 业务模块。

每个迁移模块暴露两个属性：
- VERSION：字符串版本号（如 '001'），写入 schema_migrations 作为主键。
- up(conn, adapter)：迁移逻辑。conn 是底层连接，adapter 是 migrate.py 里的
  SQLiteAdapter / PostgresAdapter，负责方言差异（建表、读改文档、事务）。

001 平移 db.py 原有隐式建表逻辑；002 是电商三表占位；003/004/005 是字段级
文档回填迁移，字段契约以集成分支最终对齐为准（见各文件头注释）。
"""

# 与 server/db.py 的 TABLES 保持一致（12 张基础表）
TABLES = ("beads", "templates", "banners", "orders", "users", "sessions", "designs",
          "order_requests", "shares", "audit_logs", "after_sales", "terms")

from . import m001_initial_tables  # noqa: E402
from . import m002_admin_commerce  # noqa: E402
from . import m003_payment_status  # noqa: E402
from . import m004_money_fen  # noqa: E402
from . import m005_logistics_status  # noqa: E402
from . import m006_after_sale_idempotency  # noqa: E402
from . import m007_after_sale_types  # noqa: E402

# 按版本号升序排列；run_migrations 会再按 VERSION 排序一次作兜底
MIGRATIONS = [
    m001_initial_tables,
    m002_admin_commerce,
    m003_payment_status,
    m004_money_fen,
    m005_logistics_status,
    m006_after_sale_idempotency,
    m007_after_sale_types,
]
