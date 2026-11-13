const { test } = require('node:test')
const assert = require('node:assert/strict')
const auth = require('../utils/auth')
const { queue } = require('../utils/toast')

function pageOf(modulePath) {
  let page
  global.Page = definition => {
    page = { ...definition, data: { ...definition.data }, setData(update) { Object.assign(this.data, update) } }
  }
  delete require.cache[require.resolve(modulePath)]
  require(modulePath)
  return page
}

test('address selection returns the selected row through the opener channel', () => {
  const calls = []
  global.wx = { navigateBack: () => calls.push('back') }
  const page = pageOf('../features/address/address')
  page.setData({ selecting: true, rows: [{ id: 'sample', person: '示例', phone: '10000000000' }] })
  page.getOpenerEventChannel = () => ({ emit: (name, row) => calls.push([name, row.id]) })
  page.select({ currentTarget: { dataset: { id: 'sample' } } })
  assert.deepEqual(calls, [['selectAddress', 'sample'], 'back'])
})

test('address deletion offers undo and recreates the deleted address', async () => {
  const previousAuth = auth.authorized, previousShow = queue.show
  const calls = []
  let toast
  global.wx = { navigateBack: () => calls.push('back') }
  global.getCurrentPages = () => [{ load: () => calls.push('reload') }]
  auth.authorized = async (path, data, method) => { calls.push([method, path, data]); return {} }
  queue.show = options => { toast = options }
  try {
    const page = pageOf('../features/address-edit/address-edit')
    page.setData({ id: 'sample', person: '示例', phone: '10000000000', region: ['浙江省', '杭州市', '西湖区'], detail: '示例路 1 号', isDefault: false })
    await page.remove()
    assert.deepEqual(calls[0], ['DELETE', '/my/addresses', { id: 'sample' }])
    assert.equal(toast.action, '撤销')
    await toast.onAction()
    assert.equal(calls[2][0], 'POST')
    assert.equal(calls[2][1], '/my/addresses')
    assert.equal(calls[2][2].person, '示例')
    assert.ok(calls.includes('reload'))
  } finally { auth.authorized = previousAuth; queue.show = previousShow }
})

test('invalid phone stays on edit page and scrolls to phone row', async () => {
  const calls = []
  global.wx = { pageScrollTo: options => calls.push(options.selector) }
  const page = pageOf('../features/address-edit/address-edit')
  page.setData({ person: '示例', phone: '1000000000', region: ['浙江省', '杭州市', '西湖区'], detail: '示例路 1 号' })
  await page.save()
  assert.equal(page.data.errors.phone, '手机号是 11 位数字')
  assert.deepEqual(calls, ['#row-phone'])
})
