const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const vm = require('node:vm')
const root = path.resolve(__dirname, '../..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')

test('page and card use token spacing and panel radius', () => {
  assert.match(read('miniprogram/components/page/index.wxss'), /var\(--sp-base\)/)
  assert.match(read('miniprogram/components/card/index.wxss'), /var\(--r-panel\)/)
  assert.match(read('miniprogram/components/card/index.wxss'), /padding:\s*var\(--sp-tight\) var\(--sp-base\)/)
  assert.match(read('miniprogram/components/card/index.wxml'), /slot name="title"/)
})
test('cell renders row, arrow and monochrome switch', () => {
  const wxml = read('miniprogram/components/cell/index.wxml')
  const wxss = read('miniprogram/components/cell/index.wxss')
  assert.match(wxml, /c-cell-row__label/)
  assert.match(wxml, /chevron-right.svg/)
  assert.match(wxml, /c-cell-row__switch/)
  assert.match(wxss, /var\(--h-row\)/)
  assert.match(wxss, /var\(--c-text\)/)
})
test('cell row tap reaches the page once and switch tap only emits change', () => {
  const wxml = read('miniprogram/components/cell/index.wxml')
  assert.match(wxml, /<view class="c-cell-row"[^>]*catchtap="onTap"/)
  assert.match(wxml, /class="c-cell-row__switch[^>]*catchtap="onSwitch"/)
  const source = read('miniprogram/components/cell/index.js')
  let definition
  vm.runInNewContext(source, {
    require: () => ({ yuan: () => '' }),
    Component: value => { definition = value },
  })
  const received = []
  const component = { data: { checked: false }, triggerEvent: (name, detail) => received.push([name, detail]) }
  definition.methods.onTap.call(component)
  assert.deepEqual(received.map(([name]) => name), ['tap'])
  definition.methods.onSwitch.call(component)
  assert.deepEqual(received.map(([name]) => name), ['tap', 'change'])
  assert.equal(received[1][1].value, true)
})
test('bar exposes three layouts and token button height', () => {
  const wxml = read('miniprogram/components/bar/index.wxml')
  assert.match(wxml, /layout === 'agreement'/)
  assert.match(wxml, /layout === 'dual'/)
  assert.match(read('miniprogram/components/bar/index.wxss'), /var\(--h-btn\)/)
})
test('bottom bar fills one action and splits two actions evenly', () => {
  const wxml = read('miniprogram/components/bar/index.wxml')
  const wxss = read('miniprogram/components/bar/index.wxss')
  assert.match(wxml, /layout === 'price' \|\| layout === 'agreement'/)
  assert.match(wxss, /\.c-bar__main--single \.c-bar__btn,[\s\S]*\.c-bar__main--dual \.c-bar__btn \{ width: 100%; \}/)
  assert.match(wxss, /\.c-bar__btn \{[\s\S]*width: 50%;/)
  assert.match(read('miniprogram/pages/finish/finish.wxml'), /<c-bar layout="dual">[\s\S]*slot="secondary"/)
  for (const page of ['features/order-detail/order-detail', 'features/review/review', 'features/after-sale/detail']) {
    assert.match(read(`miniprogram/${page}.wxml`), /<c-bar[^>]*layout="single"/)
  }
})
test('sheet footer uses full width token buttons', () => {
  const wxss = read('miniprogram/components/sheet/index.wxss')
  assert.match(wxss, /\.c-sheet__footer \{ display: flex; width: 100%; \}/)
  assert.match(wxss, /\.c-sheet__footer button \{[^}]*height: var\(--h-btn\)/)
  assert.match(read('miniprogram/pages/order/order.wxml'), /slot="footer" class="gift-footer"/)
})
test('UI checker rejects numeric button size and fixed width', () => {
  const dir = fs.mkdtempSync(path.join(root, 'miniprogram', 'tests', 'ui-button-'))
  const file = path.join(dir, 'button.wxss')
  try {
    fs.writeFileSync(file, '.submit-btn { height: 90rpx; width: 260rpx; }\n')
    let result = spawnSync('python3', ['tools/check-ui.py', file], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /button-height/)
    assert.match(result.stdout, /button-width/)
    fs.writeFileSync(file, '.submit-btn { height: var(--h-btn); width: 50%; }\n')
    result = spawnSync('python3', ['tools/check-ui.py', file], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 0)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})
test('system navigation supplies the workbench title', () => {
  const config = JSON.parse(read('miniprogram/pages/diy/diy.json'))
  assert.equal(config.navigationBarTitleText, '自己串')
  assert.equal(config.navigationStyle, 'custom')
})
test('all listed pages use system navigation', () => {
  const pages = ['pages/home/home', 'pages/ai/ai', 'pages/order/order', 'pages/login/login', 'pages/share/share',
    'features/order-detail/order-detail', 'features/shared/shared', 'features/after-sale/type',
    'features/after-sale/apply', 'features/after-sale/detail']
  for (const page of pages) {
    const config = JSON.parse(read(`miniprogram/${page}.json`))
    assert.notEqual(config.navigationStyle, 'custom', page)
    assert.ok(config.navigationBarTitleText, page)
    assert.doesNotMatch(read(`miniprogram/${page}.wxml`), /<c-nav-bar\b/, page)
  }
  assert.equal(JSON.parse(read('miniprogram/pages/diy/diy.json')).navigationStyle, 'custom')
  assert.doesNotMatch(read('miniprogram/pages/diy/diy.wxml'), /<c-nav-bar\b/)
  assert.match(read('miniprogram/pages/ai/ai.wxml'), /class="ai-chat-tools"[\s\S]*class="ai-new" bindtap="clear"/)
})
test('home thumbnails fit inside the two-column tiles', () => {
  assert.match(read('miniprogram/pages/home/home.wxml'), /class="traybox"[\s\S]*<bracelet-thumb\b/)
  assert.match(read('miniprogram/pages/home/home.wxss'), /\.traybox bracelet-thumb\{[^}]*width:220rpx;height:220rpx/)
})
test('UI checker enforces square image areas but allows circular add-photo', () => {
  const dir = fs.mkdtempSync(path.join(root, 'miniprogram', 'ui-shape-'))
  const file = path.join(dir, 'shape.wxss')
  try {
    fs.writeFileSync(file, '.photo { border-radius: var(--r-pill); }\n')
    let result = spawnSync('python3', ['tools/check-ui.py', file], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /:shape:/)
    fs.writeFileSync(file, '.cover { border-radius: 18rpx; }\n')
    result = spawnSync('python3', ['tools/check-ui.py', file], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /:shape:/)
    fs.writeFileSync(file, '.photo { border-radius: var(--r-panel); }\n.add-photo { border-radius: var(--r-pill); }\n')
    result = spawnSync('python3', ['tools/check-ui.py', file], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 0)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})
test('system navigation uses the home tab title', () => {
  const config = JSON.parse(read('miniprogram/pages/home/home.json'))
  assert.equal(config.navigationBarTitleText, '珠养养')
  assert.notEqual(config.navigationStyle, 'custom')
})
test('workbench alone uses custom navigation and removes the old component', () => {
  const config = JSON.parse(read('miniprogram/pages/diy/diy.json'))
  assert.equal(config.navigationBarTitleText, '自己串')
  assert.equal(config.navigationStyle, 'custom')
  assert.equal(fs.existsSync(path.join(root, 'miniprogram/components/nav-bar')), false)
})
test('UI checker rejects a new literal color', () => {
  const dir = fs.mkdtempSync(path.join(root, 'miniprogram', 'ui-check-'))
  const file = path.join(dir, 'bad.wxss')
  try {
    fs.writeFileSync(file, '.bad { color: #ff0000; }\n')
    const result = spawnSync('python3', ['tools/check-ui.py', file], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /#ff0000/)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})
