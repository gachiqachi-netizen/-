// 组件预览临时页（只在开发版能打开）。由任务卡 C0f 基础样式和小控件 填内容；C0z/C11 收尾时整个 kit 分包删除。
// 示例珠子：先从 /api/catalog 取一种，取不到用写死的一种（仅作 .c-pk 的小珠子图）。
const FALLBACK_BEAD = { id: 'fb-aqua', name: '海蓝宝', c: ['#b7e1ec', '#5c9db3'] }

Page({
  data: { bead: FALLBACK_BEAD, count: 1 },

  onLoad() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const version = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
    if (version !== 'develop') {
      wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/home/home' }) } })
      return
    }
    this.loadBead()
  },

  loadBead() {
    const app = getApp()
    const base = app && app.globalData && app.globalData.apiBase
    if (!base) return
    wx.request({
      url: base + '/api/catalog',
      success: (r) => {
        const beads = (r.data && r.data.beads) || []
        if (beads.length) this.setData({ bead: beads[0] })
      },
    })
  },

  onMinus() {
    this.setData({ count: Math.max(1, this.data.count - 1) })
  },

  onPlus() {
    this.setData({ count: Math.min(99, this.data.count + 1) })
  },

  onStateAction() {
    wx.showToast({ title: 'action 事件', icon: 'none' })
  },

  onStateLink() {
    wx.showToast({ title: 'link 事件', icon: 'none' })
  },
})
