const test = require('node:test')
const assert = require('node:assert/strict')
const api = require('../utils/api')

const A = '1111111111111111', B = '2222222222222222'
function setup(version = A) {
  const cached = {version, beads: [{id: 'a', mm: 8}], templates: [], banners: [], pricing: {}}
  const storage = {[`cgz_catalog_v_${version}`]: cached, cgz_catalog_version: version}
  const writes = [], loads = []
  const g = {apiBase: 'http://test', catalog: null}
  global.getApp = () => ({globalData: g})
  global.getCurrentPages = () => [{route: 'pages/home/home', setData() {}, load() { loads.push(true) }}]
  global.wx = {
    getAccountInfoSync: () => ({miniProgram: {envVersion: 'release'}}),
    getStorageSync: key => storage[key],
    setStorageSync(key, value) { storage[key] = value; writes.push(key) },
    removeStorageSync(key) { delete storage[key] },
  }
  return {cached, storage, writes, loads, g}
}

test('本机目录立即返回，后台请求带版本', async () => {
  const {cached} = setup()
  let pending
  wx.request = options => { pending = options }
  const result = await api.catalog()
  assert.equal(result, cached)
  assert.match(pending.url, /\/api\/catalog\?v=1111111111111111$/)
  pending.success({statusCode: 200, data: {unchanged: true, version: A}})
  await new Promise(resolve => setTimeout(resolve, 0))
})

test('版本不变不替换本机目录，也不通知页面', async () => {
  const {cached, writes, loads, g} = setup()
  wx.request = options => options.success({statusCode: 200, data: {unchanged: true, version: A}})
  assert.equal(await api.catalog(), cached)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(g.catalog, cached)
  assert.deepEqual(writes, [])
  assert.equal(loads.length, 0)
})

test('版本变化保存新目录并通知页面刷新', async () => {
  const {storage, writes, loads, g} = setup()
  const next = {version: B, beads: [{id: 'b', mm: 10}], templates: [], banners: [], pricing: {}}
  wx.request = options => options.success({statusCode: 200, data: next})
  const immediate = await api.catalog()
  assert.equal(immediate.version, A)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(g.catalog.version, B)
  assert.equal(storage.cgz_catalog_version, B)
  assert.equal(storage[`cgz_catalog_v_${B}`], next)
  assert.ok(writes.includes(`cgz_catalog_v_${B}`))
  assert.equal(loads.length, 1)
})

test('超过 1MB 的目录不写手机存储', async () => {
  const {writes} = setup()
  const huge = {version: B, beads: [{id: 'b', name: '珠'.repeat(400000)}], templates: [], banners: []}
  wx.request = options => options.success({statusCode: 200, data: huge})
  await api.catalog()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.deepEqual(writes, [])
})

test('较早的后台校验不能覆盖强制刷新报价', async () => {
  const {g} = setup()
  const pending = []
  wx.request = options => pending.push(options)
  await api.catalog()
  const forced = api.catalog(true)
  assert.equal(pending.length, 2)
  const latest = {version: B, beads: [{id: 'b', mm: 10}], templates: [], banners: [], pricing: {}}
  pending[1].success({statusCode: 200, data: latest})
  await forced
  pending[0].success({statusCode: 200, data: {version: A, beads: [{id: 'old'}]}})
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(g.catalog, latest)
})
