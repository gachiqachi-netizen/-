const auth = require('../../utils/auth')
const api = require('../../utils/api')
const store = require('../../utils/design')
const orderState = require('../../utils/order-state')
const money = require('../../utils/money')
const materials = require('../../pages/diy/materials')

Page({
  data: { order: null, items: [], catalog: [], loading: true, error: '', actionBusy: '', payment: null,
    paymentAmount: '', sheet: '', paidLanding: false, cancelReasons: ['不想要了', '想改一改再下单', '地址填错了', '其他'] },
  onLoad(q) { this.no = q.no; this.paidIntent = q.paid === '1'; api.catalog().then(c => this.setData({ catalog: c.beads || [] })).catch(() => {}); return this.load() },
  onPullDownRefresh() { return this.load().finally(() => wx.stopPullDownRefresh()) },
  async load() {
    this.setData({ loading: true, error: '' })
    try {
      const raw = await auth.authorized('/my/orders/' + encodeURIComponent(this.no), null, 'GET')
      if (!raw) throw new Error('未找到该订单')
      const order = Object.assign({}, raw, { state: orderState.view(raw),
        payable: money.yuan(Number.isInteger(raw.payableFen) ? raw.payableFen : 0),
        goodsPrice: money.yuan(Number.isInteger(raw.goodsFen) ? raw.goodsFen : 0),
        shippingPrice: money.yuan(Number.isInteger(raw.shippingFen) ? raw.shippingFen : 0) })
      const paidLanding = !!this.paidIntent && raw.paymentStatus === 'paid'
      this.paidIntent = false
      this.setData({ order, items: materials.fromSnapshot(raw.items || []), paidLanding })
    } catch (e) { this.setData({ error: e.message || '订单读取失败', order: null }) }
    finally { this.setData({ loading: false }) }
  },
  async startPayment() {
    if (this.data.actionBusy || !this.data.order) return
    this.setData({ actionBusy: 'pay_order' })
    try {
      const result = await auth.authorized('/my/orders/' + encodeURIComponent(this.no) + '/pay', {}, 'POST')
      const payment = result.payment
      if (!payment || !payment.mock || !Number.isInteger(payment.amountFen)) throw new Error('模拟支付暂不可用')
      this.setData({ payment, paymentAmount: money.yuan(payment.amountFen), sheet: 'payment' })
    } catch (e) { this.setData({ error: e.message || '付款暂不可用' }) }
    finally { this.setData({ actionBusy: '' }) }
  },
  async finishPayment(e) {
    if (!this.data.payment || this.data.actionBusy) return
    this.setData({ actionBusy: 'payment', error: '' })
    try {
      await auth.authorized('/payments/mock/notify', { orderNo: this.no,
        paymentId: this.data.payment.paymentId, result: e.currentTarget.dataset.result }, 'POST')
      this.setData({ payment: null, sheet: '' })
      this.paidIntent = true
      await this.load()
      if (this.data.paidLanding) wx.showToast({ title: '付款成功', icon: 'none' })
    } catch (error) { this.setData({ error: error.message || '付款结果未确认，请刷新订单' }) }
    finally { this.setData({ actionBusy: '' }) }
  },
  closePayment() { this.setData({ payment: null, sheet: '' }); return this.load() },
  runAction(e) {
    const code = e.currentTarget.dataset.code
    if (!code || this.data.actionBusy) return
    if (code === 'pay_order') return this.startPayment()
    if (code === 'cancel_order') return this.setData({ sheet: 'cancel' })
    if (code === 'confirm_receipt') return this.performAction(code)
    if (code === 'reorder') return this.reorder()
    if (code === 'view_logistics') return wx.navigateTo({ url: '/features/logistics/logistics?no=' + encodeURIComponent(this.no) })
    if (code === 'request_after_sale') return wx.navigateTo({ url: '/features/after-sale/after-sale?no=' + encodeURIComponent(this.no) })
  },
  async cancel(e) { this.setData({ sheet: '' }); return this.performAction('cancel_order', e.currentTarget.dataset.reason) },
  async performAction(code, reason) {
    this.setData({ actionBusy: code })
    try {
      await auth.authorized('/my/orders/' + encodeURIComponent(this.no) + '/actions', { action: code, reason }, 'POST')
      await this.load()
      wx.showToast({ title: code === 'cancel_order' ? '已取消' : '已确认收货', icon: 'none' })
      if (code === 'confirm_receipt' && wx.vibrateShort) wx.vibrateShort({ type: 'medium' })
    } catch (e) { this.setData({ error: e.message || '操作失败，请再试一次' }) }
    finally { this.setData({ actionBusy: '' }) }
  },
  copyNo() { wx.setClipboardData({ data: this.no, success: () => wx.showToast({ title: '订单号已复制', icon: 'none' }) }) },
  viewProduct() {
    const o = this.data.order
    if (!o || !Array.isArray(o.beads) || !o.beads.length) return
    const d = store.create()
    Object.assign(d, { name: o.name, meaning: o.meaning, wrist: o.wrist, beads: o.beads.slice() })
    store.selected(d)
    wx.navigateTo({ url: '/pages/finish/finish' })
  },
  viewOrder() { this.setData({ paidLanding: false }) },
  browse() { wx.switchTab({ url: '/pages/home/home' }) },
  reorder() {
    const o = this.data.order
    if (!o || !Array.isArray(o.beads) || !o.beads.length) return
    const d = store.create(); Object.assign(d, { name: o.name, wrist: o.wrist, beads: o.beads.slice(), reorder: true })
    store.selected(d); wx.navigateTo({ url: '/pages/order/order' })
  },
})
