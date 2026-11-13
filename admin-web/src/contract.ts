// 自动生成：python3 tools/export_contract.py，不要手改
export const CONTRACT = {
  "actions": {
    "cancel_order": "取消订单",
    "confirm_receipt": "确认收货",
    "edit_address": "修改地址",
    "pay_order": "去支付",
    "reorder": "按这款再串一条",
    "request_after_sale": "申请售后",
    "view_logistics": "查看物流",
    "write_review": "写评价"
  },
  "afterSaleReasons": {
    "仅退款": [
      "不想要了",
      "拍错了，想重新设计",
      "等太久了",
      "其他"
    ],
    "拒收后退款": [
      "不想要了",
      "物流太慢",
      "其他"
    ],
    "改手围重串": [
      "戴着太紧",
      "戴着太松"
    ],
    "补寄配件": [
      "少件或漏发",
      "掉珠或断线",
      "其他"
    ],
    "退货退款": [
      "珠子有裂纹或瑕疵",
      "和图片不一样",
      "掉珠或断线",
      "其他"
    ]
  },
  "afterSaleTypes": [
    "仅退款",
    "退货退款",
    "补寄配件",
    "改手围重串",
    "拒收后退款"
  ],
  "bannedWords": [
    "七大功效",
    "六字真言",
    "情绪稳定",
    "时来运转",
    "水晶之王",
    "爱情之石",
    "五行补",
    "保健康",
    "保平安",
    "助专心",
    "增记忆",
    "守护神",
    "护身符",
    "招人缘",
    "招桃花",
    "招贵人",
    "旺事业",
    "旺人缘",
    "本命佛",
    "桃花运",
    "消磁石",
    "能量石",
    "负能量",
    "防小人",
    "防辐射",
    "降血压",
    "保佑",
    "修法",
    "修行",
    "免疫",
    "养生",
    "养颜",
    "净化",
    "减压",
    "加持",
    "助眠",
    "化煞",
    "安神",
    "开光",
    "开运",
    "护身",
    "招财",
    "持咒",
    "挡煞",
    "排毒",
    "旺财",
    "旺运",
    "桃花",
    "气场",
    "治愈",
    "治疗",
    "活血",
    "消业",
    "消磁",
    "灌顶",
    "疗愈",
    "磁场",
    "聚财",
    "能量",
    "脉轮",
    "财神",
    "财运",
    "转运",
    "辟邪",
    "运势",
    "进财",
    "避邪",
    "释压",
    "镇宅",
    "风水",
    "鸿运"
  ],
  "cancelReasons": [
    "不想要了",
    "拍错了，想重新设计",
    "地址填错了",
    "其他"
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
  "reviewStatuses": {
    "machine_failed": "机审未通过",
    "pending": "待审核",
    "published": "已发布",
    "rejected": "审核未通过",
    "taken_down": "已下架"
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
    "售后服务说明",
    "用户协议",
    "隐私政策"
  ],
  "version": "c1d6f8ea0627",
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
