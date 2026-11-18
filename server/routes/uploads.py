"""用户上传照片：POST /api/my/uploads 保存并送审；POST /api/wechat/media-check 是微信图片审核回调。"""
import uploads
import os
import secrets
from routes.bead_photos import _image


def create(ctx, match, data):
    return 200, uploads.create(ctx.db, ctx.user_id, data)


def media_check(ctx, match, data):
    record = uploads.apply_media_check(ctx.db, data, ctx.qs)
    return 200, {"ok": True, "id": record["id"], "checkStatus": record["checkStatus"]}


def verify_media_check(ctx, match, data):
    echo = uploads.verify_media_check(ctx.qs)
    if echo is None:
        return 403, {"error": "微信消息签名校验失败"}
    return 200, echo.encode(), "text/plain; charset=utf-8"


ROUTES = [
    ("POST", r"/api/my/uploads", create, "user"),
    ("POST", r"/api/wechat/media-check", media_check, "public"),
    ("GET", r"/api/wechat/media-check", verify_media_check, "public"),
]


def upload_template_cover(ctx, match, data):
    images = data.get('images') if isinstance(data, dict) else None
    sizes = {'lg': 1080, 'md': 540, 'sm': 240}
    if not isinstance(images, dict) or set(images) != set(sizes):
        raise ValueError('请同时上传 1080、540、240 三种尺寸')
    raw = {key: _image(images[key], size) for key, size in sizes.items()}
    os.makedirs(uploads.uploads_root(), exist_ok=True)
    cover = {}
    for key, content in raw.items():
        name = 'template-' + secrets.token_hex(12) + '.jpg'
        with open(os.path.join(uploads.uploads_root(), name), 'wb') as file:
            file.write(content)
        cover[key] = '/uploads/' + name
    return 200, {'cover': cover}


ROUTES.append(('POST', r'/api/admin/templates/cover', upload_template_cover, 'edit_templates'))
