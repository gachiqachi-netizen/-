"""WeChat identity and owner-scoped prototype APIs; payment integration is intentionally separate."""
import kb
import pricing
import money
import content_security
import hashlib
import json
import os
import re
import secrets
import time
import urllib.parse
import urllib.request
import uuid
from decimal import Decimal

import status

SESSION_SECONDS = 30 * 24 * 3600


def public_user(user):
    """Only expose the phone field intended for the signed-in user."""
    return {'phoneMasked': user.get('phoneMasked')}

class IdempotencyConflict(Exception):
    pass

class PriceChanged(Exception):
    pass


def bead_price_fen(bead):
    """商品计价只信任 priceFen；旧数据没有该字段时才从 price 迁移兼容。"""
    if 'priceFen' in bead:
        return money.parse_fen(bead['priceFen'])
    return money.yuan_to_fen(bead.get('price'))


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def login(db, code):
    appid = os.environ.get('WECHAT_APP_ID', '').strip()
    secret = os.environ.get('WECHAT_APP_SECRET', '').strip()
    if not appid or not secret:
        return 503, {'error': '微信登录尚未配置'}
    if not isinstance(code, str) or not 1 <= len(code) <= 256:
        return 400, {'error': '缺少有效的微信登录凭证'}
    query = urllib.parse.urlencode({'appid': appid, 'secret': secret, 'js_code': code, 'grant_type': 'authorization_code'})
    try:
        with urllib.request.urlopen('https://api.weixin.qq.com/sns/jscode2session?' + query, timeout=8) as response:
            result = json.loads(response.read(16384))
    except Exception:
        return 502, {'error': '微信登录服务暂不可用'}
    openid = result.get('openid')
    if not isinstance(openid, str) or not openid:
        return 401, {'error': '微信登录凭证无效或已过期'}
    uid = hashlib.sha256((appid + ':' + openid).encode()).hexdigest()
    user = db.get('users', uid) or {'createdAt': int(time.time() * 1000)}
    db.put('users', uid, user)
    token = secrets.token_urlsafe(32)
    expires = int(time.time()) + SESSION_SECONDS
    db.put('sessions', token_hash(token), {'userId': uid, 'expiresAt': expires})
    return 200, {'token': token, 'expiresAt': expires}


def dev_login(db, name):
    if os.environ.get('DEV_LOGIN') != '1':
        return 404, {'error': 'not_found'}
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 40:
        return 400, {'error': '开发测试名称无效'}
    uid = 'dev:' + hashlib.sha256(name.strip().encode()).hexdigest()
    db.put('users', uid, db.get('users', uid) or {'createdAt': int(time.time() * 1000)})
    token = secrets.token_urlsafe(32)
    expires = int(time.time()) + SESSION_SECONDS
    db.put('sessions', token_hash(token), {'userId': uid, 'expiresAt': expires})
    return 200, {'token': token, 'expiresAt': expires}


def owner(db, header):
    match = re.fullmatch(r'Bearer ([A-Za-z0-9_-]{32,128})', header or '')
    if not match:
        return None
    s = db.get('sessions', token_hash(match.group(1)))
    return s.get('userId') if s and s.get('expiresAt', 0) > time.time() else None


def logout(db, header):
    match = re.fullmatch(r'Bearer ([A-Za-z0-9_-]{32,128})', header or '')
    if not match:
        return False
    db.delete('sessions', token_hash(match.group(1)))
    return True


def cleanup_sessions(db, now=None):
    return db.delete_expired_sessions(time.time() if now is None else now)


def design_data(data, owner_id):
    name = data.get('name', '我的手串')
    beads = data.get('beads', [])
    wrist = data.get('wrist', 15)
    if not isinstance(name, str) or len(name) > 60 or not name.strip():
        raise ValueError('请填写设计名称')
    content_security.ensure_allowed(name)
    if not isinstance(beads, list) or len(beads) > 500 or any(not isinstance(i, str) or len(i) > 100 for i in beads):
        raise ValueError('珠子数据格式不正确')
    if isinstance(wrist, bool) or not isinstance(wrist, (int, float)) or not 8 <= wrist <= 30:
        raise ValueError('手围须在 8–30cm 之间')
    design = {'userId': owner_id, 'name': name.strip(), 'beads': beads, 'wrist': wrist, 'updatedAt': int(time.time() * 1000)}
    # Optional fields remain absent for legacy clients, so transactional updates
    # can retain stored metadata. Empty arrays and null are explicit values.
    for field in ('special', 'pattern', 'tail'):
        if field in data:
            value = data[field]
            if not isinstance(value, list) or len(value) > 500 or any(not isinstance(i, str) or not i or len(i) > 100 for i in value):
                raise ValueError('模板珠子数据格式不正确')
            design[field] = value[:]
    if 'fixed' in data:
        fixed = data['fixed']
        if fixed is not None and (type(fixed) is not int or not 1 <= fixed <= 500):
            raise ValueError('模板固定颗数不正确')
        design['fixed'] = fixed
    for field, limit in (('source', 40), ('tplId', 100), ('meaning', 1000)):
        if field in data:
            value = data[field]
            if not isinstance(value, str) or len(value) > limit:
                raise ValueError('设计信息格式不正确')
            design[field] = value
    if 'edited' in data:
        if type(data['edited']) is not bool:
            raise ValueError('设计状态格式不正确')
        design['edited'] = data['edited']
    return design


def public_design(d):
    return {k: v for k, v in d.items() if k != 'userId'}


_ORDER_STATE_GROUPS = (
    ('order', 'orderStatus'),
    ('payment', 'paymentStatus'),
    ('fulfillment', 'fulfillmentStatus'),
    ('afterSale', 'afterSaleStatus'),
    ('logistics', 'logisticsStatus'),
)


def order_allowed_actions(order):
    """Return stable customer action codes; the server remains the final arbiter."""
    groups = status.derive_status(order)
    actions = []
    if (groups['orderStatus'] == 'pending_confirmation'
            and groups['paymentStatus'] == 'unpaid'
            and groups['fulfillmentStatus'] == 'unfulfilled'
            and groups['afterSaleStatus'] == 'none'
            and groups['logisticsStatus'] == 'not_shipped'):
        actions.append('cancel_order')
    if (groups['orderStatus'] == 'confirmed'
            and groups['paymentStatus'] == 'paid'
            and groups['fulfillmentStatus'] in ('shipped', 'delivered')
            and groups['afterSaleStatus'] == 'none'
            and groups['logisticsStatus'] in ('shipped', 'in_transit', 'delivered')):
        actions.append('confirm_receipt')
    if groups['logisticsStatus'] != 'not_shipped' or order.get('logistics'):
        actions.append('view_logistics')
    if (groups['orderStatus'] not in ('cancelled', 'closed', 'completed')
            and groups['logisticsStatus'] == 'not_shipped'
            and groups['afterSaleStatus'] == 'none'):
        actions.append('edit_address')
    if ((groups['orderStatus'] == 'completed' or groups['fulfillmentStatus'] == 'delivered'
         or groups['logisticsStatus'] == 'delivered')
            and order.get('reviewStatus') in (None, 'machine_failed')):
        actions.append('write_review')
    if isinstance(order.get('beads'), list) and order['beads']:
        actions.append('reorder')
    import commerce
    if commerce.customer_after_sale_types(order, int(time.time() * 1000)):
        actions.append('request_after_sale')
    # 只有当前有可用的支付通道（开发/体验环境的模拟支付，或以后的微信支付）时才给 pay_order；
    # 不看订单上旧的 paymentAvailable 字段。
    import payments
    if (payments.payment_available()
            and groups['orderStatus'] in ('pending_confirmation', 'confirmed')
            and groups['paymentStatus'] == 'unpaid'
            and groups['afterSaleStatus'] == 'none'):
        actions.insert(0, 'pay_order')
    return actions


# 只给后台看的订单字段：生产工单（负责人、作业备注）和质检记录（质检员、原因）。用户接口一律不返回。
INTERNAL_ORDER_FIELDS = ('workOrder', 'qualityGate', 'addressHistory', 'internalNotes')
# 状态和物流记录只给用户看“什么时候、从什么变成什么”，不带操作人和内部备注。
_PUBLIC_STATUS_KEYS = ('at', 'group', 'from', 'to')
_PUBLIC_LOGISTICS_KEYS = ('at', 'action', 'detail')


def _pick_list(rows, keys):
    return [{k: r[k] for k in keys if k in r} for r in (rows or []) if isinstance(r, dict)]


def public_order(order):
    """Owner-safe order representation with normalized state and actions."""
    import order_view
    out = {k: v for k, v in public_design(order).items() if k not in INTERNAL_ORDER_FIELDS}
    if 'statusHistory' in out:
        out['statusHistory'] = _pick_list(out['statusHistory'], _PUBLIC_STATUS_KEYS)
    if 'logisticsHistory' in out:
        out['logisticsHistory'] = _pick_list(out['logisticsHistory'], _PUBLIC_LOGISTICS_KEYS)
    groups = status.derive_status(order)
    out['state'] = {
        key: {'code': groups[field], 'label': status.status_label(field, groups[field])}
        for key, field in _ORDER_STATE_GROUPS
    }
    out['allowedActions'] = order_allowed_actions(order)
    out['customerStatus'] = order_view.customer_status(order, out['allowedActions'])
    out['progress'] = order_view.progress(order)
    return out


def get_my_order(db, no, uid):
    order = db.get('orders', no)
    if not order or order.get('userId') != uid:
        raise KeyError('订单不存在')
    return public_order(order)


def change_my_order_address(db, no, uid, data):
    import commerce
    return public_order(commerce.change_order_address(
        db, no, data, actor='customer', owner_id=uid))


def request_after_sale(db, no, uid, data):
    import commerce
    import contract
    order = db.get('orders', no)
    if not order or order.get('userId') != uid:
        raise KeyError('订单不存在')
    atype = data.get('type')
    key = data.get('idempotencyKey')
    repeated = (isinstance(key, str) and any(
        rec.get('orderNo') == no and rec.get('idempotencyKey') == key
        for rec in db.list('after_sales')))
    if not repeated and atype not in commerce.customer_after_sale_types(order, int(time.time() * 1000)):
        raise ValueError('这个阶段不能申请这种售后')
    reason = data.get('reason')
    if reason not in contract.AFTER_SALE_REASONS.get(atype, []):
        raise ValueError('售后原因不正确')
    note = data.get('userNote', '')
    if not isinstance(note, str) or len(note) > 500:
        raise ValueError('售后说明不能超过 500 字')
    content_security.ensure_allowed(note)
    wrist = data.get('newWrist')
    if atype == '改手围重串':
        if type(wrist) not in (int, float) or not 13 <= wrist <= 20:
            raise ValueError('新手围须在 13–20 cm 之间')
    payload = {'orderNo': no, 'type': atype, 'reason': reason, 'userNote': note,
               'refundFen': commerce.refund_amount_for(order, atype),
               'idempotencyKey': key}
    if atype == '改手围重串':
        payload['newWrist'] = wrist
    sale = commerce.create_after_sale(db, payload, actor='customer')
    sale = dict(sale)
    sale['history'] = _pick_list(sale.get('history'),
                                 ('at', 'group', 'from', 'to', 'note'))
    return {'afterSale': sale, 'order': public_order(db.get('orders', no))}


def perform_order_action(db, no, uid, action, reason=None):
    import commerce
    return public_order(commerce.customer_order_action(db, no, uid, action, reason=reason))


def start_payment(db, no, uid):
    import commerce
    order, params = commerce.start_payment(db, no, uid)
    return {'payment': params, 'order': public_order(order)}


def mock_payment_notify(db, no, uid, payment_id, result):
    """模拟支付的回调：由用户端点“支付成功 / 支付失败”触发，服务端按付款记录的金额组一个回调，
    走和真实回调相同的处理。只有模拟通道可用时才存在。"""
    import commerce, payments
    if payments.provider() != 'mock':
        raise KeyError('模拟支付未开启')
    if result not in ('success', 'fail'):
        raise ValueError('模拟支付结果只能是 success 或 fail')
    order = db.get('orders', no)
    if not order or order.get('userId') != uid:
        raise KeyError('订单不存在')
    attempt = next((a for a in (order.get('paymentAttempts') or []) if a.get('id') == payment_id), None)
    if not attempt:
        raise ValueError('付款记录不存在')
    callback = {'id': 'cb_' + payment_id, 'paymentId': payment_id, 'provider': 'mock',
                'amountFen': attempt['amountFen'], 'result': result}
    outcome, saved = commerce.payment_callback(db, no, callback, user_id=uid)
    return {'result': outcome, 'order': public_order(saved)}


def create_share(db, data, owner_id):
    """Create an unguessable public snapshot, containing only explicit design fields."""
    design = design_data(data, owner_id)
    if not design['beads']:
        raise ValueError('请先添加珠子')
    design_id = str(data.get('id') or '')[:64]
    if design_id:
        original = db.get('designs', design_id)
        if not original or original.get('userId') != owner_id or original.get('deletedAt'):
            raise KeyError('设计不存在')
    token = secrets.token_urlsafe(32)
    share = {k: design[k] for k in ('name', 'beads', 'wrist', 'special', 'pattern', 'tail', 'fixed', 'meaning', 'source', 'tplId') if k in design}
    share['createdAt'] = int(time.time() * 1000)
    if design_id:
        share['designId'] = design_id
    db.put('shares', token, share)
    return {'shareId': token}


def read_share(db, token):
    if not re.fullmatch(r'[A-Za-z0-9_-]{43}', token or ''):
        return None
    d = db.get('shares', token)
    if not d or d.get('takenDownAt'):
        return None
    design_id = d.get('designId')
    if design_id:   # B-11c：作品删了（或没了），分享落地页显示“看不到了”；旧分享没有 designId 不隐藏
        design = db.get('designs', design_id)
        if not design or design.get('deletedAt'):
            return None
    fields = ('name', 'beads', 'wrist', 'special', 'pattern', 'tail', 'fixed', 'meaning', 'source', 'tplId')
    public = {k: d[k] for k in fields if k in d}
    public['createdAt'] = d.get('createdAt')
    public['authorLabel'] = '来自珠养养的一位用户'
    return public


def make_order(db, data, uid):
    # 支付状态只能由支付回调（payments.mark_paid）推进，客户端传入的一律拒绝，防止伪造。
    if 'paymentStatus' in data:
        raise ValueError('支付状态不可由客户端指定')
    key = data.get('requestId')
    if not isinstance(key, str) or not re.fullmatch(r'[A-Za-z0-9_-]{16,128}', key):
        raise ValueError('请提供 16–128 位订单请求编号 requestId')
    request_id = hashlib.sha256((uid + ':' + key).encode()).hexdigest()
    payload = {k: v for k, v in data.items() if k != 'requestId'}
    fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()).hexdigest()
    state, existing = db.idempotent_order(request_id, fingerprint)
    if state == 'conflict':
        raise IdempotencyConflict('同一个订单请求编号不能用于不同内容')
    if state == 'existing':
        return public_order(existing)
    beads = {b['id']: b for b in db.list('beads') if b.get('onSale', True)}
    ids = data.get('beads')
    if not isinstance(ids, list) or not 6 <= len(ids) <= 500 or any(not isinstance(i, str) or i not in beads for i in ids):
        raise ValueError('手串中有不可购买的珠子，请调整后重试')
    for key in ('person', 'phone', 'addr'):
        if not isinstance(data.get(key), str) or not data[key].strip():
            raise ValueError('请填写收货人、手机号和地址')
    if not re.fullmatch(r'1\d{10}', data['phone']):
        raise ValueError('请输入有效的 11 位手机号')
    wrist = data.get('wrist')
    if isinstance(wrist, bool) or not isinstance(wrist, (int, float)) or not 8 <= wrist <= 30:
        raise ValueError('请确认手围')
    cord = data.get('cord', 0)
    if type(cord) is not int or cord not in (0, 1):
        raise ValueError('订单选项不正确')
    raw_gift = data.get('gift', False)
    if type(raw_gift) is bool:
        gift = {'box': raw_gift, 'card': '', 'hidePrice': False}
    elif isinstance(raw_gift, dict):
        gift_box, gift_card, gift_hide = raw_gift.get('box'), raw_gift.get('card', ''), raw_gift.get('hidePrice', False)
        if type(gift_box) is not bool or type(gift_hide) is not bool or not isinstance(gift_card, str):
            raise ValueError('订单选项不正确')
        gift_card = gift_card.strip()
        if len(gift_card) > 50:
            raise ValueError('贺卡内容不能超过 50 字')
        if gift_card:
            content_security.ensure_allowed(gift_card)
        gift = {'box': gift_box, 'card': gift_card, 'hidePrice': gift_hide}
    else:
        raise ValueError('订单选项不正确')
    try:
        unit_prices = [{'unitPriceFen': bead_price_fen(beads[i])} for i in ids]
    except (KeyError, ValueError):
        raise ValueError('商品价格不正确')
    priced = pricing.quote(unit_prices, {'cord': cord, 'gift': gift['box']})
    goods_fen = money.parse_fen(priced['goodsFen'])
    subtotal_fen = money.parse_fen(priced['subtotalFen'])
    shipping_fen = money.parse_fen(priced['shippingFen'])
    discount_fen = money.parse_fen(priced['discountFen'])
    payable_fen = money.parse_fen(priced['payableFen'])
    quote = data.get('confirmedQuote')
    if not isinstance(quote, dict) or type(quote.get('totalFen')) is not int or not isinstance(quote.get('items'), list):
        raise ValueError('请先确认订单报价')
    quoted = {}
    for item in quote['items']:
        if not isinstance(item, dict) or not isinstance(item.get('id'), str) or type(item.get('unitPriceFen')) is not int or isinstance(item.get('mm'), bool) or not isinstance(item.get('mm'), (int, float)) or item['id'] in quoted:
            raise ValueError('订单报价格式不正确')
        quoted[item['id']] = (item['unitPriceFen'], item['mm'])
    actual = {i: (bead_price_fen(beads[i]), beads[i]['mm']) for i in set(ids)}
    if quoted != actual or quote['totalFen'] != payable_fen:
        raise PriceChanged()
    enriched = {i: kb.enrich(beads[i]) for i in set(ids)}
    snapshot = [{**{key: enriched[i].get(key, [] if key == 'points' else '')
                    for key in ('id', 'name', 'mm', 'mat', 'spacer', 'price', 'photo', 'kb', 'points', 'meaning', 'summary', 'safety')},
                 'photo': beads[i].get('photo'),
                 'priceFen': bead_price_fen(beads[i]),
                 'unitPriceFen': bead_price_fen(beads[i])} for i in ids]
    raw_note = data.get('customerNote') if 'customerNote' in data else (data.get('note') or data.get('remark') or '')
    if not isinstance(raw_note, str) or len(raw_note.strip()) > 200:
        raise ValueError('客户备注不能超过 200 字')
    customer_note = raw_note.strip()
    if customer_note:
        content_security.ensure_allowed(customer_note)
    tpl_id = str(data.get('tplId') or '').strip()[:100]
    source = str(data.get('source') or ('template' if tpl_id else 'custom')).strip()[:40]
    now_ms = int(time.time() * 1000)
    no = 'CGZ' + time.strftime('%y%m%d') + uuid.uuid4().hex[:12].upper()
    import commerce
    terms_ctx = {
        'beads': ids,
        'tplId': tpl_id,
        'source': source,
        'gift': gift['box'],
        'cord': cord,
        'hasSafety': any(bool(s.get('safety')) for s in snapshot),
    }
    terms_snapshot = commerce.terms_snapshot(db, terms_ctx)
    design_snapshot = commerce.build_design_snapshot(
        db,
        {'beads': ids, 'wrist': wrist, 'cord': cord, 'gift': gift['box'],
         'customerNote': customer_note, 'tplId': tpl_id, 'source': source, 'createdAt': now_ms},
        frozen_items=snapshot,
    )
    groups = status.new_order_status()
    order = {'no': no, 'userId': uid, 'name': str(data.get('name') or '我的手串')[:60], 'beads': ids, 'items': snapshot,
             'wrist': wrist, 'length': sum(Decimal(str(beads[i].get('mm', 0))) for i in ids).__float__(),
             'cord': cord, 'gift': gift, 'promo': 0,
             'customerNote': customer_note, 'tplId': tpl_id, 'source': source,
             'designSnapshot': design_snapshot,
             'promotion': promotion_status(),
             'person': data['person'].strip()[:40], 'phone': data['phone'],
             'addr': data['addr'].strip()[:200], 'status': '待支付', 'paymentAvailable': __import__('payments').payment_available(),
             'subtotalFen': subtotal_fen, 'shippingFen': shipping_fen, 'discountFen': discount_fen,
             'payableFen': payable_fen, 'paidFen': 0, 'refundFen': 0,
             'goodsFen': goods_fen, 'shipFen': shipping_fen, 'totalFen': payable_fen,
             'orderStatus': groups['orderStatus'], 'paymentStatus': groups['paymentStatus'],
             'fulfillmentStatus': groups['fulfillmentStatus'], 'afterSaleStatus': groups['afterSaleStatus'],
             'logisticsStatus': groups['logisticsStatus'],
             'statusHistory': [], 'logistics': None, 'logisticsHistory': [],
             'qualityGate': None,
             'termsSnapshot': terms_snapshot,
             'termsVersion': hashlib.sha256(json.dumps(terms_snapshot, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16],
             'createdAt': now_ms}
    order['workOrder'] = commerce.build_work_order(order, db=db)
    state, result = db.idempotent_order(request_id, fingerprint, order)
    if state == 'conflict':
        raise IdempotencyConflict('同一个订单请求编号不能用于不同内容')
    if state == 'price_changed':
        raise PriceChanged()
    return public_order(result)


def promotion_status():
    # Do not infer paid-order history from pending orders or client claims.
    return {'firstOrder': {'available': False, 'discountFen': 0, 'reason': 'payment_not_integrated'}}
