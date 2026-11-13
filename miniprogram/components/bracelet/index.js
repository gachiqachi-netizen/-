// 手串正视圆环（任务卡 C0h）。
// 每颗珠子用 C0e 的 bead 组件；排法照 docs/design/mockups-final.html 的 ring()：
// 珠径 = 这颗的 mm / 总 mm × 圆周，所有珠子刚好排满一圈。
// layout() 是纯函数，node:test 直接测（Component 调用做了环境守卫）。

function layout(beads, size) {
  const list = (beads || []).filter(b => b && Number(b.mm) > 0)
  if (!list.length || !size) return []
  const total = list.reduce((s, b) => s + b.mm, 0)
  const maxMm = Math.max.apply(null, list.map(b => b.mm))
  // 所有珠子刚好排满一圈（依次相切）：
  // 珠径 d = k·mm，圆心半径 rc = size/2 − k·maxMm/2，相切要求 Σd = 2π·rc
  // ⇒ k·total = π·size − π·k·maxMm ⇒ k = π·size / (total + π·maxMm)
  const k = Math.PI * size / (total + Math.PI * maxMm)
  const rc = size / 2 - k * maxMm / 2
  let angle = -Math.PI / 2
  return list.map((bead, index) => {
    const d = Math.max(8, k * bead.mm)
    const step = bead.mm / total * Math.PI * 2
    const mid = angle + step / 2
    angle += step
    const box = Math.round(d) + 8 // 外框留 8rpx，选中描边不挤珠子
    return {
      index: index,
      bead: bead,
      d: Math.round(d),
      box: box,
      x: Math.round(size / 2 + rc * Math.cos(mid) - box / 2),
      y: Math.round(size / 2 + rc * Math.sin(mid) - box / 2),
    }
  })
}

if (typeof Component === 'function') {
  Component({
    options: { styleIsolation: 'apply-shared' },
    properties: {
      beads: { type: Array, value: [] },          // 珠子对象数组，按顺序（ring 模式）
      size: { type: Number, value: 320 },         // 圆环直径 rpx
      wordmark: { type: Boolean, value: false },  // 中央放 wordmark-line 字标（C0c 组件）
      selected: { type: Number, value: -1 },      // 高亮第几颗（描边），其余透明度 0.35
      mode: { type: String, value: 'ring' },      // ring 单条 / stack 叠戴
      stackBeads: { type: Array, value: [] },     // stack 模式：[beadsA, beadsB]
    },
    data: { rings: [], height: 320, wmSize: 'nav' },
    observers: {
      'beads, size, mode, stackBeads, wordmark': function () { this.rebuild() },
    },
    lifetimes: {
      attached() { this.rebuild() },
    },
    methods: {
      rebuild() {
        const p = this.properties
        const size = Number(p.size) || 320
        const wmSize = size >= 280 ? 'tray' : size >= 140 ? 'nav' : 'corner'
        if (p.mode === 'stack') {
          // 叠戴：上下各一条半透明
          const a = (p.stackBeads && p.stackBeads[0]) || []
          const b = (p.stackBeads && p.stackBeads[1]) || []
          const gap = Math.round(size * 0.36)
          this.setData({
            wmSize: wmSize,
            height: size + gap,
            rings: [
              { idx: 0, ty: -gap / 2, opacity: 0.55, items: layout(a, size) },
              { idx: 1, ty: gap / 2, opacity: 0.55, items: layout(b, size) },
            ],
          })
        } else {
          this.setData({
            wmSize: wmSize,
            height: size,
            rings: [{ idx: 0, ty: 0, opacity: 1, items: layout(p.beads, size) }],
          })
        }
      },
    },
  })
}

module.exports = { layout }
