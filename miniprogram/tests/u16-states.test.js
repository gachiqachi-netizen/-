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

test('页面原生按钮都带 c-btn，且有默认宽度覆盖和通栏规则', () => {
  const style = read('styles/components.wxss')
  assert.match(style, /button\.c-btn:not\(\[size=mini\]\)\s*\{\s*width:\s*auto/)
  assert.match(style, /c-btn--block[^}]*width:\s*100%/)
  for (const folder of ['pages', 'features', 'ar-hand', 'components']) {
    const visit = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) visit(file)
      else if (file.endsWith('.wxml')) for (const tag of read(path.relative(root, file)).match(/<button\b[^>]*>/gs) || []) assert.match(tag, /class="[^"]*c-btn/, file)
    } }
    visit(path.join(root, folder))
  }
})

test('接口错误转换区分断网与服务器故障', () => {
  const api = require('../utils/api')
  assert.equal(api.networkError({ errMsg: 'timeout' }).message, '网络不太好，检查一下网络再试')
  assert.equal(api.responseError({ statusCode: 500, data: { error: '服务暂不可用' } }).message, '系统开小差了，稍后再试')
  assert.equal(api.responseError({ statusCode: 400, data: { error: '请填写地址' } }).message, '请填写地址')
})

test('订单未登录与评价读取失败隐藏表单', () => {
  assert.match(read('components/bead-sheet/index.wxml'), /c-btn c-btn--block submit/)
  assert.match(read('pages/login/login.js'), /agreed: false/)
  assert.match(read('features/order-detail/order-detail.wxml'), /loginRequired[^>]*title="登录后查看订单"[^>]*action="去登录"/)
  const review = read('features/review/review.wxml')
  assert.match(review, /<c-state wx:if="\{\{loadError\}\}"/)
  assert.match(review, /<block wx:else>[\s\S]*<c-bar wx:if="\{\{!readOnly\}\}"/)
})
