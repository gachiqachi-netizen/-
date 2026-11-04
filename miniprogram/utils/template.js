// Match the H5 prototype's approximate sizing; measurements are still confirmed by the user.
function build(template, catalog, wrist) {
  const byId = Object.fromEntries((catalog || []).map(b => [b.id, b]))
  const special = template.special || [], pattern = template.pattern || [], tail = template.tail || []
  if (!pattern.length || special.concat(pattern, tail).some(id => !byId[id] || !(Number(byId[id].mm) > 0))) return null
  if (template.fixed) {
    const n = Math.max(0, Math.min(500, Number(template.fixed)) - special.length - tail.length)
    return special.concat(Array.from({length:n}, (_, i) => pattern[i % pattern.length]), tail)
  }
  const sizes = {}
  special.concat(pattern, tail).forEach(id => { const b = byId[id]; if (!b.spacer && Number(b.mm) >= 6) sizes[b.mm] = (sizes[b.mm] || 0) + 1 })
  const main = Number(Object.keys(sizes).sort((a, b) => sizes[b] - sizes[a])[0] || 8)
  const target = Math.round((Number(wrist) || 15) * 10 + Math.max(8, 2.5 * main - 5))
  const length = ids => ids.reduce((sum, id) => sum + Number(byId[id].mm), 0)
  const beads = special.slice(); let i = 0
  while (length(beads) + Number(byId[pattern[i % pattern.length]].mm) / 2 < target - length(tail) && beads.length < 80) beads.push(pattern[i++ % pattern.length])
  return beads.concat(tail)
}
module.exports = { build }
