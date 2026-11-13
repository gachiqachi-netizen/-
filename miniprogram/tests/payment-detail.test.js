const test = require('node:test')
const assert = require('node:assert/strict')
const auth = require('../utils/auth')
const api = require('../utils/api')
let definition, route = ''
global.Page = value => { definition = value }
global.getApp = () => ({ globalData: { apiBase: 'https://example.test' } })
global.wx = { reLaunch: o => { route = o.url }, navigateTo: o => { route = o.url },
  showToast: () => {}, stopPullDownRefresh: () => {}, setClipboardData: o => o.success(),
  getStorageSync: () => ({}), setStorageSync: () => {} }
function page(value) { const p = { ...value, data: JSON.parse(JSON.stringify(value.data)) }; p.setData = (d, cb) => { Object.assign(p.data, d); if (cb) cb() }; return p }

test('提交成功立即开启模拟付款；金额使用付款接口的整数分', async () => {
  require('../pages/order/order')
  const p = page(definition)
  const calls = []
  p.data.order = { no: 'N1' }
  auth.authorized = async (path, data) => {
    calls.push([path, data])
    if (path.endsWith('/pay')) return { payment: { mock: true, paymentId: 'P1', amountFen: 7805 } }
    if (path === '/payments/mock/notify') return {}
    return { no: 'N1', paymentStatus: 'paid' }
  }
  await p.startPayment('N1')
  assert.equal(p.data.sheet, 'payment')
  assert.equal(p.data.paymentAmount, '78.05')
  await p.finishPayment({ currentTarget: { dataset: { result: 'success' } } })
  assert.deepEqual(calls.map(c => c[0]), ['/my/orders/N1/pay', '/payments/mock/notify', '/my/orders/N1'])
  assert.equal(calls[1][1].paymentId, 'P1')
  assert.match(route, /paid=1$/)
})

test('付款失败重新拉单后进入待支付详情', async () => {
  const p = page(definition)
  p.data.order = { no: 'N2' }; p.data.payment = { paymentId: 'P2' }
  auth.authorized = async path => path === '/my/orders/N2' ? { paymentStatus: 'unpaid' } : {}
  await p.finishPayment({ currentTarget: { dataset: { result: 'fail' } } })
  assert.equal(route, '/features/order-detail/order-detail?no=N2')
})

test('订单详情只读单笔接口和后端状态、按钮，付款后重新拉取', async () => {
  require('../features/order-detail/order-detail')
  const p = page(definition)
  const raw = { no: 'N3', name: '一点红', beads: [], payableFen: 7800, goodsFen: 7000, shippingFen: 800,
    paymentStatus: 'unpaid', customerStatus: { code: 'pending_payment', label: '待支付', desc: '等待付款' }, allowedActions: ['pay_order'] }
  const calls = []
  auth.authorized = async (path, data) => { calls.push(path); if (path.endsWith('/pay')) return { payment: { mock: true, paymentId: 'P3', amountFen: 7800 } }; if (path === '/my/orders/N3') return raw; return {} }
  await p.onLoad({ no: 'N3' })
  assert.equal(p.data.order.state.label, '待支付')
  assert.equal(p.data.order.state.actions[0].code, 'pay_order')
  assert.equal(p.data.order.payable, '¥78')
  await p.startPayment()
  assert.equal(p.data.sheet, 'payment')
  raw.paymentStatus = 'paid'; raw.customerStatus = { code: 'producing', label: '制作中', desc: '正在制作' }; raw.allowedActions = []
  await p.finishPayment({ currentTarget: { dataset: { result: 'success' } } })
  assert.equal(p.data.order.state.label, '制作中')
  assert.equal(p.data.paidLanding, true)
  assert.deepEqual(calls, ['/my/orders/N3', '/my/orders/N3/pay', '/payments/mock/notify', '/my/orders/N3'])
})
