const auth = require('../../utils/auth')
Page({
  data: { busy: false, error: '', dev: false },
  onLoad() {
    const info = wx.getAccountInfoSync && wx.getAccountInfoSync()
    this.setData({ dev: !!(info && info.miniProgram && info.miniProgram.envVersion === 'develop') })
  },
  async login() {
    if (this.data.busy) return
    this.setData({ busy: true, error: '' })
    try {
      await auth.login()
      wx.showToast({ title: '登录成功', icon: 'success' })
      wx.navigateBack()
    } catch (error) {
      this.setData({ error: error.message || '暂时无法登录，请稍后重试。' })
    } finally { this.setData({ busy: false }) }
  }
})
