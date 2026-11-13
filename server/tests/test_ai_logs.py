"""B-12：AI 配对话记录（去手机号）、按期限清理、每日统计、后台只读接口。"""
import os
import sys
import tempfile
import time
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import DB
import ai
import ai_logs
import jobs
import routes

BEADS = [
    {"id": "a", "name": "粉晶", "mm": 8, "mat": "crystal", "price": 3, "tags": []},
    {"id": "b", "name": "白水晶", "mm": 8, "mat": "crystal", "price": 2, "tags": []},
]
DAY_MS = 86400000


def design_with(payload):
    class Provider:
        name = "fake"

        def json(self, prompt, schema, image=None):
            return payload

    with mock.patch.object(ai, "provider", return_value=Provider()):
        return ai.design(BEADS, "想要一条粉水晶", [], 15)


class AILogsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = DB(os.path.join(self.tmp.name, 'test.db'))

    def tearDown(self):
        self.db.conn.close()
        self.tmp.cleanup()

    def record(self, **kw):
        args = dict(db=self.db, input_text='想要一条粉水晶', output='好的，看看这两条',
                    plans=[{'pattern': ['a', 'a', 'b'], 'special': ['m']}], elapsed_ms=120, by='fake')
        args.update(kw)
        ai_logs.record(**args)

    def put_old_log(self, at_ms, plans=None, ok=True):
        self.db.put('ai_logs', 'old-' + str(at_ms), {
            'input': '旧的', 'output': '旧回复', 'plans': plans or [], 'elapsedMs': 50,
            'by': 'fake', 'ok': ok, 'error': '', 'at': at_ms})

    # ---- 迁移与表 ----

    def test_migration_creates_tables(self):
        self.assertEqual(self.db.list('ai_logs'), [])
        self.assertEqual(self.db.list('stats_daily'), [])

    # ---- 记录 ----

    def test_sanitize_masks_phone(self):
        self.assertEqual(ai_logs.sanitize('联系我 13800138000 谢谢'), '联系我 *** 谢谢')

    def test_record_writes_sanitized_log(self):
        self.record(input_text='打 13800138000 找我')
        (row,) = self.db.list('ai_logs')
        self.assertEqual(row['input'], '打 *** 找我')
        self.assertEqual(row['output'], '好的，看看这两条')
        self.assertEqual(row['plans'], [{'pattern': ['a', 'a', 'b'], 'special': ['m']}])
        self.assertEqual(row['elapsedMs'], 120)
        self.assertEqual(row['by'], 'fake')
        self.assertTrue(row['ok'])
        self.assertGreater(row['at'], 0)

    def test_attach_used_when_no_db(self):
        """attach 主连接后，record 不再自建连接（审核意见 1）。"""
        ai_logs.attach(self.db)
        try:
            ai_logs.record(None, '想要一条粉水晶', '好的', [], 10, 'fake')
        finally:
            ai_logs.attach(None)
        self.assertEqual(len(self.db.list('ai_logs')), 1)

    # ---- 清理 ----

    def test_purge_removes_expired(self):
        now = int(time.time() * 1000)
        self.put_old_log(now - 31 * DAY_MS)
        self.record()
        self.assertEqual(ai_logs.purge(self.db, retention_days=30, now_ms=now), 1)
        self.assertEqual(len(self.db.list('ai_logs')), 1)
        self.assertEqual(ai_logs.purge(self.db, retention_days=90, now_ms=now), 0)

    def test_purge_retention_from_env(self):
        now = int(time.time() * 1000)
        self.put_old_log(now - 3 * DAY_MS)
        with mock.patch.dict(os.environ, {'AI_LOGS_RETENTION_DAYS': '1'}):
            self.assertEqual(ai_logs.purge(self.db, now_ms=now), 1)

    # ---- 每日统计 ----

    def test_stats_daily_aggregates(self):
        today = time.strftime('%Y-%m-%d')
        yesterday = time.strftime('%Y-%m-%d', time.localtime((int(time.time() * 1000) - DAY_MS) / 1000))
        self.record(plans=[{'pattern': ['a', 'a', 'b'], 'special': ['m']}])
        self.record(plans=[{'pattern': ['b', 'c'], 'special': []}])
        self.record(ok=False, error='AI 给的珠子不在料包里', plans=[{'pattern': ['a'], 'special': []}])
        self.put_old_log(int(time.time() * 1000) - DAY_MS, plans=[{'pattern': ['a'], 'special': []}])
        doc = ai_logs.stats_daily(self.db, day=today)
        self.assertEqual(doc['day'], today)
        self.assertEqual(doc['plans'], 2)  # 失败的不算，昨天的不算
        self.assertEqual(doc['beads'], {'a': 1, 'b': 2, 'm': 1, 'c': 1})
        self.assertEqual(doc['pairs'], {'a+b': 1, 'a+m': 1, 'b+m': 1, 'b+c': 1})
        ai_logs.stats_daily(self.db, day=today)  # 按天幂等
        self.assertEqual(len(self.db.list('stats_daily')), 1)
        self.assertNotEqual(doc['day'], yesterday)

    # ---- design() 挂钩 ----

    def test_design_records_log(self):
        with mock.patch.object(ai_logs, 'record') as rec:
            out = design_with({'reply': '好的', 'designs': [{'name': '心愿', 'meaning': '平安',
                                                             'pattern': ['a', 'b'], 'special': []}]})
        self.assertEqual(out['message'], '好的')
        rec.assert_called_once()
        kw = rec.call_args
        self.assertEqual(kw.args[1], '想要一条粉水晶')  # input 原文传入，由 record 去手机号
        self.assertEqual(kw.args[2], '好的')
        self.assertEqual(kw.args[3], out['designs'])  # 命中的方案
        self.assertTrue(kw.kwargs['ok'])

    def test_design_failure_records_ok_false(self):
        with mock.patch.object(ai_logs, 'record') as rec:
            with self.assertRaises(RuntimeError):
                design_with({'reply': '好的', 'designs': [{'name': 'x', 'meaning': 'y',
                                                          'pattern': ['zzz'], 'special': []}]})
        self.assertFalse(rec.call_args.kwargs['ok'])

    def test_design_record_failure_does_not_affect_return(self):
        with mock.patch.object(ai_logs, 'record', side_effect=RuntimeError('日志表不可用')):
            out = design_with({'reply': '好的', 'designs': [{'name': '心愿', 'meaning': '平安',
                                                             'pattern': ['a', 'b'], 'special': []}]})
        self.assertEqual(out['message'], '好的')  # 记录失败不影响返回

    # ---- jobs 子命令 ----

    def test_jobs_purge_and_stats_commands(self):
        path = os.path.join(self.tmp.name, 'jobs.db')
        seed = DB(path)
        ai_logs.record(seed, '想要一条粉水晶', '好的', [{'pattern': ['a', 'b'], 'special': []}], 80, 'fake')
        ai_logs.record(seed, '旧的', '旧', [], 50, 'fake')
        old_at = int(time.time() * 1000) - 40 * DAY_MS
        for row in seed.list('ai_logs'):
            if row['input'] == '旧的':
                seed.put('ai_logs', row['id'], {**row, 'at': old_at})
        seed.conn.close()
        env = {k: v for k, v in os.environ.items() if k not in ('DATABASE_URL', 'DATA_DIR', 'AI_LOGS_RETENTION_DAYS')}
        env.update({'DATABASE_PATH': path, 'AI_LOGS_RETENTION_DAYS': '30'})
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertEqual(jobs.main(['purge-ai-logs']), 0)
            self.assertEqual(jobs.main(['stats-daily']), 0)
        check = DB(path)
        self.assertEqual(len(check.list('ai_logs')), 1)  # 40 天前的被清掉
        (doc,) = check.list('stats_daily')
        self.assertEqual(doc['plans'], 1)
        self.assertEqual(doc['beads'], {'a': 1, 'b': 1})
        check.conn.close()

    # ---- 后台只读接口 ----

    def test_routes_registered(self):
        table = routes.load()
        paths = {(m, p.pattern, a) for m, p, f, a in table}
        self.assertIn(('GET', r'/api/admin/ai-logs', 'view_orders'), paths)
        self.assertIn(('GET', r'/api/admin/ai-stats', 'view_orders'), paths)


if __name__ == '__main__':
    unittest.main()
