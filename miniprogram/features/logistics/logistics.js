const { queue: toast } = require('../../utils/toast')
const auth = require('../../utils/auth')

Page({
  data: {
    loading: true, error: '', order: null, carrier: '', trackingNo: '',
    tracks: [], canEdit: false, editOpen: false, addressOpen: false,
    addresses: [], person: '', phone: '', region: [], regionText: '', detail: '',
    fieldsError: {}, saving: false,
  },
  onLoad(options) {
    this.no = options && options.no || ''
    this.addressMode = options && options.mode === 'address'
    this.load()
  },
  async load() {
    if (!this.no) return this.setData({ loading: false, error: '没有找到这笔订单' })
    this.setData({ loading: true, error: '' })
    try {
      const order = await auth.authorized('/my/orders/' + encodeURIComponent(this.no))
      const logistics = order.logistics || {}
      const history = Array.isArray(logistics.traces) ? logistics.traces : []
      const tracks = history.slice().reverse().map((item, index) => ({
        at: item.at ? new Date(item.at).toLocaleString() : '',
        detail: item.detail || item.action || '', newest: index === 0,
      })).filter(item => item.detail)
      const canEdit = (order.allowedActions || []).includes('edit_address')
      this.setData({ order, carrier: logistics.carrierName || logistics.carrierCode || '',
        trackingNo: logistics.trackingNo || '', tracks, canEdit,
        person: order.person || '', phone: order.phone || '', detail: order.addr || '',
        regionText: order.addr ? '当前地址' : '', loading: false, editOpen: this.addressMode && canEdit })
    } catch (error) {
      this.setData({ loading: false, error: error.message || '物流暂时加载失败' })
    }
  },
  onPullDownRefresh() { return this.load().finally(() => wx.stopPullDownRefresh()) },
  copyNo() {
    if (!this.data.trackingNo) return
    wx.setClipboardData({ data: this.data.trackingNo,
      success: () => toast.show({ text: '单号已复制' }) })
  },
  editAddress() {
    if (!this.data.canEdit) return
    this.setData({ editOpen: true, fieldsError: {} })
  },
  closeAddress() { if (!this.data.saving) this.setData({ editOpen: false }) },
  input(event) { this.setData({ [event.currentTarget.dataset.key]: event.detail.value }) },
  chooseRegion(event) { this.setData({ region: event.detail.value, regionText: event.detail.value.join(' '), 'fieldsError.region': '' }) },
  chooseWechatAddress() {
    wx.chooseAddress({ success: address => this.setData({
      person: address.userName || '', phone: address.telNumber || '',
      region: [address.provinceName, address.cityName, address.countyName].filter(Boolean),
      regionText: [address.provinceName, address.cityName, address.countyName].filter(Boolean).join(' '),
      detail: address.detailInfo || '', fieldsError: {},
    }) })
  },
  async openAddressBook() {
    try {
      const result = await auth.authorized('/my/addresses')
      this.setData({ addresses: result.addresses || [], addressOpen: true })
    } catch (error) { toast.show({ text: error.message || '地址暂时打不开' }) }
  },
  closeAddressBook() { this.setData({ addressOpen: false }) },
  selectAddress(event) {
    const address = this.data.addresses[event.currentTarget.dataset.index]
    if (!address) return
    this.setData({ person: address.person || '', phone: address.phone || '',
      region: address.region || [], regionText: (address.region || []).join(' '), detail: address.detail || '',
      addressOpen: false, fieldsError: {} })
  },
  async saveAddress() {
    if (this.data.saving || !this.data.canEdit) return
    const { person, phone, region, detail } = this.data
    const errors = {}
    if (!person.trim()) errors.person = '请填收货人'
    if (!/^1\d{10}$/.test(phone.trim())) errors.phone = '手机号是 11 位数字'
    if ((!Array.isArray(region) || region.length < 3) && !this.data.order.addr) errors.region = '请选所在地区'
    if (!detail.trim()) errors.detail = '请填详细地址'
    if (Object.keys(errors).length) {
      this.setData({ fieldsError: errors })
      wx.pageScrollTo({ selector: '#field-' + Object.keys(errors)[0], duration: 200 })
      return
    }
    this.setData({ saving: true, fieldsError: {} })
    try {
      await auth.authorized('/my/orders/' + encodeURIComponent(this.no) + '/address',
        { person: person.trim(), phone: phone.trim(), addr: region.length ? [...region, detail.trim()].join(' ') : detail.trim() }, 'POST')
      this.setData({ editOpen: false })
      toast.show({ text: '地址已改' })
      await this.load()
    } catch (error) {
      toast.show({ text: /发货/.test(error.message || '') ? '已经发货，改不了了' : '保存失败，请重试' })
      await this.load()
    } finally { this.setData({ saving: false }) }
  },
})
