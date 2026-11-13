"""Configured customer return address, editable only by after-sale operators."""
from datetime import datetime, timezone
import re

import accounts


def public_address(db):
    saved = db.get('settings', 'return_address')
    if not saved:
        return None
    return {key: saved.get(key, '') for key in ('person', 'phone', 'address', 'note')}


def get_address(ctx, match, data):
    return 200, ctx.db.get('settings', 'return_address')


def put_address(ctx, match, data):
    if not isinstance(data, dict):
        raise ValueError('请填写寄回地址')
    person, phone, address, note = (data.get(key) for key in ('person', 'phone', 'address', 'note'))
    if not isinstance(person, str) or not person.strip():
        raise ValueError('收件人不能为空')
    if not isinstance(address, str) or not address.strip():
        raise ValueError('寄回地址不能为空')
    if not isinstance(phone, str) or not re.fullmatch(r'(?:1\d{10}|0\d{2,3}-?\d{7,8})', phone.strip()):
        raise ValueError('联系电话格式不正确')
    if note is not None and (not isinstance(note, str) or len(note) > 100):
        raise ValueError('备注不能超过 100 字')
    admin = accounts.CURRENT_ADMIN.get() or {}
    saved = {'person': person.strip(), 'phone': phone.strip(), 'address': address.strip(),
             'note': (note or '').strip(), 'updatedBy': admin.get('name', ''),
             'updatedAt': datetime.now(timezone.utc).isoformat()}
    return 200, ctx.db.put('settings', 'return_address', saved)


ROUTES = [
    ('GET', r'/api/admin/return-address', get_address, 'process_after_sales'),
    ('PUT', r'/api/admin/return-address', put_address, 'process_after_sales'),
]
