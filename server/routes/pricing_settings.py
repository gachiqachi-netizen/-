"""Admin configuration for handwork and shipping fees (integer fen)."""
from datetime import datetime, timezone

import accounts
import pricing


def _amount(value, name, nullable=False):
    if nullable and value is None:
        return None
    if type(value) is not int or not 0 <= value <= 100000:
        raise ValueError(f'{name}必须是 0–100000 的整数分')
    return value


def _section(data, name):
    section = data.get(name)
    if not isinstance(section, dict) or type(section.get('enabled')) is not bool:
        raise ValueError(f'{name}.enabled 必须是布尔值')
    return section


def get_settings(ctx, match, data):
    return 200, ctx.db.get('settings', 'pricing') or pricing.config()


def put_settings(ctx, match, data):
    if not isinstance(data, dict):
        raise ValueError('请提供计价配置')
    handwork = _section(data, 'handwork')
    shipping = _section(data, 'shipping')
    saved = {
        'handwork': {'enabled': handwork['enabled'], 'fen': _amount(handwork.get('fen'), 'handwork.fen')},
        'shipping': {'enabled': shipping['enabled'], 'fen': _amount(shipping.get('fen'), 'shipping.fen'),
                     'freeThresholdFen': _amount(shipping.get('freeThresholdFen'), 'shipping.freeThresholdFen', True)},
        'updatedBy': accounts.CURRENT_ADMIN.get()['name'],
        'updatedAt': datetime.now(timezone.utc).isoformat(),
    }
    return 200, ctx.db.put('settings', 'pricing', saved)


ROUTES = [
    ('GET', r'/api/admin/pricing-settings', get_settings, 'edit_prices'),
    ('PUT', r'/api/admin/pricing-settings', put_settings, 'edit_prices'),
]
