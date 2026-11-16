const test = require('node:test')
const assert = require('node:assert/strict')

test('订单详情的评价和售后动作打开已注册页面', () => {
  const oldPage = global.Page, oldWx = global.wx
  const urls = []
  let definition
  global.Page = value => { definition = value }
  global.wx = { navigateTo: ({ url }) => urls.push(url) }
  const pagePath = require.resolve('../features/order-detail/order-detail')
  delete require.cache[pagePath]
  try {
    require(pagePath)
    const page = { ...definition, no: 'O-1', data: { ...definition.data } }
    for (const code of ['write_review', 'request_after_sale', 'edit_address']) {
      page.runAction({ currentTarget: { dataset: { code } } })
    }
    assert.deepEqual(urls, [
      '/features/review/review?orderId=O-1',
      '/features/after-sale/type?no=O-1',
      '/features/address-edit/address-edit?orderNo=O-1',
    ])
  } finally {
    delete require.cache[pagePath]
    global.Page = oldPage; global.wx = oldWx
  }
})
