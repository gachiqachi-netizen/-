"""作品删除：DELETE /api/designs/{id} 软删除（deletedAt），只能删自己的。

软删除后作品还在表里（留档），但列表不返回、分享落地页看不到。
分享是创建时的快照、没有作品 id：删除时按快照内容匹配，把同一份作品的
分享也标上 deletedAt，user_api.read_share 见到 deletedAt 就返回 None。
"""
import time

_SHARE_FIELDS = ('name', 'beads', 'wrist', 'special', 'pattern', 'tail', 'fixed', 'meaning', 'source', 'tplId')


def _same_snapshot(design, share):
    """分享快照的字段全部和作品一致，认为是这份作品的分享。"""
    return all(share.get(k) == design.get(k) for k in _SHARE_FIELDS if k in share)


def delete(ctx, match, data):
    design = ctx.db.get("designs", match.group(1))
    if not design or design.get("userId") != ctx.user_id or design.get("deletedAt"):
        raise KeyError("设计不存在")
    design["deletedAt"] = int(time.time())
    ctx.db.put("designs", match.group(1), design)
    for share in ctx.db.list("shares"):
        if not share.get("deletedAt") and _same_snapshot(design, share):
            share["deletedAt"] = design["deletedAt"]
            ctx.db.put("shares", share["id"], share)
    return 200, {"ok": True}


ROUTES = [
    ("DELETE", r"/api/designs/([a-f0-9]{32})", delete, "user"),
]
