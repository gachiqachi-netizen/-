const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const auth = require('../utils/auth')
let definition
const preview = []
global.Page = value => { definition = value }
global.getApp = () => ({ globalData: { apiBase: 'https://example.test' } })
global.wx = { previewImage: options => preview.push(options) }
require('../features/order-detail/order-detail')
function page() {
  const p = { ...definition, no: 'O1', data: { ...definition.data }, catalogPromise: Promise.resolve({ pricing: {} }) }
  p.setData = patch => { for (const [key,value] of Object.entries(patch)) { const [root,index] = key.split('.'); if (index) p.data[root][index] = value; else p.data[key] = value } }
  return p
}
test('订单详情只把 qcPhotos 链接补全，且无图时不渲染实拍图块', async () => {
  const original = auth.authorized
  let raw = { no: 'O1', name: '手串', beads: [], items: [], qcPhotos: ['/api/uploads/demo.png'], customerStatus: { code: 'shipped', label: '已发货' }, allowedActions: [] }
  auth.authorized = async () => raw
  try { const p=page(); await p.load(); assert.deepEqual(p.data.order.qcPhotos,['https://example.test/api/uploads/demo.png']); assert.equal(p.data.ready,true)
    const markup=fs.readFileSync(path.join(__dirname,'../features/order-detail/order-detail.wxml'),'utf8')
    assert.match(markup,/wx:if="{{order.qcPhotos.length}}"/)
    assert.match(markup,/<c-skeleton[^>]*shape="block"/)
    assert.match(markup,/bindtap="previewQcPhoto"/)
    p.previewQcPhoto({currentTarget:{dataset:{index:0}}})
    assert.deepEqual(preview.at(-1),{current:'https://example.test/api/uploads/demo.png',urls:['https://example.test/api/uploads/demo.png']})
    raw = { ...raw, qcPhotos: [] }; await p.load(); assert.deepEqual(p.data.order.qcPhotos, [])
  } finally {auth.authorized=original}
})
