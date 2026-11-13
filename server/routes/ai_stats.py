"""B-12：后台只读接口——AI 对话记录和每日统计。"""


def _int_arg(ctx, name, default, lo, hi):
    try:
        return min(hi, max(lo, int((ctx.qs.get(name) or [str(default)])[0])))
    except ValueError:
        raise ValueError(name + ' 不正确')


def list_logs(ctx, match, data):
    rows = ctx.db.list('ai_logs')
    rows.sort(key=lambda r: r.get('at', 0), reverse=True)
    q = (ctx.qs.get('q') or [''])[0].strip()
    if q:
        rows = [r for r in rows
                if q in str(r.get('input') or '') or q in str(r.get('output') or '')]
    return 200, {'logs': rows[:_int_arg(ctx, 'limit', 50, 1, 200)]}


def list_stats(ctx, match, data):
    rows = ctx.db.list('stats_daily')
    rows.sort(key=lambda r: r.get('day') or '', reverse=True)
    return 200, {'stats': rows[:_int_arg(ctx, 'days', 7, 1, 90)]}


ROUTES = [
    ('GET', r'/api/admin/ai-logs', list_logs, 'admin'),
    ('GET', r'/api/admin/ai-stats', list_stats, 'admin'),
]
