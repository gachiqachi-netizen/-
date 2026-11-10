"""004 金额整数分字段回填：旧 orders 文档补 subtotalFen / shippingFen /
discountFen / payableFen / paidFen / refundFen。

字段契约（Agent C，字段契约以集成分支最终对齐为准）：
    商品 priceFen；订单 subtotalFen / shippingFen / discountFen / payableFen /
    paidFen / refundFen，一律整数分。
    不变量：payableFen = subtotalFen + shippingFen - discountFen。

回填规则（自包含，直接 int() 换算，优先用已有 *Fen 字段，缺则从元字段换算）：
    - shippingFen = 已有 shipFen，否则 ship(元) * 100 取整；
    - subtotalFen = totalFen - shippingFen（小计 = 总计 - 运费，负数归 0）；
    - discountFen = 0（旧订单没有优惠）；
    - payableFen  = subtotalFen + shippingFen - discountFen（满足不变量）；
    - paidFen     = 0（旧订单未接真实支付，视为未支付）；
    - refundFen   = 0（旧订单无退款）。
各字段独立补缺失，不改写已有值。自包含：不 import pricing / commerce 等业务模块。
"""
VERSION = '004'
NAME = 'money_fen'

_FEN_FIELDS = ('subtotalFen', 'shippingFen', 'discountFen', 'payableFen', 'paidFen', 'refundFen')


def _to_fen(doc, fen_key, yuan_key):
    value = doc.get(fen_key)
    if isinstance(value, int) and not isinstance(value, bool):
        return value
    try:
        return int(round(float(doc.get(yuan_key) or 0) * 100))
    except (TypeError, ValueError):
        return 0


def up(conn, adapter):
    for rid, doc in adapter.iter_docs(conn, 'orders'):
        if all(k in doc for k in _FEN_FIELDS):
            continue
        shipping = _to_fen(doc, 'shipFen', 'ship')
        total = _to_fen(doc, 'totalFen', 'total')
        subtotal = doc.get('subtotalFen', total - shipping)
        if isinstance(subtotal, bool) or not isinstance(subtotal, int) or subtotal < 0:
            subtotal = 0
        discount = doc.get('discountFen', 0)
        if isinstance(discount, bool) or not isinstance(discount, int):
            discount = 0
        payable = doc.get('payableFen', subtotal + shipping - discount)
        paid = doc.get('paidFen', 0)
        refund = doc.get('refundFen', 0)
        doc.setdefault('subtotalFen', subtotal)
        doc.setdefault('shippingFen', shipping)
        doc.setdefault('discountFen', discount)
        doc.setdefault('payableFen', payable)
        doc.setdefault('paidFen', paid)
        doc.setdefault('refundFen', refund)
        adapter.update_doc(conn, 'orders', rid, doc)
