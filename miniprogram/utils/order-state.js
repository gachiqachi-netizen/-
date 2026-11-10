const GROUPS = [
  { key: 'order', field: 'orderStatus', label: '订单' },
  { key: 'payment', field: 'paymentStatus', label: '支付' },
  { key: 'fulfillment', field: 'fulfillmentStatus', label: '制作履约' },
  { key: 'logistics', field: 'logisticsStatus', label: '物流' },
  { key: 'afterSale', field: 'afterSaleStatus', label: '售后' },
]

const STATUS = {
  order: {
    pending_confirmation: ['待确认', 'pending'], confirmed: ['已确认', 'success'],
    cancelled: ['已取消', 'muted'], completed: ['已完成', 'success'], closed: ['已关闭', 'muted'],
  },
  payment: {
    unpaid: ['待支付', 'pending'], paying: ['支付处理中', 'pending'], paid: ['已支付', 'success'],
    pay_failed: ['支付失败', 'danger'], refunding: ['退款处理中', 'warning'], refunded: ['已退款', 'muted'],
    refund_failed: ['退款失败', 'danger'], closed: ['支付已关闭', 'muted'],
  },
  fulfillment: {
    unfulfilled: ['待制作', 'pending'], producing: ['制作中', 'pending'], ready_to_ship: ['待发货', 'success'],
    shipped: ['已发货', 'success'], delivered: ['已送达', 'success'], exception: ['履约异常', 'danger'],
    returned: ['已退回', 'muted'],
  },
  logistics: {
    not_shipped: ['未发货', 'muted'], shipped: ['已发货', 'success'], in_transit: ['运输中', 'pending'],
    delivered: ['已签收', 'success'], exception: ['物流异常', 'danger'], returned: ['已退回', 'muted'],
  },
  afterSale: {
    none: ['无售后', 'muted'], requested: ['售后已申请', 'warning'], reviewing: ['售后审核中', 'warning'],
    approved: ['售后已通过', 'warning'], rejected: ['售后未通过', 'danger'], returning: ['退回中', 'warning'],
    refunding: ['退款处理中', 'warning'], completed: ['售后已完成', 'success'], closed: ['售后已关闭', 'muted'],
  },
}

const ACTIONS = {
  cancel_order: { code: 'cancel_order', label: '取消订单', style: 'secondary' },
  confirm_receipt: { code: 'confirm_receipt', label: '确认收货', style: 'primary' },
  reorder: { code: 'reorder', label: '按这款再买', style: 'secondary' },
  view_logistics: { code: 'view_logistics', label: '查看物流', style: 'secondary' },
}

function valueOf(order, group) {
  const descriptor = GROUPS.find(item => item.key === group)
  const state = order && order.state || {}
  let raw = state[group]
  if (raw === undefined && group === 'afterSale') raw = state.after_sale
  if (raw && typeof raw === 'object') return { code: raw.code || '', label: raw.label || '' }
  if (typeof raw === 'string') return { code: raw, label: '' }
  raw = order && descriptor && order[descriptor.field]
  return { code: typeof raw === 'string' ? raw : '', label: '' }
}

function statusView(group, code, apiLabel) {
  const known = STATUS[group] && STATUS[group][code]
  return { code, label: apiLabel || (known ? known[0] : code || '未知'), tone: known ? known[1] : 'muted' }
}

function primaryState(states) {
  const by = key => states.find(item => item.key === key)
  const after = by('afterSale')
  if (after && !['', 'none', 'closed'].includes(after.code)) {
    return { label: after.label, tone: after.tone, description: '订单正在处理售后，请留意处理进度。' }
  }
  const order = by('order'), payment = by('payment'), fulfillment = by('fulfillment'), logistics = by('logistics')
  if (order && ['cancelled', 'closed'].includes(order.code)) return { label: order.label, tone: 'muted', description: '订单已结束。' }
  if (payment && ['refunding', 'refunded', 'refund_failed'].includes(payment.code)) return { label: payment.label, tone: payment.tone, description: '退款进度以订单详情为准。' }
  if (order && order.code === 'completed') return { label: order.label, tone: 'success', description: '订单已完成，感谢你的选择。' }
  if (logistics && ['shipped', 'in_transit', 'delivered', 'exception', 'returned'].includes(logistics.code)) {
    return { label: logistics.label, tone: logistics.tone, description: logistics.code === 'exception' ? '物流出现异常，请查看详情。' : '可在订单详情查看物流进度。' }
  }
  if (fulfillment && ['producing', 'ready_to_ship', 'shipped', 'delivered', 'exception'].includes(fulfillment.code)) {
    return { label: fulfillment.label, tone: fulfillment.tone, description: fulfillment.code === 'exception' ? '订单履约出现异常，请查看详情。' : '手串正在按订单进度处理。' }
  }
  if (payment && payment.code && payment.code !== 'paid') return { label: payment.label, tone: payment.tone, description: payment.code === 'unpaid' ? '付款后才会进入制作流程。' : '请留意支付状态。' }
  if (order && order.code) return { label: order.label, tone: order.tone, description: '订单状态已更新。' }
  return { label: (order && order.code && order.label) || '订单处理中', tone: 'muted', description: '请进入详情查看订单进度。' }
}

function actionView(action) {
  const code = typeof action === 'string' ? action : action && action.code
  if (!code || !ACTIONS[code]) return null
  return Object.assign({}, ACTIONS[code], typeof action === 'object' ? action : {}, { code })
}

function decorate(order) {
  const source = order || {}
  const states = GROUPS.map(group => {
    const value = valueOf(source, group.key)
    return Object.assign({ key: group.key, groupLabel: group.label }, statusView(group.key, value.code, value.label))
  })
  const stateView = Object.assign(primaryState(states), { states })
  const allowed = Array.isArray(source.allowedActions) ? source.allowedActions : []
  const actionViews = allowed.map(actionView).filter(Boolean)
  return Object.assign({}, source, { stateView, actionViews })
}

module.exports = { decorate, actionView }
