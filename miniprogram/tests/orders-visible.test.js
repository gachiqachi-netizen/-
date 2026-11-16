const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')

const pagePath = path.resolve(__dirname, '../features/orders/orders.js')
const authPath = path.resolve(__dirname, '../utils/auth.js')
const statuses = ['pending_payment', 'producing', 'in_transit', 'after_sale_open', 'completed']

test('五笔订单切换每个分栏时 visible 条数与分栏数字一致', async () => {
  const previousPage = global.Page
  const previousAuth = require.cache[authPath]
  const previousDefinition = require.cache[pagePath]
  let definition
  global.Page = value => { definition = value }
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: {
    hasSession: () => true,
    authorized: async () => statuses.map((code, index) => ({
      no: `ORDER-${index}`, name: `手串${index}`, beads: [], items: [], payableFen: 100,
      customerStatus: { code, label: code, tone: 'normal' },
    })),
  } }
  delete require.cache[pagePath]
  try {
    require(pagePath)
    const page = { ...definition, data: { ...definition.data }, setData(update) { Object.assign(this.data, update) } }
    page.onLoad({ tab: 'all' })
    await page.loadOrders(true)
    assert.equal(page.data.rows.length, 5)
    for (const tab of page.data.tabs) {
      page.switchTab({ currentTarget: { dataset: { key: tab.key } } })
      assert.equal(page.data.visible.length, page.data.counts[tab.key], tab.key)
    }
    assert.equal(page.data.visible.length, 1)
  } finally {
    global.Page = previousPage
    if (previousAuth) require.cache[authPath] = previousAuth; else delete require.cache[authPath]
    if (previousDefinition) require.cache[pagePath] = previousDefinition; else delete require.cache[pagePath]
  }
})

test('订单 WXML 只读 data.visible，不调用页面方法', () => {
  const markup = fs.readFileSync(path.resolve(__dirname, '../features/orders/orders.wxml'), 'utf8')
  assert.match(markup, /wx:for="{{visible}}"/)
  assert.match(markup, /!visible\.length/)
  assert.doesNotMatch(markup, /visibleRows\(\)/)
})
