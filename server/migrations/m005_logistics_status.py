"""005 物流状态字段回填：旧 orders 文档缺 logisticsStatus 时补默认值 not_shipped。

字段契约（Agent E，物流状态枚举，字段契约以集成分支最终对齐为准）：
    not_shipped / shipped / in_transit / delivered / exception / returned

本迁移只补缺省默认值 not_shipped（初始态），不改写已有值；物流状态演进由
物流/履约模块维护。自包含：不 import status 等业务模块，直接写字符串默认值。
"""
VERSION = '005'
NAME = 'logistics_status'

DEFAULT_LOGISTICS_STATUS = 'not_shipped'


def up(conn, adapter):
    for rid, doc in adapter.iter_docs(conn, 'orders'):
        if 'logisticsStatus' not in doc:
            doc['logisticsStatus'] = DEFAULT_LOGISTICS_STATUS
            adapter.update_doc(conn, 'orders', rid, doc)
