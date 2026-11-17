const { layout } = require('../../utils/bracelet-layout')
const style = require('./style.js')
const { materialParams, cssPaint } = require('./fallback.js')
function normalize(beads) { return (beads || []).filter(b => b && Number(b.mm) > 0).map(b => ({ ...b, colors: b.colors || b.c || [] })) }
function photoOf(bead, tier) {
  const photo = (tier === 's' ? bead.photoSm : bead.photoMd) || bead.photo
  if (!photo) return ''
  if (/^(https?:|data:|wxfile:)/.test(photo)) return photo
  const app = typeof getApp === 'function' ? getApp() : null
  const base = app && app.globalData && app.globalData.apiBase
  return base ? base + photo : ''
}
function paint(colors, params) {
  return cssPaint(colors, params)
}
function positions(beads, size, tier) {
  const sequence = normalize(beads)
  if (!sequence.length || !Number.isFinite(size) || size <= 0) return []
  const visual = tier === 's' || tier === 'm' || tier === 'l'
  const params = tier === 's' ? style.small : style.regular
  const drawSize = visual ? size * style.fillRatio : size
  const offset = (size - drawSize) / 2
  return layout(sequence, drawSize).map((point, index) => {
    const bead = sequence[index], d = point.r * 2 * (visual ? params.beadScale : 1)
    const left = point.x + offset - d / 2, top = point.y + offset - d / 2
    return { ...point, bead, index, zeroIndex: index, d, diameter: d, box: d, x: left, y: top,
      left, top, metal: !!bead.spacer || /metal|silver|gold|steel|银|金属|隔/i.test(String(bead.mat || '')),
      face: (bead.colors || [])[0] || 'var(--c-line)', photoPath: photoOf(bead, tier), paintStyle: paint(bead.colors || [], materialParams(bead, tier)) }
  })
}
function wordmarkSize(ring, size) {
  if (!ring.length) return 'tray'
  const center = size / 2
  const innerRadius = Math.min(...ring.map(it => Math.hypot(it.left + it.r - center, it.top + it.r - center) - it.r))
  return innerRadius * 2 < 190 ? 'corner' : 'tray'
}
if (typeof Component === 'function') Component({
  options: { styleIsolation: 'apply-shared' },
  properties: { beads: { type: Array, value: [] }, tier: { type: String, value: '' }, size: { type: Number, value: 320 }, wordmark: { type: Boolean, value: false },
    selected: { type: Number, value: -1 }, mode: { type: String, value: 'ring' }, stackBeads: { type: Array, value: [] } },
  data: { rings: [], height: 320, side: 320, wordmarkSize: 'tray', background: 'transparent', record: false },
  observers: { 'beads,tier,size,mode,stackBeads,wordmark': function () { this.rebuild() } },
  lifetimes: { attached() { this.rebuild() } },
  methods: { rebuild() {
    const p = this.properties, record = Object.prototype.hasOwnProperty.call(style.tiers, p.tier)
    const size = record ? style.tiers[p.tier] : Number(p.size) || 320
    if (p.mode === 'stack') {
      const gap = Math.round(size * 0.36)
      this.setData({ side: size, height: size + gap, record: false, background: 'transparent', rings: [
        { idx: 0, ty: -gap / 2, opacity: 0.55, items: positions((p.stackBeads || [])[0], size, '') },
        { idx: 1, ty: gap / 2, opacity: 0.55, items: positions((p.stackBeads || [])[1], size, '') },
      ] })
    } else {
      const ring = positions(p.beads, size, record ? p.tier : '')
      this.setData({ side: size, height: size, record, background: record ? style.background[p.tier] : 'transparent', wordmarkSize: wordmarkSize(ring, size), rings: [{ idx: 0, ty: 0, opacity: 1, items: ring }] })
    }
  } },
})
module.exports = { layout: positions, normalize, wordmarkSize, paint, style }
