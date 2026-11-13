"""登录用户的地址簿接口。"""
import addresses


def list_addresses(ctx, match, data):
    return 200, {"addresses": addresses.list_for(ctx.db, ctx.user_id)}


def create_address(ctx, match, data):
    return 201, addresses.create(ctx.db, ctx.user_id, data)


def address_id(ctx, match, data):
    if match.lastindex:
        return match.group(1)
    candidate = data.get("id") if isinstance(data, dict) else None
    if candidate is None:
        candidate = (ctx.qs.get("id") or [None])[0]
    if not isinstance(candidate, str) or not candidate:
        raise ValueError("缺少地址编号")
    return candidate


def update_address(ctx, match, data):
    return 200, addresses.update(ctx.db, ctx.user_id, address_id(ctx, match, data), data)


def delete_address(ctx, match, data):
    return 200, addresses.delete(ctx.db, ctx.user_id, address_id(ctx, match, data))


ROUTES = [
    ("GET", r"/api/my/addresses", list_addresses, "user"),
    ("POST", r"/api/my/addresses", create_address, "user"),
    ("PUT", r"/api/my/addresses", update_address, "user"),
    ("DELETE", r"/api/my/addresses", delete_address, "user"),
    ("PUT", r"/api/my/addresses/([a-f0-9]{32})", update_address, "user"),
    ("DELETE", r"/api/my/addresses/([a-f0-9]{32})", delete_address, "user"),
]
