const TAU = Math.PI * 2
const REQUIRED = ['cx','cy','rx','ry','angle','wristWidthPx','wristWidthMm']
function validateHand(hand) {
  if (!hand || REQUIRED.some(key => !Number.isFinite(Number(hand[key])))) throw new Error('手腕标注缺少有效字段')
  if (Number(hand.rx) <= 0 || Number(hand.ry) <= 0 || Number(hand.wristWidthPx) <= 0 || Number(hand.wristWidthMm) <= 0) throw new Error('手腕尺寸必须大于零')
  return hand
}
function validateHands(value) {
  const list = Array.isArray(value) ? value : value && value.hands
  if (!Array.isArray(list) || !list.length) throw new Error('模特手数据为空')
  return list.map(hand => {
    if (!hand || ['id','label','photo','cutout'].some(key => typeof hand[key] !== 'string' || !hand[key])) throw new Error('模特手数据缺少字段')
    return validateHand(hand)
  })
}
function wristRing(hand, beads, spin = 0) {
  validateHand(hand)
  if (!Array.isArray(beads) || beads.some(bead => !bead || !Number.isFinite(Number(bead.mm)) || Number(bead.mm) <= 0)) throw new Error('珠子尺寸无效')
  if (!beads.length) return []
  const ppm = Number(hand.wristWidthPx) / Number(hand.wristWidthMm)
  const total = beads.reduce((sum, bead) => sum + Number(bead.mm), 0)
  const ratio = Number(hand.ry) / Number(hand.rx)
  // A unit ellipse is sampled by arc length so unequal beads retain their real spacing.
  const steps = 2048, lengths = [0]
  for (let i = 1; i <= steps; i++) {
    const t = (i - .5) * TAU / steps
    lengths[i] = lengths[i - 1] + Math.hypot(Math.sin(t), ratio * Math.cos(t)) * TAU / steps
  }
  const rx = total * ppm / lengths[steps], ry = rx * ratio
  function angleAt(distance) {
    const target = ((distance % total) + total) % total * lengths[steps] / total
    let lo = 0, hi = steps
    while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (lengths[mid] < target) lo = mid + 1; else hi = mid }
    const prev = Math.max(0, lo - 1), part = (target - lengths[prev]) / (lengths[lo] - lengths[prev] || 1)
    return (prev + part) * TAU / steps
  }
  const rotation = Number(hand.angle) * Math.PI / 180
  const c = Math.cos(rotation), s = Math.sin(rotation)
  let distance = 0
  return beads.map(bead => {
    const mm = Number(bead.mm), phase = angleAt(distance + mm / 2 + Number(spin || 0) / TAU * total)
    distance += mm
    const z = Math.sin(phase), x0 = rx * Math.cos(phase), y0 = ry * z
    return { x: Number(hand.cx) + x0 * c - y0 * s, y: Number(hand.cy) + x0 * s + y0 * c,
      size: mm * ppm * (.925 + .075 * z), z, front: z > 0, photo: bead.photo || '' }
  })
}
module.exports = { wristRing, validateHand, validateHands }
