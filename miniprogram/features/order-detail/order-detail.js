const { queue: toast } = require('../../utils/toast')
const auth = require('../../utils/auth')
const api = require('../../utils/api')
const store = require('../../utils/design')
const orderState = require('../../utils/order-state')
const money = require('../../utils/money')
const materials = require('../../pages/diy/materials')

function beijingTime(value) {
  const date = new Date(Number(value))
  if (!Number.isFinite(date.getTime())) return ''
  const local = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`
}

Page({
  data: { order: null, items: [], catalog: [], loading: true, error: '', actionBusy: '', payment: null,
    primaryAction: null, secondaryActions: [], afterSaleNo: '', afterSaleActive: false,
    paymentAmount: '', sheet: '', paidLanding: false, cancelReasons: ['不想要了', '想改一改再下单', '地址填错了', '其他'] },
  onLoad(q) { this.no = q.no; this.paidIntent = q.paid === '1'; this.catalogPromise = api.catalog().then(c => { this.setData({ catalog: c.beads || [] }); return c }).catch(() => ({})); return this.load() },
  onPullDownRefresh() { return this.load().finally(() => wx.stopPullDownRefresh()) },
  async load() {
    this.setData({ loading: true, ready: false, error: '' })
    try {
      const raw = await auth.authorized('/my/orders/' + encodeURIComponent(this.no), null, 'GET')
      if (!raw) throw new Error('未找到该订单')
      const state = orderState.view(raw)
      const catalog = this.catalogPromise ? await this.catalogPromise : {}
      const pricing = catalog.pricing || {}
      const cordFen = raw.cord === 1 && Number.isInteger(pricing.cordFen) ? pricing.cordFen : 0
      const giftFen = raw.gift && raw.gift.box && Number.isInteger(pricing.giftFen) ? pricing.giftFen : 0
      const quotedHandwork = Number.isInteger(raw.subtotalFen) && Number.isInteger(raw.goodsFen)
        ? raw.subtotalFen - raw.goodsFen - cordFen - giftFen : 0
      const handworkFen = Number.isInteger(raw.handworkFen) ? raw.handworkFen
        : (Number.isInteger(raw.designSnapshot && raw.designSnapshot.handworkFen)
          ? raw.designSnapshot.handworkFen : Math.max(0, quotedHandwork))
      const order = Object.assign({}, raw, { state,
        payable: money.yuan(Number.isInteger(raw.payableFen) ? raw.payableFen : 0),
        goodsPrice: money.yuan(Number.isInteger(raw.goodsFen) ? raw.goodsFen : 0),
        handworkPrice: handworkFen > 0 ? money.yuan(handworkFen) : '',
        cordPrice: cordFen > 0 ? money.yuan(cordFen) : '',
        giftPrice: giftFen > 0 ? money.yuan(giftFen) : '',
        shippingPrice: money.yuan(Number.isInteger(raw.shippingFen) ? raw.shippingFen : 0),
        createdLabel: beijingTime(raw.createdAt) })
      const primaryAction = state.actions.find(action => ['pay_order', 'confirm_receipt', 'write_review'].includes(action.code)) || null
      const secondaryActions = state.actions.filter(action => action !== primaryAction)
      const paidLanding = !!this.paidIntent && raw.paymentStatus === 'paid'
      this.paidIntent = false
      const afterSaleActive = String(state.code).startsWith('after_sale')
      this.setData({ order, items: materials.fromSnapshot(raw.items || []), paidLanding, primaryAction, secondaryActions, afterSaleActive, ready: true })
      if (afterSaleActive) {
        try {
          const result = await auth.authorized('/my/orders/' + encodeURIComponent(this.no) + '/after-sales')
          const latest = (result.afterSales || []).slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0]
          this.setData({ afterSaleNo: latest && latest.no || '' })
        } catch (_) { this.setData({ afterSaleNo: '' }) }
      } else this.setData({ afterSaleNo: '' })
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
      if (this.data.paidLanding) toast.show({ text: '付款成功' })
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
    if (code === 'edit_address') return wx.navigateTo({ url: '/features/address-edit/address-edit?orderNo=' + encodeURIComponent(this.no) })
    if (code === 'request_after_sale') return wx.navigateTo({ url: '/features/after-sale/type?no=' + encodeURIComponent(this.no) })
    if (code === 'write_review') return wx.navigateTo({ url: '/features/review/review?orderId=' + encodeURIComponent(this.no) })
  },
  async viewAfterSale() {
    let no = this.data.afterSaleNo
    if (!no) {
      try {
        const result = await auth.authorized('/my/orders/' + encodeURIComponent(this.no) + '/after-sales')
        const latest = (result.afterSales || []).slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0]
        no = latest && latest.no
      } catch (e) { return toast.show({ text: e.message || '售后记录暂时无法读取' }) }
    }
    if (!no) return toast.show({ text: '售后记录暂时无法读取' })
    wx.navigateTo({ url: '/features/after-sale/detail?no=' + encodeURIComponent(no) })
  },
  async cancel(e) { this.setData({ sheet: '' }); return this.performAction('cancel_order', e.currentTarget.dataset.reason) },
  async performAction(code, reason) {
    this.setData({ actionBusy: code })
    try {
      await auth.authorized('/my/orders/' + encodeURIComponent(this.no) + '/actions', { action: code, reason }, 'POST')
      await this.load()
      toast.show({ text: code === 'cancel_order' ? '已取消' : '已确认收货' })
      if (code === 'confirm_receipt' && wx.vibrateShort) wx.vibrateShort({ type: 'medium' })
    } catch (e) { this.setData({ error: e.message || '操作失败，请再试一次' }) }
    finally { this.setData({ actionBusy: '' }) }
  },
  copyNo() { wx.setClipboardData({ data: this.no, success: () => toast.show({ text: '订单号已复制' }) }) },
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

module.exports = { beijingTime }
