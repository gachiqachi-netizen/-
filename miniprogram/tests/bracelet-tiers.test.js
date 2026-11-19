const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { layout, paint, style } = require('../components/bracelet/index')

const root = path.resolve(__dirname, '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const sample = Array.from({ length: 18 }, (_, i) => ({ id: String(i), mm: i % 3 ? 8 : 4, colors: ['#987654', '#123456'] }))

test('三档尺寸和参数来自同一份样式文件', () => {
  const fixture = require('../../server/tests/fixtures/bracelet_style.json')
  assert.deepEqual(style, fixture)
  assert.match(read('pages/share/share.js'), /components\/bracelet\/style\.js/)
  assert.deepEqual(style.tiers, { s: 144, m: 320, l: 560 })
  assert.equal(style.fillRatio, 0.88)
  assert.equal(style.small.outlineWidth, 0)
  assert.ok(style.small.beadScale > style.regular.beadScale)
  assert.match(paint(['#987654', '#123456'], style.small), /#987654/)
  assert.match(read('pages/share/share.js'), /materialParams\(items\[i\],'l'\)/)
  assert.match(read('pages/share/share.js'), /braceletStyle\.fillRatio/)
  assert.deepEqual(style.background, { s: 'transparent', m: 'transparent', l: 'var(--c-warm)', poster: '#f8f3e9', paper: '#ffffff' })
  assert.match(read('components/bracelet/index.js'), /style\.background\[p\.tier\]/)
  assert.match(read('styles/tokens.wxss'), /--c-warm: #f8f3e9/)
})

test('中大档仍走相切排布，居中落在容器 88% 区域', () => {
  for (const tier of ['m', 'l']) {
    const side = style.tiers[tier]
    const points = layout(sample, side, tier)
    assert.equal(points.length, sample.length)
    for (const point of points) {
      assert.ok(point.left >= 0 && point.top >= 0)
      assert.ok(point.left + point.d <= side && point.top + point.d <= side)
    }
    const center = point => [point.left + point.d / 2, point.top + point.d / 2]
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length]
      const [ax, ay] = center(a), [bx, by] = center(b)
      assert.ok(Math.abs(Math.hypot(ax - bx, ay - by) - (a.d + b.d) / 2) < 0.5)
    }
  }
})

test('记录页只传 tier，确认订单缩略图在紧凑容器内', () => {
  const files = [
    'pages/order/order.wxml', 'features/order-detail/order-detail.wxml', 'features/orders/orders.wxml',
    'pages/mine/mine.wxml', 'features/review/review.wxml', 'features/after-sale/detail.wxml',
    'pages/ai/ai.wxml', 'features/shared/shared.wxml', 'components/design-row/index.wxml',
    'components/cell/index.wxml'
  ]
  for (const file of files) {
    const content = read(file)
    assert.doesNotMatch(content, /<bracelet-thumb\b|<bracelet\b/)
    for (const tag of content.match(/<c-bracelet\b[^>]*>/g) || []) {
      assert.match(tag, /tier="(?:s|m|l)"/)
      assert.doesNotMatch(tag, /\bsize=/)
    }
  }
  assert.match(read('components/bracelet-thumb/index.wxml'), /<c-bracelet[^>]*tier="s"[^>]*size="\{\{sizeRpx\}\}"[^>]*center="\{\{true\}\}"/)
  assert.match(read('pages/order/order.wxss'), /\.bracelet \{ width: 128rpx; height: 128rpx;/)
})
