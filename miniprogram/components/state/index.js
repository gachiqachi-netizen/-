// 空状态 / 失败状态共用组件（任务卡 C0f）。
// 稿 20、62、87：居中，一行大字、一行灰字、一个次按钮（或文字链接）。
Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    title: { type: String, value: '' },
    desc: { type: String, value: '' },
    action: { type: String, value: '' },
    link: { type: String, value: '' },
  },
  methods: {
    onAction() {
      this.triggerEvent('action')
    },
    onLink() {
      this.triggerEvent('link')
    },
  },
})
