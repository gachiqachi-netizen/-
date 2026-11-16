const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

test('状态组件只有标题、说明与一个居中次按钮', () => {
  const markup = read('components/state/index.wxml')
  const style = read('components/state/index.wxss')
  assert.match(markup, /c-btn c-btn--sec c-state__action/)
  assert.equal((markup.match(/<button\b/g) || []).length, 1)
  assert.doesNotMatch(markup, /c-state__link/)
  assert.match(style, /padding:\s*160rpx/)
  assert.match(style, /font-size:\s*var\(--fs-display\)/)
  assert.match(style, /--state-action-width:\s*320rpx/)
  assert.match(style, /margin:\s*40rpx auto 0/)
})

test('长条按钮使用 c-btn，圆形图标按钮保留页面尺寸', () => {
  const style = read('styles/components.wxss')
  assert.doesNotMatch(style, /button\.c-btn:not\(\[size=mini\]\)\s*\{\s*width:\s*auto/)
  assert.match(style, /c-btn--block[^}]*width:\s*100%/)
  for (const file of ['pages/photo/photo.wxml', 'ar-hand/index.wxml', 'pages/wrist/wrist.wxml']) {
    const markup = read(file)
    for (const tag of markup.match(/<button\b[^>]*class="[^"]*(?:shutter|step)[^"]*"[^>]*>/gs) || []) assert.doesNotMatch(tag, /class="[^"]*c-btn/)
  }
})

test('接口错误转换区分断网与服务器故障', () => {
  const api = require('../utils/api')
  assert.equal(api.networkError({ errMsg: 'timeout' }).message, '网络不太好，检查一下网络再试')
  const oldWx = global.wx, oldGetApp = global.getApp
  try {
    global.wx = { getAccountInfoSync: () => ({ miniProgram: { envVersion: 'develop' } }) }
    global.getApp = () => ({ globalData: { apiBase: 'http://127.0.0.1:8894' } })
    const error = api.networkError({ errMsg: 'url not in domain list' })
    assert.match(api.userMessage(error), /微信拦截了测试地址/)
    assert.match(api.userMessage(error), /url not in domain list/)
    assert.match(api.userMessage(error), /127\.0\.0\.1:8894/)
    global.wx.getAccountInfoSync = () => ({ miniProgram: { envVersion: 'release' } })
    assert.equal(api.userMessage(api.networkError({ errMsg: 'timeout' })), '网络不太好，检查一下网络再试')
  } finally { global.wx = oldWx; global.getApp = oldGetApp }
  assert.equal(api.responseError({ statusCode: 500, data: { error: '服务暂不可用' } }).message, '系统开小差了，稍后再试')
  assert.equal(api.responseError({ statusCode: 400, data: { error: '请填写地址' } }).message, '请填写地址')
})

test('订单未登录与评价读取失败隐藏表单', () => {
  assert.match(read('components/bead-sheet/index.wxml'), /c-btn c-btn--block submit/)
  assert.match(read('components/bead-sheet/index.wxss'), /bead-sheet-footer\s*\{\s*width:\s*100%/)
  assert.match(read('pages/login/login.js'), /agreed: false/)
  assert.match(read('features/order-detail/order-detail.wxml'), /loginRequired[^>]*title="登录后查看订单"[^>]*action="去登录"/)
  const review = read('features/review/review.wxml')
  assert.match(review, /<c-state wx:elif="\{\{loadError\}\}"/)
  assert.match(review, /<block wx:else>[\s\S]*<c-bar wx:if="\{\{!readOnly\}\}"/)
})

test('订单详情没有会话时直接显示登录状态，登录后返回原订单', async () => {
  const auth = require('../utils/auth')
  const oldWx = global.wx, oldPage = global.Page
  const oldHasSession = auth.hasSession, oldGoLogin = auth.goLogin
  let definition, next
  try {
    global.wx = { getStorageSync: () => '' }
    global.Page = config => { definition = config }
    auth.hasSession = () => false
    auth.goLogin = value => { next = value }
    const file = require.resolve('../features/order-detail/order-detail')
    delete require.cache[file]
    require(file)
    const page = { ...definition, no: 'DEMO-123', paidIntent: true,
      data: { ...definition.data }, setData(patch) { Object.assign(this.data, patch) } }
    await page.load()
    assert.equal(page.data.loginRequired, true)
    assert.equal(page.data.loading, false)
    assert.equal(page.data.order, null)
    page.goLogin()
    assert.deepEqual(next, { type: 'navigate', url: '/features/order-detail/order-detail?no=DEMO-123&paid=1' })
  } finally {
    auth.hasSession = oldHasSession
    auth.goLogin = oldGoLogin
    global.wx = oldWx
    global.Page = oldPage
  }
})

test('我的订单没有会话时显示登录入口，不读取订单', async () => {
  const auth = require('../utils/auth')
  const oldWx = global.wx, oldPage = global.Page
  const oldHasSession = auth.hasSession, oldAuthorized = auth.authorized
  let definition, called = false
  try {
    global.wx = { getStorageSync: () => '' }
    global.Page = config => { definition = config }
    auth.hasSession = () => false
    auth.authorized = async () => { called = true; return [] }
    const file = require.resolve('../features/orders/orders')
    delete require.cache[file]
    require(file)
    const page = { ...definition, data: { ...definition.data },
      setData(patch) { Object.assign(this.data, patch) } }
    await page.loadOrders(true)
    assert.equal(called, false)
    assert.equal(page.data.loggedIn, false)
    assert.equal(page.data.error, '登录后查看订单')
    assert.deepEqual(page.data.rows, [])
  } finally {
    auth.hasSession = oldHasSession
    auth.authorized = oldAuthorized
    global.wx = oldWx
    global.Page = oldPage
  }
})
