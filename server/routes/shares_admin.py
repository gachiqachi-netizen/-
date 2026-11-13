"""Admin listing and removal of public shares."""
from datetime import datetime, timezone


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


ROUTES = [
    ('GET', r'/api/admin/shares', list_shares, 'admin'),
    ('POST', r'/api/admin/shares/([A-Za-z0-9_-]{43})/take-down', take_down, 'admin'),
]
