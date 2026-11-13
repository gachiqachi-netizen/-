"""数据库迁移脚本包：按版本号有序执行，自包含、不 import 业务模块。

每个迁移模块暴露两个属性：
- VERSION：字符串版本号（如 '001'），写入 schema_migrations 作为主键。
- up(conn, adapter)：迁移逻辑。conn 是底层连接，adapter 是 migrate.py 里的
  SQLiteAdapter / PostgresAdapter，负责方言差异（建表、读改文档、事务）。
- NEW_TABLES（可选）：该迁移新建的表名元组，没有就当空。会自动并进
  ALL_TABLES，db.py 的 TABLES 直接引用它，新表不再要手改两个文件。

001 平移 db.py 原有隐式建表逻辑；002 是电商三表占位；003/004/005 是字段级
文档回填迁移，字段契约以集成分支最终对齐为准（见各文件头注释）。
"""

import importlib
import pkgutil
import re

# 与 server/db.py 的 TABLES 保持一致（12 张基础表）
TABLES = ("beads", "templates", "banners", "orders", "users", "sessions", "designs",
          "order_requests", "shares", "audit_logs", "after_sales", "terms")


def _discover_migrations():
    """自动发现所有 m<三位数字>_*.py 迁移模块，按 VERSION 升序返回。"""
    modules = []
    by_version = {}
    for info in pkgutil.iter_modules(__path__):
        if not re.fullmatch(r"m\d{3}_.+", info.name):
            continue
        mod = importlib.import_module(f".{info.name}", __package__)
        version = mod.VERSION
        if version in by_version:
            raise RuntimeError(
                f"迁移版本号重复：{by_version[version].__name__} 和 {mod.__name__} "
                f"都是 VERSION={version}，请改名后再启动")
        by_version[version] = mod
        modules.append(mod)
    modules.sort(key=lambda m: m.VERSION)
    return modules


# 按版本号升序排列；run_migrations 会再按 VERSION 排序一次作兜底
MIGRATIONS = _discover_migrations()


def _collect_all_tables():
    names = list(TABLES)
    for mod in MIGRATIONS:
        for name in getattr(mod, "NEW_TABLES", ()):
            if name in names:
                raise RuntimeError(
                    f"表名重复登记：{name}（迁移模块 {mod.__name__}），"
                    f"与已有表或别的迁移 NEW_TABLES 冲突")
            names.append(name)
    return tuple(names)


ALL_TABLES = _collect_all_tables()
