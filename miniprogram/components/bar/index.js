// 固定在底部的操作栏（任务卡 C0g）。
// 插槽：name="top"（勾选行等）、name="left"（价格）、默认（按钮）。
// 带底部安全区；组件在原位置留一个同高占位，页面内容不会被盖住。
Component({
  options: { styleIsolation: 'apply-shared' },
  data: { holderHeight: 0 },
  lifetimes: {
    ready() {
      this.measure()
    },
  },
  methods: {
    measure() {
      wx.createSelectorQuery()
        .in(this)
        .select('.c-bar')
        .boundingClientRect(rect => {
          if (rect && rect.height) this.setData({ holderHeight: rect.height })
        })
        .exec()
    },
  },
})
