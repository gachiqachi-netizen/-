"""当前订单可申请的售后类型、原因和退款金额。"""
import time

import commerce
import contract


def options(ctx, match, data):
    order = ctx.db.get('orders', match.group(1))
    if not order or order.get('userId') != ctx.user_id:
        raise KeyError('订单不存在')
    types = commerce.customer_after_sale_types(order, int(time.time() * 1000))
    return 200, {'types': [
        {'type': atype, 'label': atype,
         'refundFen': commerce.refund_amount_for(order, atype),
         'reasons': list(contract.AFTER_SALE_REASONS[atype])}
        for atype in types
    ]}


ROUTES = [
    ('GET', r'/api/my/orders/([\w-]+)/after-sale-options', options, 'user'),
]
