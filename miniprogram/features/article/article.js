const { request } = require('../../utils/api')

Page({
  data: { loading: true, error: '', article: null, coverUrl: '', showButton: false, bead: null },
  onLoad(options) {
    this.articleId = options && options.id ? decodeURIComponent(options.id) : ''
    this.context = options && options.context || 'home'
    this.load()
  },
  async load() {
    if (!this.articleId) {
      this.setData({ loading: false, error: '找不到这篇内容' })
      return
    }
    this.setData({ loading: true, error: '' })
    try {
      const article = await request('/articles/' + encodeURIComponent(this.articleId))
      const base = getApp().globalData.apiBase
      const cover = article.cover || ''
      const coverUrl = /^https?:\/\//.test(cover) ? cover : cover.startsWith('/') ? base + cover : ''
      const beadId = article.beadKbIds && article.beadKbIds[0]
      const catalog = getApp().globalData.catalog || {}
      const bead = (catalog.beads || []).find(item => item.kbId === beadId || item.id === beadId) || null
      this.setData({ article, coverUrl, bead, loading: false,
                     showButton: this.context === 'home' && !!article.button })
      wx.setNavigationBarTitle({ title: article.title })
    } catch (error) {
      this.setData({ loading: false, error: error.message || '暂时没能加载内容' })
    }
  },
  onShareAppMessage() {
    const article = this.data.article
    return { title: article ? article.title : '珠养养',
             path: '/features/article/article?id=' + encodeURIComponent(this.articleId) }
  },
  followButton() {
    const article = this.data.article
    const button = article && article.button
    if (!button || !button.target) return
    const target = '/' + button.target.replace(/^\/+/, '')
    const beadId = article.beadKbIds && article.beadKbIds[0]
    const url = target + (beadId ? (target.includes('?') ? '&' : '?') + 'beadKbId=' + encodeURIComponent(beadId) : '')
    if (target === '/pages/diy/diy') wx.switchTab({ url: target })
    else wx.navigateTo({ url })
  },
})
