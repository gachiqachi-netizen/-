"""005 物流状态字段回填：旧 orders 文档缺 logisticsStatus 时按旧 status / 履约状态推导。

字段契约（Agent E，物流状态枚举，字段契约以集成分支最终对齐为准）：
    not_shipped / shipped / in_transit / delivered / exception / returned

回填规则（自包含，不 import status 等业务模块，字符串常量写死）：
    - 旧 status 中文字段在映射表内 → 按其推导 logisticsStatus：
        已发货 → shipped；已完成 → delivered；待支付/待串制/串制中/已取消 → not_shipped；
    - 缺 logisticsStatus 且已有 fulfillmentStatus → 用 _FULFILLMENT_TO_LOGISTICS 等价映射推导；
    - 已有 logisticsStatus 但为合法值时跳过（幂等）；非法/与履约矛盾时按上述规则校正。
    不变量：不得出现 fulfillment=shipped 而 logistics=not_shipped 的矛盾组合。
"""
VERSION = '005'
NAME = 'logistics_status'

DEFAULT_LOGISTICS_STATUS = 'not_shipped'

VALID_LOGISTICS_STATUSES = ('not_shipped', 'shipped', 'in_transit', 'delivered', 'exception', 'returned')

# 旧中文 status → logisticsStatus（与 status.LEGACY_STATUS_MAP 的物流列一致）
_LEGACY_LOGISTICS = {
    '待支付': 'not_shipped',
    '待串制': 'not_shipped',
    '串制中': 'not_shipped',
    '已发货': 'shipped',
    '已完成': 'delivered',
    '已取消': 'not_shipped',
}

# 履约状态 → 物流状态等价映射（与 status._FULFILLMENT_TO_LOGISTICS 一致）
_FULFILLMENT_TO_LOGISTICS = {
    'unfulfilled': 'not_shipped',
    'producing': 'not_shipped',
    'ready_to_ship': 'not_shipped',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'exception': 'exception',
    'returned': 'returned',
}


def _desired_logistics(doc):
    """按现代履约字段优先，规范化历史物流状态。

    已经存在 fulfillmentStatus 的文档可能仍残留旧中文 status；旧字段不能反向
    覆盖新状态。履约为 shipped 时保留 in_transit/exception/returned 等合法的后续
    物流进度，其余矛盾值回收到 shipped。
    """
    fulfillment = doc.get('fulfillmentStatus')
    if fulfillment in _FULFILLMENT_TO_LOGISTICS:
        current = doc.get('logisticsStatus')
        if fulfillment == 'shipped' and current in ('shipped', 'in_transit', 'exception', 'returned'):
            return current
        return _FULFILLMENT_TO_LOGISTICS[fulfillment]
    legacy = doc.get('status')
    if legacy in _LEGACY_LOGISTICS:
        return _LEGACY_LOGISTICS[legacy]
    current = doc.get('logisticsStatus')
    if current in VALID_LOGISTICS_STATUSES:
        return current
    return DEFAULT_LOGISTICS_STATUS


def up(conn, adapter):
    for rid, doc in adapter.iter_docs(conn, 'orders'):
        desired = _desired_logistics(doc)
        if doc.get('logisticsStatus') == desired:
            continue
        doc['logisticsStatus'] = desired
        adapter.update_doc(conn, 'orders', rid, doc)
