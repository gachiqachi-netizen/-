// 自动生成：python3 tools/export_contract.py，不要手改
export const CONTRACT = {
  "actions": {
    "cancel_order": "取消订单",
    "confirm_receipt": "确认收货",
    "pay_order": "去支付",
    "reorder": "按这款再串一条",
    "view_logistics": "查看物流"
  },
  "afterSaleTypes": [
    "仅退款",
    "退货退款",
    "补发"
  ],
  "customerStatus": {
    "after_sale_done": {
      "label": "售后已完成",
      "tone": "normal"
    },
    "after_sale_open": {
      "label": "售后处理中",
      "tone": "normal"
    },
    "after_sale_rejected": {
      "label": "售后未通过",
      "tone": "normal"
    },
    "cancelled": {
      "label": "已取消",
      "tone": "normal"
    },
    "completed": {
      "label": "已完成",
      "tone": "normal"
    },
    "delivered": {
      "label": "已签收",
      "tone": "attention"
    },
    "in_transit": {
      "label": "运输中",
      "tone": "normal"
    },
    "logistics_issue": {
      "label": "物流有点问题",
      "tone": "danger"
    },
    "pending_payment": {
      "label": "待支付",
      "tone": "attention"
    },
    "processing": {
      "label": "处理中",
      "tone": "normal"
    },
    "producing": {
      "label": "制作中",
      "tone": "normal"
    },
    "ready_to_ship": {
      "label": "待发货",
      "tone": "normal"
    },
    "refund_failed": {
      "label": "退款遇到问题",
      "tone": "danger"
    },
    "refunded": {
      "label": "已退款",
      "tone": "normal"
    },
    "refunding": {
      "label": "退款中",
      "tone": "normal"
    }
  },
  "groups": [
    {
      "field": "orderStatus",
      "key": "order",
      "label": "订单"
    },
    {
      "field": "paymentStatus",
      "key": "payment",
      "label": "支付"
    },
    {
      "field": "fulfillmentStatus",
      "key": "fulfillment",
      "label": "制作"
    },
    {
      "field": "logisticsStatus",
      "key": "logistics",
      "label": "物流"
    },
    {
      "field": "afterSaleStatus",
      "key": "afterSale",
      "label": "售后"
    }
  ],
  "opsStatus": {
    "after_sale": {
      "danger": false,
      "label": "售后中"
    },
    "cancelled": {
      "danger": false,
      "label": "已取消"
    },
    "closed": {
      "danger": false,
      "label": "已关闭"
    },
    "completed": {
      "danger": false,
      "label": "已完成"
    },
    "logistics_issue": {
      "danger": true,
      "label": "物流异常"
    },
    "producing": {
      "danger": false,
      "label": "制作中"
    },
    "qc_failed": {
      "danger": true,
      "label": "质检不通过"
    },
    "ready_to_ship": {
      "danger": false,
      "label": "待发货"
    },
    "shipped": {
      "danger": false,
      "label": "已发货"
    },
    "to_make": {
      "danger": false,
      "label": "待制作"
    },
    "unpaid": {
      "danger": false,
      "label": "待支付"
    }
  },
  "productStatuses": {
    "archived": "已归档",
    "draft": "草稿",
    "off_sale": "已下架",
    "on_sale": "在售"
  },
  "productTypes": {
    "bead": "珠子",
    "cord": "线材",
    "packaging": "包装",
    "pendant": "吊坠",
    "spacer": "隔珠/隔片"
  },
  "progressSteps": [
    {
      "key": "ordered",
      "label": "下单"
    },
    {
      "key": "producing",
      "label": "制作"
    },
    {
      "key": "shipping",
      "label": "运输"
    },
    {
      "key": "delivered",
      "label": "签收"
    }
  ],
  "qualityGateItems": {
    "appearanceOk": "外观没有裂纹、线头",
    "materialOk": "用料和清单一致",
    "sequenceOk": "珠子顺序和工单一致",
    "sizeOk": "长度合适"
  },
  "statusLabels": {
    "afterSaleStatus": {
      "approved": "已同意",
      "closed": "售后关闭",
      "completed": "售后完成",
      "none": "无售后",
      "refunding": "退款中",
      "rejected": "已拒绝",
      "requested": "申请中",
      "returning": "退货中",
      "reviewing": "审核中"
    },
    "fulfillmentStatus": {
      "delivered": "已签收",
      "exception": "物流异常",
      "producing": "制作中",
      "ready_to_ship": "待发货",
      "returned": "已退回",
      "shipped": "已发货",
      "unfulfilled": "待履约"
    },
    "logisticsStatus": {
      "delivered": "已签收",
      "exception": "物流异常",
      "in_transit": "运输中",
      "not_shipped": "未发货",
      "returned": "已退回",
      "shipped": "已发货"
    },
    "orderStatus": {
      "cancelled": "已取消",
      "closed": "已关闭",
      "completed": "已完成",
      "confirmed": "已确认",
      "pending_confirmation": "待确认"
    },
    "paymentStatus": {
      "closed": "已关闭",
      "paid": "已支付",
      "pay_failed": "支付失败",
      "paying": "支付中",
      "refund_failed": "退款失败",
      "refunded": "已退款",
      "refunding": "退款中",
      "unpaid": "待支付"
    }
  },
  "termScenarios": {
    "ai": "AI 配的",
    "all": "全部订单",
    "cord": "选了穿绳",
    "custom_diy": "自己串的",
    "gift": "送礼",
    "safety_warning": "含需要注意的材料",
    "template": "按模板下单"
  },
  "termStatuses": {
    "disabled": "已停用",
    "draft": "草稿",
    "published": "已发布"
  },
  "termTypes": [
    "售前说明",
    "天然材料差异说明",
    "定制商品说明",
    "发货与物流说明",
    "退货退款说明",
    "售后服务说明"
  ],
  "version": "e55156f49d2f",
  "workOrderStatuses": {
    "pending": "待开始",
    "producing": "制作中",
    "qc_failed": "质检不通过",
    "qc_passed": "质检通过",
    "ready_to_ship": "待发货",
    "shipped": "已发货"
  },
  "workOrderSteps": [
    "待领料",
    "配珠排序",
    "穿制打结",
    "待质检",
    "已完工"
  ]
} as const;
export type CustomerStatusCode = keyof typeof CONTRACT.customerStatus;
export type OpsStatusCode = keyof typeof CONTRACT.opsStatus;
export type ActionCode = keyof typeof CONTRACT.actions;
