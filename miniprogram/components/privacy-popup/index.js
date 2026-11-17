const { queue: toast } = require('../../utils/toast')
const privacy = require('../../utils/privacy')

const copy = {
  phone: ['登录前，请先看一下', '我们用你的手机号认出你，订单和作品跟着账号走，不会公开或用于营销短信。'],
  address: ['选地址前，请先看一下', '读取你在微信里保存的收货地址，只用于这笔订单的发货。'],
  photo: ['上传照片前，请先看一下', '从相册选照片或拍照，只用于这次售后或评价，提交后才会上传。'],
  album: ['保存图片前，请先看一下', '把海报保存到你的相册，我们不会读取相册里的其他照片。'],
  avatar: ['选头像前，请先看一下', '你选的头像只保存在这台手机上，用于“我的”页显示。']
}

function copyFor(kind, scene) {
  if (copy[kind]) return { title: copy[kind][0], body: copy[kind][1] }
  return { title: '用相机前，请先看一下', body: `${scene}，需要用到你的相机或相册。照片仅在你确认后发送到识别服务；实时手腕画面只在本机处理。` }
}

Component({
  options: { addGlobalClass: true },
  properties: {
    scene: { type: String, value: '继续使用此功能', observer() { this.updateCopy() } },
    kind: { type: String, value: 'camera', observer() { this.updateCopy() } }
  },
  data: { visible: false, title: '', body: '' },
  lifetimes: {
    attached() { this.updateCopy(); this.unsubscribe = privacy.subscribe(visible => this.setData({visible})) },
    detached() { if (this.unsubscribe) this.unsubscribe() }
  },
  methods: {
    updateCopy() { this.setData(copyFor(this.properties.kind, this.properties.scene)) },
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

module.exports = { copyFor }
