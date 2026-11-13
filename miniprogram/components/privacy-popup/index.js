const { queue: toast } = require('../../utils/toast')
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
    openPrivacy() {
      // 打开微信隐私指引（低版本基础库没有此接口）
      if (wx.openPrivacyContract) wx.openPrivacyContract({ fail() {} })
    },
    agree() { privacy.finish(true) },
    reject() {
      privacy.finish(false)
      this.triggerEvent('reject')
      toast.show({ text: '已取消授权，其他功能仍可使用' })
    }
  }
})
