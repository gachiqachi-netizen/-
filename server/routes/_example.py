"""示例：怎么在 server/routes/ 里加一个新接口。

文件名以下划线开头（如 _example.py）不会被自动加载；正式接口用领域名命名，如 reviews.py。

ROUTES 每项是 (方法, 路径正则, 处理函数, 需要什么登录)：
- 方法："GET" / "POST" / "PUT" / "DELETE"
- 路径正则：会整体匹配请求路径，捕获组通过 match 传给处理函数
- 需要什么登录："public" 不登录 / "user" 用户登录 / "admin" 后台登录

处理函数 fn(ctx, match, data) 返回 (状态码, 返回体)：
- ctx.db 数据库；ctx.user_id 登录用户 id（未登录为 None）；ctx.admin 是否后台登录；
  ctx.qs 查询参数 dict（值都是列表）
- data 是请求 JSON 体（GET 为 None）
- 参数不对抛 ValueError（自动变 400）；资源不存在抛 KeyError（自动变 404）
- 后台的写操作（POST/PUT/DELETE）框架会自动记操作记录，不用自己记
"""


def _echo(ctx, match, data):
    return 200, {"who": ctx.user_id, "qs": ctx.qs, "data": data}


def _create_thing(ctx, match, data):
    if not isinstance(data, dict) or not str(data.get("name") or "").strip():
        raise ValueError("缺少 name")
    return 201, {"id": "demo", "name": data["name"].strip()}


def _get_thing(ctx, match, data):
    if match.group(1) != "demo":
        raise KeyError("not_found")
    return 200, {"id": "demo"}


# 这个例子不会被加载（文件名以下划线开头），只是给后面写卡的人看格式：
# ROUTES = [
#     ("GET", r"^/api/example/whoami$", _echo, "public"),
#     ("POST", r"^/api/example/things$", _create_thing, "user"),
#     ("GET", r"^/api/example/things/([\w-]+)$", _get_thing, "admin"),
# ]
