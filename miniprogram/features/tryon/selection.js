function hasBeads(design) {
  return !!(design && Array.isArray(design.beads) && design.beads.length)
}

function pickTryonDesign(current, saved, popular) {
  if (hasBeads(current)) return current
  const recent = (saved || []).find(hasBeads)
  if (recent) return recent
  return (popular || []).find(hasBeads) || null
}

module.exports = { pickTryonDesign }
