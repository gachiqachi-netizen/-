// C2：订单状态只显示后端给的 customerStatus / progress / allowedActions，前端不推算。
const test = require('node:test')
const assert = require('node:assert/strict')

const orderState = require('../utils/order-state')
const contract = require('../utils/contract')

function order(cs, extra) {
  return Object.assign({ no: 'T-1', customerStatus: cs }, extra || {})
}

const PAID_PROGRESS = {
  show: true,
  steps: [
    { key: 'ordered', label: '下单', at: 1, done: true },
    { key: 'producing', label: '制作', at: 2, done: true },
    { key: 'shipping', label: '运输', at: null, done: false },
    { key: 'delivered', label: '签收', at: null, done: false },
  ],
}

test('待支付：文字和主按钮来自 customerStatus，动作中文来自 contract.js', () => {
  const v = orderState.view(order(
    { code: 'pending_payment', label: '待支付', tone: 'attention', desc: '还没付款，订单已为你保留。', primaryAction: 'pay_order' },
    { allowedActions: ['pay_order', 'cancel_order', 'reorder'], progress: { show: true, steps: PAID_PROGRESS.steps } }
  ))
  assert.equal(v.label, '待支付')
  assert.equal(v.desc, '还没付款，订单已为你保留。')
  assert.equal(v.tone, 'attention')
  assert.equal(v.primaryAction, 'pay_order')
  assert.deepEqual(v.actions.map(a => a.code), ['pay_order', 'cancel_order', 'reorder'])
  assert.equal(v.actions[0].label, contract.actions.pay_order)
  assert.equal(v.actions[0].style, 'primary')
  assert.equal(v.actions[1].label, contract.actions.cancel_order)
  assert.equal(v.actions[1].style, 'secondary')
  assert.equal(v.progress.show, true)
  assert.equal(v.progress.steps.length, 4)
})

test('制作中：后端给什么显示什么', () => {
  const v = orderState.view(order(
    { code: 'producing', label: '制作中', tone: 'normal', desc: '师傅正在串你的手串。', primaryAction: null },
    { allowedActions: ['reorder'], progress: PAID_PROGRESS }
  ))
  assert.equal(v.label, '制作中')
  assert.equal(v.primaryAction, null)
  assert.equal(v.actions.length, 1)
  assert.equal(v.progress.steps[1].done, true)
})

test('已签收：确认收货是主按钮', () => {
  const v = orderState.view(order(
    { code: 'delivered', label: '已签收', tone: 'attention', desc: '快递显示已签收，确认没问题就点确认收货。', primaryAction: 'confirm_receipt' },
    { allowedActions: ['confirm_receipt', 'view_logistics', 'request_after_sale', 'reorder'] }
  ))
  assert.equal(v.primaryAction, 'confirm_receipt')
  const confirm = v.actions.find(a => a.code === 'confirm_receipt')
  assert.equal(confirm.style, 'primary')
  const logistics = v.actions.find(a => a.code === 'view_logistics')
  assert.equal(logistics.label, contract.actions.view_logistics)
})

test('退款中：原样显示，不推算', () => {
  const v = orderState.view(order(
    { code: 'refunding', label: '退款中', tone: 'danger', desc: '钱正在原路退回。', primaryAction: null },
    { allowedActions: [] }
  ))
  assert.equal(v.label, '退款中')
  assert.equal(v.tone, 'danger')
  assert.deepEqual(v.actions, [])
})

test('售后处理中', () => {
  const v = orderState.view(order(
    { code: 'after_sale_open', label: '售后处理中', tone: 'attention', desc: '售后正在处理，有进展会通知你。', primaryAction: null },
    { allowedActions: ['view_logistics'] }
  ))
  assert.equal(v.label, '售后处理中')
  assert.equal(v.actions[0].label, contract.actions.view_logistics)
})

test('旧订单没有 customerStatus：兜底，不再自己推算', () => {
  const v = orderState.view({
    no: 'OLD-1',
    orderStatus: 'cancelled', paymentStatus: 'refunded',
    fulfillmentStatus: 'shipped', logisticsStatus: 'delivered', afterSaleStatus: 'none',
    allowedActions: ['reorder'],
  })
  assert.equal(v.label, '订单正在处理')
  assert.equal(v.desc, '')
  assert.equal(v.tone, 'normal')
  assert.equal(v.primaryAction, null)
  assert.equal(v.progress.show, false)
  assert.deepEqual(v.actions, [])
})

test('customerStatus 不是对象也走兜底', () => {
  const v = orderState.view({ no: 'OLD-2', customerStatus: null })
  assert.equal(v.label, '订单正在处理')
})

test('decorate 兼容层：从 view() 映射，不含五组明细', () => {
  const d = orderState.decorate(order(
    { code: 'completed', label: '已完成', tone: 'normal', desc: '戴得开心。', primaryAction: 'reorder' },
    { allowedActions: ['reorder'], no: 'T-9' }
  ))
  assert.equal(d.no, 'T-9')
  assert.equal(d.stateView.label, '已完成')
  assert.equal(d.stateView.tone, 'normal')
  assert.equal(d.stateView.description, '戴得开心。')
  assert.deepEqual(d.stateView.states, [])
  assert.equal(d.actionViews.length, 1)
  assert.equal(d.actionViews[0].label, contract.actions.reorder)
})
