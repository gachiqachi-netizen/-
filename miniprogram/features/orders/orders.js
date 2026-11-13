const auth = require('../../utils/auth')
const api = require('../../utils/api')
const money = require('../../utils/money')
const meaning = require('../../utils/meaning')
const orderState = require('../../utils/order-state')
const contract = require('../../utils/contract')
const group = require('./group')

// 把订单装配成列表行；status 用 customerStatus（卡片：分栏按它的 code 归类）
function buildRow(raw) {
  const order = orderState.decorate(raw)
  const status = order.customerStatus || {}
  const beads = Array.isArray(order.beads) ? order.beads : []
  const keywords = meaning.keywords(order.items || [], 2)
  const actionCode = status.primaryAction
  return {
    no: order.no,
    name: order.name || '我的手串',
    code: status.code || '',
    statusLabel: status.label || '处理中',
    tone: status.tone || 'normal',
    payableYuan: money.yuan(Number.isInteger(order.payableFen) ? order.payableFen : 0),
    count: beads.length,
    wrist: order.wrist,
    keywords,
    beads,
    afterSaleStatus: (order.state && order.state.afterSale ? order.state.afterSale.code : '') || order.afterSaleStatus || 'none',
    action: actionCode ? { code: actionCode, label: (contract.actions || {})[actionCode] || actionCode } : null,
  }
}

Page({
  data: {
    tabs: group.TABS,
    tab: 'all',
    rows: [],
    counts: { all: 0 },
    loading: true,
    error: '',
    loggedIn: false,
    catalog: [],
    busyNo: '',
    fade: true,
    loadedOnce: false,
  },

  onLoad(query) {
    const tab = group.TABS.some(t => t.key === query.tab) ? query.tab : 'all'
    this.setData({ tab })
  },

  onShow() {
    api.catalog().then(c => this.setData({ catalog: c.beads || [] })).catch(() => {})
    this.loadOrders(!this.data.loadedOnce)
  },

  onPullDownRefresh() {
    this.loadOrders(false).finally(() => wx.stopPullDownRefresh())
  },

  loadOrders(withSkeleton) {
    if (withSkeleton) this.setData({ loading: true, error: '' })
    return auth.authorized('/my/orders')
      .then(rows => {
        const orders = (Array.isArray(rows) ? rows : []).map(buildRow)
        this.setData({ loggedIn: auth.hasSession(), rows, counts: group.countsOf(orders), error: '', loadedOnce: true })
      })
      .catch(e => this.setData({ loggedIn: auth.hasSession(), error: e.message || '读取失败' }))
      .finally(() => this.setData({ loading: false }))
  },

  retry() {
    this.loadOrders(true)
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goDiy() {
    wx.switchTab({ url: '/pages/diy/diy' })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.key
    if (tab === this.data.tab) return
    // 切分类列表淡入，不整页刷新
    this.setData({ tab, fade: false })
    setTimeout(() => this.setData({ fade: true }), 30)
  },

  visibleRows() {
    return group.rowsInTab(this.data.rows, this.data.tab)
  },

  // 点行进订单详情；售后分栏进售后详情（04 第 13 节）
  viewDetail(e) {
    const no = e.currentTarget.dataset.no
    if (!no) return
    const url = this.data.tab === 'after_sale'
      ? '/features/after-sale/detail?no=' + encodeURIComponent(no)
      : '/features/order-detail/order-detail?no=' + encodeURIComponent(no)
    wx.navigateTo({ url })
  },

  // 行尾主按钮：确认收货原地执行并更新这一行；其余动作进订单详情处理
  runAction(e) {
    const no = e.currentTarget.dataset.no
    const code = e.currentTarget.dataset.code
    const row = this.data.rows.find(r => r.no === no)
    if (!row || !row.action || this.data.busyNo) return
    if (code !== 'confirm_receipt') {
      return wx.navigateTo({ url: '/features/order-detail/order-detail?no=' + encodeURIComponent(no) })
    }
    wx.showModal({
      title: '确认收货',
      content: '请确认已经收到商品。确认后订单将完成。',
      confirmColor: '#c8302e',
      success: r => {
        if (!r.confirm) return
        this.setData({ busyNo: no })
        auth.authorized('/my/orders/' + no + '/actions/confirm_receipt', {}, 'POST')
          .then(updated => {
            const fresh = buildRow(updated)
            const rows = this.data.rows.map(item => (item.no === no ? fresh : item))
            this.setData({ rows, counts: group.countsOf(rows) })
            wx.showToast({ title: '已确认收货', icon: 'success' })
          })
          .catch(err => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
          .finally(() => this.setData({ busyNo: '' }))
      },
    })
  },

  // 售后分栏：退货中需要寄回的行尾“填写单号”
  fillReturn(e) {
    const no = e.currentTarget.dataset.no
    if (no) wx.navigateTo({ url: '/features/after-sale/return?no=' + encodeURIComponent(no) })
  },
})
