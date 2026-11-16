// 底部弹层（任务卡 C0g，稿 86 同款的通用 sheet）。
// 属性：show / title / maskClose（默认 true）/ grab（顶部小横条，默认 true）。
// 插槽：默认（内容）+ name="footer"。事件：close。
// 从底部升起 200ms；内容区最高 60% 屏；遮罩 catchtouchmove 拦住背后滚动；
// 带底部安全区；直角。tabBar 的可见性由所在页面管理。

Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    maskClose: { type: Boolean, value: true },
    grab: { type: Boolean, value: true },
  },
  methods: {
    onMaskTap() {
      if (this.data.maskClose) this.triggerEvent('close')
    },
    // 拦住遮罩和面板背后的滚动穿透
    noop() {},
  },
})
