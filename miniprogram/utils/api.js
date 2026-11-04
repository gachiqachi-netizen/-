function networkError(error) {
  const raw = error && error.errMsg || '未知网络错误'
  const info = wx.getAccountInfoSync && wx.getAccountInfoSync()
  const debug = info && info.miniProgram && info.miniProgram.envVersion === 'develop'
  let message = '无法连接服务，请稍后重试'
  if (debug) {
    message = /domain list|url not in/i.test(raw)
      ? '微信拦截了测试地址，请在右上角打开调试后退出重进'
      : '手机无法连接电脑测试服务'
    message += '；' + raw + '；地址：' + getApp().globalData.apiBase
  }
  return new Error(message)
}
function request(path, data, method) {
  const base = getApp().globalData.apiBase
  return new Promise((resolve, reject) => wx.request({url: base + '/api' + path, method: method || (data ? 'POST' : 'GET'), data, success(r) { if (r.statusCode >= 200 && r.statusCode < 300) resolve(r.data); else reject(new Error((r.data && r.data.error) || '服务暂不可用')) }, fail(error) { reject(networkError(error)) } }))
}
function catalog(force) {
  const g = getApp().globalData
  if (!force && g.catalog) return Promise.resolve(g.catalog)
  const info = wx.getAccountInfoSync && wx.getAccountInfoSync()
  if (info && info.miniProgram && info.miniProgram.envVersion === 'develop') {
    g.catalogOffline = true
    g.catalog = require('./catalog-preview')
    return Promise.resolve(g.catalog)
  }
  return request('/catalog').then(data => { g.catalogOffline = false; g.catalog = data; return data })
}
module.exports = {request,catalog,networkError}
