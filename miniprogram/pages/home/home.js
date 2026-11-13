const { queue: toast } = require('../../utils/toast')
const api = require('../../utils/api')
const store = require('../../utils/design')
const ui = require('./data')
const nav = require('../../utils/nav')

Page({
  data: { offline: false, templates: [], catalog: [], banners: [], homeArticles: [], wrist: 15, wristConfirmed: false, error: '', loading: true, hasDraft: false, configError: '' },
  onShow() {
    if (!this.configErrorShown) {
      this.configErrorShown = true
      this.setData({ configError: getApp().globalData.configError || '' })
    }
    const wrist = ui.wrist(), confirmed = !!wx.getStorageSync('cgz_wrist_confirmed')
    if (this.lastWrist !== undefined && this.lastWrist !== wrist) toast.show({ text: `已按 ${wrist}cm 重新排好` })
    this.lastWrist = wrist
    const draft = store.current(), hasDraft = !!(draft && draft.beads && draft.beads.length)
    this.setData({ wrist, wristConfirmed: confirmed, hasDraft })
    if (hasDraft && wx.showTabBarRedDot) wx.showTabBarRedDot({ index: 1 })
    else if (wx.removeTabBarRedDot) wx.removeTabBarRedDot({ index: 1 })
    this.load()
  },
  closeConfigError() { this.setData({ configError: '' }) },
  load() {
    this.setData({ loading: true, error: '' })
    api.catalog().then(c => {
      const cards = ui.catalogCards(c), byId = Object.fromEntries(cards.map(t => [t.id, t]))
      const banners = (c.banners || []).filter(b => !b.tpl || byId[b.tpl]).map(b => ({ ...b, keywords: Array.isArray(b.tags) ? b.tags.join(' · ') : (b.sub || ''), coverUrl: b.cover && /^https?:/.test(b.cover) ? b.cover : b.cover && b.cover[0] === '/' ? getApp().globalData.apiBase + b.cover : '', card: byId[b.tpl] || cards[0] }))
      const articles = Array.isArray(c.homeArticles) ? c.homeArticles.map(a => ({ ...a, image: a.cover && /^https?:/.test(a.cover) ? a.cover : a.cover && a.cover[0] === '/' ? getApp().globalData.apiBase + a.cover : '/assets/icons/bead.svg', summary: a.summary || a.excerpt || (Array.isArray(a.body) ? a.body[0] : '') })) : []
      this.setData({ offline: !!getApp().globalData.catalogOffline, templates: cards, catalog: c.beads || [], banners, homeArticles: articles, wrist: ui.wrist(), loading: false, error: '' })
    }).catch(() => {
      const fallback = getApp().globalData.catalog || require('../../utils/catalog-preview')
      const cards = ui.catalogCards(fallback), byId = Object.fromEntries(cards.map(t => [t.id, t]))
      const banners = (fallback.banners || []).filter(b => !b.tpl || byId[b.tpl]).map(b => ({ ...b, keywords: Array.isArray(b.tags) ? b.tags.join(' · ') : (b.sub || ''), card: byId[b.tpl] || cards[0] }))
      this.setData({ banners, catalog: fallback.beads || [], templates: [], homeArticles: [], loading: false, error: '款式没加载出来，检查一下网络' })
    })
  },
  start() { nav.openEditor() },
  ai() { wx.switchTab({ url: '/pages/ai/ai' }) },
  photo() { wx.navigateTo({ url: '/pages/photo/photo' }) },
  wrist() { ui.goWrist() },
  tryLast() {
    const d = store.current()
    if (d && d.beads && d.beads.length) return wx.navigateTo({ url: '/features/tryon/tryon' })
    toast.show({ text: '先挑一条手串试戴' })
  },
  use(e) {
    const t = this.data.templates[e.currentTarget.dataset.i]
    if (t) { ui.selectCard(t); wx.navigateTo({ url: '/pages/finish/finish' }) }
  },
  articleTap(e) {
    const a = this.data.homeArticles[e.currentTarget.dataset.i]
    if (a) wx.navigateTo({ url: '/features/article/article?id=' + encodeURIComponent(a.id) })
  },
  bannerTap(e) {
    const b = this.data.banners[e.currentTarget.dataset.i]
    if (!b) return
    const target = b.target
    if (target && target.type === 'article') return wx.navigateTo({ url: '/features/article/article?id=' + encodeURIComponent(target.id) })
    if (target && target.type === 'page') {
      const path = target.id[0] === '/' ? target.id : '/' + target.id
      if (path === '/pages/ai/ai' || path === '/pages/diy/diy' || path === '/pages/mine/mine' || path === '/pages/home/home') return wx.switchTab({ url: path })
      return wx.navigateTo({ url: path })
    }
    if (b.tpl || (target && target.type === 'template')) {
      const id = b.tpl || target.id
      const card = this.data.templates.find(t => t.id === id)
      if (card) { ui.selectCard(card); return wx.navigateTo({ url: '/pages/finish/finish' }) }
      return
    }
    this.start()
  }
})
