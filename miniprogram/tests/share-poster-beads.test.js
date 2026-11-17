const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
global.Page = () => {}
const { drawBead, drawPoster } = require('../pages/share/share')
const { materialOf, materialParams, cssPaint } = require('../components/bracelet/fallback')
const style = require('../components/bracelet/style')
function context() {
  const calls = []
  const gradient = () => { const stops = []; calls.push(stops); return { addColorStop(position, color) { stops.push([position, color]) } } }
  const ctx = { save() { calls.push('save') }, restore() { calls.push('restore') }, beginPath() {}, arc() {}, clip() { calls.push('clip') },
    translate() {}, rotate() { calls.push('rotate') }, scale() {}, fill() { calls.push('circle') }, setShadow() { calls.push('shadow') },
    drawImage(path) { calls.push(['image', path]) }, setFillStyle() {}, fillRect() { calls.push('fill') },
    setFontSize() {}, fillText(text, x, y) { calls.push(['text', text, x, y]) }, createCircularGradient: gradient, createLinearGradient: gradient }
  return { ctx, calls }
}

test('三类材质使用同一份不同参数，蜜蜡按通透类', () => {
  assert.equal(materialOf({ mat: 'crystal' }), 'translucent')
  assert.equal(materialOf({ mat: 'stone', name: '蜜蜡' }), 'translucent')
  assert.equal(materialOf({ mat: 'wood' }), 'matte')
  assert.equal(materialOf({ mat: 'metal', spacer: true }), 'metal')
  assert.equal(materialOf({}), 'matte')
  for (const mat of ['crystal', 'wood', 'metal']) {
    const bead = { mat, colors: ['#ffe2a0', '#9c6d22'] }
    const params = materialParams(bead, 'l')
    assert.equal(params.highlightAlpha, style.materials[materialOf(bead)].highlightAlpha)
    assert.match(cssPaint(bead.colors, params), /#ffe2a0/)
    const { ctx, calls } = context()
    drawBead(ctx, { r: 12, colors: bead.colors, bead }, '', 40, 40, params)
    assert.equal(calls.filter(call => call === 'fill').length, 4)
    assert.ok(calls.includes('shadow'))
  }
  assert.notEqual(style.materials.translucent.highlightAlpha, style.materials.matte.highlightAlpha)
  assert.ok(style.materials.metal.highlightAlpha > style.materials.translucent.highlightAlpha)
  assert.equal(materialParams({ mat: 'metal' }, 's').shadowAlpha, 0)
})

test('海报照片在圆形裁切后旋转绘制', () => {
  const { ctx, calls } = context()
  drawBead(ctx, { r: 12, colors: ['#fff', '#000'], rotate: 23 }, '/local/photo.png', 40, 40)
  assert.ok(calls.indexOf('clip') < calls.indexOf('rotate'))
  assert.ok(calls.indexOf('rotate') < calls.findIndex(call => Array.isArray(call) && call[0] === 'image'))
  assert.equal(calls.filter(call => call === 'fill').length, 0)
})

test('海报没有中央字标，有码和没码分别显示对应内容', () => {
  const base = { width: 350, height: 467, items: [], paths: [], design: { name: '好运连连' }, meaning: '好运常伴', day: new Date(2026, 10, 17) }
  const absent = context()
  drawPoster(absent.ctx, { ...base, qrPath: '' })
  const texts = absent.calls.filter(call => Array.isArray(call) && call[0] === 'text').map(call => call[1])
  assert.equal(absent.calls.filter(call => Array.isArray(call) && call[0] === 'text' && call[1] === '珠养养' && call[2] < 50).length, 1)
  assert.ok(texts.includes('微信搜索') && texts.includes('珠养养'))
  assert.ok(!texts.some(text => text.includes('你也来串一条')))
  assert.equal(absent.calls.filter(call => Array.isArray(call) && call[0] === 'image').length, 0)
  const present = context()
  drawPoster(present.ctx, { ...base, qrPath: '/local/code.png' })
  assert.ok(present.calls.some(call => Array.isArray(call) && call[0] === 'image' && call[1] === '/local/code.png'))
  assert.ok(present.calls.some(call => Array.isArray(call) && call[1] === '长按识别 串一条你的'))
  assert.ok(!present.calls.some(call => Array.isArray(call) && call[1] === '微信搜索'))
  const source = fs.readFileSync(path.join(__dirname, '../pages/share/share.js'), 'utf8')
  assert.doesNotMatch(source, /wordmark-line\.png/)
  assert.match(source, /destHeight:h\*2/)
})
