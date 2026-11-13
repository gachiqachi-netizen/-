"""订单五组独立状态、合法迁移、旧 status 字段兼容、状态历史。金额一律整数分。

订单不再用一个 status 表示全部状态，拆成五组（存储值为英文枚举，展示用中文标签）：
- orderStatus       订单状态
- paymentStatus     支付状态
- fulfillmentStatus 履约状态（producing=制作中、ready_to_ship=待发货，语义等价于任务的 making/quality_check/ready）
- afterSaleStatus   售后状态
- logisticsStatus   物流状态（独立维度，发货时与履约联动）

旧订单只存了 status（中文），读取时用 LEGACY_STATUS_MAP 推导英文枚举，不重写旧数据。
支付状态不可由后台手工修改（防止伪造支付成功）；真实支付/退款回调接入后再放开。
"""
import time

# 五组独立状态（英文枚举 = 存储值）
ORDER_STATUSES = ["pending_confirmation", "confirmed", "cancelled", "completed", "closed"]
# 支付状态 8 态（对齐验收标准）。支付状态只能由支付回调推进，后台不可手工修改。
PAYMENT_STATUSES = ["unpaid", "paying", "paid", "pay_failed", "refunding", "refunded", "refund_failed", "closed"]
FULFILLMENT_STATUSES = ["unfulfilled", "producing", "ready_to_ship", "shipped", "delivered", "exception", "returned"]
AFTER_SALE_STATUSES = ["none", "requested", "reviewing", "approved", "rejected", "returning", "refunding", "completed", "closed"]
LOGISTICS_STATUSES = ["not_shipped", "shipped", "in_transit", "delivered", "exception", "returned"]

# 状态组字段名（物流状态独立成组）
GROUP_FIELDS = ("orderStatus", "paymentStatus", "fulfillmentStatus", "afterSaleStatus", "logisticsStatus")

# 中文标签（按组区分：completed / closed 在两个组里含义不同）
GROUP_LABELS = {"orderStatus": "订单状态", "paymentStatus": "支付状态",
                "fulfillmentStatus": "履约状态", "afterSaleStatus": "售后状态",
                "logisticsStatus": "物流状态"}

ORDER_STATUS_LABELS = {
    "pending_confirmation": "待确认", "confirmed": "已确认", "cancelled": "已取消",
    "completed": "已完成", "closed": "已关闭",
}
PAYMENT_STATUS_LABELS = {
    "unpaid": "待支付", "paying": "支付中", "paid": "已支付", "pay_failed": "支付失败",
    "refunding": "退款中", "refunded": "已退款", "refund_failed": "退款失败", "closed": "已关闭",
}
FULFILLMENT_STATUS_LABELS = {
    "unfulfilled": "待履约", "producing": "制作中", "ready_to_ship": "待发货",
    "shipped": "已发货", "delivered": "已签收", "exception": "物流异常", "returned": "已退回",
}
AFTER_SALE_STATUS_LABELS = {
    "none": "无售后", "requested": "申请中", "reviewing": "审核中", "approved": "已同意", "rejected": "已拒绝",
    "returning": "退货中", "refunding": "退款中", "completed": "售后完成", "closed": "售后关闭",
}
LOGISTICS_STATUS_LABELS = {
    "not_shipped": "未发货", "shipped": "已发货", "in_transit": "运输中",
    "delivered": "已签收", "exception": "物流异常", "returned": "已退回",
}

_STATUS_LABELS = {
    "orderStatus": ORDER_STATUS_LABELS, "paymentStatus": PAYMENT_STATUS_LABELS,
    "fulfillmentStatus": FULFILLMENT_STATUS_LABELS, "afterSaleStatus": AFTER_SALE_STATUS_LABELS,
    "logisticsStatus": LOGISTICS_STATUS_LABELS,
}


def status_label(group, value):
    """英文枚举 → 中文标签；未知值原样返回。"""
    return _STATUS_LABELS.get(group, {}).get(value, value)


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

# 售后类型（业务类型，保持中文）
AFTER_SALE_TYPES = ["仅退款", "退货退款", "补寄配件", "改手围重串", "拒收后退款"]

# 服务条款类型（保持中文）
TERM_TYPES = ["售前说明", "天然材料差异说明", "定制商品说明", "发货与物流说明", "退货退款说明", "售后服务说明", "用户协议", "隐私政策"]

# 允许的状态迁移（同状态视为合法，用于幂等）。空集合 = 终态。
ORDER_TRANSITIONS = {
    "pending_confirmation": {"confirmed", "cancelled"},
    "confirmed": {"completed", "closed"},
    "cancelled": set(),
    "completed": set(),
    "closed": set(),
}

FULFILLMENT_TRANSITIONS = {
    "unfulfilled": {"producing"},
    "producing": {"ready_to_ship", "returned"},
    "ready_to_ship": {"shipped", "returned"},
    "shipped": {"delivered", "exception", "returned"},
    "exception": {"shipped", "returned"},
    "delivered": set(),
    "returned": set(),
}

AFTER_SALE_TRANSITIONS = {
    "requested": {"reviewing", "rejected", "closed"},
    "reviewing": {"approved", "rejected", "closed"},
    "approved": {"returning", "refunding", "completed", "closed"},
    "returning": {"refunding", "closed"},
    "refunding": {"completed", "closed"},
    "rejected": {"closed"},
    "completed": set(),
    "closed": set(),
}

# 支付状态合法迁移（同状态视为幂等）。终态 refunded / closed / pay_failed 不再变；
# refund_failed 可重试退款（回到 refunding）。
PAYMENT_TRANSITIONS = {
    "unpaid": {"paying", "paid", "closed"},
    "paying": {"paid", "pay_failed"},
    "paid": {"refunding", "closed"},
    "refunding": {"refunded", "refund_failed"},
    "refund_failed": {"refunding", "closed"},
    "refunded": set(),
    "closed": set(),
    "pay_failed": set(),
}

LOGISTICS_TRANSITIONS = {
    "not_shipped": {"shipped"},
    "shipped": {"in_transit", "delivered", "exception"},
    "in_transit": {"delivered", "exception"},
    "exception": {"in_transit", "returned"},
    "delivered": set(),
    "returned": set(),
}

# 旧 status 字段 → 五组英文枚举。旧演示单无真实支付回调，paymentStatus 一律 unpaid，
# 绝不显示为已支付（防止旧演示单被当成已支付）；物流维度按履约状态推导。
LEGACY_STATUS_MAP = {
    "待支付": {"orderStatus": "pending_confirmation", "paymentStatus": "unpaid",
               "fulfillmentStatus": "unfulfilled", "afterSaleStatus": "none", "logisticsStatus": "not_shipped"},
    "待串制": {"orderStatus": "confirmed", "paymentStatus": "unpaid",
               "fulfillmentStatus": "unfulfilled", "afterSaleStatus": "none", "logisticsStatus": "not_shipped"},
    "串制中": {"orderStatus": "confirmed", "paymentStatus": "unpaid",
               "fulfillmentStatus": "producing", "afterSaleStatus": "none", "logisticsStatus": "not_shipped"},
    "已发货": {"orderStatus": "confirmed", "paymentStatus": "unpaid",
               "fulfillmentStatus": "shipped", "afterSaleStatus": "none", "logisticsStatus": "shipped"},
    "已完成": {"orderStatus": "completed", "paymentStatus": "unpaid",
               "fulfillmentStatus": "delivered", "afterSaleStatus": "none", "logisticsStatus": "delivered"},
    "已取消": {"orderStatus": "cancelled", "paymentStatus": "unpaid",
               "fulfillmentStatus": "unfulfilled", "afterSaleStatus": "none", "logisticsStatus": "not_shipped"},
}

_DEFAULT_GROUPS = {"orderStatus": "pending_confirmation", "paymentStatus": "unpaid",
                   "fulfillmentStatus": "unfulfilled", "afterSaleStatus": "none",
                   "logisticsStatus": "not_shipped"}

# 履约状态 → 物流状态回退映射（旧订单没有独立 logisticsStatus 字段时推导）
_FULFILLMENT_TO_LOGISTICS = {
    "unfulfilled": "not_shipped", "producing": "not_shipped", "ready_to_ship": "not_shipped",
    "shipped": "shipped", "delivered": "delivered", "exception": "exception", "returned": "returned",
}


def new_order_status():
    """新建订单的五组初始状态（英文枚举）。"""
    return dict(_DEFAULT_GROUPS)


def derive_status(order):
    """从订单文档推导五组状态（含物流状态）。

    已有分组字段直接用；缺 logisticsStatus 时从履约状态推导（发货前 not_shipped）。
    旧订单只有中文 status 时按 LEGACY_STATUS_MAP 推导，不改写旧数据。
    迁移可能只回填了部分分组字段（如 paymentStatus/logisticsStatus），此时其余缺失的
    分组字段仍优先按旧中文 status 从 LEGACY_STATUS_MAP 补齐，避免被兜底成默认值。
    """
    legacy = LEGACY_STATUS_MAP.get(order.get("status"))
    if any(k in order for k in GROUP_FIELDS):
        groups = {k: order.get(k) for k in GROUP_FIELDS}
        if groups.get("logisticsStatus") is None:
            groups["logisticsStatus"] = _FULFILLMENT_TO_LOGISTICS.get(groups.get("fulfillmentStatus"), "not_shipped")
    else:
        groups = dict(legacy or _DEFAULT_GROUPS)
    for k in GROUP_FIELDS:  # 兜底补齐缺失字段：优先旧中文状态推导，其次默认值
        if groups.get(k) is None:
            groups[k] = (legacy or _DEFAULT_GROUPS)[k]
    return groups


def _table(group):
    return {"orderStatus": ORDER_TRANSITIONS, "paymentStatus": PAYMENT_TRANSITIONS,
            "fulfillmentStatus": FULFILLMENT_TRANSITIONS,
            "afterSaleStatus": AFTER_SALE_TRANSITIONS,
            "logisticsStatus": LOGISTICS_TRANSITIONS}.get(group)


def valid_values(group):
    return {"orderStatus": ORDER_STATUSES, "paymentStatus": PAYMENT_STATUSES,
            "fulfillmentStatus": FULFILLMENT_STATUSES, "afterSaleStatus": AFTER_SALE_STATUSES,
            "logisticsStatus": LOGISTICS_STATUSES}.get(group, [])


def next_states(group, current):
    """某状态组当前状态下允许的下一状态（稳定有序列表）。终态返回空列表。"""
    table = _table(group)
    if table is None:
        raise ValueError("未知状态组")
    return sorted(table.get(current, set()))


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
        raise ValueError(f"{GROUP_LABELS.get(group, group)} 没有「{status_label(group, to_)}」这个状态")
    if from_ not in table:
        raise ValueError(f"{GROUP_LABELS.get(group, group)} 当前状态「{status_label(group, from_)}」无效")
    if not can_transition(group, from_, to_):
        raise ValueError(f"{GROUP_LABELS.get(group, group)} 不允许从「{status_label(group, from_)}」变更到「{status_label(group, to_)}」")
    return True


def history_entry(actor, group, from_, to_, note=""):
    """一条状态变更历史（存英文枚举值）。"""
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
