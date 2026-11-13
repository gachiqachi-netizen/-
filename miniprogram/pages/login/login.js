const auth = require('../../utils/auth')

Page({
  data: { busy: false, agreed: false, sheet: false, error: '', dev: false },
  onLoad(options) {
    const info = wx.getAccountInfoSync && wx.getAccountInfoSync()
    const dev = !!(info && info.miniProgram && info.miniProgram.envVersion === 'develop')
    let next = null
    try { if (options && options.next) next = JSON.parse(decodeURIComponent(options.next)) } catch (_) {}
    this.next = next
    this.setData({ dev })
  },
  back() { wx.navigateBack() },
  toggleAgreement() { this.setData({ agreed: !this.data.agreed }) },
  showAgreement() { this.setData({ sheet: true }) },
  closeAgreement() { this.setData({ sheet: false }) },
  openTerms(event) {
    const type = event.currentTarget.dataset.type
    wx.navigateTo({ url: '/features/doc/doc?type=' + encodeURIComponent(type) })
  },
  async onPhone(event) {
    if (this.data.busy) return
    if (!this.data.agreed) {
      this.setData({ sheet: true })
      return
    }
    const detail = event.detail || {}
    const denied = !detail.code || /deny/i.test(detail.errMsg || '')
    const code = detail.code || (this.data.dev && !/deny/i.test(detail.errMsg || '') ? 'dev-' + String(Date.now()).slice(-8) : '')
    if (denied && !code) {
      this.setData({ error: '没拿到手机号，可以再点一次，或先逛逛', sheet: false })
      return
    }
    this.setData({ busy: true, error: '', sheet: false })
    try {
      await auth.bindPhone(code)
      wx.showToast({ title: '已登录', icon: 'none' })
      try {
        if (await auth.syncLocalWorks()) wx.showToast({ title: '作品已同步', icon: 'none' })
      } catch (_) { /* 本机作品保留，稍后可重试同步 */ }
      auth.continueAfterLogin(this.next)
    } catch (_) {
      this.setData({ error: '没登录上，网络不太好，再点一次试试' })
    } finally { this.setData({ busy: false }) }
  },
  async agreeAndPhone(event) {
    this.setData({ agreed: true })
    await this.onPhone(event)
  },
})
