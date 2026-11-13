"""新接口的注册处：每个领域一个文件，文件里定义 ROUTES = [(方法, 正则, 处理函数, 需要什么登录)]。

需要什么登录："public" 不登录；"user" 用户登录；"admin" 后台登录；也可写权限点名字。
写了别的值，加载时直接报错；分发时也只有明确写 "public" 的才不检查登录。
路径正则按整条路径匹配（fullmatch），不会只匹配开头。

处理函数签名：fn(ctx, match, data) -> (状态码, 返回体)。
ctx 里有 db、user_id（用户登录时）、admin（后台登录时为真）、qs（查询参数）。ctx.ip 是客户端 IP。
data 是请求 JSON（GET 时为 None）。抛 ValueError 返回 400，抛 KeyError 返回 404。
"""
import importlib
import pkgutil
import re


class Ctx:
    """一次路由处理的上下文，字段只读。"""

    def __init__(self, db, user_id, admin, qs, ip=None):
        self.db = db
        self.user_id = user_id
        self.admin = admin
        self.qs = qs
        self.ip = ip


from accounts import PERMISSIONS

AUTH_KINDS = ("public", "user", "admin", *PERMISSIONS)
METHODS = ("GET", "POST", "PUT", "DELETE")


def compile_routes(entries, source="ROUTES"):
    """检查并预编译路由。方法或登录要求写错直接报错，不会被当成“不登录”放行。"""
    table = []
    for method, pattern, fn, auth in entries:
        if method not in METHODS:
            raise ValueError(f"{source}: 不认识的方法 {method!r}（只能是 {', '.join(METHODS)}）")
        if auth not in AUTH_KINDS:
            raise ValueError(f"{source}: {pattern} 的登录要求 {auth!r} 不认识（只能是 {', '.join(AUTH_KINDS)}）")
        table.append((method, re.compile(pattern), fn, auth))
    return table


def load():
    table = []
    for m in pkgutil.iter_modules(__path__):
        if m.name.startswith("_"):
            continue
        mod = importlib.import_module(f"routes.{m.name}")
        table.extend(compile_routes(getattr(mod, "ROUTES", []), source=f"routes/{m.name}.py"))
    return table
