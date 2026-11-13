const auth = require('../../utils/auth')
const { queue } = require('../../utils/toast')
const { validateAddress, payloadOf } = require('./validation')

Page({
  data: {
    title: '编辑地址', id: '', orderNo: '', person: '', phone: '', region: [],
    regionText: '', detail: '', isDefault: false, errors: {}, loading: false,
    saving: false, deleting: false, error: '',
  },
  onLoad(options = {}) {
    const id = options.id || '', orderNo = options.orderNo || ''
    this.setData({ id, orderNo, title: orderNo ? '修改地址' : id ? '编辑地址' : '加一个地址' })
    if (id) this.load(id)
  },
  async load(id) {
    this.setData({ loading: true, error: '' })
    try {
      const response = await auth.authorized('/my/addresses')
      const rows = Array.isArray(response) ? response : (response && response.addresses) || []
      const address = rows.find(item => item.id === id)
      if (!address) throw new Error('地址没找到，请返回列表再选一次')
      this.setData({ person: address.person || '', phone: address.phone || '',
        region: address.region || [], regionText: (address.region || []).join(' '),
        detail: address.detail || '', isDefault: !!address.isDefault, loading: false })
    } catch (error) { this.setData({ loading: false, error: error.message || '地址没取到，请再试一次' }) }
  },
  input(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value, ['errors.' + field]: '' })
  },
  chooseRegion(e) {
    const region = e.detail.value || []
    this.setData({ region, regionText: region.join(' '), 'errors.region': '' })
  },
  toggleDefault(e) { this.setData({ isDefault: !!e.detail.value }) },
  async save() {
    if (this.data.saving || this.data.loading) return
    const { errors, first } = validateAddress(this.data)
    if (first) {
      this.setData({ errors })
      wx.pageScrollTo({ selector: '#row-' + first, duration: 200 })
      return
    }
    this.setData({ saving: true, error: '' })
    const payload = payloadOf(this.data)
    try {
      if (this.data.orderNo) {
        await auth.authorized('/my/orders/' + encodeURIComponent(this.data.orderNo) + '/address', payload, 'PUT')
      } else if (this.data.id) {
        await auth.authorized('/my/addresses', { id: this.data.id, ...payload }, 'PUT')
      } else {
        await auth.authorized('/my/addresses', payload, 'POST')
      }
      queue.show({ text: this.data.orderNo ? '地址已改' : '已保存' })
      wx.navigateBack()
    } catch (error) {
      const sent = /发货|已寄/.test(error.message || '')
      this.setData({ error: sent ? '已经发货，改不了了，请联系客服' : (error.message || '保存失败，请再试一次') })
    } finally { this.setData({ saving: false }) }
  },
  async remove() {
    if (!this.data.id || this.data.deleting) return
    this.setData({ deleting: true, error: '' })
    const old = payloadOf(this.data)
    try {
      await auth.authorized('/my/addresses', { id: this.data.id }, 'DELETE')
      wx.navigateBack()
      queue.show({ text: '已删除', action: '撤销', onAction: async () => {
        try {
          await auth.authorized('/my/addresses', old, 'POST')
          const pages = getCurrentPages()
          const list = pages[pages.length - 1]
          if (list && list.load) list.load()
          queue.show({ text: '已撤销删除' })
        } catch (error) { queue.show({ text: error.message || '撤销失败，请重新添加' }) }
      } })
    } catch (error) { this.setData({ error: error.message || '删除失败，请再试一次' }) }
    finally { this.setData({ deleting: false }) }
  },
})
