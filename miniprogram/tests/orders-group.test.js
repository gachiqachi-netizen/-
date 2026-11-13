// C8b 我的订单分栏归类的用例（事实来源：04 第 13 节 + contract.CUSTOMER_STATUS）
const test = require('node:test')
const assert = require('node:assert/strict')
const group = require('../features/orders/group')

test('待收货 = 运输中 + 已签收（含物流问题）', () => {
  assert.equal(group.tabOf('in_transit'), 'shipping')
  assert.equal(group.tabOf('delivered'), 'shipping')
  assert.equal(group.tabOf('logistics_issue'), 'shipping')
})

test('待支付 / 制作中 / 售后归类', () => {
  assert.equal(group.tabOf('pending_payment'), 'pending_payment')
  assert.equal(group.tabOf('producing'), 'making')
  assert.equal(group.tabOf('ready_to_ship'), 'making')
  assert.equal(group.tabOf('processing'), 'making')
  assert.equal(group.tabOf('after_sale_open'), 'after_sale')
  assert.equal(group.tabOf('after_sale_done'), 'after_sale')
  assert.equal(group.tabOf('after_sale_rejected'), 'after_sale')
  assert.equal(group.tabOf('refunding'), 'after_sale')
  assert.equal(group.tabOf('refunded'), 'after_sale')
  assert.equal(group.tabOf('refund_failed'), 'after_sale')
})

test('已完成和已取消不属于任何分栏（只出现在全部）', () => {
  assert.equal(group.tabOf('completed'), '')
  assert.equal(group.tabOf('cancelled'), '')
})

test('countsOf 统计每个分栏，rowsInTab 过滤', () => {
  const rows = [
    { code: 'delivered' },
    { code: 'in_transit' },
    { code: 'pending_payment' },
    { code: 'completed' },
    { code: 'after_sale_open' },
  ]
  const counts = group.countsOf(rows)
  assert.equal(counts.all, 5)
  assert.equal(counts.shipping, 2)
  assert.equal(counts.pending_payment, 1)
  assert.equal(counts.making, 0)
  assert.equal(counts.after_sale, 1)
  assert.equal(group.rowsInTab(rows, 'all').length, 5)
  assert.equal(group.rowsInTab(rows, 'shipping').length, 2)
  assert.equal(group.rowsInTab(rows, 'making').length, 0)
})

test('五个分栏顺序固定', () => {
  assert.deepEqual(group.TABS.map(t => t.key), ['all', 'pending_payment', 'making', 'shipping', 'after_sale'])
  assert.deepEqual(group.TABS.map(t => t.label), ['全部', '待支付', '制作中', '待收货', '售后'])
})
