// C8b 我的订单：分栏归类（纯函数，node 可测，不依赖 wx）
// 事实来源：订单的 customerStatus.code（server/order_view.py + contract.CUSTOMER_STATUS）

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'making', label: '制作中' },
  { key: 'shipping', label: '待收货' },
  { key: 'after_sale', label: '售后' },
]

// 卡片要求：待收货 = 运输中 + 已签收
const TAB_CODES = {
  pending_payment: ['pending_payment'],
  making: ['producing', 'ready_to_ship', 'processing'],
  shipping: ['in_transit', 'delivered', 'logistics_issue'],
  after_sale: ['after_sale_open', 'after_sale_done', 'after_sale_rejected', 'refunding', 'refunded', 'refund_failed'],
}

// 返回订单属于的分栏 key；已完成/已取消不属于任何分栏（只出现在“全部”）
function tabOf(code) {
  for (const key of Object.keys(TAB_CODES)) {
    if (TAB_CODES[key].indexOf(code) !== -1) return key
  }
  return ''
}

// 每个分栏的条数（全部 = 所有订单）
function countsOf(rows) {
  const counts = { all: rows.length }
  TABS.forEach(t => { if (t.key !== 'all') counts[t.key] = 0 })
  rows.forEach(row => {
    const tab = tabOf(row.code)
    if (tab) counts[tab] += 1
  })
  return counts
}

function rowsInTab(rows, tab) {
  if (tab === 'all') return rows
  return rows.filter(row => tabOf(row.code) === tab)
}

module.exports = { TABS, tabOf, countsOf, rowsInTab }
