const test = require('node:test')
const assert = require('node:assert/strict')
const { layout, angleDelta } = require('../utils/bracelet-layout')
const { layout: componentLayout } = require('../components/bracelet/index')

const beads = count => Array.from({ length: count }, (_, i) => ({ id: String(i), mm: 8 }))

test('1、2、5 颗及刚好一圈保持同一像素直径，空弧保留', () => {
  const samples = [1, 2, 5, 20].map(count => layout(beads(count), 470, 160))
  for (const points of samples) assert.ok(Math.abs(points[0].r - samples[0][0].r) < 1e-9)
  assert.ok(samples.slice(0, 3).every(points => points[0].open))
  assert.equal(samples[3][0].open, false)
  assert.ok(samples[3][19].rotate < 360)
})

test('超过一圈时放大半径，整体只缩放一次', () => {
  const full = layout(beads(20), 470, 160)
  const over = layout(beads(30), 470, 160)
  assert.ok(over[0].circleRadius > full[0].circleRadius)
  assert.ok(over[0].r < full[0].r)
  assert.ok(over.every(point => point.x - point.r >= 0 && point.x + point.r <= 470))
})

test('旋转 90 度，跨过正负 π 不跳，珠序不变', () => {
  const before = layout(beads(5), 470, 160)
  const after = layout(beads(5), 470, 160, Math.PI / 2)
  assert.ok(Math.abs(after[0].x - 470 / 2 - before[0].circleRadius) < 1e-8)
  assert.deepEqual(after.map(point => point.index), before.map(point => point.index))
  assert.ok(Math.abs(angleDelta(Math.PI - .01, -Math.PI + .01) - .02) < 1e-8)
  assert.ok(Math.abs(angleDelta(-Math.PI + .01, Math.PI - .01) + .02) < 1e-8)
})

test('缩略图和海报不传手围时仍用原布局', () => {
  const items = beads(5)
  assert.deepEqual(componentLayout(items, 144, 's'), componentLayout(items, 144, 's', 40))
  assert.deepEqual(layout(items, 144), layout(items, 144, undefined))
})
