"""金额统一整数分的唯一权威模块。

约定：金额一律用整数「分」表示；禁止在其它模块用浮点参与金额计算、比较或转换。
所有元 ↔ 分转换、整数分校验、订单金额字段归一化与约束校验都集中在这里。
"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

# 金额上限：超过 9_999_999_999 分（约 1 亿元）视为异常金额
MAX_FEN = 9_999_999_999


def yuan_to_fen(yuan):
    """元 → 整数分，用 Decimal 精确转换并四舍五入到分。

    拒绝布尔、NaN/Inf、负数、超过上限（> MAX_FEN 分）的值；非法抛 ValueError。
    """
    if isinstance(yuan, bool):
        raise ValueError("金额格式不正确")
    try:
        d = Decimal(str(yuan))
    except (InvalidOperation, ValueError):
        raise ValueError("金额格式不正确")
    if not d.is_finite():
        raise ValueError("金额格式不正确")
    if d < 0:
        raise ValueError("金额不能为负数")
    fen = d * 100
    if fen > MAX_FEN:
        raise ValueError("金额超出上限")
    try:
        fen = fen.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    except InvalidOperation:
        raise ValueError("金额格式不正确")
    return int(fen)


def parse_fen(value):
    """严格校验整数分：仅接受 int（拒绝 bool/float/str/None）、非负、不超过上限。

    非法抛 ValueError，合法返回原 int。
    """
    if type(value) is not int:
        raise ValueError("金额必须是整数分")
    if value < 0:
        raise ValueError("金额不能为负数")
    if value > MAX_FEN:
        raise ValueError("金额超出上限")
    return value


def fen_to_yuan(fen):
    """整数分 → 元字符串（仅用于展示，不参与计算）。"""
    fen = parse_fen(fen)
    return f"{fen // 100}.{fen % 100:02d}"


def validate_order_amounts(subtotal_fen, shipping_fen, discount_fen, payable_fen,
                           paid_fen=0, refund_fen=0):
    """校验订单金额不变量与约束，返回规范化的整数分字段 dict。

    不变量：payableFen = subtotalFen + shippingFen - discountFen；
    约束：paidFen ≤ payableFen；累计 refundFen ≤ paidFen（可退款上限）。
    任一不满足抛 ValueError。
    """
    subtotal = parse_fen(subtotal_fen)
    shipping = parse_fen(shipping_fen)
    discount = parse_fen(discount_fen)
    payable = parse_fen(payable_fen)
    paid = parse_fen(paid_fen)
    refund = parse_fen(refund_fen)
    if payable != subtotal + shipping - discount:
        raise ValueError("金额不变量不成立：payableFen 应等于 subtotalFen + shippingFen - discountFen")
    if paid > payable:
        raise ValueError("实付金额不能超过应付金额")
    if refund > paid:
        raise ValueError("累计退款不能超过实付金额")
    return {
        "subtotalFen": subtotal,
        "shippingFen": shipping,
        "discountFen": discount,
        "payableFen": payable,
        "paidFen": paid,
        "refundFen": refund,
    }


def normalize_order_amounts(order):
    """从订单文档推导统一整数分金额字段，不改写原数据。

    新订单直接读新字段；旧订单缺新字段时从 totalFen/shipFen 或旧浮点元字段
    total/ship 推导，保证 subtotalFen/shippingFen/payableFen 等字段可用。
    """
    o = order or {}

    def _fen(*keys, default=0):
        for k in keys:
            v = o.get(k)
            if v is None or isinstance(v, bool):
                continue
            if type(v) is int:
                try:
                    return parse_fen(v)
                except ValueError:
                    continue
            try:
                return yuan_to_fen(v)
            except ValueError:
                continue
        return default

    payable = _fen("payableFen", "totalFen", "total")
    shipping = _fen("shippingFen", "shipFen", "ship")
    discount = _fen("discountFen")
    subtotal = _fen("subtotalFen")
    if "subtotalFen" not in o:
        # 旧订单没有 subtotalFen：由不变量反推（旧订单无折扣，discount=0）
        subtotal = max(0, payable + discount - shipping)
    paid = _fen("paidFen")
    refund = _fen("refundFen")
    return {
        "subtotalFen": subtotal,
        "shippingFen": shipping,
        "discountFen": discount,
        "payableFen": payable,
        "paidFen": paid,
        "refundFen": refund,
    }
