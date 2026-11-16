const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '../..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const pages = ['features/order-detail/order-detail', 'features/orders/orders', 'features/reviews/reviews',
  'features/shared/shared', 'pages/ai/ai', 'pages/diy/diy', 'pages/finish/finish', 'pages/share/share']

test('skeleton has only block, line, circle and pill shapes with token colors', () => {
  const js = read('miniprogram/components/skeleton/index.js')
  const wxss = read('miniprogram/components/skeleton/index.wxss')
  for (const shape of ['block', 'line', 'circle', 'pill']) assert.match(wxss, new RegExp(`c-skeleton--${shape}`))
  assert.match(js, /ratio:/)
  assert.match(js, /diameter:/)
  assert.match(wxss, /var\(--c-surface\)/)
  assert.match(wxss, /var\(--h-btn\)/)
  assert.match(wxss, /var\(--h-btn-s\)/)
  assert.doesNotMatch(wxss, /animation|@keyframes/)
})

test('eight loading regions use skeleton components without old shimmer classes', () => {
  for (const page of pages) {
    assert.match(read(`miniprogram/${page}.wxml`), /<c-skeleton\b/, page)
    assert.equal(JSON.parse(read(`miniprogram/${page}.json`)).usingComponents['c-skeleton'], '/components/skeleton/index', page)
    assert.doesNotMatch(read(`miniprogram/${page}.wxss`), /\.(?:[\w-]*skeleton[\w-]*|sk-[\w-]+)\b|@keyframes sk-/i, page)
  }
})

test('no old skeleton selector or loading shimmer remains outside the component', () => {
  const visit = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? visit(full) : entry.name.endsWith('.wxss') ? [full] : []
  })
  for (const file of visit(path.join(root, 'miniprogram'))) {
    if (file.includes('/components/skeleton/')) continue
    const style = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(style, /\.(?:[\w-]*skeleton[\w-]*|sk(?:-[\w-]+)?)\b|@keyframes\s+(?:[\w-]*skeleton[\w-]*|sk-[\w-]+)/i, file)
  }
})
