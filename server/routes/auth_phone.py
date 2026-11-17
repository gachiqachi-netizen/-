"""静默登录后绑定手机号，并查询当前用户。"""
import phone_auth
import user_api
import content_security
import logging

_log = logging.getLogger(__name__)


def bind(ctx, match, data):
    if not isinstance(data, dict):
        raise ValueError("缺少手机号凭证")
    try:
        phone = phone_auth.exchange_code(data.get("code"))
    except ValueError:
        raise
    except Exception:
        return 502, {"error": "没登录上，网络不太好，再点一次试试"}
    return 200, phone_auth.bind_phone(ctx.db, ctx.user_id, phone)


def me(ctx, match, data):
    user = ctx.db.get("users", ctx.user_id)
    if user is None:
        raise KeyError("用户不存在")
    return 200, user_api.public_user(user)


def update_nickname(ctx, match, data):
    name = str(data.get('nickname') or '').strip() if isinstance(data, dict) else ''
    if not 1 <= len(name) <= 20:
        return 400, {'error': '名字要填 1–20 个字'}
    try:
        content_security.ensure_allowed(name)
    except content_security.ContentRejected as error:
        if '未配置' not in str(error):
            return 400, {'error': '这个名字不能用，换一个吧'}
        _log.exception('nickname content security not configured; saving without check')
    except Exception:
        _log.exception('nickname content security check failed; saving without check')
    user = ctx.db.get('users', ctx.user_id)
    if user is None:
        raise KeyError('用户不存在')
    user['nickname'] = name
    ctx.db.put('users', ctx.user_id, user)
    return 200, user_api.public_user(user)


ROUTES = [
    ("POST", r"/api/auth/phone", bind, "user"),
    ("GET", r"/api/me", me, "user"),
    ("POST", r"/api/me/nickname", update_nickname, "user"),
]
