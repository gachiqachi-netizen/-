const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '../..')

function component(name) {
  let definition
  const source = fs.readFileSync(path.join(root, 'miniprogram/components', name, 'index.js'), 'utf8')
  vm.runInNewContext(source, {
    Component: value => { definition = value },
    module: { exports: {} },
    require: () => ({ queue: { show() {} }, finish() {}, variants() {}, fitHint() {}, unitPrice() {} }),
    wx: { getWindowInfo: () => ({ windowWidth: 375 }) },
    clearTimeout,
  })
  return definition
}

for (const [name, method, data, event, arg] of [
  ['bead-sheet', 'add', { selected: { id: 'x' }, quantity: 1 }, 'add'],
  ['privacy-popup', 'reject', {}, 'reject'],
  ['composer', 'onPlus', {}, 'plus'],
  ['sheet', 'onMaskTap', { maskClose: true }, 'close'],
  ['cell', 'onTap', {}, 'tap'],
  ['bracelet3d', 'end', {}, 'select', { changedTouches: [{ x: 1, y: 1 }] }],
  ['state', 'onAction', {}, 'action'],
]) {
  test(`${name}: one action reaches page once`, () => {
    const wxml = fs.readFileSync(path.join(root, 'miniprogram/components', name, 'index.wxml'), 'utf8')
    assert.match(wxml, new RegExp(`(?:bind|catch)(?:tap|touchend|agreeprivacyauthorization)="${method}"`))
    let calls = 0
    const instance = { data, touch: name === 'bracelet3d' ? { index: 2, moved: false } : null,
      triggerEvent: emitted => { if (emitted === event) calls++ } }
    component(name).methods[method].call(instance, arg)
    assert.equal(calls, 1)
  })
}

test('UI checker catches bubbled native tap and missing global style opt-in', () => {
  const dir = fs.mkdtempSync(path.join(root, 'miniprogram/components', 'h5-check-'))
  const js = path.join(dir, 'index.js')
  const wxml = path.join(dir, 'index.wxml')
  const check = () => spawnSync('python3', ['tools/check-ui.py', js], { cwd: root, encoding: 'utf8' })
  try {
    fs.writeFileSync(js, "Component({ methods: { onTap() { this.triggerEvent('tap') } } })")
    fs.writeFileSync(wxml, '<view class="c-btn" bindtap="onTap" />')
    let result = check()
    assert.equal(result.status, 1)
    assert.match(result.stdout, /event-bubble/)
    assert.match(result.stdout, /global-class/)
    fs.writeFileSync(js, "Component({ options: { styleIsolation: 'apply-shared' }, methods: { onTap() { this.triggerEvent('tap') } } })")
    fs.writeFileSync(wxml, '<view class="c-btn" catchtap="onTap" />')
    result = check()
    assert.equal(result.status, 0, result.stdout)
  } finally { fs.rmSync(dir, { recursive: true, force: true }) }
})
