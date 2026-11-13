const test = require('node:test')
const assert = require('node:assert/strict')

let stack, relaunched, notice, storage, switched
function get(key) { return structuredClone(storage[key]) }
global.getCurrentPages = () => stack
global.wx = {
  getStorageSync: key => get(key),
  setStorageSync: (key, value) => { storage[key] = structuredClone(value) },
  navigateTo({ url }) { stack.push({ route: url.replace(/^\//, '') }) },
  navigateBack({ delta }) { stack.splice(stack.length - delta, delta) },
  redirectTo({ url }) { stack[stack.length - 1] = { route: url.replace(/^\//, '') } },
  switchTab({ url }) { switched = url; stack = [{ route: url.replace(/^\//, '') }] },
  reLaunch({ url }) { relaunched = url; stack = [{ route: url.split('?')[0].replace(/^\//, '') }] }
}
const queue = require('../utils/toast').queue
queue.show = options => { notice = options }
const nav = require('../utils/nav')
const store = require('../utils/design')

test.beforeEach(() => {
  stack = [{ route: 'pages/home/home' }]
  relaunched = notice = switched = undefined
  storage = {}
})

test('opening another design saves an unsaved current draft before switching tab', () => {
  const current = { id: 'old', name: '旧设计', beads: ['a'], wrist: 15 }
  const next = { id: 'new', name: '新设计', beads: ['b'], wrist: 16 }
  store.selected(current)
  nav.openWorkbench(next)
  assert.equal(switched, '/pages/diy/diy')
  assert.deepEqual(store.list(), [current])
  assert.deepEqual(store.current(), next)
  assert.equal(notice.text, '原来那条已存到我的作品')
})

test('unchanged current draft does not create another saved work', () => {
  const current = { id: 'old', name: '旧设计', beads: ['a'], wrist: 15 }
  store.save(current)
  store.selected(current)
  nav.openWorkbench({ id: 'new', name: '新设计', beads: [] })
  assert.equal(store.list().length, 1)
  assert.equal(notice, undefined)
})

test('workbench returns to the tab from home, AI, or mine', () => {
  for (const tab of ['pages/home/home', 'pages/ai/ai', 'pages/mine/mine']) {
    stack = [{ route: tab }, { route: 'pages/finish/finish' }]
    nav.openWorkbench({ id: tab, beads: [] })
    nav.backFromWorkbench()
    assert.equal(switched, '/' + tab)
  }
  stack = [{ route: 'features/shared/shared' }]
  nav.openWorkbench({ id: 'shared', beads: [] })
  nav.backFromWorkbench()
  assert.equal(switched, '/pages/home/home')
})

test('openEditor uses tab navigation without exceeding page stack', () => {
  storage.cgz_wrist_confirmed = true
  for (let i = 0; i < 20; i++) {
    nav.openEditor()
    nav.openOrder()
    assert.ok(stack.length <= 10)
  }
})

test('unmeasured wrist defaults to 15cm and checkout confirms only once', () => {
  assert.deepEqual(nav.wrist(), { value: 15, measured: false })
  store.selected({ id: 'draft', beads: [] })
  nav.openOrder()
  assert.equal(notice.text, '先按常见的 15cm，确认后去下单')
  assert.equal(stack[0].route, 'pages/home/home')
  assert.equal(store.current().wrist, 15)
  notice.onAction()
  assert.equal(storage.cgz_wrist_confirmed, true)
  assert.equal(stack.at(-1).route, 'pages/order/order')
  notice = undefined
  nav.openOrder()
  assert.equal(notice, undefined)
  assert.equal(stack.at(-1).route, 'pages/order/order')
  storage.cgz_wrist = 16
  assert.deepEqual(nav.wrist(), { value: 16, measured: true })
})

test('successful order relaunches order detail', () => {
  nav.orderComplete('A 1')
  assert.equal(relaunched, '/features/order-detail/order-detail?no=A%201')
})
