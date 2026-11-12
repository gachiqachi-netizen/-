// 组件预览临时页（只在开发版能打开）。由任务卡 C0e 珠子图 填内容；C11 收尾时整个 kit 分包删除。
Page({
  onLoad() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const version = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
    if (version !== 'develop') {
      wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/home/home' }) } })
    }
  }
})
