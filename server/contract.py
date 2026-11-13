"""对外的代码和中文叫法：唯一来源。前端用的文件由 tools/export_contract.py 生成，不要手改。"""
import hashlib, json
import commerce, kb, status

GROUPS = [  # 五组状态：key 给前端用，field 是订单里的字段名
    {"key": "order", "field": "orderStatus", "label": "订单"},
    {"key": "payment", "field": "paymentStatus", "label": "支付"},
    {"key": "fulfillment", "field": "fulfillmentStatus", "label": "制作"},
    {"key": "logistics", "field": "logisticsStatus", "label": "物流"},
    {"key": "afterSale", "field": "afterSaleStatus", "label": "售后"},
]
# 每组状态的中文：直接取 status.py 现有的 *_LABELS，不另写
STATUS_LABELS = {
    "orderStatus": status.ORDER_STATUS_LABELS,
    "paymentStatus": status.PAYMENT_STATUS_LABELS,
    "fulfillmentStatus": status.FULFILLMENT_STATUS_LABELS,
    "logisticsStatus": status.LOGISTICS_STATUS_LABELS,
    "afterSaleStatus": status.AFTER_SALE_STATUS_LABELS,
}
# 给用户看的主状态（06 第 3.1 节）。tone: normal 普通 / attention 需要用户处理 / danger 异常
CUSTOMER_STATUS = {
    "after_sale_open":     {"label": "售后处理中", "tone": "normal"},
    "after_sale_done":     {"label": "售后已完成", "tone": "normal"},
    "after_sale_rejected": {"label": "售后未通过", "tone": "normal"},
    "cancelled":           {"label": "已取消", "tone": "normal"},
    "refunding":           {"label": "退款中", "tone": "normal"},
    "refunded":            {"label": "已退款", "tone": "normal"},
    "refund_failed":       {"label": "退款遇到问题", "tone": "danger"},
    "completed":           {"label": "已完成", "tone": "normal"},
    "delivered":           {"label": "已签收", "tone": "attention"},
    "in_transit":          {"label": "运输中", "tone": "normal"},
    "logistics_issue":     {"label": "物流有点问题", "tone": "danger"},
    "producing":           {"label": "制作中", "tone": "normal"},
    "ready_to_ship":       {"label": "待发货", "tone": "normal"},
    "pending_payment":     {"label": "待支付", "tone": "attention"},
    "processing":          {"label": "处理中", "tone": "normal"},
}
# 给后台看的状态（12 第 4 节）。danger=True 的显示红字
OPS_STATUS = {
    "after_sale": {"label": "售后中", "danger": False},
    "cancelled": {"label": "已取消", "danger": False},
    "closed": {"label": "已关闭", "danger": False},
    "unpaid": {"label": "待支付", "danger": False},
    "to_make": {"label": "待制作", "danger": False},
    "qc_failed": {"label": "质检不通过", "danger": True},
    "producing": {"label": "制作中", "danger": False},
    "ready_to_ship": {"label": "待发货", "danger": False},
    "logistics_issue": {"label": "物流异常", "danger": True},
    "shipped": {"label": "已发货", "danger": False},
    "completed": {"label": "已完成", "danger": False},
}
# 用户订单动作。以后加动作就在这里加一行
ACTIONS = {
    "pay_order": "去支付",
    "cancel_order": "取消订单",
    "edit_address": "修改地址",
    "confirm_receipt": "确认收货",
    "view_logistics": "查看物流",
    "reorder": "按这款再串一条",
    "request_after_sale": "申请售后",
    "write_review": "写评价",
}
REVIEW_STATUSES = {"machine_failed": "机审未通过", "pending": "待审核",
                   "published": "已发布", "rejected": "审核未通过", "taken_down": "已下架"}
AFTER_SALE_REASONS = {  # 2026-11-13 负责人定：按常见电商，场景从简；定制商品签收后不支持“不想要了”
    "仅退款": ["不想要了", "拍错了，想重新设计", "等太久了", "其他"],
    "退货退款": ["珠子有裂纹或瑕疵", "和图片不一样", "掉珠或断线", "其他"],
    "补寄配件": ["少件或漏发", "掉珠或断线", "其他"],
    "改手围重串": ["戴着太紧", "戴着太松"],
    "拒收后退款": ["不想要了", "物流太慢", "其他"],
}
CANCEL_REASONS = ["不想要了", "拍错了，想重新设计", "地址填错了", "其他"]  # 用词和售后原因保持一致
PROGRESS_STEPS = [("ordered", "下单"), ("producing", "制作"), ("shipping", "运输"), ("delivered", "签收")]
PRODUCT_TYPES = {"bead": "珠子", "spacer": "隔珠/隔片", "pendant": "吊坠", "cord": "线材", "packaging": "包装"}
PRODUCT_STATUSES = {"draft": "草稿", "on_sale": "在售", "off_sale": "已下架", "archived": "已归档"}
TERM_STATUSES = {"draft": "草稿", "published": "已发布", "disabled": "已停用"}
TERM_SCENARIOS = {"all": "全部订单", "custom_diy": "自己串的", "template": "按模板下单", "ai": "AI 配的",
                  "gift": "送礼", "cord": "选了穿绳", "safety_warning": "含需要注意的材料"}
WORK_ORDER_STATUSES = {"pending": "待开始", "producing": "制作中", "qc_passed": "质检通过",
                       "qc_failed": "质检不通过", "ready_to_ship": "待发货", "shipped": "已发货"}
QUALITY_GATE_ITEMS = {"sequenceOk": "珠子顺序和工单一致", "sizeOk": "长度合适",
                      "materialOk": "用料和清单一致", "appearanceOk": "外观没有裂纹、线头"}

def payload():
    data = {
        "groups": GROUPS, "statusLabels": STATUS_LABELS, "customerStatus": CUSTOMER_STATUS,
        "opsStatus": OPS_STATUS, "actions": ACTIONS, "reviewStatuses": REVIEW_STATUSES,
        "progressSteps": [{"key": k, "label": v} for k, v in PROGRESS_STEPS],
        "afterSaleTypes": list(status.AFTER_SALE_TYPES),
        "afterSaleReasons": AFTER_SALE_REASONS,
        "productTypes": PRODUCT_TYPES, "productStatuses": PRODUCT_STATUSES,
        "termTypes": list(status.TERM_TYPES), "termStatuses": TERM_STATUSES, "termScenarios": TERM_SCENARIOS,
        "workOrderSteps": list(commerce.WORK_ORDER_STEPS), "workOrderStatuses": WORK_ORDER_STATUSES,
        "qualityGateItems": QUALITY_GATE_ITEMS,
        "cancelReasons": CANCEL_REASONS,
        "bannedWords": list(kb._load()["banned"]),
    }
    raw = json.dumps(data, ensure_ascii=False, sort_keys=True)
    return {"version": hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12], **data}
