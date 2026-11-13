"""Admin listing and removal of public shares."""
from datetime import datetime, timezone
import threading
import uuid


_report_lock = threading.Lock()


def list_shares(ctx, match, data):
    query = (ctx.qs.get('q') or [''])[0].strip().casefold()
    shares = ctx.db.list('shares')
    if query:
        shares = [share for share in shares
                  if query in str(share.get('name') or '').casefold()
                  or query in share['id'].casefold()
                  or share['id'].casefold() in query]
    return 200, {'shares': shares}


def take_down(ctx, match, data):
    share = ctx.db.get('shares', match.group(1))
    if share is None:
        raise KeyError('分享不存在')
    if not isinstance(data, dict) or not str(data.get('reason') or '').strip():
        raise ValueError('请填写下架原因')
    if not share.get('takenDownAt'):
        share['takenDownAt'] = datetime.now(timezone.utc).isoformat()
        share['takeDownReason'] = data['reason'].strip()
        ctx.db.put('shares', share['id'], share)
    return 200, {'shareId': share['id'], 'takenDownAt': share['takenDownAt'],
                 'takeDownReason': share['takeDownReason']}


def report_share(ctx, match, data):
    share_id = match.group(1)
    if ctx.db.get('shares', share_id) is None:
        raise KeyError('分享不存在')
    if not isinstance(data, dict) or not str(data.get('reason') or '').strip():
        raise ValueError('请填写举报原因')
    if not ctx.ip:
        raise ValueError('无法识别来源 IP')
    today = datetime.now(timezone.utc).date().isoformat()
    with _report_lock:
        used = sum(1 for item in ctx.db.list('share_reports')
                   if item.get('ip') == ctx.ip and item.get('day') == today)
        if used >= 20:
            return 429, {'error': '今天举报次数已达上限'}
        report_id = uuid.uuid4().hex
        ctx.db.put('share_reports', report_id, {
            'shareId': share_id, 'ip': ctx.ip, 'day': today,
            'reason': data['reason'].strip(),
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })
    return 201, {'reportId': report_id}


ROUTES = [
    ('GET', r'/api/admin/shares', list_shares, 'admin'),
    ('POST', r'/api/admin/shares/([A-Za-z0-9_-]{43})/take-down', take_down, 'admin'),
    ('POST', r'/api/shares/([A-Za-z0-9_-]{43})/report', report_share, 'public'),
]
