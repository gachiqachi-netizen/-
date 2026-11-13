const { test } = require('node:test')
const assert = require('node:assert/strict')
const { pickTryonDesign } = require('../features/tryon/selection')

test('tryon uses the current design when it has beads', () => {
  const current = { name: '最近看过', beads: ['a'] }
  assert.equal(pickTryonDesign(current, [{ name: '本机作品', beads: ['b'] }], [{ name: '热门款', beads: ['c'] }]), current)
})

test('tryon uses the most recent saved work when current is empty', () => {
  const recent = { name: '最近作品', beads: ['b'] }
  assert.equal(pickTryonDesign({ beads: [] }, [{ name: '空作品', beads: [] }, recent], [{ name: '热门款', beads: ['c'] }]), recent)
})

test('tryon uses the first popular design when current and saved work are empty', () => {
  const popular = { name: '热门款', beads: ['c'] }
  assert.equal(pickTryonDesign(null, [], [popular]), popular)
})
