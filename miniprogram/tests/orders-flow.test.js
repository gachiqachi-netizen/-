const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

test('订单列表使用服务端状态，售后分栏按售后编号打开详情', async () => {
  const pagePath = path.resolve(__dirname, '../features/orders/orders.js')
  const authPath = path.resolve(__dirname, '../utils/auth.js')
  const apiPath = path.resolve(__dirname, '../utils/api.js')
  const oldAuth = require.cache[authPath], oldApi = require.cache[apiPath], oldPage = global.Page, oldWx = global.wx
  const urls = []
  let definition
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: {
    hasSession: () => true,
    authorized: async url => url.endsWith('/after-sales')
      ? { afterSales: [{ no: 'AS-1', orderNo: 'O-1' }] }
      : [{ no: 'O-1', name: '测试手串', beads: [], items: [], payableFen: 100,
        customerStatus: { code: 'after_sale_open', label: '售后处理中', tone: 'attention' },
        state: { afterSale: { code: 'requested' } } }],
  } }
  require.cache[apiPath] = { id: apiPath, filename: apiPath, loaded: true, exports: { catalog: async () => ({ beads: [] }) } }
  global.Page = value => { definition = value }
  global.wx = { navigateTo: ({ url }) => urls.push(url) }
  delete require.cache[pagePath]
  try {
    require(pagePath)
    const page = { ...definition, data: { ...definition.data }, setData(update) { Object.assign(this.data, update) } }
    await page.loadOrders(true)
    assert.equal(page.data.rows[0].code, 'after_sale_open')
    assert.equal(page.data.counts.after_sale, 1)
    page.setData({ tab: 'after_sale' })
    await page.viewDetail({ currentTarget: { dataset: { no: 'O-1' } } })
    assert.equal(urls[0], '/features/after-sale/detail?no=AS-1')
  } finally {
    delete require.cache[pagePath]
    if (oldAuth) require.cache[authPath] = oldAuth; else delete require.cache[authPath]
    if (oldApi) require.cache[apiPath] = oldApi; else delete require.cache[apiPath]
    global.Page = oldPage; global.wx = oldWx
  }
})
