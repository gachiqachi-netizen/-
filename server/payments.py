"""支付领域唯一入口。

当前未接真实微信支付（PAYMENT_NOT_INTEGRATED = True）。任何把订单标记为「已支付」
的尝试都会在此被拒绝，绝不允许伪造支付成功。真实支付/退款回调的接入点集中于此文件，
未来接入微信支付 v3 时只需改这里：

1. 验签：用微信支付平台证书校验回调签名，失败即拒绝。
2. 幂等：同一回调编号（微信支付回调 id）只处理一次，重复回调直接返回已处理结果。
3. 金额核对：回调金额必须等于订单应付金额 payableFen，否则拒绝。

本文件不写任何真实商户号 / APIv3 密钥 / 证书序列号。
"""
import status

PAYMENT_NOT_INTEGRATED = True


def payable_fen(order):
    """订单应付金额（整数分）。

    字段名将由 Agent C 统一为 payableFen，当前兼容读取旧的 totalFen。
    """
    fen = order.get("payableFen")
    if fen is None:
        fen = order.get("totalFen")  # 兼容旧字段，将统一为 payableFen
    if isinstance(fen, bool) or not isinstance(fen, int) or fen < 0:
        raise ValueError("订单应付金额不正确")
    return fen


def payment_transition(from_, to_):
    """校验支付状态合法迁移，非法抛 ValueError。"""
    return status.validate_transition("paymentStatus", from_, to_)


def is_callback_processed(order, callback_id):
    """同一支付回调编号是否已处理过（幂等）。

    结构：订单上记录已处理的回调编号列表 paymentCallbacks。
    """
    return callback_id in (order.get("paymentCallbacks") or [])


def assert_amount_matches(order, callback):
    """核对回调金额必须等于订单应付金额，否则抛错拒绝。"""
    amount = (callback or {}).get("amountFen")
    if isinstance(amount, bool) or not isinstance(amount, int):
        raise ValueError("支付回调金额格式不正确")
    if amount != payable_fen(order):
        raise ValueError("支付金额与订单应付金额不符")
    return True


def mark_paid(order, callback):
    """把订单标记为已支付（唯一入口）。

    本轮未接真实微信支付：无论回调内容如何，一律抛错，绝不允许假实现返回成功。
    TODO(接入微信支付 v3 回调)：以下为接入后的完整流程结构，当前不可达——
      1. 校验回调编号存在，且 is_callback_processed(order, callback['id']) 为假
         （同一回调编号只记账一次，重复回调直接返回，幂等）；
      2. 用微信支付平台证书验签，失败抛错拒绝；
      3. assert_amount_matches(order, callback) 核对金额；
      4. 全部通过后 payment_transition(当前支付态, 'paid')，落库并把回调编号记入
         order['paymentCallbacks']，同时写状态历史。
    """
    if PAYMENT_NOT_INTEGRATED:
        raise RuntimeError("未接真实支付，禁止标记已支付")
    callback = callback or {}
    if not callback.get("id"):
        raise ValueError("支付回调缺少编号")
    if is_callback_processed(order, callback["id"]):
        return order  # 幂等：同一回调编号不重复记账
    assert_amount_matches(order, callback)
    # 未来接入点：验签 → payment_transition(当前支付态, 'paid') → 落库
    raise NotImplementedError("真实支付尚未接入")


def validate_refund_amount(order, refund_fen):
    """校验退款金额：非负整数分，且不超过订单应付金额。"""
    if isinstance(refund_fen, bool) or not isinstance(refund_fen, int) or refund_fen < 0:
        raise ValueError("退款金额必须是不小于 0 的整数分")
    if refund_fen > payable_fen(order):
        raise ValueError("退款金额不能超过订单金额")
    return True


def handle_refund(order, refund_fen):
    """执行支付域退款：paid → refunding → refunded / refund_failed。

    本轮未接真实微信退款：不会伪造退款成功，一律抛错。
    TODO(接入微信退款 API)：接入后的流程结构——
      1. validate_refund_amount(order, refund_fen)；
      2. 调用微信退款，成功 payment_transition('refunding', 'refunded')，
         失败 payment_transition('refunding', 'refund_failed')；
      3. 记录退款单号与幂等键，写状态历史。
    """
    validate_refund_amount(order, refund_fen)
    if PAYMENT_NOT_INTEGRATED:
        raise RuntimeError("未接真实退款，禁止标记已退款")
    raise NotImplementedError("真实退款尚未接入")
