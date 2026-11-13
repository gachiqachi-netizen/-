"""用户上传图片：保存、每日限量、机审状态、送审取图链接和读图访问控制。

记录字段（存 uploads 表）：id, userId, path（相对 uploads 根目录，如
user/2026-11-13/xxxx.png）, checkStatus(pending/passed/rejected), createdAt（秒）。

送微信异步图片审核时，media_url 用 PUBLIC_BASE_URL 拼完整地址，并带临时
访问参数 e（过期时间）/ k（HMAC 签名，1 小时有效），微信凭 k 可以直接取
待审图片；k 过期后图片回到“只有本人和后台可见”。
"""
import base64
import binascii
import hashlib
import hmac
import os
import secrets
import time

import content_security

MAX_BYTES = 5 * 1024 * 1024      # 单张不超过 5MB
DAILY_LIMIT = 50                 # 每个用户每天最多 50 张
LINK_TTL = 3600                  # 送审取图链接 1 小时有效
CONTENT_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
}

_here = os.path.dirname(os.path.abspath(__file__))


def uploads_root():
    return os.environ.get("UPLOADS_DIR") or os.path.join(
        os.environ.get("DATA_DIR") or _here, "uploads")


def _day_start(now=None):
    t = time.localtime(time.time() if now is None else now)
    return time.mktime((t.tm_year, t.tm_mon, t.tm_mday, 0, 0, 0, 0, 0, -1))


def _today(now=None):
    return time.strftime("%Y-%m-%d", time.localtime(time.time() if now is None else now))


def _decode_image(filename, content_type, data):
    content_type = str(content_type or "").strip().lower()
    ext = CONTENT_TYPES.get(content_type)
    if content_type and ext is None:
        raise ValueError("只支持 png / jpg / webp 图片")
    if ext is None:
        ext = str(filename or "").rsplit(".", 1)[-1].lower() if "." in str(filename or "") else ""
        if ext == "jpeg":
            ext = "jpg"
        if ext not in ("png", "jpg", "webp"):
            raise ValueError("只支持 png / jpg / webp 图片")
    try:
        raw = base64.b64decode(data or b"", validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("图片数据不是有效的 base64")
    if not raw:
        raise ValueError("图片是空的")
    if len(raw) > MAX_BYTES:
        raise ValueError("图片太大，请小于 5MB")
    return ext, raw


def _user_count_today(db, user_id, now=None):
    start = _day_start(now)
    return sum(1 for u in db.list("uploads")
               if u.get("userId") == user_id and (u.get("createdAt") or 0) >= start)


# ---- 送审取图链接（e=过期时间, k=HMAC） ----

def _link_secret():
    import env
    secret = os.environ.get("MEDIA_LINK_SECRET")
    if secret:
        return secret
    if env.is_dev():
        return "dev-only-media-link-secret"
    raise content_security.ContentRejected("未配置 MEDIA_LINK_SECRET，无法生成审核取图地址")


def sign_link(rel_path, expires):
    msg = ("%s|%d" % (rel_path, expires)).encode()
    return hmac.new(_link_secret().encode(), msg, hashlib.sha256).hexdigest()


def link_params(rel_path, now=None):
    """生成 (expires, k)；有效期 1 小时。"""
    expires = int(time.time() if now is None else now) + LINK_TTL
    return expires, sign_link(rel_path, expires)


def valid_link(rel_path, qs, now=None):
    """k 参数合法且未过期返回 True；没带 k 或不对、过期返回 False（不抛异常）。"""
    k = (qs.get("k") or [""])[0]
    exp = (qs.get("e") or [""])[0]
    if not k or not exp:
        return False
    try:
        expires = int(exp)
    except ValueError:
        return False
    if expires < (time.time() if now is None else now):
        return False
    try:
        expected = sign_link(rel_path, expires)
    except ValueError:
        return False
    return hmac.compare_digest(k, expected)


def _media_check_url(rel_path):
    """送审地址：PUBLIC_BASE_URL 拼完整地址并带临时取图参数。

    没配 PUBLIC_BASE_URL：开发环境返回 None（走 fail-open 直接放行），
    正式环境抛 ContentRejected。
    """
    import env
    base = (os.environ.get("PUBLIC_BASE_URL") or "").rstrip("/")
    if not base:
        if env.is_dev():
            return None
        raise content_security.ContentRejected("未配置 PUBLIC_BASE_URL，无法送审图片")
    expires, k = link_params(rel_path)
    return "%s/uploads/%s?e=%d&k=%s" % (base, rel_path, expires, k)


def create(db, user_id, data, now=None):
    """保存一张用户上传的图片并登记记录，返回 {"id", "url"}。"""
    if not isinstance(data, dict):
        raise ValueError("请求格式不对")
    now = time.time() if now is None else now
    ext, raw = _decode_image(data.get("filename"), data.get("contentType"), data.get("data"))
    if _user_count_today(db, user_id, now) >= DAILY_LIMIT:
        raise ValueError("今天上传的图片太多了，明天再传吧")
    rel_path = os.path.join("user", _today(now), secrets.token_hex(8) + "." + ext).replace("\\", "/")
    media_url = _media_check_url(rel_path)
    status, trace_id = (("passed", None) if media_url is None
                        else content_security.check_image_async(media_url))
    abs_path = os.path.join(uploads_root(), rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "wb") as f:
        f.write(raw)
    record = {
        "userId": user_id,
        "path": rel_path,
        "checkStatus": status,
        "createdAt": int(now),
    }
    if trace_id:
        record["traceId"] = trace_id
    rid = secrets.token_hex(8)
    db.put("uploads", rid, record)
    return {"id": rid, "url": "/uploads/" + rel_path}


def get_by_url_path(db, rel_path):
    """按相对路径找上传记录，找不到返回 None。"""
    for u in db.list("uploads"):
        if u.get("path") == rel_path:
            return u
    return None


def viewer_can_see(record, user_id, is_admin):
    """checkStatus 不是 passed 时，只有上传者本人和后台能看到。"""
    if record.get("checkStatus") == "passed":
        return True
    return bool(is_admin) or (user_id is not None and record.get("userId") == user_id)


def _msg_token():
    return os.environ.get("WECHAT_MSG_TOKEN") or os.environ.get("WECHAT_TOKEN") or ""


def _check_signature(qs):
    """微信消息签名校验：sha1(sort(token, timestamp, nonce))。"""
    import env
    token = _msg_token()
    if not token:
        if env.is_dev():
            return
        raise ValueError("未配置微信消息校验令牌")
    signature = (qs.get("signature") or [""])[0]
    timestamp = (qs.get("timestamp") or [""])[0]
    nonce = (qs.get("nonce") or [""])[0]
    expected = hashlib.sha1("".join(sorted([token, timestamp, nonce])).encode()).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise ValueError("微信消息签名校验失败")


def apply_media_check(db, data, qs):
    """微信图片异步检查回调：写回 checkStatus。签名校验不过抛 ValueError。"""
    _check_signature(qs)
    result = (data or {}).get("result") or {}
    trace_id = str(result.get("trace_id") or (data or {}).get("trace_id") or "")
    record = None
    if trace_id:
        for u in db.list("uploads"):
            if u.get("traceId") == trace_id:
                record = u
                break
    if record is None:
        raise KeyError("没有这条上传记录")
    record["checkStatus"] = "passed" if result.get("suggest") == "pass" else "rejected"
    db.put("uploads", record["id"], record)
    return record
