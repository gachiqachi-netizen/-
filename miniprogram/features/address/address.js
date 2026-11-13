const auth = require('../../utils/auth')
const { queue } = require('../../utils/toast')

function rowsOf(response) {
  const rows = Array.isArray(response) ? response : (response && response.addresses) || []
  return rows.map(row => ({ ...row,
    phoneLabel: String(row.phone || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
    addressLine: (Array.isArray(row.region) ? row.region.join('') : '') + String(row.detail || ''),
  }))
}

Page({
  data: { rows: [], loading: true, error: '', selecting: false, importing: false },
  onLoad(options = {}) { this.setData({ selecting: options.select === '1' || options.mode === 'select' }) },
  onShow() { this.load() },
  async load() {
    this.setData({ loading: true, error: '' })
    try { this.setData({ rows: rowsOf(await auth.authorized('/my/addresses')), loading: false }) }
    catch (error) { this.setData({ loading: false, error: error.message || '地址没取到，请再试一次' }) }
  },
  add() {
    if (this.data.rows.length >= 20) return queue.show({ text: '最多保存 20 个地址' })
    wx.navigateTo({ url: '/features/address-edit/address-edit' })
  },
  edit(e) { wx.navigateTo({ url: '/features/address-edit/address-edit?id=' + encodeURIComponent(e.currentTarget.dataset.id) }) },
  select(e) {
    if (!this.data.selecting) return
    const address = this.data.rows.find(row => row.id === e.currentTarget.dataset.id)
    if (!address) return
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
    if (channel && channel.emit) channel.emit('selectAddress', address)
    wx.navigateBack()
  },
  importWechat() {
    if (this.data.rows.length >= 20) return queue.show({ text: '最多保存 20 个地址' })
    if (this.data.importing) return
    this.setData({ importing: true })
    wx.chooseAddress({
      success: async result => {
        const address = { person: result.userName, phone: result.telNumber,
          region: [result.provinceName, result.cityName, result.countyName],
          detail: result.detailInfo, isDefault: false }
        try { await auth.authorized('/my/addresses', address, 'POST'); await this.load(); queue.show({ text: '已加上' }) }
        catch (error) { queue.show({ text: error.message || '地址没加上，请再试一次' }) }
        finally { this.setData({ importing: false }) }
      },
      fail: () => { this.setData({ importing: false }); queue.show({ text: '没拿到微信地址，可以手动加一个' }) },
    })
  },
})
