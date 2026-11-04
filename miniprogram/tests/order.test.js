// Run with: node miniprogram/tests/order.test.js
const assert = require('assert')
let definition
global.Page = value => { definition = value }
const storage = {}
let confirmSize=true
global.wx = { showModal: options=>options.success({confirm:confirmSize}), getStorageSync: key => storage[key], setStorageSync: (key, value) => { storage[key] = value } }
const api = require('../utils/api'), auth = require('../utils/auth')
require('../pages/order/order')
function page() {
  const p = {...definition, data: JSON.parse(JSON.stringify(definition.data))}
  p.setData = (value, callback) => { Object.assign(p.data, value); if(callback) callback() }
  p.data.design = {name:'测试', beads:['a','a','a','a','a','a'], wrist:15}
  p.data.person = '测试'; p.data.phone = '13800000000'; p.data.addr = '测试地址'
  return p
}
const catalog = price => ({beads:[{id:'a',name:'珠子',mm:8,price}]})
async function run() {
  let requests = 0, next = catalog(3)
  api.catalog = async force => { assert.strictEqual(force, true); return next }
  auth.authorized = async (_, body) => { requests++; assert.deepStrictEqual(body.confirmedQuote,{totalFen:5300,items:[{id:'a',unitPriceFen:500,mm:8}]}); return {no:'TEST',status:'待支付',total:53, requestId:body.requestId} }
  let p = page(); p.catalog = next.beads; p.calculate(); next = catalog(5)
  await p.submit(); assert.strictEqual(requests, 0); assert.match(p.data.error, /更新/); assert.strictEqual(p.data.total, '53.00')
  confirmSize=false; await p.submit(); assert.strictEqual(requests,0); assert.match(p.data.error,/确认尺寸/); confirmSize=true;
  await p.submit(); assert.strictEqual(requests, 1); assert.strictEqual(p.data.order.status, '待支付')
  p = page(); p.catalog = catalog(3).beads; p.calculate(); api.catalog = async () => { throw new Error('离线') }
  await p.submit(); assert.strictEqual(requests, 1); assert.strictEqual(p.data.catalogReady, false); assert.match(p.data.error, /离线/)
  p = page(); p.catalog = catalog(3).beads; p.calculate(); api.catalog = async () => ({beads:[]})
  await p.submit(); assert.strictEqual(requests, 1); assert.match(p.data.error, /下架/)
  p = page(); p.catalog = catalog(3).beads; p.calculate(); let refresh=0;api.catalog = async () => catalog(++refresh===1?3:5)
  auth.authorized = async () => { const e=new Error('价格已变化');e.code='price_changed';throw e }
  await p.submit();assert.strictEqual(p.data.total,'53.00');assert.strictEqual(p.data.catalogReady,true);assert.match(p.data.error,/核对/)
  console.log('订单目录更新、失联、下架和重试检查通过')
}
run().catch(err => { console.error(err); process.exitCode = 1 })
