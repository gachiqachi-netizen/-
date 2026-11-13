"""订单展示信息：只读订单，状态名称统一取契约。"""
import contract
import status


def customer_status(order, allowed_actions):
    g = status.derive_status(order)
    after = g['afterSaleStatus']
    action = None
    if after in ('requested', 'reviewing', 'approved', 'returning', 'refunding', 'received'):
        code, desc = 'after_sale_open', '售后正在处理，有进展会通知你。'
    elif after == 'completed':
        code, desc = 'after_sale_done', '售后已经处理完了。'
    elif after == 'rejected':
        code, desc = 'after_sale_rejected', '售后申请没有通过，原因在售后详情里。'
    elif g['orderStatus'] in ('cancelled', 'closed'):
        code, action = 'cancelled', 'reorder'
        desc = '这笔订单已取消，钱已原路退回。' if g['paymentStatus'] == 'refunded' else '这笔订单已取消，没有扣款。'
    elif g['paymentStatus'] in ('refunding', 'refunded', 'refund_failed'):
        code = g['paymentStatus']
        desc = {'refunding': '钱正在原路退回。', 'refunded': '钱已原路退回。', 'refund_failed': '退款没成功，我们在处理。'}[code]
    elif g['orderStatus'] == 'completed':
        code, desc, action = 'completed', '戴得开心。', 'reorder'
    elif g['logisticsStatus'] == 'delivered':
        code, desc, action = 'delivered', '快递显示已签收，确认没问题就点确认收货。', 'confirm_receipt'
    elif g['logisticsStatus'] in ('shipped', 'in_transit'):
        code, action = 'in_transit', 'view_logistics'
        logistics = order.get('logistics') or {}
        desc = '已交给%s，单号 %s' % (logistics.get('carrierName') or '快递', logistics['trackingNo']) if logistics.get('trackingNo') else '快件已发出。'
    elif g['logisticsStatus'] in ('exception', 'returned'):
        code, desc = 'logistics_issue', '快递遇到问题，我们在处理，有进展会通知你。'
    elif g['fulfillmentStatus'] == 'ready_to_ship':
        code, desc = 'ready_to_ship', '手串做好了，等快递来取。'
    elif g['fulfillmentStatus'] == 'producing' or (g['paymentStatus'] == 'paid' and g['fulfillmentStatus'] == 'unfulfilled'):
        code, desc = 'producing', '师傅正在串你的手串。'
    elif g['paymentStatus'] in ('unpaid', 'paying', 'pay_failed'):
        code, desc, action = 'pending_payment', '还没付款，订单已为你保留。', 'pay_order'
    else:
        code, desc = 'processing', '订单正在处理。'
    return {'code': code, **contract.CUSTOMER_STATUS[code], 'desc': desc,
            'primaryAction': action if action in allowed_actions else None}


def ops_status(order):
    g = status.derive_status(order)
    if g['afterSaleStatus'] not in ('none', 'closed'):
        code = 'after_sale'
    elif g['orderStatus'] in ('cancelled', 'closed'):
        code = g['orderStatus']
    elif g['paymentStatus'] in ('unpaid', 'paying', 'pay_failed'):
        code = 'unpaid'
    elif g['fulfillmentStatus'] == 'unfulfilled':
        code = 'to_make'
    elif g['fulfillmentStatus'] == 'producing':
        code = 'qc_failed' if (order.get('qualityGate') or {}).get('passed') is False else 'producing'
    elif g['fulfillmentStatus'] == 'ready_to_ship':
        code = 'ready_to_ship'
    elif g['logisticsStatus'] == 'exception':
        code = 'logistics_issue'
    elif g['fulfillmentStatus'] == 'shipped':
        code = 'shipped'
    elif g['fulfillmentStatus'] == 'delivered' or g['orderStatus'] == 'completed':
        code = 'completed'
    else:
        code = 'producing'  # 不应出现：兼容尚未归类的旧订单。
    return {'code': code, **contract.OPS_STATUS[code]}


def progress(order):
    g = status.derive_status(order)
    show = (g['orderStatus'] not in ('cancelled', 'closed')
            and g['paymentStatus'] not in ('refunding', 'refunded', 'refund_failed')
            and g['afterSaleStatus'] in ('none', 'closed'))
    history = order.get('statusHistory') or []
    def first(to):
        return next((row.get('at') for row in history if row.get('group') == 'fulfillmentStatus' and row.get('to') == to), None)
    logistics = order.get('logistics') or {}
    times = {'ordered': order.get('createdAt'), 'producing': first('producing'),
             'shipping': first('shipped') or logistics.get('shippedAt'), 'delivered': logistics.get('signedAt')}
    return {'show': show, 'steps': [{'key': key, 'label': label, 'at': times[key], 'done': times[key] is not None}
                                   for key, label in contract.PROGRESS_STEPS]}
