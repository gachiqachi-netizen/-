// Temporary LAN bridge allows login and owner-scoped design/order reads.
// Published/trial builds never use the private network address.
const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
const develop = info && info.miniProgram && info.miniProgram.envVersion === 'develop'
const platform = wx.getDeviceInfo ? wx.getDeviceInfo().platform : wx.getSystemInfoSync().platform
const apiBase = develop && platform !== 'devtools' ? 'http://192.168.2.156:8802' : 'http://127.0.0.1:8800'
App({ globalData: { apiBase, catalog: null } })
