const privacy = require('../../utils/privacy')

Component({
  properties: {
    scene: {type: String, value: '继续使用此功能'}
  },
  data: {visible: false},
  lifetimes: {
    attached() { this.unsubscribe = privacy.subscribe(visible => this.setData({visible})) },
    detached() { if (this.unsubscribe) this.unsubscribe() }
  },
  methods: {
    agree() { privacy.finish(true) },
    reject() {
      privacy.finish(false)
      this.triggerEvent('reject')
      wx.showToast({title: '已取消授权，其他功能仍可使用', icon: 'none'})
    }
  }
})
