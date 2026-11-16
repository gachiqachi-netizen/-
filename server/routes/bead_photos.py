"""后台单珠照片三尺寸上传与工单成品照。图片头检查只用标准库。"""
import base64
import binascii
import struct

import accounts
import commerce
import uploads

SIZES = {'photo': 480, 'photoMd': 240, 'photoSm': 96}
MAX_IMAGE_BYTES = 1024 * 1024
PNG_SIGNATURE = b'\x89PNG\r\n\x1a\n'
JPEG_SOF = {0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf}


def _actor():
    return (accounts.CURRENT_ADMIN.get() or {}).get('name') or 'admin'


def _dimensions(raw):
    if raw.startswith(PNG_SIGNATURE):
        if len(raw) < 24 or raw[12:16] != b'IHDR' or struct.unpack('>I', raw[8:12])[0] != 13:
            raise ValueError('PNG 文件头无效')
        return 'png', *struct.unpack('>II', raw[16:24])
    if not raw.startswith(b'\xff\xd8'):
        raise ValueError('图片内容必须是 PNG 或 JPG')
    offset = 2
    while offset + 4 <= len(raw):
        if raw[offset] != 0xff:
            raise ValueError('JPG 文件头无效')
        while offset < len(raw) and raw[offset] == 0xff:
            offset += 1
        if offset >= len(raw):
            break
        marker = raw[offset]
        offset += 1
        if marker in (0xd8, 0xd9) or 0xd0 <= marker <= 0xd7:
            continue
        if offset + 2 > len(raw):
            break
        length = struct.unpack('>H', raw[offset:offset + 2])[0]
        if length < 2 or offset + length > len(raw):
            raise ValueError('JPG 文件头无效')
        if marker in JPEG_SOF:
            if length < 7:
                raise ValueError('JPG 尺寸信息无效')
            height, width = struct.unpack('>HH', raw[offset + 3:offset + 7])
            return 'jpg', width, height
        if marker == 0xda:
            break
        offset += length
    raise ValueError('JPG 缺少尺寸信息')


def _image(data, size):
    if not isinstance(data, dict):
        raise ValueError('请上传 PNG 或 JPG 图片')
    content_type = str(data.get('contentType') or '').lower()
    if content_type not in ('image/png', 'image/jpeg', 'image/jpg'):
        raise ValueError('只支持 PNG 或 JPG 图片')
    try:
        raw = base64.b64decode(data.get('data') or '', validate=True)
    except (binascii.Error, ValueError, TypeError) as exc:
        raise ValueError('图片数据不是有效的 base64') from exc
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise ValueError('单张图片不能超过 1MB')
    fmt, width, height = _dimensions(raw)
    if (fmt == 'png') != (content_type == 'image/png'):
        raise ValueError('图片格式与声明的类型不一致')
    if type(data.get('width')) is not int or type(data.get('height')) is not int:
        raise ValueError('请声明图片宽高')
    if (width, height) != (data['width'], data['height']):
        raise ValueError('图片宽高与声明尺寸不一致')
    if width != size or height != size:
        raise ValueError(f'图片尺寸必须是 {size}×{size}')
    return raw


def upload_bead_photo(ctx, match, data):
    bead = ctx.db.get('beads', match.group(1))
    if not bead:
        raise KeyError('商品不存在')
    if not bead.get('name'):
        raise ValueError('请先保存商品名称')
    images = data.get('images') if isinstance(data, dict) else None
    if not isinstance(images, dict) or set(images) != set(SIZES):
        raise ValueError('请同时上传 480、240、96 三种尺寸')
    for field, size in SIZES.items():
        _image(images[field], size)
    urls = {}
    for field in SIZES:
        urls[field] = uploads.create(ctx.db, 'admin:' + _actor(), images[field])['url']
    siblings = [item for item in ctx.db.list('beads') if item.get('name') == bead['name']]
    for item in siblings:
        item.update(urls)
        ctx.db.put('beads', item['id'], item)
    commerce.audit(ctx.db, _actor(), 'upload_photo', 'product', bead['id'], f"{bead['name']} · {len(siblings)} 个尺寸")
    return 200, {**urls, 'count': len(siblings), 'ids': [item['id'] for item in siblings]}


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
