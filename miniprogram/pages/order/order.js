const materials = require('../editor/materials')
const auth = require('../../utils/auth')
const store = require('../../utils/design')
const api = require('../../utils/api')
const sizing = require('../editor/logic')
const nav = require('../../utils/nav')

const KEY = 'cgz_pending_order_request'
const DEFAULT_PRICING = { handworkFen: 1500, cordFen: 500, giftFen: 1000, freeShippingThresholdFen: 9900, shippingFen: 800 }
function fingerprint(text) { let a = 2166136261, b = 2246822519; for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = Math.imul(b ^ c, 3266489917) } return (a >>> 0).toString(16) + '-' + (b >>> 0).toString(16) + '-' + text.length }
function requestId(payload) { const key = fingerprint(JSON.stringify(payload)), pending = wx.getStorageSync(KEY) || {}; if (pending[key]) return pending[key]; const id = 'order_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2) + '_' + Math.random().toString(36).slice(2); pending[key] = id; wx.setStorageSync(KEY, pending); return id }
function fen(value) { return Number.isInteger(value) ? value : 0 }
function price(fenValue) { return (fenValue / 100).toFixed(2) }

Page({
  data: { design: null, person: '', phone: '', addr: '', agreed: false, agreeError: false,
    addressShake: false, agreeShake: false, error: '', busy: false, order: null,
    cord: 0, gift: false, giftNote: '', hidePrice: false, sheet: '',
    items: [], beads: [], missing: [], goods: '0.00', handwork: '0.00',
    cordPrice: '0.00', giftPrice: '0.00', ship: '0.00', shipNote: '', total: '0.00',
    catalogReady: false, quotePending: false, quoteChanges: [], length: '0.0',
    fit: '', safety: '', hasSafety: false, loading: true },

  onShow() {
    const design = store.current()
    if (!this.initialized) {
      this.initialized = true
      this.setData({ design, cord: design && design.cord === 1 ? 1 : 0 })
    } else if (design !== this.data.design) {
      this.setData({ design })
    }
    if (!design) return this.setData({ loading: false })
    this.loadPromise = this.loadCatalog()
    this.loadAddress()
  },
  async loadCatalog() {
    const design = this.data.design
    const previous = this.catalog || (getApp().globalData.catalog || {}).beads || []
    const oldMap = Object.fromEntries(previous.map(bead => [bead.id, bead]))
    this.setData({ loading: true, catalogReady: false, error: '' })
    try {
      const response = await api.catalog(true)
      if (design !== this.data.design) return
      const next = (response.beads || []).filter(bead => bead.onSale !== false)
      const map = Object.fromEntries(next.map(bead => [bead.id, bead]))
      const changes = []
      for (const id of [...new Set(design.beads)]) {
        const before = oldMap[id], now = map[id]
        if (!now) { changes.push((before && before.name || id) + '已下架，换一颗才能下单。'); continue }
        const beforeFen = before && Math.round(Number(before.price) * 100)
        const afterFen = Math.round(Number(now.price) * 100)
        if (beforeFen != null && beforeFen !== afterFen) changes.push(now.name + ' ¥' + price(beforeFen) + ' → ¥' + price(afterFen) + ' / 颗')
      }
      this.catalog = next
      this.pricing = response.pricing || DEFAULT_PRICING
      this.setData({ quoteChanges: changes, quotePending: changes.length > 0, loading: false })
      this.calculate()
      this.setData({ catalogReady: !changes.length && !this.data.missing.length,
        sheet: changes.length ? 'price' : '' })
    } catch (error) {
      this.setData({ loading: false, catalogReady: false, error: '网络不太好，没能连上服务，点提交再试一次' })
    }
  },
  async loadAddress() {
    if (!auth.hasSession || !auth.hasSession() || this.data.person) return
    try {
      const result = await auth.authorized('/my/addresses')
      const rows = result.addresses || []
      const address = rows.find(row => row.isDefault) || rows[0]
      if (address && !this.data.person) this.useAddress(address)
    } catch (_) { /* A new customer can still choose a WeChat or manual address. */ }
  },
  useAddress(address) {
    const region = Array.isArray(address.region) ? address.region.join(' ') : (address.provinceName || '') + ' ' + (address.cityName || '') + ' ' + (address.countyName || '')
    this.setData({ person: address.person || address.userName || '', phone: address.phone || address.telNumber || '',
      addr: ((region || '') + ' ' + (address.detail || address.detailInfo || '')).trim(), addressShake: false, error: '' })
  },
  chooseAddress() {
    wx.chooseAddress({ success: address => {
      this.useAddress(address)
      if (auth.hasSession && auth.hasSession()) {
        auth.authorized('/my/addresses', { person: address.userName, phone: address.telNumber,
          region: [address.provinceName, address.cityName, address.countyName].filter(Boolean),
          detail: address.detailInfo, isDefault: true }, 'POST').catch(() => {})
      }
    } })
  },
  manualAddress() { this.setData({ sheet: 'address' }) },
  closeSheet() { if (this.data.sheet !== 'price') this.setData({ sheet: '' }) },
  openMaterials() { this.setData({ sheet: 'materials' }) },
  openCord() { this.setData({ sheet: 'cord' }) },
  openGift() { this.setData({ sheet: 'gift' }) },
  input(event) { this.setData({ [event.currentTarget.dataset.key]: event.detail.value }) },
  toggleGift() { this.setData({ gift: !this.data.gift }, () => this.calculate()) },
  toggleHidePrice() { this.setData({ hidePrice: !this.data.hidePrice }) },
  setCord(event) { this.setData({ cord: Number(event.currentTarget.dataset.cord), sheet: '' }, () => this.calculate()) },
  finishGift() { this.setData({ sheet: '' }) },
  toggleAgreed() { this.setData({ agreed: !this.data.agreed, agreeError: false, agreeShake: false }) },
  openRule(event) { wx.navigateTo({ url: '/features/doc/doc?type=' + encodeURIComponent(event.currentTarget.dataset.type) }) },
  edit() { nav.openEditor() },
  acceptPrice() {
    if (this.data.missing.length) return this.edit()
    this.submitAfterReprice = false
    this.setData({ sheet: '', quotePending: false, quoteChanges: [], catalogReady: true, error: '' })
  },
  declinePrice() { this.submitAfterReprice = false; this.setData({ sheet: '', error: '请核对新价格后再提交' }) },

  calculate() {
    const { design, cord, gift } = this.data
    if (!design || !Array.isArray(this.catalog)) return
    const map = Object.fromEntries(this.catalog.map(bead => [bead.id, bead]))
    let goodsFen = 0, length = 0
    const missing = []
    const beads = design.beads.map(id => {
      const bead = map[id]
      if (!bead) { if (!missing.includes(id)) missing.push(id); return null }
      goodsFen += Math.round(Number(bead.price) * 100)
      length += Number(bead.mm) || 0
      return bead
    }).filter(Boolean)
    const items = materials.fromCatalog(design.beads, this.catalog)
    const pricing = this.pricing || DEFAULT_PRICING
    const handworkFen = fen(pricing.handworkFen)
    const cordFen = cord === 1 ? fen(pricing.cordFen) : 0
    const giftFen = gift ? fen(pricing.giftFen) : 0
    const subtotalFen = goodsFen + handworkFen + cordFen + giftFen
    const threshold = pricing.freeShippingThresholdFen
    const shippingFen = threshold != null && subtotalFen >= threshold ? 0 : fen(pricing.shippingFen)
    const shipNote = shippingFen && threshold != null ? '满 ¥' + price(threshold) + ' 包邮' : ''
    const fit = sizing.stats(design.beads, this.catalog, design.wrist).fit
    const safety = materials.safetyLines(items)
    this.setData({ beads, items, missing, pricing, goods: price(goodsFen), handwork: price(handworkFen),
      cordPrice: price(cordFen), giftPrice: price(giftFen), ship: price(shippingFen),
      shipNote, total: price(subtotalFen + shippingFen), length: (length / 10).toFixed(1),
      fit, safety, hasSafety: !!safety })
  },

  async submit() {
    if (this.loadPromise) await this.loadPromise
    const { design, person, phone, addr, cord, gift, giftNote, hidePrice } = this.data
    if (this.data.busy || this.data.order) return
    if (!design) return this.setData({ error: '没找到要下单的手串' })
    if (this.data.missing.length) return this.setData({ error: '有材料已下架，回去换一颗' })
    if (this.data.quotePending) return this.setData({ sheet: 'price' })
    if (!person.trim() || !phone.trim() || !addr.trim()) {
      this.setData({ addressShake: true, error: '先填收货地址' })
      wx.showToast({ title: '先填收货地址', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(phone.trim())) return this.setData({ error: '请输入有效的 11 位手机号' })
    if (!this.data.agreed) {
      this.setData({ agreeError: true, agreeShake: true })
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
      return
    }
    if (!auth.hasSession || !auth.hasSession()) return auth.goLogin({ type: 'submitOrder' })
    if (!this.data.catalogReady) return this.setData({ error: '网络不太好，没能连上服务，点提交再试一次' })
    const before = JSON.stringify({ design, cord, gift, person, phone, addr, giftNote, hidePrice })
    const oldTotal = this.data.total, oldItems = JSON.stringify(this.data.items)
    this.setData({ busy: true, error: '' })
    try {
      const latest = await api.catalog(true)
      if (before !== JSON.stringify({ design: this.data.design, cord: this.data.cord, gift: this.data.gift,
        person: this.data.person, phone: this.data.phone, addr: this.data.addr,
        giftNote: this.data.giftNote, hidePrice: this.data.hidePrice })) {
        this.setData({ error: '订单信息已更改，请检查后重新提交' }); return
      }
      this.catalog = (latest.beads || []).filter(bead => bead.onSale !== false)
      this.pricing = latest.pricing || DEFAULT_PRICING
      this.calculate()
      if (this.data.missing.length) { this.setData({ error: '有材料已下架，回去换一颗' }); return }
      if (this.data.total !== oldTotal || JSON.stringify(this.data.items) !== oldItems) {
        this.submitAfterReprice = true
        this.setData({ quotePending: true, sheet: 'price', quoteChanges: ['合计 ¥' + oldTotal + ' → ¥' + this.data.total] })
        return
      }
      const confirmedQuote = { totalFen: Math.round(Number(this.data.total) * 100),
        items: this.data.items.map(item => ({ id: item.id, unitPriceFen: item.unitPriceFen, mm: Number(item.mm) })) }
      const payload = { name: design.name, beads: design.beads, wrist: design.wrist, cord, gift,
        person: person.trim(), phone: phone.trim(), addr: addr.trim(),
        confirmedQuote }
      payload.requestId = requestId(payload)
      payload.gift = { box: gift, card: giftNote.trim(), hidePrice }
      const order = await auth.authorized('/my/orders', payload)
      const pending = wx.getStorageSync(KEY) || {}
      Object.keys(pending).forEach(key => { if (pending[key] === payload.requestId) delete pending[key] })
      wx.setStorageSync(KEY, pending)
      this.setData({ order })
      if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' })
      nav.orderComplete(order.no)
    } catch (error) {
      if (error.status === 401) { auth.goLogin({ type: 'submitOrder' }); return }
      if (error.code === 'price_changed') {
        try {
          const latest = await api.catalog(true)
          const oldTotal = this.data.total
          this.catalog = (latest.beads || []).filter(bead => bead.onSale !== false)
          this.pricing = latest.pricing || DEFAULT_PRICING
          this.calculate()
          this.submitAfterReprice = true
          this.setData({ quotePending: true, sheet: 'price',
            quoteChanges: ['合计 ¥' + oldTotal + ' → ¥' + this.data.total] })
        } catch (_) { this.setData({ error: '价格有变化，请重新进入订单页核对' }) }
        return
      }
      this.setData({ error: error.code === 'idempotency_conflict'
        ? '这笔订单可能已经提交过了，先去“我的订单”看看'
        : '网络不太好，没能连上服务，点提交再试一次' })
    } finally { this.setData({ busy: false }) }
  },
  home() { wx.switchTab({ url: '/pages/home/home' }) },
})
