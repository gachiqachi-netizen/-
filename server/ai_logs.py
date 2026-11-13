"""B-12：AI 配对话记录和每日统计。

ai_logs：每次 AI 配的输入（去掉手机号等敏感信息）、输出、命中的方案、耗时、时间。
按 E5 的期限定时清理（jobs.py 的子命令 purge-ai-logs）；保留天数走环境变量
AI_LOGS_RETENTION_DAYS，默认 30 天——E5 隐私政策的最终数字下来后改默认值即可。
stats_daily：每天汇总"珠子被串次数、搭配次数"，只有数字，不带用户。
"""
import itertools
import os
import re
import time
import uuid

RETENTION_DAYS_DEFAULT = 30
_PHONE = re.compile(r'1\d{10}')

_db = None


def attach(db):
    """照 pricing.attach 的做法：服务器启动时把主连接挂进来，record 就用它，不再自建连接
    （自建连接会和主连接各自加锁，SQLite 同时写会 database is locked）。"""
    global _db
    _db = db


def sanitize(text):
    """去掉手机号等敏感信息：11 位手机号打码，超长文本截断。"""
    return _PHONE.sub('***', str(text or ''))[:500]


def _open_db():
    """和 jobs.py 一样的开库方式；只在没 attach 时（比如单独跑测试）自建并缓存。"""
    global _db
    if _db is None:
        if os.environ.get('DATABASE_URL'):
            from db_postgres import PostgresDB
            _db = PostgresDB(os.environ['DATABASE_URL'])
        else:
            from db import DB
            data_dir = os.environ.get('DATA_DIR') or os.path.dirname(os.path.abspath(__file__))
            _db = DB(os.environ.get('DATABASE_PATH') or os.path.join(data_dir, 'data.sqlite3'))
    return _db


def record(db, input_text, output, plans, elapsed_ms, by, ok=True, error=''):
    """记一次 AI 配；plans 是命中的方案（designs 列表）。优先用 attach 进来的主连接。"""
    (db or _db or _open_db()).put('ai_logs', uuid.uuid4().hex, {
        'input': sanitize(input_text), 'output': sanitize(output),
        'plans': plans or [], 'elapsedMs': int(elapsed_ms or 0), 'by': str(by or ''),
        'ok': bool(ok), 'error': str(error or '')[:200], 'at': int(time.time() * 1000)})


def purge(db, retention_days=None, now_ms=None):
    """按保留期限清理 ai_logs，返回删除条数。"""
    if retention_days is None:
        retention_days = int(os.environ.get('AI_LOGS_RETENTION_DAYS') or RETENTION_DAYS_DEFAULT)
    cutoff = (now_ms if now_ms is not None else int(time.time() * 1000)) - int(retention_days) * 86400000
    removed = 0
    for row in db.list('ai_logs'):
        if int(row.get('at') or 0) < cutoff:
            db.delete('ai_logs', row['id'])
            removed += 1
    return removed


def stats_daily(db, day=None, now_ms=None):
    """汇总一天的"珠子被串次数、搭配次数"（只有数字，不带用户），写入 stats_daily，按天幂等。

    珠子被串次数 = 当天命中的方案里每颗珠子出现的方案数；搭配次数 = 两种珠子同出现在一个方案里的次数。
    """
    day = day or time.strftime('%Y-%m-%d', time.localtime(((now_ms if now_ms is not None else int(time.time() * 1000))) / 1000))
    beads, pairs, plans = {}, {}, 0
    for row in db.list('ai_logs'):
        if not row.get('ok'):
            continue
        if time.strftime('%Y-%m-%d', time.localtime(int(row.get('at') or 0) / 1000)) != day:
            continue
        for plan in row.get('plans') or []:
            ids = list(dict.fromkeys((plan.get('pattern') or []) + (plan.get('special') or [])))
            if not ids:
                continue
            plans += 1
            for bead_id in ids:
                beads[bead_id] = beads.get(bead_id, 0) + 1
            for a, b in itertools.combinations(sorted(ids), 2):
                key = a + '+' + b
                pairs[key] = pairs.get(key, 0) + 1
    doc = {'day': day, 'plans': plans, 'beads': beads, 'pairs': pairs,
           'updatedAt': int(time.time() * 1000)}
    db.put('stats_daily', day, doc)
    return doc
