// 组件预览临时页（只在开发版能打开）。由任务卡 C0h 手串图 填内容；C0z/C11 收尾时整个 kit 分包删除。
// 示例珠子：从 /api/catalog 取，取不到用写死的两组。
const FALLBACK_A = [
  { id: 'a1', name: '月光石', mm: 8, c: ['#e6eaf2', '#9fabc0'] },
  { id: 'a2', name: '白水晶', mm: 8, c: ['#eef1f5', '#aeb8c6'] },
  { id: 'a3', name: '海蓝宝', mm: 8, c: ['#b7e1ec', '#5c9db3'] },
]
const FALLBACK_B = [
  { id: 'b1', name: '朱砂', mm: 8, c: ['#c8432d', '#6e140b'] },
  { id: 'b2', name: '白水晶', mm: 8, c: ['#eef1f5', '#aeb8c6'] },
]

const MOON = { name: '白月光', line: '清冷里，藏一点温柔' }
const RED = { name: '一点红', line: '一点红火，衬着一身明澈' }

Page({
  data: {
    beadsA: FALLBACK_A,
    beadsB: FALLBACK_B,
    catalog: FALLBACK_A.concat(FALLBACK_B),
    cellMoon: Object.assign({ beads: FALLBACK_A.concat(FALLBACK_A, FALLBACK_A).slice(0, 18), priceFen: 10000 }, MOON),
    cellRed: Object.assign({ beads: FALLBACK_B.concat(FALLBACK_B, FALLBACK_B).slice(0, 18), priceFen: 7800 }, RED),
    rowMoon: Object.assign({ beads: FALLBACK_A.concat(FALLBACK_A, FALLBACK_A).slice(0, 18) }, MOON),
    rowRed: Object.assign({ beads: FALLBACK_B.concat(FALLBACK_B, FALLBACK_B).slice(0, 18) }, RED),
    loading: true,
  },

  onLoad() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const version = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
    if (version !== 'develop') {
      wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/home/home' }) } })
      return
    }
    this.loadBeads()
  },

  loadBeads() {
    const app = getApp()
    const base = app && app.globalData && app.globalData.apiBase
    if (!base) {
      this.setData({ loading: false })
      return
    }
    wx.request({
      url: base + '/api/catalog',
      success: (r) => {
        const beads = (r.data && r.data.beads) || []
        if (beads.length >= 2) {
          const a = beads.slice(0, Math.ceil(beads.length / 2))
          const b = beads.slice(Math.ceil(beads.length / 2))
          this.setData({
            beadsA: a,
            beadsB: b,
            catalog: beads,
            loading: false,
          })
        } else {
          this.setData({ loading: false })
        }
      },
      fail: () => this.setData({ loading: false }),
    })
  },
})
