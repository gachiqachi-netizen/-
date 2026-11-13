const { request } = require('../../utils/api')
const labels = ['', '很不满意', '不满意', '一般', '满意', '很满意']

Page({
  data: { orderId: '', name: '', image: '', spec: '', rating: 5, label: '很满意',
    stars: [1, 2, 3, 4, 5], content: '', photos: [], anonymous: true,
    readOnly: false, submitting: false, error: '' },
  onLoad(query) {
    const orderId = query.orderId || query.id || ''
    this.setData({ orderId })
    if (!orderId) return this.setData({ error: '找不到订单' })
    const path = '/my/orders/' + encodeURIComponent(orderId)
    request(path, null, 'GET').then(order => {
      const item = (order.items && order.items[0]) || order
      const beads = item.bead_count || item.beadCount || ''
      const wrist = item.wrist_cm || item.wristCm || ''
      this.setData({ name: item.name || item.design_name || '手串', image: item.thumbnail || item.image || '',
        spec: [beads ? beads + ' 颗' : '', wrist ? '手围 ' + wrist + 'cm' : ''].filter(Boolean).join(' · ') })
    }).catch(error => this.setData({ error: error.message || '订单加载失败' }))
    request(path + '/review', null, 'GET').then(review => {
      if (!review || !review.id) return
      const rating = Number(review.rating) || 5
      this.setData({ readOnly: true, rating, label: labels[rating], content: review.content || '',
        anonymous: review.anonymous !== false,
        photos: (review.photos || []).map(url => ({ url, status: 'done' })) })
    }).catch(() => {})
  },
  back() { wx.navigateBack() },
  rate(event) {
    if (this.data.readOnly) return
    const rating = Number(event.currentTarget.dataset.rating)
    this.setData({ rating, label: labels[rating] })
  },
  input(event) { this.setData({ content: event.detail.value }) },
  toggleAnonymous(event) { this.setData({ anonymous: event.detail.value }) },
  addPhoto() {
    if (this.data.readOnly || this.data.photos.length >= 6) return
    wx.chooseMedia({ count: 6 - this.data.photos.length, mediaType: ['image'],
      success: result => (result.tempFiles || []).forEach(file => this.uploadPhoto(file.tempFilePath)) })
  },
  uploadPhoto(path, index) {
    const photos = this.data.photos.slice()
    const photo = { path, url: '', status: 'uploading' }
    if (index === undefined) photos.push(photo)
    else photos[index] = photo
    this.setData({ photos })
    wx.getFileSystemManager().readFile({ filePath: path, encoding: 'base64',
      success: file => request('/my/uploads', { filename: path.split('/').pop(), content_base64: file.data }, 'POST')
        .then(result => {
          const next = this.data.photos.slice()
          const at = next.findIndex(item => item.path === path)
          if (at < 0) return
          next[at] = { path, url: result.url, status: 'done' }
          this.setData({ photos: next })
        }).catch(() => this.photoFailed(path)),
      fail: () => this.photoFailed(path) })
  },
  photoFailed(path) {
    this.setData({ photos: this.data.photos.map(item => item.path === path ? { path, url: '', status: 'failed' } : item) })
  },
  retryPhoto(event) {
    const index = Number(event.currentTarget.dataset.index)
    const photo = this.data.photos[index]
    if (photo && photo.status === 'failed') this.uploadPhoto(photo.path, index)
  },
  removePhoto(event) {
    if (this.data.readOnly) return
    const photos = this.data.photos.slice()
    photos.splice(Number(event.currentTarget.dataset.index), 1)
    this.setData({ photos })
  },
  publish() {
    if (this.data.readOnly || this.data.submitting || !this.data.orderId) return
    if (this.data.photos.some(photo => photo.status === 'uploading')) return this.setData({ error: '照片还在上传' })
    if (this.data.photos.some(photo => photo.status === 'failed')) return this.setData({ error: '照片没传上，请重试' })
    this.setData({ submitting: true, error: '' })
    request('/my/orders/' + encodeURIComponent(this.data.orderId) + '/review', {
      rating: this.data.rating, content: this.data.content.trim(),
      photos: this.data.photos.map(photo => photo.url), anonymous: this.data.anonymous
    }, 'POST').then(() => wx.navigateBack({ success: () => wx.showToast({ title: '已发布，谢谢你', icon: 'none' }) }))
      .catch(error => this.setData({ error: error.message || '发布失败，请再试一次' }))
      .then(() => this.setData({ submitting: false }))
  }
})
