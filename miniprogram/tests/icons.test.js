const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const ICONS = [
  'back', 'undo', 'stack', 'share', 'save', 'mic', 'plus', 'minus',
  'up', 'check', 'copy', 'close', 'more', 'chevron-right', 'camera',
  'image', 'hand', 'spark', 'bead',
]

test('every icon name from step 1 has an svg file', () => {
  for (const name of ICONS) {
    assert.ok(
      fs.existsSync(path.join(ROOT, 'assets', 'icons', `${name}.svg`)),
      `missing assets/icons/${name}.svg`
    )
  }
})

test('white variants up-on and check-on exist', () => {
  for (const name of ['up-on', 'check-on']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'icons', `${name}.svg`)))
  }
})

test('no alert or warn icon files', () => {
  const files = fs.readdirSync(path.join(ROOT, 'assets', 'icons'))
  for (const f of files) {
    assert.ok(!/alert|warn/i.test(f), `forbidden icon file: ${f}`)
  }
})

test('every svg uses stroke-width 1.5 and 24 viewBox', () => {
  const files = fs.readdirSync(path.join(ROOT, 'assets', 'icons'))
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, 'assets', 'icons', f), 'utf8')
    assert.ok(text.includes('stroke-width="1.5"'), `${f} missing stroke-width="1.5"`)
    assert.ok(text.includes('viewBox="0 0 24 24"'), `${f} bad viewBox`)
    assert.ok(text.includes('fill="none"'), `${f} missing fill="none"`)
  }
})

test('up-on and check-on are white', () => {
  for (const name of ['up-on', 'check-on']) {
    const text = fs.readFileSync(path.join(ROOT, 'assets', 'icons', `${name}.svg`), 'utf8')
    assert.ok(text.includes('stroke="#ffffff"'), `${name} not white`)
  }
})

test('eight tab pngs exist and each is at most 3KB', () => {
  for (const name of ['home', 'bead', 'chat', 'me']) {
    for (const suffix of ['', '-on']) {
      const p = path.join(ROOT, 'assets', 'tab', `${name}${suffix}.png`)
      assert.ok(fs.existsSync(p), `missing ${name}${suffix}.png`)
      const size = fs.statSync(p).size
      assert.ok(size <= 3072, `${name}${suffix}.png is ${size} bytes > 3KB`)
    }
  }
})
