"""Authenticated customer after-sale views and actions."""
import commerce
from routes.return_address import public_address


def _owned_sale(ctx, no):
    sale = ctx.db.get('after_sales', no)
    order = ctx.db.get('orders', sale.get('orderNo')) if sale else None
    if not order or order.get('userId') != ctx.user_id:
        raise KeyError('售后记录不存在')
    return sale


def _actions(sale):
    status = sale.get('status')
    if status in ('requested', 'reviewing'):
        return ['cancel_after_sale']
    if status == 'approved' and sale.get('type') in ('退货退款', '改手围重串'):
        return ['submit_return']
    return []


def _public(sale):
    return {
        'no': sale.get('no'), 'orderNo': sale.get('orderNo'),
        'type': sale.get('type'), 'reason': sale.get('reason'),
        'userNote': sale.get('userNote', ''), 'status': sale.get('status'),
        'refundFen': sale.get('refundFen', 0),
        'photoIds': list(sale.get('photoIds') or []),
        'contactPhone': sale.get('contactPhone', ''),
        'returnLogistics': {key: value for key, value in (sale.get('returnLogistics') or {}).items()
                            if key in ('carrierCode', 'carrierName', 'trackingNo')},
        'result': sale.get('result', ''),
        'createdAt': sale.get('createdAt'),
        'history': [
            {'status': entry.get('to'), 'at': entry.get('at')}
            for entry in sale.get('history', [])
        ],
        'customerActions': _actions(sale),
    }


def list_order(ctx, match, data):
    order_no = match.group(1)
    order = ctx.db.get('orders', order_no)
    if not order or order.get('userId') != ctx.user_id:
        raise KeyError('订单不存在')
    sales = [sale for sale in ctx.db.list('after_sales') if sale.get('orderNo') == order_no]
    sales.sort(key=lambda sale: sale.get('createdAt') or 0, reverse=True)
    return 200, {'afterSales': [_public(sale) for sale in sales]}


def detail(ctx, match, data):
    sale = _owned_sale(ctx, match.group(1))
    public = _public(sale)
    if 'submit_return' in public['customerActions']:
        public['returnAddress'] = public_address(ctx.db)
    return 200, {'afterSale': public}


def cancel(ctx, match, data):
    sale = _owned_sale(ctx, match.group(1))
    if sale.get('status') not in ('requested', 'reviewing'):
        raise ValueError('已经在处理了，不能撤销')
    changed = commerce.transition_after_sale(
        ctx.db, sale['no'], 'close', note='用户撤销', actor='用户')
    return 200, {'afterSale': _public(changed)}


def submit_return(ctx, match, data):
    sale = _owned_sale(ctx, match.group(1))
    if 'submit_return' not in _actions(sale):
        raise ValueError('当前不能填写寄回单号')
    data = data if isinstance(data, dict) else {}
    carrier = data.get('carrierName')
    tracking = data.get('trackingNo')
    if not isinstance(carrier, str) or not carrier.strip() or not isinstance(tracking, str) or not tracking.strip():
        raise ValueError('快递公司和单号都要填写')
    changed = commerce.transition_after_sale(
        ctx.db, sale['no'], 'returning',
        return_logistics={'carrierName': carrier.strip(), 'trackingNo': tracking.strip()},
        actor='用户')
    return 200, {'afterSale': _public(changed)}


ROUTES = [
    ('GET', r'/api/my/orders/([\w-]+)/after-sales', list_order, 'user'),
    ('GET', r'/api/my/after-sales/([\w-]+)', detail, 'user'),
    ('POST', r'/api/my/after-sales/([\w-]+)/cancel', cancel, 'user'),
    ('POST', r'/api/my/after-sales/([\w-]+)/return', submit_return, 'user'),
]
