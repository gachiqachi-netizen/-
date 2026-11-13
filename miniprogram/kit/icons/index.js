Page({
  data: {
    icons: [
      'back', 'undo', 'stack', 'share', 'save', 'mic', 'plus', 'minus',
      'up', 'up-on', 'check', 'check-on', 'copy', 'close', 'more',
      'chevron-right', 'camera', 'image', 'hand', 'spark', 'bead',
    ],
    tabs: ['home', 'bead', 'chat', 'me'],
  },
  onLoad() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const version = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
    if (version !== 'develop') {
      wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/home/home' }) } })
    }
  }
})
