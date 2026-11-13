const assert = require('node:assert/strict')
const auth = require('../utils/auth')
let definition, destination = ''
global.Page = value => { definition = value }
global.wx = { navigateTo: ({url}) => { destination = url }, redirectTo: ({url}) => { destination = url } }
function page() {
  const p = { ...definition, data: JSON.parse(JSON.stringify(definition.data)) }
  p.setData = value => Object.assign(p.data, value)
  return p
}
async function run() {
  const options = { types: [{ type: '退货退款', label: '退货退款', refundFen: 1200,
    reasons: ['珠子有裂纹或瑕疵', '其他'] }] }
  let submitted
  auth.authorized = async (path, body) => {
    if (path.endsWith('/after-sale-options')) return options
    if (path.endsWith('/after-sales')) { submitted = body; return { afterSale: { no: 'AS-1' } } }
    return { name: '手串', phone: '13800000000' }
  }
  require('../features/after-sale/type')
  let p = page(); await p.onLoad({ no: 'C9-1' })
  assert.equal(p.data.types[0].type, '退货退款')
  p.select({ currentTarget: { dataset: { type: '退货退款' } } })
  assert.match(destination, /after-sale\/apply\?no=C9-1&type=/)
  require('../features/after-sale/apply')
  p = page(); p.onLoad({ no: 'C9-1', type: '退货退款' }); await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(p.data.reasons, options.types[0].reasons)
  assert.equal(p.data.amount, '12.00')
  await p.submit(); assert.equal(submitted, undefined)
  p.chooseReason({ currentTarget: { dataset: { reason: '珠子有裂纹或瑕疵' } } })
  await p.submit(); assert.match(p.data.photoError, /质量问题/)
  p.setData({ photos: [{ id: 'photo-1', path: 'a.jpg' }] })
  await p.submit()
  assert.deepEqual(submitted.photoIds, ['photo-1'])
  assert.equal(submitted.contactPhone, '13800000000')
  assert.equal(destination, '/features/after-sale/detail?no=AS-1')
  console.log('售后类型、原因、金额、照片校验与提交跳转检查通过')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
