"""作品删除：DELETE /api/designs/{id} 软删除（deletedAt），只能删自己的。

软删除后作品还在表里（留档），但列表不返回；它带 designId 的分享由
user_api.read_share 在读取时发现作品已删而隐藏（这里不直接改分享表）。
"""
import time


def delete(ctx, match, data):
    design = ctx.db.get("designs", match.group(1))
    if not design or design.get("userId") != ctx.user_id or design.get("deletedAt"):
        raise KeyError("设计不存在")
    design["deletedAt"] = int(time.time())
    ctx.db.put("designs", match.group(1), design)
    return 200, {"ok": True}


ROUTES = [
    ("DELETE", r"/api/designs/([a-f0-9]{32})", delete, "user"),
]
