const logic = require('../../pages/diy/logic')
const { fitText } = require('../../utils/fit-text')

function variants(bead, catalog) {
  if (!bead) return []
  return (catalog || []).filter(item => item.name === bead.name && Number(item.mm) > 0)
    .sort((a, b) => Number(a.mm) - Number(b.mm))
    .map(item => ({ ...item, available: item.onSale !== false && item.stock !== 'out_of_stock' }))
}
function fitHint(design, catalog, bead, quantity) {
  if (!design || !bead || !quantity) return ''
  const current = logic.stats(design.beads, catalog, design.wrist)
  if (fitText(current, design.beads.length).state === 'ok') return ''
  const next = design.beads.concat(Array(quantity).fill(bead.id))
  const fit = fitText(logic.stats(next, catalog, design.wrist), next.length)
  if (fit.state === 'ok') return `加 ${quantity} 颗刚好合适`
  if (fit.state === 'long') return `加了会超出约 ${fit.mm}mm`
  return fit.word
}
function unitPrice(bead) {
  if (!bead) return '0'
  const fen = Number.isInteger(bead.unitPriceFen) ? bead.unitPriceFen : Math.round(Number(bead.price || 0) * 100)
  return (fen / 100).toFixed(2).replace(/\.00$/, '')
}
module.exports = { variants, fitHint, unitPrice }
