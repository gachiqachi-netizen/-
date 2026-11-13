// Run with: node miniprogram/tests/order.test.js
const assert = require('assert')
const fs = require('fs')
const path = require('path')
let definition
const storage = {}
let navigated = '', continued = 0
let session = true
let currentPage = null

global.Page = value => { definition = value }
global.getCurrentPages = () => currentPage ? [currentPage] : []
global.getApp = () => ({ globalData: { catalog: { beads: [] }, apiBase: 'https://example.test' } })
global.wx = {
  getStorageSync: key => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  navigateTo: options => { navigated = options.url },
  navigateBack: options => { if (options.success) options.success() },
  reLaunch: options => { navigated = options.url },
  showToast: () => {},
}
const api = require('../utils/api'), auth = require('../utils/auth')
require('../pages/order/order')
auth.hasSession = () => session
auth.goLogin = next => { continued++; assert.deepStrictEqual(next, { type: 'submitOrder' }) }
function page() {
  const p = { ...definition, data: JSON.parse(JSON.stringify(definition.data)) }
  p.setData = (value, callback) => { Object.assign(p.data, value); if (callback) callback() }
  p.data.design = { name: '测试', beads: ['a', 'a', 'a', 'a', 'a', 'a'], wrist: 15 }
  p.data.person = '测试'; p.data.phone = '13800000000'; p.data.addr = '测试地址'
  p.data.agreed = true // C7a has one required checkbox; keep old quote assertions on a legal order.
  return p
}
const catalog = (value, pricing) => ({ beads: [{ id: 'a', name: '珠子', mm: 8, price: value }], pricing })
async function run() {
  const source = fs.readFileSync(path.join(__dirname, '../pages/order/order.wxml'), 'utf8')
  const logic = fs.readFileSync(path.join(__dirname, '../pages/order/order.js'), 'utf8')
  assert.strictEqual((source.match(/class="check /g) || []).length, 1)
  assert(!logic.includes('wx.showModal(')) // No second confirmation dialog.
  let requests = 0, next = catalog(3)
  api.catalog = async force => { assert.strictEqual(force, true); return next }
  auth.authorized = async (_, body) => {
    requests++
    assert.deepStrictEqual(body.confirmedQuote, { totalFen: 5300, items: [{ id: 'a', unitPriceFen: 500, mm: 8 }] })
    return { no: 'TEST', status: '待支付', total: 53, requestId: body.requestId }
  }
  let p = page(); p.catalog = next.beads; p.calculate(); p.data.catalogReady = true; next = catalog(5)
  await p.submit(); assert.strictEqual(requests, 0); assert.strictEqual(p.data.sheet, 'price'); assert.strictEqual(p.data.total, '53.00')
  p.acceptPrice(); assert.strictEqual(requests, 0) // Reprice requires a fresh tap on submit.
  await p.submit(); assert.strictEqual(requests, 1); assert.strictEqual(p.data.order.status, '待支付')

  p = page(); p.catalog = catalog(3).beads; p.calculate(); p.data.catalogReady = true
  api.catalog = async () => { throw new Error('离线') }
  await p.submit(); assert.strictEqual(requests, 1); assert.match(p.data.error, /网络不太好/)
  p = page(); p.catalog = catalog(3).beads; p.calculate(); p.data.catalogReady = true
  api.catalog = async () => catalog(3)
  p.data.agreed = false
  await p.submit(); assert.strictEqual(requests, 1); assert.strictEqual(p.data.agreeError, true)

  p = page(); p.catalog = catalog(3).beads; p.calculate(); p.data.catalogReady = true
  api.catalog = async () => ({ beads: [] })
  await p.submit(); assert.strictEqual(requests, 1); assert.match(p.data.error, /下架/)
  p = page(); p.catalog = catalog(3).beads; p.calculate(); p.data.catalogReady = true
  let refresh = 0; api.catalog = async () => catalog(++refresh === 1 ? 3 : 5)
  auth.authorized = async () => { const e = new Error('价格已变化'); e.code = 'price_changed'; throw e }
  await p.submit(); assert.strictEqual(p.data.total, '53.00'); assert.strictEqual(p.data.sheet, 'price'); assert.strictEqual(p.data.quotePending, true)

  // The login page calls continueAfterLogin; it should invoke the same page's submit once.
  p = page(); p.catalog = catalog(3).beads; p.calculate(); p.data.catalogReady = true
  api.catalog = async () => catalog(3)
  session = false; currentPage = p
  await p.submit(); assert.strictEqual(continued, 1); assert.strictEqual(requests, 1)
  session = true
  auth.authorized = async () => { requests++; return { no: 'LOGIN', status: '待支付' } }
  auth.continueAfterLogin({ type: 'submitOrder' })
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.strictEqual(requests, 2); assert.strictEqual(p.data.order.no, 'LOGIN')

  // Two taps during a pending request still use one request ID and create one order.
  p = page(); p.catalog = catalog(3).beads; p.calculate(); p.data.catalogReady = true
  api.catalog = async () => catalog(3)
  let release
  const pending = new Promise(resolve => { release = resolve })
  let created = 0
  auth.authorized = async () => { created++; await pending; return { no: 'ONCE', status: '待支付' } }
  const first = p.submit(), second = p.submit()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.strictEqual(created, 1)
  release(); await Promise.all([first, second]); assert.strictEqual(created, 1)

  const priced = page()
  const defaultPricing = { handworkFen: 1500, cordFen: 500, giftFen: 1000, shippingFen: 800, freeShippingThresholdFen: 9900 }
  api.catalog = async () => catalog(3, defaultPricing)
  await priced.loadCatalog(); assert.strictEqual(priced.data.total, '41.00')
  api.catalog = async () => catalog(3, { ...defaultPricing, handworkFen: 0 })
  await priced.loadCatalog(); assert.strictEqual(priced.data.total, '26.00')
  api.catalog = async () => catalog(3, { ...defaultPricing, freeShippingThresholdFen: null })
  await priced.loadCatalog(); assert.strictEqual(priced.data.ship, '8.00'); assert.strictEqual(priced.data.shipNote, ''); assert.strictEqual(priced.data.total, '41.00')
  // The submitted quote is the integer-fen total displayed in the bar.
  assert.strictEqual(Math.round(Number(priced.data.total) * 100), 4100)
  console.log('订单单勾选、登录续提交、幂等、价格复核与 catalog pricing 检查通过')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
