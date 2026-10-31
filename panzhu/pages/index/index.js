const store = require('../../utils/store')
const { patinaOf, levelOf } = require('../../utils/beads')

Page({
  data: { b: null, rotate: 0, animate: false, patina: 0, count: 0, laps: 0, today: 0, level: {} },

  onShow() {
    const b = store.current()
    this.b = b
    this.rot = 0
    this.acc = 0
    this.step = 360 / b.beads.length
    this.setData({ b, rotate: 0, today: store.todayCount() })
    this.refresh(true)
    setTimeout(() => this.measure(), 50)
  },
  onHide() { this.save() },
  onUnload() { this.save() },

  measure() {
    wx.createSelectorQuery().select('#ring').boundingClientRect(r => {
      if (!r) return
      this.cx = r.left + r.width / 2
      this.cy = r.top + r.height / 2
    }).exec()
  },

  refresh(force) {
    const c = this.b.count
    const p = patinaOf(c)
    const data = { count: c, laps: Math.floor(c / this.b.beads.length), level: levelOf(c) }
    // 包浆变化明显时才重算珠子颜色
    if (force || Math.abs(p - this.data.patina) > 0.004) data.patina = p
    data.patinaPct = Math.floor(p * 100)
    this.setData(data)
  },

  add(n) {
    const before = levelOf(this.b.count).index
    this.b.count += n
    const today = store.addToday(n)
    wx.vibrateShort({ type: 'light' })
    this.setData({ today })
    this.refresh(false)
    const lv = levelOf(this.b.count)
    if (lv.index > before) {
      wx.showToast({ title: '手串进阶：' + lv.name, icon: 'none' })
      this.refresh(true)
    }
    if (this.b.count % 20 === 0) this.save()
  },

  save() { if (this.b) store.update(this.b) },

  angle(t) { return Math.atan2(t.clientY - this.cy, t.clientX - this.cx) },

  onTouchStart(e) {
    if (this.cx === undefined) this.measure()
    this.last = this.angle(e.touches[0])
    if (this.data.animate) this.setData({ animate: false })
  },

  onTouchMove(e) {
    const a = this.angle(e.touches[0])
    let d = a - this.last
    if (d > Math.PI) d -= 2 * Math.PI
    if (d < -Math.PI) d += 2 * Math.PI
    this.last = a
    const deg = d * 180 / Math.PI
    this.rot += deg
    this.acc += Math.abs(deg)
    let n = 0
    while (this.acc >= this.step) { this.acc -= this.step; n++ }
    this.setData({ rotate: this.rot })
    if (n) this.add(n)
  },

  // 点按钮拨一颗
  flick() {
    this.rot += this.step
    this.setData({ animate: true, rotate: this.rot })
    this.add(1)
  }
})
