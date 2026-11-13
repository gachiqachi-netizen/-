"""用户上传照片：POST /api/my/uploads 保存并送审；POST /api/wechat/media-check 是微信图片审核回调。"""
import uploads


def create(ctx, match, data):
    return 200, uploads.create(ctx.db, ctx.user_id, data)


def media_check(ctx, match, data):
    record = uploads.apply_media_check(ctx.db, data, ctx.qs)
    return 200, {"ok": True, "id": record["id"], "checkStatus": record["checkStatus"]}


ROUTES = [
    ("POST", r"/api/my/uploads", create, "user"),
    ("POST", r"/api/wechat/media-check", media_check, "public"),
]
