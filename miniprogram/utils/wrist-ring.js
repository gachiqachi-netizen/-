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
  // Beads occupy a 3D circle; only its projection onto the photo is elliptical.
  const rx = total * ppm / TAU, ry = rx * ratio
  const rotation = Number(hand.angle) * Math.PI / 180
  const c = Math.cos(rotation), s = Math.sin(rotation)
  let distance = 0
  return beads.map(bead => {
    const mm = Number(bead.mm), phase = TAU * (distance + mm / 2) / total + Number(spin || 0)
    distance += mm
    const z = Math.sin(phase), x0 = rx * Math.cos(phase), y0 = ry * z
    return { x: Number(hand.cx) + x0 * c - y0 * s, y: Number(hand.cy) + x0 * s + y0 * c,
      size: mm * ppm * (.925 + .075 * z), z, front: z > 0, photo: bead.photo || '' }
  })
}
module.exports = { wristRing, validateHand, validateHands }
