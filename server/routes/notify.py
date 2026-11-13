"""B-10：用户订阅授权接口。"""
import notify


def _subscribe(ctx, match, data):
    return 200, notify.subscribe(ctx.db, ctx.user_id, data)


ROUTES = [
    ("POST", r"^/api/my/subscriptions$", _subscribe, "user"),
]
