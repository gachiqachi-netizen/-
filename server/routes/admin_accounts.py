"""后台账号接口；权限点细分由 A8b 接入。"""
import accounts


def manager():
    actor = accounts.CURRENT_ADMIN.get()
    if not actor or actor.get("roleId") != "owner":
        return None
    return actor


def bootstrap(ctx, match, data):
    actor = accounts.CURRENT_ADMIN.get()
    if not actor or not actor.get("bootstrap") or ctx.db.list("admin_users"):
        return 403, {"error": "只能初始化第一个负责人"}
    if not isinstance(data, dict):
        raise ValueError("缺少账号资料")
    user, _ = accounts.create_user(ctx.db, data.get("username"), data.get("name"),
                                   "owner", data.get("password"))
    return 201, {"user": user}


def list_accounts(ctx, match, data):
    if not manager():
        return 403, {"error": "你没有这个操作的权限"}
    return 200, {"users": [accounts.public_user(u) for u in ctx.db.list("admin_users")],
                 "roles": [{k: r.get(k) for k in ("id", "name", "permissions", "builtin", "dataScope")}
                           for r in ctx.db.list("admin_roles")]}


def create(ctx, match, data):
    if not manager():
        return 403, {"error": "你没有这个操作的权限"}
    if not isinstance(data, dict):
        raise ValueError("缺少账号资料")
    user, temporary = accounts.create_user(ctx.db, data.get("username"), data.get("name"),
                                           data.get("roleId"))
    return 201, {"user": user, "temporaryPassword": temporary}


def update(ctx, match, data):
    if not manager():
        return 403, {"error": "你没有这个操作的权限"}
    if not isinstance(data, dict):
        raise ValueError("缺少账号资料")
    user = ctx.db.get("admin_users", match.group(1))
    if not user:
        raise KeyError("账号不存在")
    role_id = data.get("roleId", user["roleId"])
    if not ctx.db.get("admin_roles", role_id):
        raise ValueError("角色不存在")
    accounts.require_last_owner(ctx.db, user, new_role=role_id)
    name = str(data.get("name", user["name"])).strip()
    if not name:
        raise ValueError("名字不能为空")
    user.update(name=name, roleId=role_id)
    ctx.db.put("admin_users", user["id"], user)
    return 200, {"user": accounts.public_user(user)}


def disable(ctx, match, data):
    if not manager():
        return 403, {"error": "你没有这个操作的权限"}
    user = ctx.db.get("admin_users", match.group(1))
    if not user:
        raise KeyError("账号不存在")
    accounts.require_last_owner(ctx.db, user, new_status="disabled")
    user["status"] = "disabled"
    ctx.db.put("admin_users", user["id"], user)
    return 200, {"user": accounts.public_user(user)}


def reset_password(ctx, match, data):
    if not manager():
        return 403, {"error": "你没有这个操作的权限"}
    user = ctx.db.get("admin_users", match.group(1))
    if not user:
        raise KeyError("账号不存在")
    temporary = __import__("secrets").token_urlsafe(12)
    user["passwordHash"] = accounts.hash_password(temporary)
    user["mustChangePassword"] = True
    ctx.db.put("admin_users", user["id"], user)
    return 200, {"temporaryPassword": temporary}


def change_password(ctx, match, data):
    actor = accounts.CURRENT_ADMIN.get()
    if not actor or actor.get("bootstrap"):
        return 403, {"error": "请先登录账号"}
    if not isinstance(data, dict):
        raise ValueError("缺少密码")
    if not accounts.verify_password(data.get("oldPassword"), actor.get("passwordHash")):
        return 401, {"error": "旧密码不正确"}
    actor["passwordHash"] = accounts.hash_password(data.get("newPassword"))
    actor["mustChangePassword"] = False
    ctx.db.put("admin_users", actor["id"], actor)
    return 200, {"ok": True}


ROUTES = [
    ("POST", r"/api/admin/accounts/bootstrap", bootstrap, "admin"),
    ("GET", r"/api/admin/accounts", list_accounts, "admin"),
    ("POST", r"/api/admin/accounts", create, "admin"),
    ("PUT", r"/api/admin/accounts/([a-f0-9]{32})", update, "admin"),
    ("POST", r"/api/admin/accounts/([a-f0-9]{32})/disable", disable, "admin"),
    ("POST", r"/api/admin/accounts/([a-f0-9]{32})/reset-password", reset_password, "admin"),
    ("PUT", r"/api/admin/accounts/me/password", change_password, "admin"),
]
