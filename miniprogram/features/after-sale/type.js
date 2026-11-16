const auth = require('../../utils/auth')
const api = require('../../utils/api')
const { yuan } = require('../../utils/money')

Page({
  data: { order: null, types: [], loading: true, error: '', policyOpen: false },
  onLoad(query) { this.no = query.no; return this.load() },
  async load() {
    this.setData({ loading: true, error: '' })
    try {
      const no = encodeURIComponent(this.no)
      const [order, result] = await Promise.all([
        auth.authorized('/my/orders/' + no),
        auth.authorized('/my/orders/' + no + '/after-sale-options')
      ])
      const descriptions = {
        '仅退款': '还没发货，审核后退款',
        '拒收后退款': '快递退回后退款',
        '退货退款': '质量问题，寄回后退款',
        '补寄配件': '掉珠、断线，补寄或寄回修',
        '改手围重串': '尺寸不合适，寄回按新手围重串'
      }
      this.setData({ order: { ...order, paidPrice: yuan(Number.isInteger(order.payableFen) ? order.payableFen : 0) }, types: (result.types || []).map(item => ({ ...item, description: descriptions[item.type] || '' })) })
    } catch (error) { this.setData({ error: api.userMessage(error) }) }
    finally { this.setData({ loading: false }) }
  },
  select(e) {
    const type = e.currentTarget.dataset.type
    wx.redirectTo({ url: '/features/after-sale/apply?no=' + encodeURIComponent(this.no) + '&type=' + encodeURIComponent(type) })
  },
  showPolicy() {
    this.setData({ policyOpen: true })
  },
  closePolicy() { this.setData({ policyOpen: false }) }
})
