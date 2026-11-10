"""003 支付状态字段回填：旧 orders 文档缺 paymentStatus 时补默认值 unpaid。

字段契约（Agent B，8 态支付状态枚举，字段契约以集成分支最终对齐为准）：
    unpaid / paying / paid / pay_failed / refunding / refunded / refund_failed / closed

本迁移只补缺省默认值 unpaid（8 态中的初始态），不改写已有值；真实支付/退款
回调接入后由支付模块维护该字段。自包含：不 import status / payments 等业务模块，
直接写字符串默认值，避免独立 worktree 里 import 不到其它 Agent 的实现。
"""
VERSION = '003'
NAME = 'payment_status'

DEFAULT_PAYMENT_STATUS = 'unpaid'


def up(conn, adapter):
    for rid, doc in adapter.iter_docs(conn, 'orders'):
        if 'paymentStatus' not in doc:
            doc['paymentStatus'] = DEFAULT_PAYMENT_STATUS
            adapter.update_doc(conn, 'orders', rid, doc)
