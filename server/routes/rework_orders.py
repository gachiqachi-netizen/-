"""改手围重串工单；独立保存在售后记录中，不生成新订单或金额。"""

import accounts
import commerce


def _actor():
    return (accounts.CURRENT_ADMIN.get() or {}).get('name') or 'admin'


def _visible(ctx, sale_no):
    rec = ctx.db.get('after_sales', sale_no)
    wo = rec.get('reworkOrder') if rec else None
    if not wo:
        raise KeyError('重串工单不存在')
    own_name = accounts.own_scope_name(ctx.db)
    if own_name and wo.get('assignee') != own_name:
        raise KeyError('重串工单不存在')
    return wo


def list_orders(ctx, match, data):
    own_name = accounts.own_scope_name(ctx.db)
    rows = [rec['reworkOrder'] for rec in ctx.db.list('after_sales')
            if isinstance(rec.get('reworkOrder'), dict)
            and (not own_name or rec['reworkOrder'].get('assignee') == own_name)]
    rows.sort(key=lambda row: row.get('createdAt', 0), reverse=True)
    return 200, rows


def detail(ctx, match, data):
    return 200, _visible(ctx, match.group(1))


def create(ctx, match, data):
    return 201, commerce.create_rework_order(ctx.db, match.group(1), actor=_actor())


def update(ctx, match, data):
    _visible(ctx, match.group(1))
    return 200, commerce.update_rework_order(ctx.db, match.group(1), data, actor=_actor())


def quality(ctx, match, data):
    _visible(ctx, match.group(1))
    return 200, commerce.update_rework_order(ctx.db, match.group(1), {'qualityGate': data}, actor=_actor())


def ship(ctx, match, data):
    _visible(ctx, match.group(1))
    return 200, commerce.update_rework_order(ctx.db, match.group(1), {'shipping': data}, actor=_actor())


ROUTES = [
    ('GET', r'/api/admin/rework-orders', list_orders, 'view_work_orders'),
    ('GET', r'/api/admin/rework-orders/([\w-]+)', detail, 'view_work_orders'),
    ('POST', r'/api/admin/after-sales/([\w-]+)/rework-order', create, 'process_after_sales'),
    ('PUT', r'/api/admin/rework-orders/([\w-]+)', update, 'work_orders'),
    ('PUT', r'/api/admin/rework-orders/([\w-]+)/quality-gate', quality, 'quality_gate'),
    ('PUT', r'/api/admin/rework-orders/([\w-]+)/ship', ship, 'process_after_sales'),
]
