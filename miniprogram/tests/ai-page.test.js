const test = require('node:test')
const assert = require('node:assert/strict')
const api = require('../utils/api')

let definition
const saved = new Map()
global.Page = value => { definition = value }
global.wx = {
  getStorageSync: key => key === 'cgz_wrist' ? 15 : saved.get(key),
  setStorageSync: (key, value) => saved.set(key, value),
  removeStorageSync: key => saved.delete(key),
}
require('../pages/ai/ai')

function page(pricing = {}) {
  const p = { ...definition, data: JSON.parse(JSON.stringify(definition.data)), catalog: [{ id: 'b', priceFen: 300, price: 3 }], pricing }
  p.setData = values => Object.assign(p.data, values)
  return p
}

function stub(response) {
  api.request = async path => {
    if (path === '/ai/design') return response
    throw new Error('不该调用方案库')
  }
}

const recipe = { name: '旧名字', pattern: ['b'], meaning: '旧寓意' }

test('有 plans 时卡片字段只取 plans，兼容 designs 被删除', async () => {
  stub({
    designs: [{ ...recipe, name: '不能用的名字', beads: ['wrong'], count: 99, lengthMm: 999, payableFen: 99999 }],
    plans: [{ name: '白月光', beads: ['b', 'b'], count: 18, lengthMm: 162, payableFen: 10400, line: '温柔、纯净' }],
    reply: '先看看这条。',
  })
  const p = page(); p.data.text = '清冷一点'; await p.submit()
  const result = p.data.messages[1].results[0]
  assert.equal(result.name, '白月光')
  assert.deepEqual(result.beads, ['b', 'b'])
  assert.equal(result.count, 18)
  assert.equal(result.lengthMm, 162)
  assert.equal(result.lengthCm, '16.2')
  assert.equal(result.priceText, '¥104')
  stub({ plans: [{ name: '只有 plans', beads: ['b'], count: 1, lengthMm: 100, payableFen: 900 }], reply: '可以试试。' })
  const q = page(); q.data.text = '试试'; await q.submit()
  assert.equal(q.data.messages[1].results[0].name, '只有 plans')
})

test('小数毫米长度四舍五入显示一位厘米', async () => {
  stub({ plans: [{ name: '海风', beads: ['b'], count: 1, lengthMm: 162.5, payableFen: 300 }], reply: '可以试试。' })
  const p = page(); p.data.text = '海边'; await p.submit()
  assert.equal(p.data.messages[1].results[0].lengthCm, '16.3')
})

test('模型回复里有数字时换成固定句', async () => {
  stub({ plans: [{ name: '海风', beads: ['b'], count: 1, lengthMm: 100, payableFen: 300 }], reply: '18 颗，¥100' })
  const p = page(); p.data.text = '海边'; await p.submit()
  assert.equal(p.data.messages[1].text, '为你配了三条，先看看第一条的寓意。')
})

test('没有 plans 时按 catalog pricing 算手工费和运费', async () => {
  stub({ designs: [{ ...recipe, beads: ['b', 'b'] }], reply: '为你配好了。' })
  const withHand = page({ handworkFen: 1500, shippingFen: 800, freeShippingThresholdFen: 9900 })
  withHand.data.text = '送朋友'; await withHand.submit()
  assert.equal(withHand.data.messages[1].results[0].priceText, '¥29')
  const noHand = page({ handworkFen: 0, shippingFen: 800, freeShippingThresholdFen: 9900 })
  noHand.data.text = '送朋友'; await noHand.submit()
  assert.equal(noHand.data.messages[1].results[0].priceText, '¥14')
})

test('时间行仅在隔五分钟或跨天出现', async () => {
  stub({ designs: [recipe], reply: '为你配好了。' })
  const realNow = Date.now
  const p = page()
  try {
    let clock = new Date(2026, 10, 12, 12, 0).getTime()
    Date.now = () => clock
    p.data.text = '第一句'; await p.submit()
    assert.ok(p.data.messages[0].time)
    clock += 4 * 60000
    p.data.text = '第二句'; await p.submit()
    assert.equal(p.data.messages[2].time, '')
    clock += 6 * 60000
    p.data.text = '第三句'; await p.submit()
    assert.ok(p.data.messages[4].time)
    clock = new Date(2026, 10, 12, 23, 59).getTime()
    p.data.text = '夜里'; await p.submit()
    clock += 2 * 60000
    p.data.text = '第二天'; await p.submit()
    assert.ok(p.data.messages[8].time)
  } finally { Date.now = realNow }
})
