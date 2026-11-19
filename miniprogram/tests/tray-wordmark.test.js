const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const { wordmarkSize } = require('../components/bracelet/index.js')

test('wordmark component maps trayLg to 96rpx', () => {
  let component
  const previous = global.Component
  global.Component = definition => { component = definition }
  try { delete require.cache[require.resolve('../components/wordmark/index.js')]; require('../components/wordmark/index.js') }
  finally { global.Component = previous }
  let data
  component.observers['tone, size'].call({ setData: next => { data = next } }, 'text', 'trayLg')
  assert.equal(data.height, '96rpx')
  assert.equal(data.src, '/assets/brand/wordmark.svg')
})

test('wordmarkSize shrinks below the ring inner diameter', () => {
  const smallRing = [{ left: 125, top: 95, r: 10 }]
  assert.equal(wordmarkSize(smallRing, 320), 'corner')
  const smallInner = 2 * (Math.hypot(125 + 10 - 160, 95 + 10 - 160) - 10)
  assert.ok(28 * 259 / 128.3 <= smallInner)
  const largeRing = [{ left: 40, top: 225, r: 10 }]
  assert.equal(wordmarkSize(largeRing, 470), 'trayLg')
  const largeInner = 2 * (Math.hypot(40 + 10 - 235, 225 + 10 - 235) - 10)
  assert.ok(96 * 259 / 128.3 <= largeInner)
})

test('tray wordmarks use text tone and small tiers stay hidden', () => {
  assert.match(read('pages/diy/diy.wxml'), /empty-ring-wordmark[^>]*><c-wordmark tone="text" size="trayLg"/)
  assert.match(read('components/bracelet/index.wxml'), /tier !== 's' && tier !== 'm'/)
  assert.match(read('components/bracelet/index.wxml'), /<c-wordmark tone="text" size="{{wordmarkSize}}"/)
  assert.match(read('pages/diy/diy.wxss'), /\.empty-ring-wordmark\{opacity:\.32\}/)
  assert.match(read('components/bracelet/index.wxss'), /\.c-bracelet__wordmark\{[^}]*opacity:\.32\}/)
})
