const contract = require('../../utils/contract')
const labels = contract.statusLabels.afterSaleStatus
const needsReturn = type => type === '退货退款' || type === '改手围重串'
const yuan = fen => (Math.max(0, Number(fen) || 0) / 100).toFixed(2)
function saleView(sale) {
  if (!sale) return null
  const status = sale.status
  const label = labels[status] || ''
  const returning = status === 'approved' && needsReturn(sale.type)
  const refund = sale.type && /退款/.test(sale.type)
  const descriptions = {
    requested:'已收到你的申请。', reviewing:'已收到你的申请。', approved:returning?'审核通过了。寄出后填写单号，我们收到后处理。':'审核通过了。',
    returning:'已寄出，收到后处理。', refunding:`¥${yuan(sale.refundFen)} 正在原路退回。`,
    completed:refund?`¥${yuan(sale.refundedFen || sale.refundFen)} 已原路退回。`:'售后已处理完成。',
    closed:'你撤销了这次申请。', rejected:''
  }
  const history=(sale.history||[]).slice().reverse().map(entry=>({
    label:labels[entry.status || entry.to] || '', at:entry.at || ''
  }))
  const actions=sale.customerActions || []
  return {label, description:descriptions[status]||'', returning,
    canCancel:actions.includes('cancel_after_sale'),
    canSubmitReturn:actions.includes('submit_return'),
    canReorder:status==='completed' && refund,
    refund:yuan(sale.refundFen), history,
    photos:Array.isArray(sale.photoIds)?sale.photoIds:[], contactPhone:sale.contactPhone||''}
}
function copyOrderDesign(order, created) {
  if (!order || !Array.isArray(order.beads) || !order.beads.length) return null
  const suffix='（再串一条）', name=String(order.name||'手串')
  return {...created,name:name.slice(0,Math.max(0,8-suffix.length))+suffix,
    wrist:order.wrist,beads:order.beads.slice()}
}
function trackingError(value) {
  const text=String(value||'').trim()
  if (!text) return '先填单号'
  return /^[A-Za-z0-9-]{6,40}$/.test(text)?'':'单号看起来不对，再核对一下'
}
module.exports={saleView,trackingError,needsReturn,copyOrderDesign}
