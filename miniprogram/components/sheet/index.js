// 底部弹层（任务卡 C0g，稿 86 同款的通用 sheet）。
// 属性：show / title / maskClose（默认 true）/ grab（顶部小横条，默认 true）。
// 插槽：默认（内容）+ name="footer"。事件：close。
// 从底部升起 200ms；内容区最高 60% 屏；遮罩 catchtouchmove 拦住背后滚动；
// 带底部安全区；直角。在 tabBar 页上打开时收起 tabBar，关闭时恢复。
const TAB_ROUTES = ['pages/home/home', 'pages/diy/diy', 'pages/ai/ai', 'pages/mine/mine']

Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    maskClose: { type: Boolean, value: true },
    grab: { type: Boolean, value: true },
  },
  data: { wasTab: false },
  observers: {
    show(visible) {
      if (visible) this.onEnter()
      else this.onLeave()
    },
  },
  lifetimes: {
    detached() { this.onLeave() },
  },
  methods: {
    currentIsTab() {
      if (typeof getCurrentPages !== 'function') return false
      const pages = getCurrentPages()
      const page = pages[pages.length - 1]
      return !!page && TAB_ROUTES.indexOf(page.route) !== -1
    },
    onEnter() {
      if (this.data.wasTab || !this.currentIsTab()) return
      this.data.wasTab = true
      wx.hideTabBar({ fail() {} })
    },
    onLeave() {
      if (!this.data.wasTab) return
      this.data.wasTab = false
      wx.showTabBar({ fail() {} })
    },
    onMaskTap() {
      if (this.data.maskClose) this.triggerEvent('close')
    },
    // 拦住遮罩和面板背后的滚动穿透
    noop() {},
  },
})
