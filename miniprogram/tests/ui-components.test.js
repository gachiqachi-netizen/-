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
test('bar exposes three layouts and token button height', () => {
  const wxml = read('miniprogram/components/bar/index.wxml')
  assert.match(wxml, /layout === 'agreement'/)
  assert.match(wxml, /layout === 'dual'/)
  assert.match(read('miniprogram/components/bar/index.wxss'), /var\(--h-btn\)/)
})
test('navigation aligns title with capsule measurements', () => {
  assert.match(read('miniprogram/components/nav-bar/index.js'), /getMenuButtonBoundingClientRect/)
  assert.match(read('miniprogram/components/nav-bar/index.wxml'), /navHeight/)
  assert.match(read('miniprogram/components/nav-bar/index.wxml'), /statusHeight \+ navHeight/)
  assert.match(read('miniprogram/components/nav-bar/index.wxss'), /position:\s*fixed/)
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
test('home navigation shows home icon and switches to the home tab', () => {
  const wxml = read('miniprogram/components/nav-bar/index.wxml')
  assert.match(wxml, /wx:if="{{home}}" src="\.\.\/\.\.\/assets\/icons\/home\.svg"/)
  const calls = []
  let component
  vm.runInNewContext(read('miniprogram/components/nav-bar/index.js'), {
    Component: definition => { component = definition },
    wx: { switchTab: options => calls.push(['switchTab', options.url]), navigateBack: () => calls.push(['navigateBack']) },
  })
  component.methods.goBack.call({ data: { home: true } })
  assert.deepEqual(calls, [['switchTab', '/pages/home/home']])
})
test('back navigation shows back icon and navigates back', () => {
  const wxml = read('miniprogram/components/nav-bar/index.wxml')
  assert.match(wxml, /wx:else src="\.\.\/\.\.\/assets\/icons\/back\.svg"/)
  const calls = []
  let component
  vm.runInNewContext(read('miniprogram/components/nav-bar/index.js'), {
    Component: definition => { component = definition },
    wx: { switchTab: () => calls.push(['switchTab']), navigateBack: options => calls.push(['navigateBack', options.delta]) },
  })
  component.methods.goBack.call({ data: { home: false } })
  assert.deepEqual(calls, [['navigateBack', 1]])
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
