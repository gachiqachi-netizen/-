// 组件预览临时页（只在开发版能打开）。由任务卡 C0c 字标 填内容；C11 收尾时整个 kit 分包删除。
Page({
  data: {
    rows: [
      { tone: 'text', label: 'text #111111', dark: false },
      { tone: 'line', label: 'line #e8e8e8', dark: false },
      { tone: 'on', label: 'on #ffffff（深色底）', dark: true },
    ],
    sizes: ['nav', 'tray', 'corner', 'block'],
  },
  onLoad() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const version = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
    if (version !== 'develop') {
      wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/home/home' }) } })
    }
  }
})
