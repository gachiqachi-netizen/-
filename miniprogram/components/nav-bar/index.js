Component({
  properties: { title: { type: String, value: '' }, home: { type: Boolean, value: false } },
  data: { statusHeight: 0, navHeight: 44, capsuleRight: 0 },
  lifetimes: { attached() {
    const info = wx.getSystemInfoSync()
    const capsule = wx.getMenuButtonBoundingClientRect()
    this.setData({ statusHeight: info.statusBarHeight || 0, navHeight: capsule.height + 2 * (capsule.top - (info.statusBarHeight || 0)), capsuleRight: info.screenWidth - capsule.left })
  } },
  methods: { goBack() { if (this.data.home) wx.reLaunch({ url: '/pages/home/index' }); else wx.navigateBack({ delta: 1 }) } },
})
