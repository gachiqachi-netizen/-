// 组件预览临时页（只在开发版能打开）。由任务卡 C0e 珠子图 填内容；C11 收尾时整个 kit 分包删除。
// 8 种示例珠子：先从 /api/catalog 取前 8 种，取不到用下面写死的 8 种。
const FALLBACK_BEADS = [
  { id: 'fb-aqua', name: '海蓝宝', c: ['#b7e1ec', '#5c9db3'] },
  { id: 'fb-clear', name: '白水晶', c: ['#eef1f5', '#aeb8c6'] },
  { id: 'fb-moon', name: '月光石', c: ['#e6eaf2', '#9fabc0'] },
  { id: 'fb-rose', name: '粉晶', c: ['#f1bcc6', '#c47f8e'] },
  { id: 'fb-amethyst', name: '紫水晶', c: ['#b293de', '#5f3e96'] },
  { id: 'fb-strawberry', name: '草莓晶', c: ['#eda2ab', '#ad5562'] },
  { id: 'fb-citrine', name: '黄水晶', c: ['#f3cd75', '#b4842b'] },
  { id: 'fb-cinnabar', name: '朱砂', c: ['#c8432d', '#6e140b'] },
]

Page({
  data: { beads: [] },
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
      this.setData({ beads: FALLBACK_BEADS })
      return
    }
    wx.request({
      url: base + '/api/catalog',
      success: (r) => {
        const beads = (r.data && r.data.beads || []).slice(0, 8)
        this.setData({ beads: beads.length ? beads : FALLBACK_BEADS })
      },
      fail: () => this.setData({ beads: FALLBACK_BEADS }),
    })
  },
})
