const test = require('node:test')
const assert = require('node:assert/strict')
const { decorate, actionView } = require('../utils/order-state')

test('售后状态优先成为订单主状态', () => {
  const row = decorate({
    state: {
      order: { code: 'confirmed', label: '订单已确认' }, payment: { code: 'paid' },
      fulfillment: { code: 'shipped' }, logistics: { code: 'in_transit' }, afterSale: { code: 'reviewing' },
    },
    allowedActions: ['view_logistics', 'reorder'],
  })
  assert.equal(row.stateView.label, '售后审核中')
  assert.equal(row.stateView.tone, 'warning')
  assert.deepEqual(row.actionViews.map(item => item.code), ['view_logistics', 'reorder'])
})

test('物流异常优先于普通履约状态', () => {
  const row = decorate({ state: {
    order: 'confirmed', payment: 'paid', fulfillment: 'shipped', logistics: 'exception', afterSale: 'none',
  } })
  assert.equal(row.stateView.label, '物流异常')
  assert.equal(row.stateView.tone, 'danger')
})

test('兼容旧订单的五组状态字段', () => {
  const row = decorate({
    orderStatus: 'pending_confirmation', paymentStatus: 'unpaid', fulfillmentStatus: 'unfulfilled',
    logisticsStatus: 'not_shipped', afterSaleStatus: 'none', allowedActions: ['cancel_order'],
  })
  assert.equal(row.stateView.label, '待支付')
  assert.equal(row.stateView.description, '付款后才会进入制作流程。')
  assert.equal(row.stateView.states[0].label, '待确认')
  assert.equal(row.actionViews[0].label, '取消订单')
})

test('服务端标签优先于本地标签且保留本地语气', () => {
  const row = decorate({ state: { order: { code: 'completed', label: '交易完成' } } })
  assert.equal(row.stateView.label, '交易完成')
  assert.equal(row.stateView.tone, 'success')
})

test('动作映射覆盖订单页面需要的动作', () => {
  assert.deepEqual(actionView('confirm_receipt'), { code: 'confirm_receipt', label: '确认收货', style: 'primary' })
  assert.equal(actionView('reorder').label, '按这款再买')
  assert.equal(actionView('view_logistics').label, '查看物流')
  assert.equal(actionView('unknown_action'), null)
})

test('缺失状态时安全降级，不制造可执行按钮', () => {
  const row = decorate({ status: '旧状态', allowedActions: ['unknown_action'] })
  assert.equal(row.stateView.label, '订单处理中')
  assert.equal(row.stateView.tone, 'muted')
  assert.deepEqual(row.actionViews, [])
})
