// 任务卡 C0h：bracelet 组件排珠算法 layout() 是纯函数（components/bracelet/index.js 导出）。
// 规则照 docs/design/mockups-final.html 的 ring()：珠径 = mm/总mm × 圆周，所有珠子刚好排满一圈。
const test = require('node:test')
const assert = require('node:assert/strict')
const { layout } = require('../components/bracelet/index')

const BEADS = [
  { id: 'a', mm: 8, c: ['#111111', '#000000'] },
  { id: 'b', mm: 8, c: ['#222222', '#000000'] },
  { id: 'c', mm: 10, c: ['#333333', '#000000'] },
]

test('珠子直径按 mm 占比分圆周，10mm 的珠子比 8mm 的大，整圈相切排满', () => {
  const items = layout(BEADS, 400)
  assert.equal(items.length, 3)
  assert.ok(items[2].d > items[0].d, `10mm 应大于 8mm：${items[2].d} vs ${items[0].d}`)
  // 相切排满一圈：珠径之和 = 圆心圆周的周长 2π·rc
  const rc = Math.hypot(items[0].x + items[0].box / 2 - 200, items[0].y + items[0].box / 2 - 200)
  const sum = items.reduce((s, it) => s + it.d, 0)
  assert.ok(Math.abs(sum - 2 * Math.PI * rc) < 6, `珠径和应接近 2π·rc：${sum} vs ${Math.round(2 * Math.PI * rc)}`)
  // 最大珠的外沿贴着圆环边缘
  assert.ok(Math.abs(rc + items[2].d / 2 - 200) <= 2, `最大珠外沿应贴边：${rc + items[2].d / 2}`)
})

test('同 mm 的珠子直径相同，位置都在圆环上（到圆心距离一致）', () => {
  const items = layout(BEADS, 400)
  const dist = it => Math.hypot(it.x + it.box / 2 - 200, it.y + it.box / 2 - 200)
  assert.equal(items[0].d, items[1].d)
  // 同 mm ⇒ 中心圆半径相同（允许取整误差 2rpx）
  assert.ok(Math.abs(dist(items[0]) - dist(items[1])) <= 2)
  // 任意一颗都不飞出圆环
  for (const it of items) {
    assert.ok(dist(it) + it.d / 2 <= 200 + 2, `珠子 ${it.index} 超出圆环`)
  }
})

test('空数组 / 没有 size 返回空，缺 mm 的珠子被跳过', () => {
  assert.deepEqual(layout([], 400), [])
  assert.deepEqual(layout(BEADS, 0), [])
  assert.deepEqual(layout(null, 400), [])
  const items = layout([{ id: 'x' }, BEADS[0]], 400)
  assert.equal(items.length, 1)
  assert.equal(items[0].bead.id, 'a')
})
