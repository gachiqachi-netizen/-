const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const wxml = fs.readFileSync(path.join(root, 'pages/ai/ai.wxml'), 'utf8')
const wxss = fs.readFileSync(path.join(root, 'pages/ai/ai.wxss'), 'utf8')

test('手围是横向快捷项的第一个 chip，其他快捷项仍能发送', () => {
  const quick = wxml.match(/<scroll-view class="ai-quick"[\s\S]*?<\/scroll-view>/)?.[0]
  assert.ok(quick)
  assert.match(quick, /scroll-x enhanced show-scrollbar="{{false}}"/)
  assert.ok(quick.indexOf('手围 {{wrist}}cm') < quick.indexOf('wx:for="{{chips}}"'))
  assert.match(quick, /class="c-chip ai-quick-item" bindtap="onTag"/)
  assert.match(quick, /data-text="{{item}}" bindtap="example"/)
  assert.match(wxss, /\.ai-quick-inner \{[^}]*padding: 0 var\(--sp-base\)/)
})

test('输入和发送同一行，键盘弹起时使用输入框自动避让', () => {
  assert.match(wxml, /class="ai-input"[^>]*value="{{text}}"[^>]*confirm-type="send" adjust-position="{{true}}"[^>]*bindconfirm="submit"/)
  assert.match(wxml, /class="ai-send [^>]*role="button" aria-label="发送" bindtap="submit"/)
  assert.match(wxss, /\.ai-input \{[^}]*height: 80rpx;[^}]*border-radius: var\(--r-pill\)/)
  assert.match(wxss, /\.ai-send \{[^}]*width: 80rpx; height: 80rpx; flex: none/)
  assert.doesNotMatch(wxml, /<c-composer/)
})

test('新对话在正文工具行，保留页面左右安全边距', () => {
  assert.match(wxml, /class="ai-chat-tools"><text class="ai-new" bindtap="clear"/)
  assert.match(wxss, /\.ai-chat-tools \{[^}]*padding: var\(--sp-tight\) var\(--sp-base\)/)
})
