"""经敏感信息权限检查后显示订单完整联系方式。"""


def reveal(ctx, match, data):
    order = ctx.db.get("orders", match.group(1))
    if not order:
        raise KeyError("订单不存在")
    return 200, {"person": order.get("person"), "phone": order.get("phone"), "addr": order.get("addr")}


ROUTES = [
    ("POST", r"/api/admin/orders/([\w-]+)/reveal", reveal, "view_full_contact"),
]
