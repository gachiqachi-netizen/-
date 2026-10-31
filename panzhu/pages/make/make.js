const store = require('../../utils/store')
const { MATERIALS, MAP, beadBg } = require('../../utils/beads')

const SIZES = [{ v: 56, t: '小' }, { v: 70, t: '中' }, { v: 86, t: '大' }]
const MIN = 8, MAX = 30

Page({
  data: {
    beads: [],
    size: 70,
    sizes: SIZES,
    name: '',
    materials: MATERIALS.map(m => ({ id: m.id, name: m.name, bg: beadBg(m.id, 0) })),
    min: MIN,
    max: MAX
  },

  pick(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.beads.length >= MAX) return wx.showToast({ title: `最多 ${MAX} 颗`, icon: 'none' })
    this.setData({ beads: this.data.beads.concat(id) })
    wx.vibrateShort({ type: 'light' })
  },

  // 点手串上的珠子把它取下
  removeAt(e) {
    const beads = this.data.beads.slice()
    beads.splice(e.detail.index, 1)
    this.setData({ beads })
  },

  undo() { this.setData({ beads: this.data.beads.slice(0, -1) }) },
  clear() { this.setData({ beads: [] }) },

  // 随机搭配：1~3 种材质交替
  random() {
    const pool = MATERIALS.slice().sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3))
    const n = 12 + Math.floor(Math.random() * 9)
    const pattern = pool.length === 1 ? [0] : [0, 0, 0, 1, 0, 0, 0, pool.length - 1]
    const beads = []
    for (let i = 0; i < n; i++) beads.push(pool[pattern[i % pattern.length]].id)
    this.setData({ beads })
  },

  setSize(e) { this.setData({ size: +e.currentTarget.dataset.v }) },
  onName(e) { this.setData({ name: e.detail.value }) },

  save() {
    const { beads, size } = this.data
    if (beads.length < MIN) return wx.showToast({ title: `至少串 ${MIN} 颗`, icon: 'none' })
    const name = this.data.name.trim() || MAP[beads[0]].name + '手串'
    store.add({ id: 'b' + Date.now(), name, beads, size, count: 0, created: Date.now() })
    this.setData({ beads: [], name: '' })
    wx.showToast({ title: '串好啦，开盘！', icon: 'none' })
    wx.switchTab({ url: '/pages/index/index' })
  }
})
