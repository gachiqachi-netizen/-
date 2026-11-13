"""定时任务入口：python3 server/jobs.py auto-complete

部署时由服务器的定时任务每小时跑一次（这里不配定时任务）。
打开数据库的方式和 app.py 一致：有 DATABASE_URL 用 PostgreSQL，否则用 SQLite
（DATABASE_PATH，默认 DATA_DIR/data.sqlite3，DATA_DIR 默认是 server 目录）。
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import commerce  # noqa: E402


def open_db():
    if os.environ.get("DATABASE_URL"):
        from db_postgres import PostgresDB
        return PostgresDB(os.environ["DATABASE_URL"])
    from db import DB
    data_dir = os.environ.get("DATA_DIR") or HERE
    return DB(os.environ.get("DATABASE_PATH") or os.path.join(data_dir, "data.sqlite3"))


def main(argv=None):
    parser = argparse.ArgumentParser(description="串个珠定时任务")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("auto-complete", help="签收 7 天、没有售后的订单自动确认收货")
    sub.add_parser("purge-ai-logs", help="按保留期限清理 AI 对话记录（AI_LOGS_RETENTION_DAYS，默认 30 天）")
    sub.add_parser("stats-daily", help="汇总今天的珠子被串次数、搭配次数（按天幂等）")
    args = parser.parse_args(argv)
    if args.command == "auto-complete":
        done = commerce.auto_complete_delivered(open_db())
        print(f"自动完成 {len(done)} 单" + (f"：{', '.join(done)}" if done else ""))
    elif args.command == "purge-ai-logs":
        import ai_logs
        print(f"清理 AI 对话记录 {ai_logs.purge(open_db())} 条")
    elif args.command == "stats-daily":
        import ai_logs
        doc = ai_logs.stats_daily(open_db())
        print(f"汇总 {doc['day']}：方案 {doc['plans']} 条，珠子 {len(doc['beads'])} 种，搭配 {len(doc['pairs'])} 对")
    return 0


if __name__ == "__main__":
    sys.exit(main())
