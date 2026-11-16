"""后台按料上传单珠照片，并为工单保存质检成品照。"""
import base64
import io

import accounts
import commerce
import uploads


def _actor():
    return (accounts.CURRENT_ADMIN.get() or {}).get('name') or 'admin'


def _image(data):
    if not isinstance(data, dict):
        raise ValueError('请上传 PNG 或 JPG 图片')
    ext, raw = uploads._decode_image(data.get('filename'), data.get('contentType'), data.get('data'))
    if ext not in ('png', 'jpg'):
        raise ValueError('只支持 PNG 或 JPG 图片')
    try:
        from PIL import Image
        image = Image.open(io.BytesIO(raw))
        image.load()
    except (ImportError, OSError, ValueError) as exc:
        raise ValueError('图片无法读取，请上传有效的 PNG 或 JPG') from exc
    if image.format not in ('PNG', 'JPEG'):
        raise ValueError('图片内容必须是 PNG 或 JPG')
    width, height = image.size
    if width != height or width < 800:
        raise ValueError('图片必须是至少 800×800 的正方形')
    rgba = image.convert('RGBA')
    corners = [rgba.getpixel(p) for p in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))]
    if any(a >= 240 and min(r, g, b) < 235 for r, g, b, a in corners):
        raise ValueError('背景四角须透明或接近白色')
    # 中心应有珠子，四边留少量背景；避免空图或珠子严重偏位。
    center = rgba.crop((width // 4, height // 4, 3 * width // 4, 3 * height // 4))
    if not any(a > 40 and min(r, g, b) < 230 for r, g, b, a in center.resize((32, 32)).getdata()):
        raise ValueError('珠子须位于画面中央，不能是空白图')
    return raw


def upload_bead_photo(ctx, match, data):
    bead = ctx.db.get('beads', match.group(1))
    if not bead:
        raise KeyError('商品不存在')
    if not bead.get('name'):
        raise ValueError('请先保存商品名称')
    _image(data)
    result = uploads.create(ctx.db, 'admin:' + _actor(), data)
    siblings = [item for item in ctx.db.list('beads') if item.get('name') == bead['name']]
    for item in siblings:
        item['photo'] = result['url']
        ctx.db.put('beads', item['id'], item)
    commerce.audit(ctx.db, _actor(), 'upload_photo', 'product', bead['id'], f"{bead['name']} · {len(siblings)} 个尺寸")
    return 200, {'photo': result['url'], 'count': len(siblings), 'ids': [item['id'] for item in siblings]}


def upload_finished_photo(ctx, match, data):
    kind, number = match.group(1), match.group(2)
    table = 'orders' if kind == 'orders' else 'after_sales'
    record = ctx.db.get(table, number)
    if not record:
        raise KeyError('工单不存在')
    if kind == 'after-sales' and not record.get('reworkOrder'):
        raise KeyError('重串工单不存在')
    if kind == 'orders' and not commerce.get_work_order(ctx.db, number):
        raise KeyError('工单不存在')
    _image(data)
    result = uploads.create(ctx.db, 'admin:' + _actor(), data)
    work_order = dict(record.get('workOrder' if kind == 'orders' else 'reworkOrder') or {})
    work_order['finishedPhoto'] = result['url']
    record['workOrder' if kind == 'orders' else 'reworkOrder'] = work_order
    ctx.db.put(table, number, record)
    commerce.audit(ctx.db, _actor(), 'upload_finished_photo', table, number, result['url'])
    return 200, {'finishedPhoto': result['url']}


def finished_photo(ctx, match, data):
    kind, number = match.group(1), match.group(2)
    record = ctx.db.get('orders' if kind == 'orders' else 'after_sales', number)
    if not record:
        raise KeyError('工单不存在')
    work_order = record.get('workOrder' if kind == 'orders' else 'reworkOrder') or {}
    return 200, {'finishedPhoto': work_order.get('finishedPhoto') or ''}


ROUTES = [
    ('GET', r'/api/admin/(orders|after-sales)/([\w-]+)/finished-photo', finished_photo, 'view_work_orders'),
    ('POST', r'/api/admin/beads/([\w-]+)/photo', upload_bead_photo, 'edit_products'),
    ('POST', r'/api/admin/(orders|after-sales)/([\w-]+)/finished-photo', upload_finished_photo, 'quality_gate'),
]
