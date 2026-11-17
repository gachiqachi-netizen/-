"""Report one physical shipment to WeChat's mini-program order service."""
import datetime
import json
import logging
import os
import re
import time
import urllib.parse
import urllib.request

import payments
import wechat_pay
import wechat_token


EXPRESS_COMPANIES = {
    '顺丰': ('顺丰速运', '顺丰', 'SF'),
    '中通': ('中通快递', '中通', 'ZTO'),
    '圆通': ('圆通速递', '圆通快递', '圆通', 'YTO'),
    '韵达': ('韵达速递', '韵达快递', '韵达', 'YD', 'YUNDA'),
    '申通': ('申通快递', '申通', 'STO'),
    'EMS': ('中国邮政速递物流', 'EMS', '邮政EMS'),
    '邮政': ('邮政快递包裹', '中国邮政快递包裹', '中国邮政', '邮政快递', '邮政包裹', '邮政', 'YZPY'),
    '京东': ('京东快递', '京东物流', '京东', 'JD'),
    '极兔': ('极兔速递', '极兔快递', '极兔', 'JTSD', 'JT'),
    '德邦': ('德邦快递', '德邦物流', '德邦', 'DB', 'DBL'),
}
UNSYNCED = '微信发货信息未同步 · 重试'
CARRIER_UNSYNCED = '微信发货信息未同步：快递公司不在微信支持列表，请改成标准名称后重新保存物流'
_logger = logging.getLogger(__name__)
_delivery_list = None
_delivery_expires = 0


class CarrierError(ValueError):
    pass


class PaymentError(ValueError):
    pass


def _normalize(value):
    return re.sub(r'\s+', '', str(value or '')).casefold()


def _get_delivery_list():
    """WeChat's get_delivery_list is authoritative; its IDs are not guessed."""
    global _delivery_list, _delivery_expires
    if _delivery_list is not None and _delivery_expires > time.time():
        return _delivery_list
    token = wechat_token.access_token()
    url = ('https://api.weixin.qq.com/cgi-bin/express/delivery/open_msg/get_delivery_list?access_token='
           + urllib.parse.quote(token, safe=''))
    request = urllib.request.Request(url, data=b'{}', headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=8) as response:
        result = json.loads(response.read())
    if result.get('errcode') != 0 or not isinstance(result.get('delivery_list'), list):
        raise RuntimeError('微信运力列表获取失败')
    _delivery_list = result['delivery_list']
    _delivery_expires = time.time() + 3600
    return _delivery_list


def express_code(name, delivery_list=None):
    """Resolve common names against the official list, returning no unknown ID."""
    normalized = _normalize(name)
    variants = next((names for names in EXPRESS_COMPANIES.values()
                     if normalized in {_normalize(item) for item in names}), None)
    if variants is None:
        return None
    rows = _get_delivery_list() if delivery_list is None else delivery_list
    accepted = {_normalize(item) for item in variants}
    return next((row['delivery_id'] for row in rows
                 if isinstance(row, dict) and _normalize(row.get('delivery_name')) in accepted
                 and isinstance(row.get('delivery_id'), str) and row['delivery_id']), None)


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
    carrier_name = logistics.get('carrierName')
    if not any(_normalize(carrier_name) in {_normalize(item) for item in names}
               for names in EXPRESS_COMPANIES.values()):
        raise CarrierError('快递公司不在微信支持列表')
    code = express_code(carrier_name)
    if not code:
        raise CarrierError('快递公司不在微信支持列表')
    tracking = str(logistics.get('trackingNo') or '').strip()
    phone = str(order.get('phone') or '').strip()
    if not tracking or not re.fullmatch(r'1\d{10}', phone):
        raise ValueError('微信发货缺少运单号或收件电话')
    queried = wechat_pay.query_order(order['no'])
    if (queried.get('trade_state') != 'SUCCESS' or queried.get('out_trade_no') != order['no']
            or queried.get('mchid') != os.environ['WXPAY_MCHID']):
        raise PaymentError('微信支付单尚未确认')
    openid = (queried.get('payer') or {}).get('openid')
    if not openid:
        raise PaymentError('微信支付单缺少付款人标识')
    return {
        'order_key': {'order_number_type': 1, 'mchid': os.environ['WXPAY_MCHID'],
                      'out_trade_no': order['no']},
        'logistics_type': 1, 'delivery_mode': 1,
        'shipping_list': [{'tracking_no': tracking, 'express_company': code,
                           'item_desc': str(order.get('name') or '手串')[:120],
                           'contact': {'receiver_contact': phone[:3] + '****' + phone[-4:]}}],
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
        reason = 'carrier' if isinstance(exc, CarrierError) else 'payment' if isinstance(exc, PaymentError) else 'api'
        state = {'status': 'failed', 'reason': reason, 'trackingNo': tracking,
                 'message': CARRIER_UNSYNCED if reason == 'carrier' else UNSYNCED}
    current['wxShipping'] = state
    db.put('orders', order_no, current)
    order['wxShipping'] = state
    return order
