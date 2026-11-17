const style = require('./style.js')

function materialOf(bead = {}) {
  const mat = String(bead.mat || bead.material || '').toLowerCase()
  const name = String(bead.name || '')
  if (bead.spacer || /metal|silver|gold|steel|金属|隔珠|隔片|转运珠|银|铜/.test(mat + name)) return 'metal'
  if (/crystal|glass|resin|amber|水晶|蜜蜡|琉璃|琥珀/.test(mat + name)) return 'translucent'
  return 'matte'
}

function materialParams(bead, tier) {
  if (tier === 's') return { ...style.small, kind: materialOf(bead), simple: true }
  const kind = materialOf(bead)
  return { ...style.regular, ...style.materials[kind], kind }
}

function cssPaint(colors, params) {
  const light = colors[0] || style.fallbackColors[0]
  const dark = colors[1] || style.fallbackColors[1]
  const highlight = `radial-gradient(circle at ${params.highlightX}% ${params.highlightY}%, rgba(255,255,255,${params.highlightAlpha}) 0%, rgba(255,255,255,0) ${params.highlightStop}%)`
  const body = params.kind === 'metal' && !params.simple
    ? `linear-gradient(115deg, ${dark} 0%, ${light} 31%, ${dark} 55%, ${light} 72%, ${dark} 100%)`
    : `radial-gradient(circle at 38% 34%, ${light} 0%, ${light} ${params.colorStop}%, ${dark} 100%)`
  const glow = `radial-gradient(circle at 58% 64%, rgba(255,255,255,${params.glowAlpha}), rgba(255,255,255,0) ${params.glowStop}%)`
  const shadow = params.shadowAlpha ? `0 3rpx 7rpx rgba(0,0,0,${params.shadowAlpha}),` : ''
  return `background:${highlight},${glow},${body};box-shadow:${shadow}inset 0 0 4rpx rgba(0,0,0,${params.shadeAlpha});`
}

module.exports = { materialOf, materialParams, cssPaint }
