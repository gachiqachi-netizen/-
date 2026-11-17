const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '../..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')

test('round icon buttons stay outside c-btn and have fixed dimensions', () => {
  for (const [page, cls, size] of [
    ['pages/photo/photo', 'shutter', 112],
    ['ar-hand/index', 'shutter', 112],
    ['pages/wrist/wrist', 'step', 64],
  ]) {
    const wxml = read(`miniprogram/${page}.wxml`)
    const wxss = read(`miniprogram/${page}.wxss`)
    assert.match(wxml, new RegExp(`<button class="${cls}"`))
    assert.match(wxss, new RegExp(`\\.${cls}\\{[^}]*min-width:${size}rpx;[^}]*max-width:${size}rpx;[^}]*flex:none`))
  }
})

test('unavailable live tryon uses one c-state action', () => {
  const wxml = read('miniprogram/ar-hand/index.wxml')
  assert.match(wxml, /<c-state wx:if="{{error}}"/)
  assert.doesNotMatch(wxml, /<view wx:else class="state-link"/)
})

test('UI checker rejects an unclassified native button', () => {
  const file = path.join(root, 'miniprogram/tests/u17-invalid.wxml')
  try {
    fs.writeFileSync(file, '<button class="plain">提交</button>')
    assert.throws(() => execFileSync('python3', ['tools/check-ui.py', file], { cwd: root, stdio: 'pipe' }), error => /button-class/.test(error.stdout.toString()))
  } finally {
    fs.rmSync(file, { force: true })
  }
})

test('UI checker rejects a button in an unprotected vertical flex container', () => {
  const file = path.join(root, 'miniprogram/tests/u17-vertical.wxml')
  const style = path.join(root, 'miniprogram/tests/u17-vertical.wxss')
  try {
    fs.writeFileSync(file, '<view class="stack"><button class="c-btn">提交</button></view>')
    fs.writeFileSync(style, '.stack{display:flex;flex-direction:column}')
    assert.throws(() => execFileSync('python3', ['tools/check-ui.py', file], { cwd: root, stdio: 'pipe' }), error => /vertical-button/.test(error.stdout.toString()))
  } finally {
    fs.rmSync(file, { force: true })
    fs.rmSync(style, { force: true })
  }
})
