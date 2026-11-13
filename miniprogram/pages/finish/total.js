const money = require('../../utils/money')

// 到手价（整数分）：珠子 + 手工费 + 运费（满额包邮）。
// pricing 来自 /api/catalog 的 pricing 字段（A3 起手工费、运费改后台配置）。
// 规则与后端 server/pricing.py 的 quote 一致（详情页无穿绳/礼盒）：
//   - handworkFen：手工费，后台关闭时接口已返回 0；
//   - shippingFen：运费，后台关闭时接口已返回 0；
//   - freeShippingThresholdFen：null 表示不包邮（恒收运费），否则满额包邮。
function totalHand(goodsFen, pricing) {
  const p = pricing || {}
  const handworkFen = Number.isInteger(p.handworkFen) ? p.handworkFen : 0
  const shippingFen = Number.isInteger(p.shippingFen) ? p.shippingFen : 0
  const threshold = p.freeShippingThresholdFen
  const subtotalFen = goodsFen + handworkFen
  const free = threshold != null && subtotalFen >= threshold
  const charged = free ? 0 : shippingFen
  return { handworkFen, subtotalFen, shippingFen: charged, payableFen: subtotalFen + charged }
}

// 配送行文案（整数分）。shippingFen 是实际收取的运费，thresholdFen 是包邮门槛：
//   - 运费 0：'包邮'
//   - 门槛是数字：'运费 ¥8，满 ¥99 包邮'
//   - 门槛是 null（不包邮）：'运费 ¥8'
function shippingText(shippingFen, thresholdFen) {
  if (shippingFen === 0) return '包邮'
  const ship = money.yuan(shippingFen)
  if (thresholdFen == null) return '运费 ' + ship
  return '运费 ' + ship + '，满 ' + money.yuan(thresholdFen) + ' 包邮'
}

// 尺寸弹层「运费」下的小字：有门槛且收运费时写 '满 ¥99 包邮'，其余返回空串（不显示）。
function shipNote(shippingFen, thresholdFen) {
  if (shippingFen === 0 || thresholdFen == null) return ''
  return '满 ' + money.yuan(thresholdFen) + ' 包邮'
}

module.exports = { totalHand, shippingText, shipNote }
