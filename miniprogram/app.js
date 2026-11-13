const {loadConfig} = require('./config')
let config = {}, configError = ''
try { config = loadConfig(wx) } catch (error) {
  configError = error.message
  console.error('小程序环境配置失败：' + configError)
}
App({
  globalData: {...config, configError, catalog: null},
  onLaunch() {
    require('./utils/privacy').install()
  }
})
