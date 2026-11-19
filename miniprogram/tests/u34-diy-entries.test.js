const test = require('node:test')
const assert = require('node:assert/strict')
const logic = require('../pages/diy/logic')

test('picked chip tap removes one occurrence and long press removes its whole group', () => {
  const ids = ['a', 'b', 'a', 'a']
  assert.deepEqual(logic.removeOne(ids, 'a'), ['a', 'b', 'a'])
  assert.deepEqual(logic.removeGroup(ids, 'a'), ['b'])
  assert.deepEqual(ids, ['a', 'b', 'a', 'a'])
})

test('wrist change recalculates remaining length', () => {
  const beads = [{ id: 'a', mm: 8, price: 1 }]
  assert.equal(logic.stats(['a'], beads, 15).fit, '还差约 157mm')
  assert.equal(logic.stats(['a'], beads, 16).fit, '还差约 167mm')
})

test('return button is conditional on a consumed source', () => {
  const wxml = require('node:fs').readFileSync(require('node:path').join(__dirname, '../pages/diy/diy.wxml'), 'utf8')
  assert.match(wxml, /wx:if="\{\{returnSource\}\}" class="tray-back" bindtap="back"/)
})

let definition
const app = { globalData: {} }
const storage = {}
let navigation = ''
global.Page = value => { definition = value }
global.getApp = () => app
global.wx = {
  getStorageSync: key => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  navigateTo: ({url}) => { navigation = url },
  hideTabBar: () => {},
  showTabBar: () => {},
}
require('../pages/diy/diy')
const api = require('../utils/api')
const { queue } = require('../utils/toast')
const savedCatalog = api.catalog, savedRequest = api.request, savedShow = queue.show
function page(beads = []) {
  const p = { ...definition, data: { ...definition.data,
    design: { id: 'u34', wrist: 15, beads },
    catalog: [{ id: 'a', name: '小叶紫檀', mm: 8 }, { id: 'b', name: '白水晶', mm: 8 }],
  }, setData(patch) { Object.assign(this.data, patch) }, update() {},
    saveDraftSoon() {}, playSound() {}, vibrate() {}, refreshStackPreview() {}, focusKbBead() {}, dragCancel() {} }
  return p
}

test('return source survives opening My Works and returning, but clears on direct tab entry', () => {
  api.catalog = async () => ({ beads: [] })
  api.request = async () => ({})
  app.globalData = { workbenchReturn: { route: 'pages/finish/finish', options: {} } }
  const p = page()
  try {
    p.onShow()
    assert.equal(p.data.returnSource.route, 'pages/finish/finish')
    p.works()
    assert.equal(navigation, '/features/works/works')
    p.onHide()
    p.onShow()
    assert.equal(p.data.returnSource.route, 'pages/finish/finish')
    p.onHide()
    p.onShow()
    assert.equal(p.data.returnSource, null)
  } finally { api.catalog = savedCatalog; api.request = savedRequest }
})

test('picked chip one bead and group deletion both offer working undo', () => {
  const p = page(['a', 'b', 'a'])
  let notice
  queue.show = value => { notice = value }
  try {
    p.removePickedOne({ currentTarget: { dataset: { id: 'a' } } })
    assert.deepEqual(p.data.design.beads, ['a', 'b'])
    assert.equal(notice.action, '撤销')
    notice.onAction()
    assert.deepEqual(p.data.design.beads, ['a', 'b', 'a'])
    p.removePickedGroup({ currentTarget: { dataset: { id: 'a' } } })
    assert.deepEqual(p.data.design.beads, ['b'])
    assert.equal(notice.text, '已删除 2 颗小叶紫檀')
    assert.equal(notice.action, '撤销')
    notice.onAction()
    assert.deepEqual(p.data.design.beads, ['a', 'b', 'a'])
  } finally { queue.show = savedShow }
})
