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
    assert.match(fs.readFileSync(path.resolve(__dirname, '../features/orders/orders.wxml'), 'utf8'), /c-bracelet beads="{{item.visual}}" tier="s"/)
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
    assert.match(fs.readFileSync(path.resolve(__dirname, '../features/after-sale/detail.wxml'), 'utf8'), /c-bracelet beads="{{product.beads}}" tier="s"\s*\/>/)
  } finally {
    global.Page = oldPage
    if (oldDefinition) require.cache[pagePath] = oldDefinition; else delete require.cache[pagePath]
  }
})

test('订单详情、售后详情和评价都用冻结珠序，三处手串均有照片和颜色', async () => {
  const orderWxml = fs.readFileSync(path.resolve(__dirname, '../features/order-detail/order-detail.wxml'), 'utf8')
  assert.match(orderWxml, /c-bracelet beads="{{order\.designSnapshot\.sequence}}" tier="s"/)
  const saleWxml = fs.readFileSync(path.resolve(__dirname, '../features/after-sale/detail.wxml'), 'utf8')
  assert.match(saleWxml, /c-bracelet beads="{{product\.beads}}" tier="s"/)
  const reviewWxml = fs.readFileSync(path.resolve(__dirname, '../features/review/review.wxml'), 'utf8')
  assert.match(reviewWxml, /c-bracelet beads="{{beads}}" tier="s"/)
  const pagePath = path.resolve(__dirname, '../features/review/review.js')
  const authPath = path.resolve(__dirname, '../utils/auth.js')
  const oldPage = global.Page, oldAuth = require.cache[authPath], oldDefinition = require.cache[pagePath]
  let definition
  global.Page = value => { definition = value }
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: { authorized: async () => order } }
  delete require.cache[pagePath]
  try {
    require(pagePath)
    const page = { ...definition, data: { ...definition.data }, setData(update) { Object.assign(this.data, update) } }
    page.onLoad({ orderId: order.no })
    await new Promise(resolve => setImmediate(resolve))
    const salePath = path.resolve(__dirname, '../features/after-sale/detail.js')
    const oldSale = require.cache[salePath]
    let saleDefinition
    global.Page = value => { saleDefinition = value }
    delete require.cache[salePath]
    require(salePath)
    const salePage = { ...saleDefinition, data: { ...saleDefinition.data }, setData(update) { Object.assign(this.data, update) } }
    salePage.setOrder(order)
    if (oldSale) require.cache[salePath] = oldSale; else delete require.cache[salePath]
    const sequences = [order.designSnapshot.sequence, salePage.data.product.beads, page.data.beads]
    assert.deepEqual(page.data.beads, order.designSnapshot.sequence)
    assert.equal(page.data.beads[0].photoSm, '/old-sm.png')
    assert.deepEqual(page.data.beads[0].colors, original.colors)
    const { layout } = require('../components/bracelet/index')
    for (const sequence of sequences) assert.ok(layout(sequence, 144, 's').length > 0)
  } finally {
    global.Page = oldPage
    if (oldAuth) require.cache[authPath] = oldAuth; else delete require.cache[authPath]
    if (oldDefinition) require.cache[pagePath] = oldDefinition; else delete require.cache[pagePath]
  }
})
