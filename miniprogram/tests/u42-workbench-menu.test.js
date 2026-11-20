const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const api = require('../utils/api')
const store = require('../utils/design')

let definition
global.Page = page => { definition = page }
global.getApp = () => ({ globalData: {} })
global.wx = { getStorageSync: () => true, hideTabBar() {}, setStorageSync() {} }
require('../pages/diy/diy')

const markup = fs.readFileSync(path.join(__dirname, '../pages/diy/diy.wxml'), 'utf8')
function page(design = { id: 'u42', wrist: 15, beads: [] }) {
  return { ...definition, data: { ...definition.data, design }, setData(patch) { Object.assign(this.data, patch) }, update() {} }
}

test('底栏只在有珠子时显示，保存和串好了同排，保存按钮调用 save', () => {
  assert.match(markup, /<c-bar wx:if="\{\{beadCount\}\}" layout="price"/)
  assert.match(markup, /class="bar-actions"><button[^>]*bindtap="save"[^>]*>\{\{barSaved \? '已保存' : '保存'\}\}<\/button><button[^>]*bindtap="finish"[^>]*>串好了<\/button>/)
  const style = fs.readFileSync(path.join(__dirname, '../pages/diy/diy.wxss'), 'utf8')
  assert.match(style, /\.bar-actions\{[^}]*display:flex/)
  assert.match(style, /\.bar-actions \.bar-save\{flex:0 0 200rpx/)
  const p = page({ id: 'u42', wrist: 15, beads: ['b'] })
  let saved = 0
  p.save = () => { saved++ }
  p.save()
  assert.equal(saved, 1)
})

test('保存先落本机并短暂显示已保存，再继续同步', async () => {
  const oldSave = store.save, oldSelected = store.selected, oldSync = store.sync
  let local = 0, synced = 0
  store.save = () => { local++ }
  store.selected = () => {}
  store.sync = () => { synced++; return Promise.resolve() }
  const p = page({ id: 'u42', wrist: 15, beads: ['b'] })
  try {
    p.save()
    assert.equal(local, 1)
    assert.equal(synced, 1)
    assert.equal(p.data.barSaved, true)
    await new Promise(resolve => setTimeout(resolve, 1550))
    assert.equal(p.data.barSaved, false)
  } finally { clearTimeout(p.barSavedTimer); store.save = oldSave; store.selected = oldSelected; store.sync = oldSync }
})

test('手围变更且有珠子才询问；先不用不改珠子，重排调用现有逻辑', () => {
  assert.match(markup, /show="\{\{reflowPromptOpen\}\}"[^>]*title="按 \{\{design.wrist\}\}cm 重新排一下？"/)
  const oldCurrent = store.current, oldCatalog = api.catalog, oldRequest = api.request
  let current = { id: 'u42', wrist: 16, beads: ['b'] }
  store.current = () => current
  api.catalog = () => new Promise(() => {})
  api.request = () => new Promise(() => {})
  try {
    const p = page({ ...current, wrist: 15 })
    p.pendingWristFrom = 15; p.pendingWristReflow = true
    p.onShow()
    assert.equal(p.data.reflowPromptOpen, true)
    p.dismissReflowWrist()
    assert.equal(p.data.reflowPromptOpen, false)
    assert.deepEqual(p.data.design.beads, ['b'])
    let reflows = 0
    p.reflowWrist = () => { reflows++ }
    p.confirmReflowWrist()
    assert.equal(reflows, 1)
    assert.equal(p.data.reflowPromptOpen, false)

    const same = page({ ...current, wrist: 16 })
    same.pendingWristFrom = 16; same.pendingWristReflow = true; same.onShow()
    assert.equal(same.data.reflowPromptOpen, false)
    current = { id: 'empty', wrist: 16, beads: [] }
    const empty = page({ ...current, wrist: 15 })
    empty.pendingWristFrom = 15; empty.pendingWristReflow = true; empty.onShow()
    assert.equal(empty.data.reflowPromptOpen, false)
  } finally { store.current = oldCurrent; api.catalog = oldCatalog; api.request = oldRequest }
})
