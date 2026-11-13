"""静默登录后绑定手机号，并查询当前用户。"""
import phone_auth
import user_api


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


ROUTES = [
    ("POST", r"/api/auth/phone", bind, "user"),
    ("GET", r"/api/me", me, "user"),
]
