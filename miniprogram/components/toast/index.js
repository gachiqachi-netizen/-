// 浮动提示组件（任务卡 C0g，稿 85）：黑底白字胶囊，一句话，最多一个操作。
// 订阅 utils/toast.js 的全站单例 queue；页面传 anchor 可加类名改位置（工作台用托盘底部）。
const { queue } = require('../../utils/toast')

Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    anchor: { type: String, value: '' },
  },
  data: { current: null },
  lifetimes: {
    attached() {
      this.unsubscribe = queue.subscribe(current => this.setData({ current }))
    },
    detached() {
      if (this.unsubscribe) this.unsubscribe()
    },
  },
  methods: {
    onAction() { queue.action() },
  },
})
