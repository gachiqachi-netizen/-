const test = require('node:test')
const assert = require('node:assert/strict')
const auth = require('../../utils/auth')
let definition
const notices = []
let copied = ''
global.Page = value => { definition = value }
global.wx = {
  setClipboardData: options => { copied = options.data; options.success() },
  showToast: options => notices.push(options.title),
  pageScrollTo: () => {}, stopPullDownRefresh: () => {},
}
require('./logistics')
function page() {
  const p = { ...definition, data: JSON.parse(JSON.stringify(definition.data)), no: 'ORDER' }
  p.setData = value => Object.assign(p.data, value)
  return p
}

test('without tracking provider only waybill is visible and copy gives feedback', async () => {
  const previous = auth.authorized
  auth.authorized = async () => ({ no: 'ORDER', person: '测试用户', addr: '测试地区',
    logistics: { carrierName: '测试快递', trackingNo: 'TEST-1' },
    logisticsHistory: [{ at: 1, detail: '后台内部记录' }], allowedActions: [] })
  try {
    const p = page(); await p.load()
    assert.equal(p.data.carrier, '测试快递')
    assert.equal(p.data.trackingNo, 'TEST-1')
    assert.deepEqual(p.data.tracks, [])
    assert.equal(p.data.canEdit, false)
    p.copyNo(); assert.equal(copied, 'TEST-1'); assert.equal(notices.at(-1), '单号已复制')
  } finally { auth.authorized = previous }
})

test('only edit_address permission allows pre-shipment address update', async () => {
  const previous = auth.authorized
  const calls = []
  auth.authorized = async (path, data, method) => {
    calls.push({ path, data, method })
    if (method === 'POST') return { ok: true }
    return { no: 'ORDER', person: '测试用户', phone: '13800000000', addr: '旧地址',
      logistics: null, allowedActions: ['edit_address'] }
  }
  try {
    const p = page(); p.addressMode = true; await p.load()
    assert.equal(p.data.canEdit, true); assert.equal(p.data.editOpen, true)
    p.setData({ person: '新收货人', phone: '13800000000', region: ['测试省', '测试市', '测试区'], detail: '测试门牌' })
    await p.saveAddress()
    assert.equal(calls[1].path, '/my/orders/ORDER/address')
    assert.equal(calls[1].method, 'POST')
    assert.equal(calls[1].data.addr, '测试省 测试市 测试区 测试门牌')
    assert.equal(notices.at(-1), '地址已改')
  } finally { auth.authorized = previous }
})

test('shipped order never opens address editor', async () => {
  const previous = auth.authorized
  auth.authorized = async () => ({ no: 'ORDER', person: '测试用户', addr: '测试地区',
    logistics: { trackingNo: 'TEST-2' }, allowedActions: [] })
  try {
    const p = page(); p.addressMode = true; await p.load(); p.editAddress()
    assert.equal(p.data.canEdit, false); assert.equal(p.data.editOpen, false)
  } finally { auth.authorized = previous }
})
