const test = require('node:test')
const assert = require('node:assert/strict')
const logic = require('../pages/editor/logic')
const { fitText, meterPos } = require('../utils/fit-text')

// 手围 15cm、全 8mm 珠子：target = 150 + max(8, 2.5*8-5) = 165mm
const catalog = [{ id: 'm8', name: '主珠', mm: 8, price: 1, mat: 'stone' }]
const statsOf = n => logic.stats(Array(n).fill('m8'), catalog, 15)

test('21 颗 8mm 珠（差 +3mm）显示“刚好合适”', () => {
  const s = statsOf(21)
  assert.equal(s.length - s.target, 3)
  assert.deepEqual(fitText(s, 21), { word: '刚好合适', state: 'ok', short: '合适' })
})

test('20 颗 8mm 珠（差 -5mm）显示“还差约 5mm”', () => {
  const s = statsOf(20)
  assert.equal(s.length - s.target, -5)
  assert.deepEqual(fitText(s, 20), { word: '还差约 5mm', state: 'short', mm: 5 })
})

test('22 颗 8mm 珠（差 +11mm）显示“超出约 11mm”', () => {
  const s = statsOf(22)
  assert.equal(s.length - s.target, 11)
  assert.deepEqual(fitText(s, 22), { word: '超出约 11mm', state: 'long', mm: 11 })
})

test('54 颗起算多圈串，只看颗数不看差值', () => {
  const s = statsOf(54)
  assert.notEqual(s.length - s.target, 0)
  assert.deepEqual(fitText(s, 54), { word: '多圈串', state: 'multi' })
})

test('量尺位置：合适区间映射 43%–60%，两端夹在 2%–98%', () => {
  const at = (target, length) => meterPos({ length, target })
  assert.equal(at(165, 161), 43)   // length = target - 4 → 43%
  assert.equal(at(165, 171), 60)   // length = target + 6 → 60%
  const mid = meterPos(statsOf(21)) // 差 +3mm，落在区间内
  assert.ok(mid > 43 && mid < 60, `mid=${mid}`)
  assert.equal(at(1000, 0), 2)     // 短到出界夹在 2%
  assert.equal(at(0, 1000), 98)    // 长出界夹在 98%
})
