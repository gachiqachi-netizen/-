"""新接口的注册处：每个领域一个文件，文件里定义 ROUTES = [(方法, 正则, 处理函数, 需要什么登录)]。

需要什么登录："public" 不登录；"user" 用户登录；"admin" 后台登录（A8b 以后会变成权限点名字）。

处理函数签名：fn(ctx, match, data) -> (状态码, 返回体)。
ctx 里有 db、user_id（用户登录时）、admin（后台登录时为真）、qs（查询参数）。
data 是请求 JSON（GET 时为 None）。抛 ValueError 返回 400，抛 KeyError 返回 404。
"""
import importlib
import pkgutil
import re


class Ctx:
    """一次路由处理的上下文，字段只读。"""

    def __init__(self, db, user_id, admin, qs):
        self.db = db
        self.user_id = user_id
        self.admin = admin
        self.qs = qs


def load():
    table = []
    for m in pkgutil.iter_modules(__path__):
        if m.name.startswith("_"):
            continue
        mod = importlib.import_module(f"routes.{m.name}")
        for method, pattern, fn, auth in getattr(mod, "ROUTES", []):
            table.append((method, re.compile(pattern), fn, auth))
    return table
