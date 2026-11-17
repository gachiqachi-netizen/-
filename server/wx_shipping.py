"""Report one physical shipment to WeChat's mini-program order service."""
import datetime
import json
import logging
import os
import urllib.parse
import urllib.request

import payments
import wechat_pay
import wechat_token


EXPRESS_COMPANIES = {'顺丰': 'SF', '顺丰速运': 'SF', 'SF': 'SF'}
UNSYNCED = '微信发货信息未同步 · 重试'
_logger = logging.getLogger(__name__)


def express_code(name):
    """Only accepted carrier names are sent; never guess an unknown code."""
    return EXPRESS_COMPANIES.get(str(name or '').strip())


def _post(payload):
    token = wechat_token.access_token()
    url = ('https://api.weixin.qq.com/wxa/sec/order/upload_shipping_info?access_token='
           + urllib.parse.quote(token, safe=''))
    request = urllib.request.Request(url, data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
                                     headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=8) as response:
        result = json.loads(response.read())
    if result.get('errcode') != 0:
        raise RuntimeError('微信发货接口返回失败，错误码 ' + str(result.get('errcode', 'unknown')))
    return result


def _payload(order):
    logistics = order.get('logistics') or {}
    code = express_code(logistics.get('carrierName'))
    if not code:
        raise ValueError('不支持的快递公司编码')
    tracking = str(logistics.get('trackingNo') or '').strip()
    phone = str(order.get('phone') or '').strip()
    if not tracking or not phone:
        raise ValueError('微信发货缺少运单号或收件电话')
    queried = wechat_pay.query_order(order['no'])
    if (queried.get('trade_state') != 'SUCCESS' or queried.get('out_trade_no') != order['no']
            or queried.get('mchid') != os.environ['WXPAY_MCHID']):
        raise ValueError('微信支付单尚未确认')
    openid = (queried.get('payer') or {}).get('openid')
    if not openid:
        raise ValueError('微信支付单缺少付款人标识')
    return {
        'order_key': {'order_number_type': 1, 'mchid': os.environ['WXPAY_MCHID'],
                      'out_trade_no': order['no']},
        'logistics_type': 1, 'delivery_mode': 1,
        'shipping_list': [{'tracking_no': tracking, 'express_company': code,
                           'item_desc': str(order.get('name') or '手串')[:120],
                           'contact': {'receiver_contact': phone}}],
        'upload_time': datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat(timespec='milliseconds'),
        'payer': {'openid': openid},
    }


def sync(db, order_no, order):
    """Called after shipping and on logistics PUT for a failed upload retry."""
    if payments.provider() != 'wechat' or order.get('paymentChannel') != 'wechat':
        return order
    if order.get('fulfillmentStatus') != 'shipped':
        return order
    current = db.get('orders', order_no) or order
    state = current.get('wxShipping') or {}
    logistics = current.get('logistics') or {}
    tracking = logistics.get('trackingNo')
    if state.get('status') == 'synced' and state.get('trackingNo') == tracking:
        return order
    try:
        _post(_payload(current))
        state = {'status': 'synced', 'trackingNo': tracking}
    except Exception as exc:
        _logger.warning('微信发货信息同步失败，订单 %s：%s', order_no, type(exc).__name__)
        state = {'status': 'failed', 'trackingNo': tracking, 'message': UNSYNCED}
    current['wxShipping'] = state
    db.put('orders', order_no, current)
    order['wxShipping'] = state
    return order
