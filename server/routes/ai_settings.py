"""Admin AI settings, test call and usage aggregation."""
import time
from datetime import datetime, timedelta, timezone

import accounts
import ai
import ai_settings


def get_settings(ctx, match, data):
    return 200, {**ai_settings.current(ctx.db), 'providers': ai_settings.configured()}


def put_settings(ctx, match, data):
    actor = accounts.CURRENT_ADMIN.get()['name']
    saved = ai_settings.save(ctx.db, data, actor)
    ai._provider = None
    ai._provider_err = None
    return 200, {**saved, 'providers': ai_settings.configured()}


def test_provider(ctx, match, data):
    started = time.monotonic()
    p = ai.provider()
    if p is None:
        return 200, {'success': False, 'elapsedMs': 0, 'model': '', 'error': 'AI 配当前不可用'}
    try:
        p.json('帮我配一条清爽的手串', {'type': 'object', 'properties': {'reply': {'type': 'string'}},
                                    'required': ['reply']})
        return 200, {'success': True, 'elapsedMs': int((time.monotonic() - started) * 1000),
                     'model': str(getattr(p, 'model', ''))}
    except Exception:
        return 200, {'success': False, 'elapsedMs': int((time.monotonic() - started) * 1000),
                     'model': str(getattr(p, 'model', '')), 'error': '测试失败，请检查服务配置'}


def usage(ctx, match, data):
    try:
        days = int((ctx.qs.get('days') or ['7'])[0])
    except (TypeError, ValueError):
        raise ValueError('days 不正确')
    if not 1 <= days <= 90:
        raise ValueError('days 必须在 1–90 之间')
    today = datetime.now(timezone.utc).date()
    result = {str(today - timedelta(days=i)): {'day': str(today - timedelta(days=i)),
              'design': {'calls': 0, 'failures': 0, 'avgElapsedMs': 0},
              'photo': {'calls': 0, 'failures': 0, 'avgElapsedMs': 0}} for i in range(days)}
    sums = {}
    for row in ctx.db.list('ai_logs'):
        try:
            day = str(datetime.fromtimestamp(int(row.get('at') or 0) / 1000, timezone.utc).date())
        except (ValueError, TypeError, OverflowError):
            continue
        kind = 'photo' if row.get('kind') == 'photo' else 'design'
        if day not in result:
            continue
        item = result[day][kind]
        item['calls'] += 1
        item['failures'] += not bool(row.get('ok'))
        sums[(day, kind)] = sums.get((day, kind), 0) + int(row.get('elapsedMs') or 0)
    for (day, kind), total in sums.items():
        item = result[day][kind]
        item['avgElapsedMs'] = round(total / item['calls'])
    return 200, {'days': [result[d] for d in sorted(result)]}


ROUTES = [
    ('GET', r'/api/admin/ai-settings', get_settings, 'manage_accounts'),
    ('PUT', r'/api/admin/ai-settings', put_settings, 'manage_accounts'),
    ('POST', r'/api/admin/ai-settings/test', test_provider, 'manage_accounts'),
    ('GET', r'/api/admin/ai-settings/usage', usage, 'manage_accounts'),
]
