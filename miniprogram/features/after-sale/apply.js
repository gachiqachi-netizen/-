const auth = require('../../utils/auth')

function yuan(fen) { return (Number(fen || 0) / 100).toFixed(2) }
function needsPhoto(reason) { return /裂纹|瑕疵|图片|掉珠|断线|少件|漏发/.test(reason || '') }

Page({
  data: { option: null, reasons: [], reason: '', note: '', phone: '', newWrist: '', photos: [],
    amount: '0.00', loading: true, submitting: false, error: '', photoError: '', reasonOpen: false },
  onLoad(query) { this.no = query.no; this.type = query.type; return this.load() },
  async load() {
    this.setData({ loading: true, error: '' })
    try {
      const no = encodeURIComponent(this.no)
      const [order, result] = await Promise.all([
        auth.authorized('/my/orders/' + no),
        auth.authorized('/my/orders/' + no + '/after-sale-options')
      ])
      const option = (result.types || []).find(item => item.type === this.type)
      if (!option) throw new Error('这笔订单现在不能申请这种售后')
      this.setData({ option, reasons: option.reasons, amount: yuan(option.refundFen), phone: order.phone || '' })
    } catch (error) { this.setData({ error: error.message || '读取失败，请重试' }) }
    finally { this.setData({ loading: false }) }
  },
  toggleReasons() { this.setData({ reasonOpen: !this.data.reasonOpen }) },
  chooseReason(e) { this.setData({ reason: e.currentTarget.dataset.reason, reasonOpen: false, photoError: '' }) },
  inputNote(e) { this.setData({ note: e.detail.value }) },
  inputPhone(e) { this.setData({ phone: e.detail.value }) },
  inputWrist(e) { this.setData({ newWrist: e.detail.value }) },
  addPhoto() {
    if (this.data.photos.length >= 6) return
    wx.chooseMedia({ count: 6 - this.data.photos.length, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: result => (result.tempFiles || []).forEach(file => this.uploadPhoto(file.tempFilePath)) })
  },
  async uploadPhoto(path) {
    const photo = { path, id: '', busy: true, error: '' }
    this.setData({ photos: [...this.data.photos, photo], photoError: '' })
    try {
      const base64 = await new Promise((resolve, reject) => wx.getFileSystemManager().readFile({
        filePath: path, encoding: 'base64', success: result => resolve(result.data), fail: reject }))
      const ext = (path.split('.').pop() || 'jpg').toLowerCase()
      const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
      const result = await auth.authorized('/my/uploads', { filename: 'photo.' + ext, contentType, data: base64 }, 'POST')
      photo.id = result.id; photo.busy = false
    } catch (error) { photo.busy = false; photo.error = '没传上，点一下重试' }
    this.setData({ photos: this.data.photos.slice() })
  },
  retryPhoto(e) {
    const photo = this.data.photos[e.currentTarget.dataset.index]
    if (!photo || !photo.error) return
    this.setData({ photos: this.data.photos.filter(item => item !== photo) })
    this.uploadPhoto(photo.path)
  },
  removePhoto(e) { this.setData({ photos: this.data.photos.filter((_, index) => index !== e.currentTarget.dataset.index) }) },
  async submit() {
    if (!this.data.option || !this.data.reason || this.data.submitting) return
    if (needsPhoto(this.data.reason) && !this.data.photos.some(photo => photo.id)) {
      this.setData({ photoError: '质量问题需要至少一张照片' }); return
    }
    if (this.data.photos.some(photo => photo.busy || photo.error)) {
      this.setData({ photoError: '请等照片上传完成，失败的照片点一下重试' }); return
    }
    const payload = { type: this.data.option.type, reason: this.data.reason,
      userNote: this.data.note, photoIds: this.data.photos.map(photo => photo.id) }
    if (this.data.phone) payload.contactPhone = this.data.phone
    if (this.data.option.type === '改手围重串') payload.newWrist = Number(this.data.newWrist)
    this.setData({ submitting: true, error: '', photoError: '' })
    try {
      const result = await auth.authorized('/my/orders/' + encodeURIComponent(this.no) + '/after-sales', payload, 'POST')
      wx.redirectTo({ url: '/features/after-sale/detail?no=' + encodeURIComponent(result.afterSale.no) })
    } catch (error) { this.setData({ error: error.message || '提交失败，请再试一次' }) }
    finally { this.setData({ submitting: false }) }
  }
})
