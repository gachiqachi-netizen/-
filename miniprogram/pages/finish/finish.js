const api = require('../../utils/api')
const store = require('../../utils/design')
const logic = require('../editor/logic')
const meaning = require('../../utils/meaning')
const money = require('../../utils/money')
const nav = require('../../utils/nav')
const toast = require('../../utils/toast').queue

const DEFAULT_PRICING = { shippingFen: 800, freeShippingThresholdFen: 9900 }

Page({
  data: {
    design: null,
    items: [],          // 按顺序的珠子对象数组（供手串圆环）
    counts: [],         // 详情里的每颗珠子 {id, bead, n, line}
    beadsCount: 0,
    lengthText: '',     // 总长 "168mm"
    fitText: '',        // "合适" / "还差约 5mm" / "超出约 11mm"
    goods: '',          // 珠子价 "¥92"
    shipping: '',       // 运费 "¥8" 或 "包邮"
    shippingRow: '',    // 配送行整句
    price: '',          // 到手价 "¥100"
    shippingNote: '',   // "到手价，已含运费" / "到手价，包邮"
    line: '',           // 一句寓意
    tags: '',           // 寓意关键词
    loading: true,
    error: '',
    down: false,        // 款式已下架
    outOfStock: false,  // 有珠子缺货
    outOfStockName: '',
    showSize: false,
    showWrist: false,
    current: 0,
    slides: [{ kind: 'bracelet' }],
  },

  onLoad() {
    this.wristBefore = null
    this.loaded = false
    this.load()
  },

  onShow() {
    if (this.loaded) this.refreshDesign()
  },

  load() {
    const design = store.current()
    if (!design || !design.beads || !design.beads.length) {
      this.setData({ loading: false, down: true, design: design || null })
      return
    }
    this.wristBefore = design.wrist
    this.setData({ design, loading: true, error: '', down: false })
    api.catalog().then(c => {
      this.catalog = (c && c.beads) || []
      const p = (c && c.pricing) || {}
      this.pricing = {
        shippingFen: Number.isInteger(p.shippingFen) ? p.shippingFen : DEFAULT_PRICING.shippingFen,
        freeShippingThresholdFen: Number.isInteger(p.freeShippingThresholdFen) ? p.freeShippingThresholdFen : DEFAULT_PRICING.freeShippingThresholdFen,
      }
      this.loaded = true
      this.render(store.current() || design)
      this.setData({ loading: false })
    }).catch(e => {
      this.setData({ loading: false, error: e.message || '加载失败，请稍后重试' })
    })
  },

  refreshDesign() {
    const design = store.current()
    if (!design || !design.beads || !design.beads.length) return
    const changed = this.wristBefore != null && design.wrist !== this.wristBefore
    this.wristBefore = design.wrist
    this.render(design)
    if (changed) toast.show({ text: '已按 ' + design.wrist + 'cm 重新判断' })
  },

  render(design) {
    const map = Object.fromEntries(this.catalog.map(b => [b.id, b]))
    const items = design.beads.map(id => map[id]).filter(Boolean)
    const missingCount = design.beads.length - items.length
    const st = logic.stats(design.beads, this.catalog, design.wrist)

    // 缺货：还在目录里但标了 out_of_stock；或珠子已下架（不在目录里）
    const outOfStockBeads = items.filter(b => b.stock === 'out_of_stock')
    const down = items.length === 0
    const outOfStock = !down && (outOfStockBeads.length > 0 || missingCount > 0)
    const outOfStockName = outOfStockBeads.length ? outOfStockBeads[0].name : (missingCount ? '部分材料' : '')

    // 详情里的每颗珠子（按 id 去重，带数量）
    const countsMap = {}
    items.forEach(b => { countsMap[b.id] = (countsMap[b.id] || 0) + 1 })
    const counts = Object.keys(countsMap).map(id => ({
      id,
      bead: map[id],
      n: countsMap[id],
      line: meaning.beadLine(map[id]),
    }))

    // 到手价 = 珠子 + 运费（无单独手工费，见 04 第 0 节第 12 条）
    let goodsFen = 0
    items.forEach(b => { goodsFen += Math.round(Number(b.price) * 100) })
    const shippingFen = goodsFen >= this.pricing.freeShippingThresholdFen ? 0 : this.pricing.shippingFen
    const payableFen = goodsFen + shippingFen

    const line = design.line || design.meaning || meaning.keywords(items).join(' · ')
    const tags = meaning.keywords(items, Infinity).join(' · ')
    const fitText = st.fit === '长度基本合适' ? '合适' : st.fit

    this.setData({
      design, items, counts,
      beadsCount: design.beads.length,
      lengthText: st.length + 'mm',
      fitText,
      goods: money.yuan(goodsFen),
      shipping: shippingFen === 0 ? '包邮' : money.yuan(shippingFen),
      shippingRow: shippingFen === 0 ? '包邮 · 下单后制作' : ('运费 ' + money.yuan(shippingFen) + '，满 ¥99 包邮 · 下单后制作'),
      price: money.yuan(payableFen),
      shippingNote: shippingFen === 0 ? '到手价，包邮' : '到手价，已含运费',
      line, tags,
      down, outOfStock, outOfStockName,
    })
  },

  onSwiperChange(e) {
    this.setData({ current: e.detail.current })
  },

  openSize() {
    this.setData({ showSize: true })
  },
  closeSize() {
    this.setData({ showSize: false })
  },
  goWrist() {
    this.setData({ showSize: false })
    wx.navigateTo({ url: '/pages/wrist/wrist?source=finish' })
  },

  tryon() {
    wx.navigateTo({ url: '/features/tryon/tryon' })
  },

  edit() {
    this.goWorkbench()
  },
  replace() {
    this.goWorkbench()
  },
  goWorkbench() {
    const d = this.data.design
    if (d) store.selected(d)
    wx.switchTab({ url: '/pages/diy/diy' })
  },

  order() {
    if (this.data.outOfStock) return this.replace()
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
  goHome() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  onShareAppMessage() {
    return { title: this.data.design ? this.data.design.name : '串个珠', path: '/pages/home/home' }
  },
})
