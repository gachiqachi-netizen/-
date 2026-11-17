"""Preview or add missing catalog and draft terms from server/seed.py."""

import argparse
import os
import sys
from pathlib import Path

SERVER = Path(__file__).resolve().parents[1] / "server"
sys.path.insert(0, str(SERVER))

import seed  # noqa: E402

SEED_TABLES = {
    "beads": seed.BEADS,
    "templates": seed.TEMPLATES,
    "banners": seed.BANNERS,
    "terms": seed.TERMS,
}


def open_database():
    """Use the same database selection as app.py, without SQLite auto-seeding."""
    from db import DB

    url = os.environ.get("DATABASE_URL")
    if url:
        from db_postgres import PostgresDB
        return PostgresDB(url)

    data_dir = os.environ.get("DATA_DIR") or str(SERVER)
    path = os.environ.get("DATABASE_PATH") or str(Path(data_dir) / "data.sqlite3")
    original = {name: getattr(seed, name) for name in ("BEADS", "TEMPLATES", "BANNERS", "TERMS")}
    try:
        for name in original:
            setattr(seed, name, [])
        return DB(path)
    finally:
        for name, value in original.items():
            setattr(seed, name, value)


def load(db, tables, apply=False, output=print):
    """List once for preview; recheck each missing ID before writing."""
    totals = {}
    for table in tables:
        existing = {row["id"] for row in db.list(table)}
        additions = [row for row in SEED_TABLES[table] if row["id"] not in existing]
        skipped = len(SEED_TABLES[table]) - len(additions)
        if apply:
            added = 0
            for row in additions:
                if db.get(table, row["id"]) is not None:
                    skipped += 1
                    continue
                db.put(table, row["id"], dict(row))
                added += 1
            additions_count = added
        else:
            additions_count = len(additions)
        output(f"{table}：将新增 {additions_count} 条 / 已存在跳过 {skipped} 条" if not apply
               else f"{table}：已新增 {additions_count} 条 / 已存在跳过 {skipped} 条")
        totals[table] = (additions_count, skipped)
    return totals


def main(argv=None):
    parser = argparse.ArgumentParser(description="预览或导入缺失的初始数据")
    parser.add_argument("--apply", action="store_true", help="确认写入；默认只预览")
    parser.add_argument("--only", help="仅处理指定表，以逗号分隔：beads,templates,banners,terms")
    args = parser.parse_args(argv)
    tables = list(SEED_TABLES) if args.only is None else [name.strip() for name in args.only.split(",")]
    if not tables or len(set(tables)) != len(tables) or any(name not in SEED_TABLES for name in tables):
        parser.error("--only 只能列出 beads,templates,banners,terms，且不可重复")
    try:
        db = open_database()
        print("执行导入（只补缺）" if args.apply else "预览（不写入记录）")
        load(db, tables, apply=args.apply)
    except Exception:
        print("数据库连接或导入失败，请检查服务端日志和数据库配置。", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
