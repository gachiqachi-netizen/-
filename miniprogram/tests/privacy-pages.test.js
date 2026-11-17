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

test('privacy copy matches each purpose and unknown kinds use camera copy', () => {
  const previous = global.Component
  let component
  global.Component = config => { component = config }
  const { copyFor } = require('../components/privacy-popup/index.js')
  global.Component = previous
  const titles = {
    phone: '登录前，请先看一下',
    address: '选地址前，请先看一下',
    photo: '上传照片前，请先看一下',
    album: '保存图片前，请先看一下',
    avatar: '选头像前，请先看一下',
  }
  for (const [kind, title] of Object.entries(titles)) {
    assert.equal(copyFor(kind, '测试场景').title, title)
    assert.ok(copyFor(kind, '测试场景').body.length > 10)
    const instance = { properties: { kind, scene: '测试场景' }, setData(data) { this.data = data } }
    component.methods.updateCopy.call(instance)
    assert.equal(instance.data.title, title)
  }
  assert.deepEqual(copyFor('unknown', '测试场景'), copyFor('camera', '测试场景'))
  assert.match(copyFor('camera', '测试场景').body, /测试场景/)
  assert.equal(component.options.addGlobalClass, true)
})

test('non-camera privacy pages declare their kind', () => {
  const kinds = {
    'pages/login/login': 'phone',
    'pages/order/order': 'address',
    'features/address/address': 'address',
    'features/address-edit/address-edit': 'address',
    'features/logistics/logistics': 'address',
    'features/after-sale/apply': 'photo',
    'features/review/review': 'photo',
    'pages/share/share': 'album',
    'pages/mine/mine': 'avatar',
  }
  for (const [page, kind] of Object.entries(kinds)) {
    const markup = fs.readFileSync(path.join(root, page + '.wxml'), 'utf8')
    assert.match(markup, new RegExp(`<privacy-popup\\b[^>]*kind="${kind}"`), page)
  }
})
