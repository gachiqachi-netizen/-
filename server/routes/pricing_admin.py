"""后台批量调价；写操作由路由分发统一记录。"""
import pricing_admin


def reprice(ctx, match, data):
    return 200, pricing_admin.reprice(ctx.db, data)


ROUTES = [
    ("POST", r"/api/admin/beads/reprice", reprice, "edit_prices"),
]
