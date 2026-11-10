"""WeChat identity and owner-scoped prototype APIs; payment integration is intentionally separate."""
import kb
import pricing
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
from decimal import Decimal, InvalidOperation

SESSION_SECONDS = 30 * 24 * 3600

class IdempotencyConflict(Exception):
    pass

class PriceChanged(Exception):
    pass


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


def create_share(db, data, owner_id):
    """Create an unguessable public snapshot, containing only explicit design fields."""
    design = design_data(data, owner_id)
    if not design['beads']:
        raise ValueError('请先添加珠子')
    token = secrets.token_urlsafe(32)
    fields = ('name', 'beads', 'wrist', 'special', 'pattern', 'tail', 'fixed', 'meaning', 'source', 'tplId')
    db.put('shares', token, {k: design[k] for k in fields if k in design})
    return {'shareId': token}


def read_share(db, token):
    if not re.fullmatch(r'[A-Za-z0-9_-]{43}', token or ''):
        return None
    d = db.get('shares', token)
    fields = ('name', 'beads', 'wrist', 'special', 'pattern', 'tail', 'fixed', 'meaning', 'source', 'tplId')
    return {k: d[k] for k in fields if k in d} if d else None


def make_order(db, data, uid):
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
        return public_design(existing)
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
    if type(cord) is not int or cord not in (0, 1) or type(data.get('gift', False)) is not bool:
        raise ValueError('订单选项不正确')
    try:
        goods = sum((Decimal(str(beads[i]['price'])) for i in ids), Decimal(0))
        if not goods.is_finite() or goods < 0:
            raise ValueError('商品价格不正确')
    except (InvalidOperation, KeyError):
        raise ValueError('商品价格不正确')
    priced = pricing.quote([{'unitPriceFen': int(Decimal(str(beads[i]['price'])) * 100)} for i in ids], {'cord': cord, 'gift': data.get('gift', False)})
    ship = Decimal(priced['shippingFen']) / 100
    total = Decimal(priced['totalFen']) / 100
    quote = data.get('confirmedQuote')
    if not isinstance(quote, dict) or type(quote.get('totalFen')) is not int or not isinstance(quote.get('items'), list):
        raise ValueError('请先确认订单报价')
    quoted = {}
    for item in quote['items']:
        if not isinstance(item, dict) or not isinstance(item.get('id'), str) or type(item.get('unitPriceFen')) is not int or isinstance(item.get('mm'), bool) or not isinstance(item.get('mm'), (int, float)) or item['id'] in quoted:
            raise ValueError('订单报价格式不正确')
        quoted[item['id']] = (item['unitPriceFen'], item['mm'])
    actual = {i: (int(Decimal(str(beads[i]['price'])) * 100), beads[i]['mm']) for i in set(ids)}
    if quoted != actual or Decimal(quote['totalFen']) != total * 100:
        raise PriceChanged()
    enriched = {i: kb.enrich(beads[i]) for i in set(ids)}
    snapshot = [{**{key: enriched[i].get(key, [] if key == 'points' else '')
                    for key in ('id', 'name', 'mm', 'price', 'photo', 'kb', 'points', 'meaning', 'summary', 'safety')},
                 'photo': beads[i].get('photo'),
                 'unitPriceFen': int(Decimal(str(beads[i]['price'])) * 100)} for i in ids]
    no = 'CGZ' + time.strftime('%y%m%d') + uuid.uuid4().hex[:12].upper()
    order = {'no': no, 'userId': uid, 'name': str(data.get('name') or '我的手串')[:60], 'beads': ids, 'items': snapshot,
             'wrist': wrist, 'length': sum(Decimal(str(beads[i].get('mm', 0))) for i in ids).__float__(),
             'cord': cord, 'gift': data.get('gift', False), 'goods': float(goods), 'ship': float(ship), 'promo': 0,
             'promotion': promotion_status(),
             'total': float(total), 'person': data['person'].strip()[:40], 'phone': data['phone'],
             'addr': data['addr'].strip()[:200], 'status': '待支付', 'paymentAvailable': False,
             'createdAt': int(time.time() * 1000)}
    state, result = db.idempotent_order(request_id, fingerprint, order)
    if state == 'conflict':
        raise IdempotencyConflict('同一个订单请求编号不能用于不同内容')
    if state == 'price_changed':
        raise PriceChanged()
    return public_design(result)


def promotion_status():
    # Do not infer paid-order history from pending orders or client claims.
    return {'firstOrder': {'available': False, 'discountFen': 0, 'reason': 'payment_not_integrated'}}
