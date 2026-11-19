const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { layout: rawLayout, centerInFrame } = require('../utils/bracelet-layout')
const { layout: componentLayout, style } = require('../components/bracelet/index')

function bounds(points, radius = point => point.r) {
  return {
    left: Math.min(...points.map(p => p.x - radius(p))),
    right: Math.max(...points.map(p => p.x + radius(p))),
    top: Math.min(...points.map(p => p.y - radius(p))),
    bottom: Math.max(...points.map(p => p.y + radius(p))),
  }
}
function assertCentered(points, size, radius = point => point.r) {
  const box = bounds(points, radius)
  assert.ok(Math.abs((box.left + box.right) / 2 - size / 2) <= 1)
  assert.ok(Math.abs((box.top + box.bottom) / 2 - size / 2) <= 1)
  assert.ok(box.right - box.left <= size * .88 + 1e-8)
  assert.ok(box.bottom - box.top <= size * .88 + 1e-8)
}

test('single large pendant, disparate bead sizes, and open ring all center by visible bounds', () => {
  const cases = [
    [{ mm: 30 }],
    [{ mm: 16 }, { mm: 3 }, { mm: 2 }, { mm: 8 }, { mm: 4 }],
    [{ mm: 12 }, { mm: 5 }],
  ]
  for (const beads of cases) assertCentered(centerInFrame(rawLayout(beads, 144), 144), 144)
  assertCentered(centerInFrame([{ x: -20, y: 40, r: 100 }], 144), 144)
})

test('center defaults off, thumbnail center aligns rendered bounds, and workbench path stays unchanged', () => {
  const beads = [{ mm: 16 }, { mm: 3 }, { mm: 2 }, { mm: 8 }, { mm: 4 }]
  const size = style.tiers.s, drawSize = size * style.fillRatio, offset = (size - drawSize) / 2
  const raw = rawLayout(beads, drawSize)
  const unchanged = componentLayout(beads, size, 's')
  raw.forEach((point, i) => {
    const diameter = point.r * 2 * style.small.beadScale
    assert.equal(unchanged[i].x, point.x + offset - diameter / 2)
    assert.equal(unchanged[i].y, point.y + offset - diameter / 2)
    assert.equal(unchanged[i].d, diameter)
  })
  const centered = componentLayout(beads, size, 's', undefined, 0, true)
  assertCentered(centered.map(point => ({ x: point.left + point.d / 2, y: point.top + point.d / 2, r: point.d / 2 })), size)
  assert.deepEqual(componentLayout(beads, 470, '', 160, 0, true), componentLayout(beads, 470, '', 160, 0, false))
})

test('only bracelet-thumb requests centering and home card art stays square', () => {
  const root = path.join(__dirname, '..')
  const thumb = fs.readFileSync(path.join(root, 'components/bracelet-thumb/index.wxml'), 'utf8')
  const home = fs.readFileSync(path.join(root, 'pages/home/home.wxss'), 'utf8')
  assert.match(thumb, /<c-bracelet[^>]*center="\{\{true\}\}"/)
  assert.match(home, /\.traybox\{[^}]*aspect-ratio:1\/1/)
})
