"""Customer reviews: machine checks, human moderation, and public template lists."""
import time
import uuid

import accounts
import commerce
import content_security
import kb
import status

REVIEW_STATUSES = ('machine_failed', 'pending', 'published', 'rejected', 'taken_down')


def _now():
    return int(time.time() * 1000)


def _mine(db, no, user_id):
    order = db.get('orders', no)
    if not order or order.get('userId') != user_id:
        raise KeyError('订单不存在')
    return order


def _review_for_order(db, no):
    return next((row for row in db.list('reviews') if row.get('orderNo') == no), None)


def _set_order_review_status(db, no, review_status):
    order = db.get('orders', no)
    if order:
        order['reviewStatus'] = review_status
        db.put('orders', no, order)


def _photo_checks(db, user_id, photo_ids):
    checks = []
    for photo_id in photo_ids:
        upload = db.get('uploads', photo_id)
        if not upload or upload.get('userId') != user_id:
            raise ValueError('照片不属于当前用户')
        check = upload.get('checkStatus')
        checks.append({'id': photo_id, 'status': check if check in ('passed', 'pending') else 'rejected'})
    return checks


def submit(db, no, user_id, data):
    order = _mine(db, no, user_id)
    groups = status.derive_status(order)
    if not (groups['orderStatus'] == 'completed' or
            groups['fulfillmentStatus'] == 'delivered' or
            groups['logisticsStatus'] == 'delivered'):
        raise ValueError('订单签收后才能评价')
    user = db.get('users', user_id)
    if not user or not user.get('phoneHash'):
        raise PermissionError('请先绑定手机号')
    existing = _review_for_order(db, no)
    if existing and existing['status'] != 'machine_failed':
        raise ValueError('这单已经评价过了')
    if not isinstance(data, dict):
        raise ValueError('评价格式不正确')
    stars = data.get('stars', 5)
    review_text = data.get('text', '')
    photo_ids = data.get('photoIds', [])
    anonymous = data.get('anonymous', True)
    if type(stars) is not int or not 1 <= stars <= 5:
        raise ValueError('请给 1–5 颗星')
    if not isinstance(review_text, str) or len(review_text) > 300:
        raise ValueError('评价文字不能超过 300 字')
    if (not isinstance(photo_ids, list) or len(photo_ids) > 6 or
            any(not isinstance(x, str) or not x for x in photo_ids) or len(set(photo_ids)) != len(photo_ids)):
        raise ValueError('最多选择 6 张不同的照片')
    if type(anonymous) is not bool:
        raise ValueError('匿名选项格式不正确')
    text_reason = None
    try:
        content_security.ensure_allowed(review_text)
    except content_security.ContentRejected:
        text_reason = '内容没有通过审核，改一下再发'
    banned = kb.banned_in(review_text)
    if banned:
        text_reason = '内容没有通过审核，改一下再发'
    photos = _photo_checks(db, user_id, photo_ids)
    if any(photo['status'] == 'rejected' for photo in photos):
        photo_reason = '照片没有通过审核，改一下再发'
    else:
        photo_reason = None
    machine_failed = bool(text_reason or photo_reason)
    record = {
        'orderNo': no, 'userId': user_id, 'templateId': order.get('tplId') or None,
        'stars': stars, 'text': review_text, 'photoIds': photo_ids,
        'anonymous': anonymous, 'status': 'machine_failed' if machine_failed else 'pending',
        'machine': {'textOk': text_reason is None, 'textReason': text_reason,
                    'photos': photos},
        'rejectReason': text_reason or photo_reason, 'createdAt': _now(), 'publishedAt': None,
    }
    rid = existing['id'] if existing else uuid.uuid4().hex
    saved = db.put('reviews', rid, record)
    _set_order_review_status(db, no, saved['status'])
    return saved


def my_review(db, no, user_id):
    _mine(db, no, user_id)
    review = _review_for_order(db, no)
    if not review:
        raise KeyError('评价不存在')
    return review


def list_admin(db, review_status=None):
    if review_status and review_status not in REVIEW_STATUSES:
        raise ValueError('评价状态不正确')
    rows = [row for row in db.list('reviews') if not review_status or row['status'] == review_status]
    return sorted(rows, key=lambda row: row.get('createdAt', 0), reverse=True)


def _audit(db, action, review_id, reason=''):
    actor = accounts.CURRENT_ADMIN.get() or {}
    commerce.audit(db, actor.get('name') or '后台', action, 'review', review_id, reason)


def moderate(db, review_id, action, reason=''):
    review = db.get('reviews', review_id)
    if not review:
        raise KeyError('评价不存在')
    reason = str(reason or '').strip()
    if action == 'approve':
        if review['status'] != 'pending':
            raise ValueError('只有待人审评价可以通过')
        photos = _photo_checks(db, review['userId'], review['photoIds'])
        review['machine']['photos'] = photos
        if any(photo['status'] == 'rejected' for photo in photos):
            review['status'] = 'machine_failed'
            review['rejectReason'] = '照片没有通过审核，改一下再发'
            db.put('reviews', review_id, review)
            _set_order_review_status(db, review['orderNo'], review['status'])
            raise ValueError('照片没有通过审核')
        if any(photo['status'] == 'pending' for photo in photos):
            raise ValueError('照片还在审核中')
        review['status'] = 'published'
        review['publishedAt'] = _now()
        review['rejectReason'] = None
    elif action == 'reject':
        if review['status'] != 'pending':
            raise ValueError('只有待人审评价可以驳回')
        if not reason:
            raise ValueError('请填写给用户看的驳回原因')
        review['status'] = 'rejected'
        review['rejectReason'] = reason[:300]
    elif action == 'take-down':
        if review['status'] != 'published':
            raise ValueError('只有已公开评价可以下架')
        if not reason:
            raise ValueError('请填写下架原因')
        review['status'] = 'taken_down'
        review['rejectReason'] = reason[:300]
    else:
        raise ValueError('审核动作不正确')
    saved = db.put('reviews', review_id, review)
    _set_order_review_status(db, review['orderNo'], saved['status'])
    _audit(db, action, review_id, reason)
    return saved


def public_reviews(db, template_id, review_filter='all', wrist=None):
    if review_filter not in ('all', 'photos', 'wrist'):
        raise ValueError('评价筛选条件不正确')
    if review_filter == 'wrist':
        try:
            wrist = float(wrist)
        except (TypeError, ValueError):
            raise ValueError('请提供手围')
        if not 5 <= wrist <= 30:
            raise ValueError('手围格式不正确')
    rows = []
    for review in db.list('reviews'):
        if review.get('status') != 'published' or not review.get('templateId') or review['templateId'] != template_id:
            continue
        photos = []
        for photo_id in review.get('photoIds', []):
            upload = db.get('uploads', photo_id)
            if (upload and upload.get('userId') == review['userId'] and
                    upload.get('checkStatus') == 'passed' and upload.get('path')):
                photos.append({'id': photo_id, 'url': '/uploads/' + upload['path']})
        if review_filter == 'photos' and not photos:
            continue
        order = db.get('orders', review['orderNo'])
        order_wrist = order.get('wrist') if order else None
        if review_filter == 'wrist' and (not isinstance(order_wrist, (int, float)) or abs(order_wrist - wrist) > 1):
            continue
        user = db.get('users', review['userId']) or {}
        nickname = 'X*' if review['anonymous'] else (user.get('nickname') or user.get('name') or '用户')
        rows.append({k: review[k] for k in ('id', 'stars', 'text', 'anonymous', 'createdAt', 'publishedAt')})
        rows[-1]['photos'] = photos
        rows[-1]['nickname'] = nickname
        rows[-1]['wrist'] = order_wrist
    return sorted(rows, key=lambda row: row['publishedAt'], reverse=True)
