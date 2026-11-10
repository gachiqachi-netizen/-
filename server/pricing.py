"""Authoritative order pricing. All monetary values are integer fen."""

HANDWORK_FEN = 1500
CORD_FEN = 500
GIFT_FEN = 1000
FREE_SHIPPING_THRESHOLD_FEN = 9900
SHIPPING_FEN = 800


def public_config():
    return {
        'handworkFen': HANDWORK_FEN,
        'cordFen': CORD_FEN,
        'giftFen': GIFT_FEN,
        'freeShippingThresholdFen': FREE_SHIPPING_THRESHOLD_FEN,
        'shippingFen': SHIPPING_FEN,
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
    cord = CORD_FEN if options.get('cord') == 1 else 0
    gift = GIFT_FEN if options.get('gift') is True else 0
    subtotal = goods + HANDWORK_FEN + cord + gift
    shipping = 0 if subtotal >= FREE_SHIPPING_THRESHOLD_FEN else SHIPPING_FEN
    discount = 0
    return {
        'goodsFen': goods,
        'handworkFen': HANDWORK_FEN,
        'cordFen': cord,
        'giftFen': gift,
        'subtotalFen': subtotal,
        'shippingFen': shipping,
        'discountFen': discount,
        'payableFen': subtotal + shipping - discount,
        # totalFen 为兼容别名，恒等于 payableFen
        'totalFen': subtotal + shipping,
    }
