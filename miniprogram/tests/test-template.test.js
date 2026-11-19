const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')

test('test template is marked on home card and details', () => {
  const home = fs.readFileSync(path.join(root, 'pages/home/home.wxml'), 'utf8')
  const detail = fs.readFileSync(path.join(root, 'pages/finish/finish.wxml'), 'utf8')
  assert.match(home, /wx:if="{{item\.testOnly}}">测试</)
  assert.match(detail, /wx:if="{{design\.testOnly}}">测试</)
  assert.match(detail, /wx:if="{{design\.testOnly}}">仅供内部测试，请勿购买</)
  const store = require('../utils/design')
  const oldCreate = store.create
  const oldSelected = store.selected
  const oldWx = global.wx
  try {
    store.create = () => ({})
    store.selected = () => {}
    global.wx = { getStorageSync: () => 15 }
    const { selectCard } = require('../pages/home/data')
    assert.equal(selectCard({ id: 'test', name: '测试款', beads: ['bead'], testOnly: true }).testOnly, true)
    assert.equal(selectCard({ id: 'normal', name: '普通款', beads: ['bead'] }).testOnly, false)
  } finally {
    store.create = oldCreate
    store.selected = oldSelected
    global.wx = oldWx
  }
})
