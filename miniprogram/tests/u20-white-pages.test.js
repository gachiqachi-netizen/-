const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')

function files(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const name = `${dir}/${entry.name}`
    return entry.isDirectory() ? files(name) : [name]
  })
}

test('c-page reserves bottom space only when bar is true', () => {
  assert.match(read('miniprogram/components/page/index.js'), /bar: \{ type: Boolean, value: false \}/)
  assert.match(read('miniprogram/components/page/index.wxml'), /bar \? 'c-page--bar'/)
  assert.match(read('miniprogram/components/page/index.wxss'), /\.c-page--bar \{ padding-bottom:/)
})

test('every c-page matches c-bar presence and condition', () => {
  for (const file of files('miniprogram/pages').concat(files('miniprogram/features')).filter(f => f.endsWith('.wxml'))) {
    const content = read(file)
    const tag = content.match(/<c-page\b[^>]*>/)?.[0]
    if (!tag) continue
    if (content.includes('<c-bar')) assert.match(tag, /\bbar="\{\{.+\}\}"/, file)
    else assert.doesNotMatch(tag, /bar="\{\{true\}\}"/, file)
  }
  assert.match(read('miniprogram/features/order-detail/order-detail.wxml'), /<c-page bar="\{\{order && !paidLanding && primaryAction\}\}"/)
})

test('sheet single button fills footer and history is absent', () => {
  const css = read('miniprogram/components/sheet/index.wxss')
  assert.match(css, /button:only-child \{ width: 100%; \}/)
  assert.match(read('miniprogram/pages/order/order.wxml'), /slot="footer" class="c-btn c-btn--block"[^>]*>好了/)
  assert.doesNotMatch(read('miniprogram/features/after-sale/detail.wxml'), /协商历史|historyOpen/)
})

test('UI checker rejects gray page roots', () => {
  const file = path.join(root, 'miniprogram/pages/mine/u20-check.wxss')
  fs.writeFileSync(file, 'page { background: var(--c-surface); }')
  try {
    const result = spawnSync('python3', ['tools/check-ui.py', file], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /page-background:page/)
  } finally {
    fs.unlinkSync(file)
  }
})
