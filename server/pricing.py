"""Authoritative order pricing. All monetary values are integer fen."""

HANDWORK_FEN = 1500
CORD_FEN = 500
GIFT_FEN = 1000
FREE_SHIPPING_THRESHOLD_FEN = 9900
SHIPPING_FEN = 800


_db = None


def attach(db):
    global _db
    _db = db


def config():
    saved = _db.get('settings', 'pricing') if _db is not None else None
    if saved is not None:
        return saved
    return {
        'handwork': {'enabled': True, 'fen': HANDWORK_FEN},
        'shipping': {'enabled': True, 'fen': SHIPPING_FEN,
                     'freeThresholdFen': FREE_SHIPPING_THRESHOLD_FEN},
    }


def public_config():
    current = config()
    handwork = current['handwork']
    shipping = current['shipping']
    return {
        'handworkFen': handwork['fen'] if handwork['enabled'] else 0,
        'handworkEnabled': handwork['enabled'],
        'cordFen': CORD_FEN,
        'giftFen': GIFT_FEN,
        'freeShippingThresholdFen': shipping['freeThresholdFen'],
        'shippingFen': shipping['fen'] if shipping['enabled'] else 0,
        'shippingEnabled': shipping['enabled'],
    }


def quote(items, options=None):
    options = options or {}
    goods = 0
    for item in items:
        price = item.get('unitPriceFen')
        quantity = item.get('quantity', 1)
        if type(price) is not int or type(quantity) is not int or price < 0 or quantity < 0:
            raise ValueError('金额必须使用非负整数分')
        goods += price * quantity
    current = config()
    handwork = current['handwork']['fen'] if current['handwork']['enabled'] else 0
    shipping_config = current['shipping']
    cord = CORD_FEN if options.get('cord') == 1 else 0
    gift = GIFT_FEN if options.get('gift') is True else 0
    subtotal = goods + handwork + cord + gift
    threshold = shipping_config['freeThresholdFen']
    shipping = (shipping_config['fen'] if shipping_config['enabled'] and
                (threshold is None or subtotal < threshold) else 0)
    discount = 0
    return {
        'goodsFen': goods,
        'handworkFen': handwork,
        'cordFen': cord,
        'giftFen': gift,
        'subtotalFen': subtotal,
        'shippingFen': shipping,
        'discountFen': discount,
        'payableFen': subtotal + shipping - discount,
        # totalFen 为兼容别名，恒等于 payableFen
        'totalFen': subtotal + shipping,
    }
