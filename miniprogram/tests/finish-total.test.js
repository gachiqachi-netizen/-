const test = require('node:test')
const assert = require('node:assert/strict')
const { totalHand, shippingText, shipNote } = require('../pages/finish/total')

// 默认：收手工费 ¥15、运费 ¥8，满 ¥99 包邮
test('totalHand：默认收手工费，未满额收运费，满额包邮', () => {
  const pricing = { handworkFen: 1500, shippingFen: 800, freeShippingThresholdFen: 9900 }
  // 珠子 7000 + 手工费 1500 = 8500 < 9900，收运费 800
  assert.deepEqual(totalHand(7000, pricing), {
    handworkFen: 1500, subtotalFen: 8500, shippingFen: 800, payableFen: 9300,
  })
  // 珠子 10000 + 手工费 1500 = 11500 >= 9900，包邮
  assert.deepEqual(totalHand(10000, pricing), {
    handworkFen: 1500, subtotalFen: 11500, shippingFen: 0, payableFen: 11500,
  })
})

// 不收手工费：后台关闭手工费时接口返回 handworkFen = 0
test('totalHand：不收手工费（handworkFen 为 0）', () => {
  const pricing = { handworkFen: 0, shippingFen: 800, freeShippingThresholdFen: 9900 }
  assert.deepEqual(totalHand(7000, pricing), {
    handworkFen: 0, subtotalFen: 7000, shippingFen: 800, payableFen: 7800,
  })
})

// 不包邮：freeShippingThresholdFen 为 null，无论金额多少都收运费
test('totalHand：不包邮（freeShippingThresholdFen 为 null）恒收运费', () => {
  const pricing = { handworkFen: 1500, shippingFen: 800, freeShippingThresholdFen: null }
  // 即使 subtotal 超过默认的 9900 也收运费
  assert.deepEqual(totalHand(10000, pricing), {
    handworkFen: 1500, subtotalFen: 11500, shippingFen: 800, payableFen: 12300,
  })
})

// 配送行文案：三种情况
test('shippingText：有门槛写「运费+满额包邮」，null 只写运费，运费 0 写包邮', () => {
  assert.equal(shippingText(800, 9900), '运费 ¥8，满 ¥99 包邮')
  assert.equal(shippingText(800, null), '运费 ¥8')
  assert.equal(shippingText(0, 9900), '包邮')
})

// 尺寸弹层小字：有门槛且收运费写满额包邮，其余空串
test('shipNote：有门槛且收运费写满额包邮，包邮或不包邮时空串', () => {
  assert.equal(shipNote(800, 9900), '满 ¥99 包邮')
  assert.equal(shipNote(800, null), '')
  assert.equal(shipNote(0, 9900), '')
})
