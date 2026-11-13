const api = require('../../utils/api')
const store = require('../../utils/design')
const money = require('../../utils/money')
const nav = require('../../utils/nav')

const DEFAULT_PRICING = { shippingFen: 800, freeShippingThresholdFen: 9900 }

Page({
  data: {
    design: null,
    tab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'photo', label: '有图' },
      { key: 'wrist', label: '手围相近' },
    ],
    reviews: [],
    price: '',
    loading: true,
    error: '',
    showWrist: false,
  },

  onLoad() {
    this.load()
  },

  load() {
    const design = store.current()
    this.setData({ design, loading: true, error: '' })
    api.catalog().then(c => {
      this.catalog = (c && c.beads) || []
      const p = (c && c.pricing) || {}
      this.pricing = {
        shippingFen: Number.isInteger(p.shippingFen) ? p.shippingFen : DEFAULT_PRICING.shippingFen,
        freeShippingThresholdFen: Number.isInteger(p.freeShippingThresholdFen) ? p.freeShippingThresholdFen : DEFAULT_PRICING.freeShippingThresholdFen,
      }
      this.renderPrice(design)
      // 评价数据等后端 B14（与晒单 D35 共用），合并前列表为空
      this.setData({ loading: false })
    }).catch(e => {
      this.setData({ loading: false, error: e.message || '加载失败，请稍后重试' })
    })
  },

  renderPrice(design) {
    if (!design || !this.catalog) return this.setData({ price: '' })
    const map = Object.fromEntries(this.catalog.map(b => [b.id, b]))
    let goodsFen = 0
    ;(design.beads || []).forEach(id => {
      const b = map[id]
      if (b) goodsFen += Math.round(Number(b.price) * 100)
    })
    const shippingFen = goodsFen >= this.pricing.freeShippingThresholdFen ? 0 : this.pricing.shippingFen
    this.setData({ price: money.yuan(goodsFen + shippingFen) })
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.key })
  },

  order() {
    if (wx.getStorageSync('cgz_wrist_confirmed')) return nav.openOrder()
    this.setData({ showWrist: true })
  },
  confirmWrist() {
    const d = this.data.design
    const wrist = d && d.wrist ? d.wrist : 15
    wx.setStorageSync('cgz_wrist', wrist)
    wx.setStorageSync('cgz_wrist_confirmed', true)
    this.setData({ showWrist: false })
    nav.openOrder()
  },
  measureWrist() {
    this.setData({ showWrist: false })
    wx.navigateTo({ url: '/pages/wrist/wrist?source=finish' })
  },
  closeWrist() {
    this.setData({ showWrist: false })
  },

  retry() {
    this.load()
  },
})
