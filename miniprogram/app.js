const {loadConfig} = require('./config')
let config = {}, configError = ''
try { config = loadConfig(wx) } catch (error) {
  configError = error.message
  console.error('小程序环境配置失败：' + configError)
}
App({
  globalData: {...config, configError, catalog: null},
  onLaunch() {
    if (configError) wx.showModal({title: '环境配置未完成', content: configError, showCancel: false})
  }
})
