const test = require('node:test')
const assert = require('node:assert/strict')

let page
global.Page = value => { page = value }
global.wx = { getStorageSync: () => undefined }
global.getApp = () => ({ globalData: { apiBase: 'http://localhost' } })

const design = require('../utils/design')
const catalog = [{ id: 'main', mm: 10, price: 3 }, { id: 'head', mm: 8, price: 1 }]

test('ordinary AI plan reflows when wrist changes while fixed 108 stays fixed', () => {
  const ordinary = { name: '普通', pattern: ['main'], count: 17 }
  const at15 = design.fromTemplate(ordinary, catalog, 15)
  const at19 = design.fromTemplate(ordinary, catalog, 19)
  assert.notEqual(at15.beads.length, at19.beads.length)
  assert.equal(at15.fixed, null)
  const prayer = design.fromTemplate({ name: '念珠', pattern: ['main'], fixed: 108 }, catalog, 15)
  const prayerLarge = design.fromTemplate({ name: '念珠', pattern: ['main'], fixed: 108 }, catalog, 19)
  assert.equal(prayer.beads.length, 108)
  assert.equal(prayerLarge.beads.length, 108)
})

require('../pages/shared/shared')
const shared = require('../pages/shared/shared')

test('shared template reflows for viewer wrist and defaults to 15cm when unmeasured', () => {
  const source = { name: '分享', wrist: 13, beads: Array(14).fill('main'), pattern: ['main'], special: [], tail: [] }
  const result = shared.reflow(source, catalog, 19)
  assert.equal(result.wrist, 19)
  assert.notEqual(result.beads.length, source.beads.length)
  assert.deepEqual(shared.viewerWrist(), { value: 15, measured: false })
})
