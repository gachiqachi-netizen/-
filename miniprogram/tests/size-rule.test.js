const test = require('node:test')
const assert = require('node:assert/strict')
const logic = require('../pages/editor/logic')

test('13–19cm wrist and common bead sizes follow the documented fit interval', () => {
  const knownDiscreteExceptions = new Map([['13/14', -6], ['16/12', -5]])
  for (let wrist = 13; wrist <= 19; wrist++) {
    for (const mm of [6, 8, 10, 12, 14]) {
      const catalog = [{id: 'main', name: '主珠', mm, price: 1, mat: 'stone'}]
      const ids = logic.fill([], catalog, wrist, 'main')
      const result = logic.stats(ids, catalog, wrist)
      const diff = result.length - result.target
      const key = `${wrist}/${mm}`
      if (knownDiscreteExceptions.has(key)) assert.equal(diff, knownDiscreteExceptions.get(key), key)
      else assert.ok(diff >= -4 && diff <= 6, `${key}: ${diff}mm`)
    }
  }
})

test('54 beads and above are treated as prayer-bead strands', () => {
  const catalog = [{id: 'main', name: '主珠', mm: 8, price: 1, mat: 'stone'}]
  assert.equal(logic.stats(Array(53).fill('main'), catalog, 15).fit, '超出约 259mm')
  assert.equal(logic.stats(Array(54).fill('main'), catalog, 15).fit, '多圈串长度请根据实际佩戴确认')
})

