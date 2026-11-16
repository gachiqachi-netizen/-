const test = require('node:test')
const assert = require('node:assert/strict')
const cases = require('../../server/tests/fixtures/bracelet_layout_cases.json')
const { layout } = require('../utils/bracelet-layout')

function sequenceOf(item) {
  return Array.from({ length: item.repeat }, () => item.sequence).flat()
}

test('十三组共用用例都按珠序从正上方顺时针排在容器内', () => {
  assert.equal(cases.length, 13)
  for (const item of cases) {
    const sequence = sequenceOf(item)
    const result = layout(sequence, item.size)
    assert.equal(result.length, sequence.length, item.name)
    assert.equal(result[0].index, 1, item.name)
    assert.ok(Math.abs(result[0].x - item.size / 2) < 1e-8, item.name)
    assert.ok(result[0].y < item.size / 2, item.name)
    for (let i = 0; i < result.length; i++) {
      const bead = result[i]
      assert.equal(bead.index, i + 1, item.name)
      assert.ok(bead.x - bead.r >= -1e-8 && bead.x + bead.r <= item.size + 1e-8, item.name)
      assert.ok(bead.y - bead.r >= -1e-8 && bead.y + bead.r <= item.size + 1e-8, item.name)
      assert.equal(bead.photo, sequence[i].photo || null, item.name)
      assert.deepEqual(bead.colors, sequence[i].colors || [null, null], item.name)
      if (i) assert.ok(bead.rotate > result[i - 1].rotate, item.name)
    }
    if (result.length > 1) assert.ok(result[result.length - 1].rotate < 360, item.name)
  }
})

test('隔珠半径按毫米数缩小，80 颗和单颗边界可用', () => {
  const pair = layout([{ mm: 12 }, { mm: 2, spacer: true }], 80)
  assert.ok(Math.abs(pair[0].r / pair[1].r - 6) < 1e-10)
  assert.equal(layout([{ mm: 8 }], 80).length, 1)
  assert.equal(layout(Array.from({ length: 80 }, () => ({ mm: 8 })), 80).length, 80)
})

test('大小珠混排圆心同圆、首尾相切且任意两颗不重叠', () => {
  for (const item of cases.filter(row => row.name.endsWith('-tangent'))) {
    const beads = layout(sequenceOf(item), item.size)
    const center = item.size / 2
    const radius = Math.hypot(beads[0].x - center, beads[0].y - center)
    for (let i = 0; i < beads.length; i++) {
      const a = beads[i]
      assert.ok(Math.abs(Math.hypot(a.x - center, a.y - center) - radius) < 0.01, item.name)
      for (let j = i + 1; j < beads.length; j++) {
        const b = beads[j]
        const distance = Math.hypot(a.x - b.x, a.y - b.y)
        assert.ok(distance + 0.5 >= a.r + b.r, `${item.name}: ${i + 1}/${j + 1} overlap`)
      }
      const next = beads[(i + 1) % beads.length]
      const distance = Math.hypot(a.x - next.x, a.y - next.y)
      assert.ok(Math.abs(distance - a.r - next.r) <= 0.01, `${item.name}: ${i + 1} tangent`)
    }
  }
})
