const { layout, centerInFrame } = require('../../utils/bracelet-layout')
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
function positions(beads, size, tier, circumferenceMm, rotation = 0, center = false, pixelsPerMm) {
  const sequence = normalize(beads)
  if (!sequence.length || !Number.isFinite(size) || size <= 0) return []
  const visual = tier === 's' || tier === 'm' || tier === 'l'
  const params = tier === 's' ? style.small : style.regular
  const drawSize = visual ? size * style.fillRatio : size
  const offset = (size - drawSize) / 2
  const raw = layout(sequence, drawSize, visual ? undefined : circumferenceMm, visual ? 0 : rotation, pixelsPerMm)
  const points = center && visual ? centerInFrame(raw, drawSize, params.beadScale) : raw
  return points.map((point, index) => {
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
  return innerRadius * 2 < 196 ? 'corner' : 'trayLg'
}
// The time samples approximate cubic-bezier(0,0,.2,1); angles always increase clockwise.
function easeOut(t) {
  let u = t
  for (let i = 0; i < 5; i++) {
    const x = 0.6 * u * u + 0.4 * u * u * u
    const slope = 1.2 * u + 1.2 * u * u
    if (slope < 0.001) break
    u = Math.max(0, Math.min(1, u - (x - t) / slope))
  }
  return 3 * u * u - 2 * u * u * u
}
function clockwiseFrames(point, size, steps = 20) {
  const center = size / 2
  const radius = Math.hypot(point.x - center, point.y - center)
  const start = Math.PI / 2
  let end = Math.atan2(point.y - center, point.x - center)
  while (end < start) end += 2 * Math.PI
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, angle = start + (end - start) * easeOut(t)
    return { offset: t, left: `${center + radius * Math.cos(angle) - point.d / 2}rpx`,
      top: `${center + radius * Math.sin(angle) - point.d / 2}rpx`, opacity: Math.min(1, t * 3) }
  })
}
function reducedMotion() {
  const info = typeof wx !== 'undefined' && wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
  return !!(info.reduceMotion || info.reducedMotion || info.enableReduceMotion)
}
if (typeof Component === 'function') Component({
  options: { styleIsolation: 'apply-shared' },
  properties: { beads: { type: Array, value: [] }, tier: { type: String, value: '' }, size: { type: Number, value: 320 }, wordmark: { type: Boolean, value: false },
    circumferenceMm: { type: Number, value: 0 }, rotation: { type: Number, value: 0 }, center: { type: Boolean, value: false }, pixelsPerMm: { type: Number, value: 0 },
    selected: { type: Number, value: -1 }, mode: { type: String, value: 'ring' }, stackBeads: { type: Array, value: [] }, slide: { type: Object, value: null } },
  data: { rings: [], height: 320, side: 320, wordmarkSize: 'trayLg', background: 'transparent', record: false, animatingIndex: -1 },
  observers: { 'beads,tier,size,mode,stackBeads,wordmark,circumferenceMm,rotation,center,pixelsPerMm,slide': function () { this.rebuild() } },
  lifetimes: { attached() { this.rebuild() } },
  methods: { rebuild() {
    const p = this.properties, record = Object.prototype.hasOwnProperty.call(style.tiers, p.tier)
    const size = record && !p.center ? style.tiers[p.tier] : Number(p.size) || (record ? style.tiers[p.tier] : 320)
    if (p.mode === 'stack') {
      const gap = Math.round(size * 0.36)
      this.setData({ side: size, height: size + gap, record: false, background: 'transparent', rings: [
        { idx: 0, ty: -gap / 2, opacity: 0.55, items: positions((p.stackBeads || [])[0], size, '') },
        { idx: 1, ty: gap / 2, opacity: 0.55, items: positions((p.stackBeads || [])[1], size, '') },
      ] })
    } else {
      const ring = positions(p.beads, size, record ? p.tier : '', !record && Number(p.circumferenceMm) > 0 ? Number(p.circumferenceMm) : undefined, Number(p.rotation) || 0, Boolean(p.center), Number(p.pixelsPerMm) || undefined)
      const track = !record && ring.length && ring[0].open ? { left: size / 2 - ring[0].circleRadius, top: size / 2 - ring[0].circleRadius, diameter: ring[0].circleRadius * 2 } : null
      const slide = p.slide
      const fresh = !record && p.mode === 'ring' && slide && slide.seq !== this.lastSlideSeq &&
        slide.index === ring.length - 1 && typeof this.animate === 'function' && !reducedMotion()
      if (fresh) {
        if (this.activeSlideToken && typeof this.clearAnimation === 'function') this.clearAnimation('#slide-bead')
        this.activeSlideToken = slide.seq
        this.lastSlideSeq = slide.seq
      }
      const animatingIndex = fresh ? slide.index : this.activeSlideToken ? this.data.animatingIndex : -1
      this.setData({ side: size, height: size, record, background: record ? style.background[p.tier] : 'transparent', wordmarkSize: wordmarkSize(ring, size), track, rings: [{ idx: 0, ty: 0, opacity: 1, items: ring }], animatingIndex }, () => {
        if (!fresh || this.activeSlideToken !== slide.seq) return
        try {
          this.animate('#slide-bead', clockwiseFrames(ring[slide.index], size), 420, () => {
            if (this.activeSlideToken !== slide.seq) return
            this.activeSlideToken = 0
            this.setData({ animatingIndex: -1 })
          })
        } catch (_) {
          this.activeSlideToken = 0
          this.setData({ animatingIndex: -1 })
        }
      })
    }
  } },
})
module.exports = { layout: positions, normalize, wordmarkSize, paint, style, clockwiseFrames, easeOut }
