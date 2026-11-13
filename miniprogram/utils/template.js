// 尺寸规则以工作台 pages/diy/logic.js 的 stats 为准（2026-11-13 负责人定）。
const logic = require('../pages/diy/logic')

function build(template, catalog, wrist) {
  const byId = Object.fromEntries((catalog || []).map(b => [b.id, b]))
  const special = template.special || [], pattern = template.pattern || [], tail = template.tail || []
  if (!pattern.length || special.concat(pattern, tail).some(id => !byId[id] || !(Number(byId[id].mm) > 0))) return null
  if (template.fixed) {
    const n = Math.max(0, Math.min(500, Number(template.fixed)) - special.length - tail.length)
    return special.concat(Array.from({length:n}, (_, i) => pattern[i % pattern.length]), tail)
  }
  const w = Number(wrist) || 15
  const beads = special.slice()
  let i = 0
  while (beads.length < 80) {
    const next = pattern[i % pattern.length]
    const target = logic.stats(beads.concat(next, tail), catalog, w).target
    const length = logic.stats(beads.concat(tail), catalog, w).length
    if (length + Number(byId[next].mm) / 2 >= target) break
    beads.push(next); i++
  }
  return beads.concat(tail)
}
module.exports = { build }
