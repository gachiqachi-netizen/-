"""订单四组独立状态、合法迁移、旧 status 字段兼容、状态历史。金额一律整数分。

订单不再用一个 status 表示全部状态，拆成四组：
- orderStatus      订单状态
- paymentStatus    支付状态
- fulfillmentStatus 履约/物流状态
- afterSaleStatus  售后状态

旧订单只存了 status，读取时用 LEGACY_STATUS_MAP 推导四组状态，不重写旧数据。
支付状态不可由后台手工修改（防止伪造支付成功）；真实支付/退款回调接入后再放开。
"""
import time

# 四组独立状态（顺序即后台展示顺序）
ORDER_STATUSES = ["待确认", "已确认", "已取消", "已完成", "已关闭"]
PAYMENT_STATUSES = ["待支付", "支付中", "已支付", "支付失败", "部分退款", "已退款"]
FULFILLMENT_STATUSES = ["待履约", "制作中", "待发货", "已发货", "已签收", "物流异常", "已退回"]
AFTER_SALE_STATUSES = ["无售后", "申请中", "已同意", "已拒绝", "退货中", "退款中", "售后完成", "售后关闭"]

# 商品/模板状态：草稿 / 上架 / 下架 / 归档
PRODUCT_STATUSES = ["draft", "on_sale", "off_sale", "archived"]

# 服务条款状态：草稿 / 已发布 / 已停用
TERM_STATUSES = ["draft", "published", "disabled"]

# 商品类型（至少覆盖：珠子、隔片/配件、吊坠、线材、包装）
PRODUCT_TYPES = ["bead", "spacer", "pendant", "cord", "packaging"]

# 珠子/隔片类目材质（与 ai.MATS 一致，决定 3D 质感）
BEAD_MATERIALS = ("wood", "bodhi", "stone", "crystal", "metal")

# 商品材质：在珠子五类材质基础上扩展非珠子品类（吊坠/线材/包装）
MATERIALS = {
    "wood": "木质", "bodhi": "菩提", "stone": "玉石", "crystal": "水晶", "metal": "金属配件",
    "cord": "线材", "textile": "织物", "paper": "纸品", "plastic": "塑料", "glass": "玻璃", "alloy": "合金",
}

# 售后类型
AFTER_SALE_TYPES = ["仅退款", "退货退款", "补发"]

# 服务条款类型
TERM_TYPES = ["售前说明", "天然材料差异说明", "定制商品说明", "发货与物流说明", "退货退款说明", "售后服务说明"]

# 四组状态的字段名
GROUP_FIELDS = ("orderStatus", "paymentStatus", "fulfillmentStatus", "afterSaleStatus")

# 允许的状态迁移（同状态视为合法，用于幂等）。空集合 = 终态。
ORDER_TRANSITIONS = {
    "待确认": {"已确认", "已取消"},
    "已确认": {"已完成", "已关闭"},
    "已取消": set(),
    "已完成": set(),
    "已关闭": set(),
}

FULFILLMENT_TRANSITIONS = {
    "待履约": {"制作中"},
    "制作中": {"待发货", "已退回"},
    "待发货": {"已发货", "已退回"},
    "已发货": {"已签收", "物流异常", "已退回"},
    "物流异常": {"已发货", "已退回"},
    "已签收": set(),
    "已退回": set(),
}

AFTER_SALE_TRANSITIONS = {
    "申请中": {"已同意", "已拒绝", "售后关闭"},
    "已同意": {"退货中", "退款中", "售后完成", "售后关闭"},
    "退货中": {"退款中", "售后关闭"},
    "退款中": {"售后完成", "售后关闭"},
    "已拒绝": {"售后关闭"},
    "售后完成": set(),
    "售后关闭": set(),
}

# 旧 status 字段 → 四组状态。旧演示单无真实支付，视为已支付仅用于展示。
LEGACY_STATUS_MAP = {
    "待支付": {"orderStatus": "待确认", "paymentStatus": "待支付", "fulfillmentStatus": "待履约", "afterSaleStatus": "无售后"},
    "待串制": {"orderStatus": "已确认", "paymentStatus": "已支付", "fulfillmentStatus": "待履约", "afterSaleStatus": "无售后"},
    "串制中": {"orderStatus": "已确认", "paymentStatus": "已支付", "fulfillmentStatus": "制作中", "afterSaleStatus": "无售后"},
    "已发货": {"orderStatus": "已确认", "paymentStatus": "已支付", "fulfillmentStatus": "已发货", "afterSaleStatus": "无售后"},
    "已完成": {"orderStatus": "已完成", "paymentStatus": "已支付", "fulfillmentStatus": "已签收", "afterSaleStatus": "无售后"},
    "已取消": {"orderStatus": "已取消", "paymentStatus": "待支付", "fulfillmentStatus": "待履约", "afterSaleStatus": "无售后"},
}

_DEFAULT_GROUPS = {"orderStatus": "待确认", "paymentStatus": "待支付", "fulfillmentStatus": "待履约", "afterSaleStatus": "无售后"}


def new_order_status():
    """新建订单的四组初始状态。"""
    return dict(_DEFAULT_GROUPS)


def derive_status(order):
    """从订单文档推导四组状态。已有四组字段直接用；否则按旧 status 映射，不改写旧数据。"""
    if all(k in order for k in GROUP_FIELDS):
        return {k: order[k] for k in GROUP_FIELDS}
    return dict(LEGACY_STATUS_MAP.get(order.get("status"), _DEFAULT_GROUPS))


def _table(group):
    return {"orderStatus": ORDER_TRANSITIONS, "fulfillmentStatus": FULFILLMENT_TRANSITIONS,
            "afterSaleStatus": AFTER_SALE_TRANSITIONS}.get(group)


def valid_values(group):
    return {"orderStatus": ORDER_STATUSES, "paymentStatus": PAYMENT_STATUSES,
            "fulfillmentStatus": FULFILLMENT_STATUSES, "afterSaleStatus": AFTER_SALE_STATUSES}.get(group, [])


def can_transition(group, from_, to_):
    """判断 group 状态组里 from_ → to_ 是否合法。"""
    table = _table(group)
    if table is None:
        raise ValueError("未知状态组")
    if from_ == to_:
        return True
    return to_ in table.get(from_, set())


def validate_transition(group, from_, to_):
    """校验一次状态迁移，非法则抛 ValueError。"""
    table = _table(group)
    if table is None:
        raise ValueError("未知状态组")
    if to_ not in table:
        raise ValueError(f"{group} 没有「{to_}」这个状态")
    if from_ not in table:
        raise ValueError(f"{group} 当前状态「{from_}」无效")
    if not can_transition(group, from_, to_):
        raise ValueError(f"{group} 不允许从「{from_}」变更到「{to_}」")
    return True


def history_entry(actor, group, from_, to_, note=""):
    """一条状态变更历史。"""
    return {"at": int(time.time() * 1000), "actor": actor, "group": group,
            "from": from_, "to": to_, "note": str(note or "")[:200]}


def product_status(doc):
    """商品/模板状态：优先读 status 字段，旧数据从 onSale 布尔推导。"""
    if doc.get("status") in PRODUCT_STATUSES:
        return doc["status"]
    return "on_sale" if doc.get("onSale", True) else "off_sale"


def product_on_sale(doc):
    """商品/模板是否在售（供目录接口用），与 status 保持一致。"""
    return product_status(doc) == "on_sale"


def product_type(doc):
    """商品类型：新数据读 type，旧数据从 spacer 布尔推导。"""
    t = doc.get("type")
    if t in PRODUCT_TYPES:
        return t
    return "spacer" if doc.get("spacer") else "bead"
