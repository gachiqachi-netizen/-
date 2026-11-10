"""004 金额整数分字段回填：旧 orders 文档补 subtotalFen / shippingFen /
discountFen / payableFen / paidFen / refundFen。

字段契约（Agent C，字段契约以集成分支最终对齐为准）：
    商品 priceFen；订单 subtotalFen / shippingFen / discountFen / payableFen /
    paidFen / refundFen，一律整数分。
    不变量：payableFen = subtotalFen + shippingFen - discountFen。

回填规则（自包含，Decimal 精确换算，优先用已有 *Fen 字段，缺则从元字段换算）：
    - shippingFen = 已有 shipFen，否则 ship(元) * 100 取整；
    - subtotalFen = totalFen - shippingFen（小计 = 总计 - 运费，负数归 0）；
    - discountFen = 0（旧订单没有优惠）；
    - payableFen  = subtotalFen + shippingFen - discountFen（满足不变量）；
    - paidFen     = 0（旧订单未接真实支付，视为未支付）；
    - refundFen   = 0（旧订单无退款）。
各字段独立补缺失，不改写已有值。自包含：不 import pricing / commerce 等业务模块。
"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

VERSION = '004'
NAME = 'money_fen'
MAX_FEN = 9_999_999_999

_FEN_FIELDS = ('subtotalFen', 'shippingFen', 'discountFen', 'payableFen', 'paidFen', 'refundFen')


def _parse_fen(value, key):
    if type(value) is not int or value < 0 or value > MAX_FEN:
        raise ValueError(f'{key} 必须是有效的非负整数分')
    return value


def _yuan_to_fen(value, key):
    if isinstance(value, bool):
        raise ValueError(f'{key} 金额格式不正确')
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f'{key} 金额格式不正确')
    if not amount.is_finite() or amount < 0:
        raise ValueError(f'{key} 金额格式不正确')
    fen = (amount * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
    if fen > MAX_FEN:
        raise ValueError(f'{key} 金额超出上限')
    return int(fen)


def _to_fen(doc, fen_key, yuan_key, default=0):
    if fen_key in doc:
        return _parse_fen(doc[fen_key], fen_key)
    if yuan_key in doc:
        return _yuan_to_fen(doc[yuan_key], yuan_key)
    return default


def up(conn, adapter):
    for rid, doc in adapter.iter_docs(conn, 'orders'):
        shipping = (_parse_fen(doc['shippingFen'], 'shippingFen')
                    if 'shippingFen' in doc else _to_fen(doc, 'shipFen', 'ship'))
        total = _to_fen(doc, 'totalFen', 'total')
        subtotal = _parse_fen(doc['subtotalFen'], 'subtotalFen') if 'subtotalFen' in doc else total - shipping
        if subtotal < 0:
            raise ValueError(f'订单 {rid} 的小计不能为负数')
        discount = _parse_fen(doc['discountFen'], 'discountFen') if 'discountFen' in doc else 0
        payable = _parse_fen(doc['payableFen'], 'payableFen') if 'payableFen' in doc else subtotal + shipping - discount
        paid = _parse_fen(doc['paidFen'], 'paidFen') if 'paidFen' in doc else 0
        refund = _parse_fen(doc['refundFen'], 'refundFen') if 'refundFen' in doc else 0
        if payable < 0 or payable != subtotal + shipping - discount:
            raise ValueError(f'订单 {rid} 的金额不变量不成立')
        if paid > payable or refund > paid:
            raise ValueError(f'订单 {rid} 的实付或退款金额不合法')
        doc.setdefault('subtotalFen', subtotal)
        doc.setdefault('shippingFen', shipping)
        doc.setdefault('discountFen', discount)
        doc.setdefault('payableFen', payable)
        doc.setdefault('paidFen', paid)
        doc.setdefault('refundFen', refund)
        adapter.update_doc(conn, 'orders', rid, doc)
