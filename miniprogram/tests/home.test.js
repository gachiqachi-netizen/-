const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const api = require('../utils/api')
const store = require('../utils/design')
const { queue } = require('../utils/toast')

test('home uses only the native 珠养养 title and keeps dots inside the banner', () => {
  const home = path.join(__dirname, '../pages/home')
  const config = JSON.parse(fs.readFileSync(path.join(home, 'home.json'), 'utf8'))
  const markup = fs.readFileSync(path.join(home, 'home.wxml'), 'utf8')
  const style = fs.readFileSync(path.join(home, 'home.wxss'), 'utf8')
  assert.equal(config.navigationBarTitleText, '珠养养')
  assert.equal(config.usingComponents['c-wordmark'], undefined)
  assert.doesNotMatch(markup, /<c-wordmark|class="brand"/)
  assert.match(markup, /<swiper class="banner"[^>]*indicator-dots/)
  assert.match(style, /\.slide\{[^}]*height:100%;[^}]*padding-bottom:calc\(var\(--sp-base\) \+ var\(--sp-tight\)\)/)
})

function pageWith(catalog) {
  let page
  const storage = {}
  const calls = []
  global.Page = definition => { page = { ...definition, data: { ...definition.data }, setData(next) { Object.assign(this.data, next) } } }
  global.wx = {
    getStorageSync: key => storage[key],
    navigateTo: args => calls.push(['navigate', args.url]),
    switchTab: args => calls.push(['tab', args.url]),
    showTabBarRedDot: args => calls.push(['dot', args.index]),
    removeTabBarRedDot: args => calls.push(['undot', args.index])
  }
  global.getApp = () => ({ globalData: { catalog, apiBase: 'https://example.invalid' } })
  delete require.cache[require.resolve('../pages/home/home')]
  require('../pages/home/home')
  let initialToast = true
  queue.subscribe(item => { if (initialToast) { initialToast = false; return } if (item) calls.push(['toast', item.text]) })
  return { page, storage, calls }
}

const sample = require('../utils/catalog-preview')
const sampleWithBanner = { ...sample, banners: [{ id: 'b1', tpl: sample.templates[0].id, title: '清冷一点' }] }

test('home catalog failure keeps banner and entrances while replacing only templates', async () => {
  const old = api.catalog
  api.catalog = () => Promise.reject(new Error('offline'))
  try {
    const { page } = pageWith(sampleWithBanner)
    page.load()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.data.banners.length, 1)
    assert.equal(page.data.templates.length, 0)
    assert.equal(page.data.error, '网络不太好，检查一下网络再试')
  } finally { api.catalog = old }
})

test('home reloads templates for changed wrist and shows the new size', async () => {
  const old = api.catalog
  api.catalog = () => Promise.resolve(sampleWithBanner)
  try {
    const { page, storage, calls } = pageWith(sampleWithBanner)
    storage.cgz_wrist = 15
    page.onShow()
    await new Promise(resolve => setImmediate(resolve))
    assert.ok(page.data.templates.length > 0)
    storage.cgz_wrist = 15.5
    storage.cgz_wrist_confirmed = true
    page.onShow()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.data.wrist, 15.5)
    assert.ok(calls.some(([kind, value]) => kind === 'toast' && value.includes('15.5cm')))
  } finally { api.catalog = old }
})

test('home template card opens bracelet detail with selected design', async () => {
  const oldCatalog = api.catalog, oldSelected = store.selected
  let selected
  api.catalog = () => Promise.resolve(sampleWithBanner)
  store.selected = design => { selected = design }
  try {
    const { page, calls } = pageWith(sampleWithBanner)
    page.load()
    await new Promise(resolve => setImmediate(resolve))
    page.use({ currentTarget: { dataset: { i: 0 } } })
    assert.equal(selected.tplId, sample.templates[0].id)
    assert.ok(calls.some(([kind, url]) => kind === 'navigate' && url === '/pages/finish/finish'))
  } finally { api.catalog = oldCatalog; store.selected = oldSelected }
})

test('home articles appear only when catalog supplies them and open content page', async () => {
  const old = api.catalog
  api.catalog = () => Promise.resolve({ ...sampleWithBanner, homeArticles: [{ id: 'a1', title: '月光石的光', body: ['光从层间反射而来'] }] })
  try {
    const { page, calls } = pageWith(sampleWithBanner)
    page.load()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.data.homeArticles[0].summary, '光从层间反射而来')
    page.articleTap({ currentTarget: { dataset: { i: 0 } } })
    assert.ok(calls.some(([kind, url]) => kind === 'navigate' && url === '/features/article/article?id=a1'))
  } finally { api.catalog = old }
})

test('home quick entrances keep their distinct destinations', () => {
  const old = store.current
  store.current = () => ({ beads: ['b1'] })
  try {
    const { page, calls } = pageWith(sampleWithBanner)
    page.ai(); page.photo(); page.tryLast()
    assert.deepEqual(calls, [
      ['tab', '/pages/ai/ai'],
      ['navigate', '/pages/photo/photo'],
      ['navigate', '/features/tryon/tryon']
    ])
  } finally { store.current = old }
})

test('home banner page target follows configured route', () => {
  const { page, calls } = pageWith(sampleWithBanner)
  page.data.banners = [{ target: { type: 'page', id: 'pages/ai/ai' } }]
  page.bannerTap({ currentTarget: { dataset: { i: 0 } } })
  assert.deepEqual(calls, [['tab', '/pages/ai/ai']])
})
