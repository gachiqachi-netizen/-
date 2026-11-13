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

module.exports = { totalHand }
