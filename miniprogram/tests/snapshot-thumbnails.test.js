const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const original = { id: 'a', mm: 8, colors: ['#112233', '#445566'], photo: '/old.png', photoMd: '/old-md.png', photoSm: '/old-sm.png' }
const changedCatalog = [{ id: 'a', mm: 8, colors: ['#ffffff', '#000000'], photo: '/new.png' }]
const order = { no: 'O-1', name: '旧订单', beads: ['a'], designSnapshot: { sequence: [original] }, customerStatus: { code: 'completed' } }

test('我的订单缩略图直接使用冻结珠序，商品改色后不变', async () => {
  const pagePath = path.resolve(__dirname, '../features/orders/orders.js')
  const authPath = path.resolve(__dirname, '../utils/auth.js')
  const oldPage = global.Page, oldAuth = require.cache[authPath], oldDefinition = require.cache[pagePath]
  let definition
  global.Page = value => { definition = value }
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: { hasSession: () => true, authorized: async () => [order] } }
  delete require.cache[pagePath]
  try {
    require(pagePath)
    const page = { ...definition, data: { ...definition.data, catalog: changedCatalog }, setData(update) { Object.assign(this.data, update) } }
    await page.loadOrders(false)
    assert.deepEqual(page.data.rows[0].visual, [original])
    assert.equal(page.data.rows[0].visual[0].colors[0], '#112233')
    assert.match(fs.readFileSync(path.resolve(__dirname, '../features/orders/orders.wxml'), 'utf8'), /bracelet-thumb beads="{{item.visual}}"/)
  } finally {
    global.Page = oldPage
    if (oldAuth) require.cache[authPath] = oldAuth; else delete require.cache[authPath]
    if (oldDefinition) require.cache[pagePath] = oldDefinition; else delete require.cache[pagePath]
  }
})

test('售后详情缩略图直接使用冻结珠序，商品改色后不变', () => {
  const pagePath = path.resolve(__dirname, '../features/after-sale/detail.js')
  const oldPage = global.Page, oldDefinition = require.cache[pagePath]
  let definition
  global.Page = value => { definition = value }
  delete require.cache[pagePath]
  try {
    require(pagePath)
    const page = { ...definition, data: { ...definition.data, catalog: changedCatalog }, setData(update) { Object.assign(this.data, update) } }
    page.setOrder(order)
    assert.deepEqual(page.data.product.beads, [original])
    assert.equal(page.data.product.beads[0].photoSm, '/old-sm.png')
    assert.match(fs.readFileSync(path.resolve(__dirname, '../features/after-sale/detail.wxml'), 'utf8'), /bracelet-thumb beads="{{product.beads}}"\s*\/>/)
  } finally {
    global.Page = oldPage
    if (oldDefinition) require.cache[pagePath] = oldDefinition; else delete require.cache[pagePath]
  }
})
