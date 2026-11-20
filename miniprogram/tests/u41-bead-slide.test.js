const test = require('node:test')
const assert = require('node:assert/strict')
let spec
global.Component = value => { spec = value }
global.wx = { getSystemInfoSync: () => ({ reduceMotion: false }) }
const { clockwiseFrames } = require('../components/bracelet/index')

test('从六点钟顺时针滑入，跨过零角不倒退', () => {
  const frames = clockwiseFrames({ x: 100, y: 50, d: 20 }, 200)
  let previous = Math.PI / 2
  for (const frame of frames) {
    const x = parseFloat(frame.left) + 10 - 100
    const y = parseFloat(frame.top) + 10 - 100
    let angle = Math.atan2(y, x)
    while (angle < previous - 0.001) angle += 2 * Math.PI
    assert.ok(angle >= previous - 0.001)
    previous = angle
  }
  assert.ok(Math.abs(previous - 3 * Math.PI / 2) < 0.001)
  assert.equal(frames[0].opacity, 0)
  assert.equal(frames[Math.ceil((frames.length - 1) / 3)].opacity, 1)
  assert.ok(Math.abs(parseFloat(frames.at(-1).left) - 90) < 0.001)
})

test('连续加珠先结束上一颗，同一时间只留一颗在动', () => {
  const callbacks = [], calls = []
  const component = { ...spec.methods, properties: { ...Object.fromEntries(Object.entries(spec.properties).map(([key, value]) => [key, value.value])),
    beads: [{ id: 'a', mm: 8 }], size: 200, circumferenceMm: 150, slide: { seq: 1, index: 0 } },
    data: { animatingIndex: -1 }, setData(patch, done) { Object.assign(this.data, patch); if (done) done() },
    animate(selector, frames, duration, done) { calls.push({ selector, frames, duration }); callbacks.push(done) },
    clearAnimation(selector) { calls.push({ clear: selector }) } }
  component.rebuild()
  assert.equal(component.data.animatingIndex, 0)
  component.properties.beads = [{ id: 'a', mm: 8 }, { id: 'b', mm: 8 }]
  component.properties.slide = { seq: 2, index: 1 }
  component.rebuild()
  assert.equal(calls.filter(call => call.clear).length, 1)
  assert.equal(calls.filter(call => call.duration === 420).length, 2)
  assert.equal(component.data.animatingIndex, 1)
  callbacks[0]()
  assert.equal(component.data.animatingIndex, 1)
  callbacks[1]()
  assert.equal(component.data.animatingIndex, -1)
})

test('减少动态效果或不支持 animate 时直接出现', () => {
  const component = { ...spec.methods, properties: { ...Object.fromEntries(Object.entries(spec.properties).map(([key, value]) => [key, value.value])),
    beads: [{ id: 'a', mm: 8 }], size: 200, circumferenceMm: 150, slide: { seq: 1, index: 0 } },
    data: { animatingIndex: -1 }, setData(patch, done) { Object.assign(this.data, patch); if (done) done() } }
  component.rebuild()
  assert.equal(component.data.animatingIndex, -1)
  component.animate = () => { throw Error('should not animate') }
  global.wx.getSystemInfoSync = () => ({ reduceMotion: true })
  component.properties.slide = { seq: 2, index: 0 }
  component.rebuild()
  assert.equal(component.data.animatingIndex, -1)
})
