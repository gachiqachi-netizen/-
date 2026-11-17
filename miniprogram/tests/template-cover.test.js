const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('catalog cards expose the requested size and no cover stays empty', () => {
  global.wx = { getStorageSync: () => 15 }
  global.getApp = () => ({ globalData: { apiBase: 'https://example.invalid' } })
  const { catalogCards } = require('../pages/home/data')
  const bead = { id: 'b1', mm: 8, price: 1, tags: [] }
  const recipe = { id: 't1', pattern: ['b1'], fixed: 4 }
  const [covered, plain] = catalogCards({ beads: [bead], templates: [
    { ...recipe, cover: { lg: '/uploads/large.jpg', md: '/uploads/medium.jpg', sm: '/uploads/small.jpg' } },
    { ...recipe, id: 't2' },
  ] })
  assert.equal(covered.coverUrl, 'https://example.invalid/uploads/medium.jpg')
  assert.equal(covered.coverLgUrl, 'https://example.invalid/uploads/large.jpg')
  assert.equal(plain.coverUrl, '')
  assert.equal(plain.coverLgUrl, '')
})

test('home chooses medium card and large banner covers with image failure fallback', () => {
  const root = path.join(__dirname, '../pages/home')
  const markup = fs.readFileSync(path.join(root, 'home.wxml'), 'utf8')
  const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8')
  assert.match(data, /coverUrl:materialUrl\(cover\.md\)/)
  assert.match(data, /coverLgUrl:materialUrl\(cover\.lg\)/)
  assert.match(markup, /item\.card\.coverLgUrl/)
  assert.match(markup, /binderror="bannerCoverError"/)
  assert.match(markup, /binderror="coverError"/)
  assert.match(markup, /bracelet-thumb wx:else/)
})

test('detail shows large cover then labeled layout and falls back after image error', () => {
  const root = path.join(__dirname, '../pages/finish')
  const markup = fs.readFileSync(path.join(root, 'finish.wxml'), 'utf8')
  const code = fs.readFileSync(path.join(root, 'finish.js'), 'utf8')
  assert.match(code, /cover\.lg/)
  assert.match(code, /\[{ kind: 'cover', url: coverUrl }, { kind: 'bracelet' }\]/)
  assert.match(code, /coverError\(\).*slides: \[{ kind: 'bracelet' }\]/)
  assert.match(markup, /mode="aspectFill" binderror="coverError"/)
  assert.match(markup, /珠子排布/)
  let detail
  global.Page = definition => { detail = definition }
  require('../pages/finish/finish')
  let next
  detail.coverError.call({ setData(value) { next = value } })
  assert.deepEqual(next, { coverFailed: true, slides: [{ kind: 'bracelet' }], current: 0 })
})
