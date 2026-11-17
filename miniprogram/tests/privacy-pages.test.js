const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const excluded = new Set(['components', 'utils', 'tests'])
const privacy = /\b(?:getPhoneNumber|chooseAddress|chooseMedia|chooseImage|saveImageToPhotosAlbum)\b|open-type=["'](?:getPhoneNumber|chooseAvatar)["']/g

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (dir === root && excluded.has(entry.name)) return []
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? files(full) : [full]
  })
}

test('all pages using privacy APIs register and render privacy-popup', () => {
  const missing = []
  for (const file of files(root)) {
    if (!/\.(js|wxml)$/.test(file)) continue
    const source = fs.readFileSync(file, 'utf8')
    if (!privacy.test(source)) continue
    privacy.lastIndex = 0
    const stem = file.replace(/\.(js|wxml)$/, '')
    if (!fs.existsSync(stem + '.json') || !fs.existsSync(stem + '.wxml')) continue
    const config = JSON.parse(fs.readFileSync(stem + '.json', 'utf8'))
    const markup = fs.readFileSync(stem + '.wxml', 'utf8')
    if (config.usingComponents?.['privacy-popup'] !== '/components/privacy-popup/index' || !/<privacy-popup\b/.test(markup)) {
      missing.push(path.relative(root, stem))
    }
  }
  assert.deepEqual([...new Set(missing)].sort(), [])
})
