"""订阅消息（B-10）：发货 / 签收 / 退款到账三个模板。

模板 ID 从环境变量读（NOTIFY_TPL_SHIPPED / NOTIFY_TPL_DELIVERED / NOTIFY_TPL_REFUNDED）；
开发环境或没配模板 ID 时用假发送（只记日志，算成功）。真实发送走公众平台
subscribeMessage.send，失败只记错误码。所有失败都不抛异常，不影响订单主流程。

表：notify_logs（谁、哪个模板、成功没有、错误码）、subscriptions（用户订阅授权），
由 migrations/m017_notify_logs.py 建表。
"""
import json
import os
import time
import urllib.parse
import urllib.request
import uuid

import content_security
import env

TEMPLATE_ENV_KEYS = {
    'shipped': 'NOTIFY_TPL_SHIPPED',
    'delivered': 'NOTIFY_TPL_DELIVERED',
    'refunded': 'NOTIFY_TPL_REFUNDED',
}


def _template_id(template_key):
    return os.environ.get(TEMPLATE_ENV_KEYS[template_key], '')


def _fake_send(template_id, user_id, data):
    """开发环境假发送：只记日志，算成功。"""
    return True, ''


def _wechat_send(template_id, user_id, data):
    """真实发送：公众平台 subscribeMessage.send，返回 (ok, errcode)。"""
    token = content_security._access_token()
    body = json.dumps({'touser': user_id, 'template_id': template_id, 'data': data or {}},
                      ensure_ascii=False).encode()
    request = urllib.request.Request(
        'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=' + urllib.parse.quote(token),
        data=body, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(request, timeout=8) as response:
        result = json.loads(response.read())
    code = int(result.get('errcode', 0))
    return (True, '') if code == 0 else (False, str(code))


def send(db, user_id, template_key, data):
    """发一条订阅消息并写 notify_logs；任何失败都只记日志，返回是否成功。"""
    ok, error = False, ''
    try:
        if template_key not in TEMPLATE_ENV_KEYS:
            raise ValueError('未知模板：' + str(template_key))
        template_id = _template_id(template_key)
        if env.is_dev() or not template_id:
            ok, error = _fake_send(template_id, user_id, data)
        else:
            ok, error = _wechat_send(template_id, user_id, data)
    except Exception as exc:
        ok, error = False, str(exc)[:200]
    try:
        db.put('notify_logs', uuid.uuid4().hex, {
            'userId': str(user_id or ''), 'templateKey': template_key,
            'ok': bool(ok), 'error': error, 'data': data or {},
            'at': int(time.time() * 1000)})
    except Exception:
        pass
    return ok


def order_event(db, order, event):
    """订单事件的订阅消息入口；订单没有归属用户时不发。"""
    if not isinstance(order, dict):
        return False
    user_id = order.get('userId')
    if not user_id:
        return False
    return send(db, user_id, event,
                {'orderNo': order.get('no') or '', 'orderName': order.get('name') or ''})


def on_order_transition(db, order, group, to_, idempotent=False):
    """订单状态流转后的统一入口：发货 / 签收；幂等重复流转不重复发。"""
    if idempotent or not isinstance(order, dict):
        return False
    if group == 'fulfillmentStatus' and to_ == 'shipped':
        return order_event(db, order, 'shipped')
    if to_ == 'delivered':
        return order_event(db, order, 'delivered')
    return False


def on_customer_action(db, order, action):
    """用户确认收货后发生签收事件。"""
    if action != 'confirm_receipt':
        return False
    return order_event(db, order, 'delivered')


def subscribe(db, user_id, data):
    """记录用户订阅授权：{'templates': ['shipped', ...]}；空列表 = 取消全部授权。"""
    if not isinstance(data, dict) or not isinstance(data.get('templates'), list):
        raise ValueError('请提供 templates 列表')
    raw = data['templates']
    if any(not isinstance(t, str) for t in raw) or any(t not in TEMPLATE_ENV_KEYS for t in raw):
        raise ValueError('模板名不正确')
    doc = {'userId': user_id, 'templates': sorted(set(raw)), 'updatedAt': int(time.time() * 1000)}
    db.put('subscriptions', user_id, doc)
    return doc
