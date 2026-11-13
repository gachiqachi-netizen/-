"""后台角色管理和当前账号信息。"""
import accounts


def create(ctx, match, data):
    if not isinstance(data, dict):
        raise ValueError("缺少角色资料")
    role = accounts.create_role(ctx.db, data.get("name"), data.get("permissions"), data.get("dataScope"))
    return 201, {"role": role}


def update(ctx, match, data):
    if not isinstance(data, dict):
        raise ValueError("缺少角色资料")
    return 200, {"role": accounts.update_role(ctx.db, match.group(1), data)}


def delete(ctx, match, data):
    accounts.delete_role(ctx.db, match.group(1))
    return 200, {"ok": True}


def me(ctx, match, data):
    return 200, accounts.current_admin(ctx.db, accounts.CURRENT_ADMIN.get() or {})


ROUTES = [
    ("POST", r"/api/admin/roles", create, "manage_accounts"),
    ("PUT", r"/api/admin/roles/([\w-]+)", update, "manage_accounts"),
    ("DELETE", r"/api/admin/roles/([\w-]+)", delete, "manage_accounts"),
    # All four built-in roles have view_work_orders; this lets each sign in and read its own permissions.
    ("GET", r"/api/admin/me", me, "view_work_orders"),
]
