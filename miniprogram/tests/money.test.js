const test = require('node:test')
const assert = require('node:assert/strict')
const { yuan, toHand } = require('../utils/money')

test('yuan：整数元不带小数，有零头带两位', () => {
  assert.equal(yuan(10000), '¥100')
  assert.equal(yuan(10050), '¥100.50')
  assert.equal(yuan(5), '¥0.05')
  assert.equal(yuan(0), '¥0')
  assert.equal(yuan(9900), '¥99')
})

test('yuan：分不是整数时抛错', () => {
  assert.throws(() => yuan(100.5), /integer/)
  assert.throws(() => yuan('10000'), /integer/)
  assert.throws(() => yuan(NaN), /integer/)
})

test('toHand：payableFen 优先，其次 totalFen', () => {
  assert.equal(toHand({ goodsFen: 9200, shippingFen: 800, payableFen: 10000 }), 10000)
  assert.equal(toHand({ goodsFen: 9200, shippingFen: 800, totalFen: 10000 }), 10000)
  assert.equal(toHand({ payableFen: 0 }), 0)
})

test('toHand：两个字段都没有时抛错，不做加法', () => {
  assert.throws(() => toHand({ goodsFen: 9200, shippingFen: 800 }), /payableFen/)
  assert.throws(() => toHand({}), /payableFen/)
  assert.throws(() => toHand(null), /required/)
})
