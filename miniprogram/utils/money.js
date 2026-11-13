// 金额显示函数（C0d）
// 报价接口返回的金额都是整数分：goodsFen / shippingFen / payableFen / totalFen。

// 整数分 → 展示元：10000 → '¥100'，10050 → '¥100.50'，5 → '¥0.05'。
// 分不是整数时抛错（金额规则：一律整数分）。
function yuan(fen) {
  if (!Number.isInteger(fen)) throw new Error('yuan: fen must be an integer')
  const sign = fen < 0 ? '-' : ''
  const abs = Math.abs(fen)
  const whole = Math.floor(abs / 100)
  const cents = abs % 100
  if (cents === 0) return `${sign}¥${whole}`
  return `${sign}¥${whole}.${String(cents).padStart(2, '0')}`
}

// 应付金额：payableFen 优先，其次 totalFen，都没有抛错。不做任何加法。
function toHand(quote) {
  if (!quote) throw new Error('toHand: quote is required')
  if (Number.isInteger(quote.payableFen)) return quote.payableFen
  if (Number.isInteger(quote.totalFen)) return quote.totalFen
  throw new Error('toHand: payableFen / totalFen missing')
}

module.exports = { yuan, toHand }
