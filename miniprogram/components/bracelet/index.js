const { layout } = require('../../utils/bracelet-layout')
function normalize(beads) { return (beads || []).filter(b => b && Number(b.mm) > 0).map(b => ({ ...b, colors: b.colors || b.c || [] })) }
function positions(beads, size) {
  const sequence = normalize(beads)
  if (!sequence.length || !Number.isFinite(size) || size <= 0) return []
  return layout(sequence, size).map((point, index) => {
    const bead = sequence[index], d = point.r * 2, left = point.x - point.r, top = point.y - point.r
    return { ...point, bead, index, zeroIndex: index, d, diameter: d, box: d, x: left, y: top,
      left, top, metal: !!bead.spacer || /metal|silver|gold|steel|银|金属|隔/i.test(String(bead.mat || '')),
      face: (bead.colors || [])[0] || 'var(--c-line)' }
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
  properties: { beads: { type: Array, value: [] }, size: { type: Number, value: 320 }, wordmark: { type: Boolean, value: false },
    selected: { type: Number, value: -1 }, mode: { type: String, value: 'ring' }, stackBeads: { type: Array, value: [] } },
  data: { rings: [], height: 320, wordmarkSize: 'tray' },
  observers: { 'beads,size,mode,stackBeads,wordmark': function () { this.rebuild() } },
  lifetimes: { attached() { this.rebuild() } },
  methods: { rebuild() {
    const p = this.properties, size = Number(p.size) || 320
    if (p.mode === 'stack') {
      const gap = Math.round(size * 0.36)
      this.setData({ height: size + gap, rings: [
        { idx: 0, ty: -gap / 2, opacity: 0.55, items: positions((p.stackBeads || [])[0], size) },
        { idx: 1, ty: gap / 2, opacity: 0.55, items: positions((p.stackBeads || [])[1], size) },
      ] })
    } else {
      const ring = positions(p.beads, size)
      this.setData({ height: size, wordmarkSize: wordmarkSize(ring, size), rings: [{ idx: 0, ty: 0, opacity: 1, items: ring }] })
    }
  } },
})
module.exports = { layout: positions, normalize, wordmarkSize }
