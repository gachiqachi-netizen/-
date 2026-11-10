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
function request(path, data, method, options) {
  const g = getApp().globalData
  if (g.configError || !g.apiBase) return Promise.reject(new Error(g.configError || '服务地址尚未配置'))
  const base = g.apiBase
  const timeout = options && Number(options.timeout)
  return new Promise((resolve, reject) => wx.request({url: base + '/api' + path, method: method || (data ? 'POST' : 'GET'), data, timeout:timeout > 0 ? timeout : 10000, success(r) { if (r.statusCode >= 200 && r.statusCode < 300) resolve(r.data); else { const error = new Error((r.data && r.data.error) || '服务暂不可用'); error.status = r.statusCode; error.code = r.data && r.data.code; reject(error) } }, fail(error) { reject(networkError(error)) } }))
}
function showCatalogSource(offline) {
  if (typeof getCurrentPages !== 'function') return
  getCurrentPages().forEach(page => { if (page && page.setData) page.setData({catalogOffline:offline}) })
}
let catalogGeneration = 0
function catalog(force) {
  const g = getApp().globalData
  if (g.configError || !g.apiBase) return Promise.reject(new Error(g.configError || '服务地址尚未配置'))
  const info = wx.getAccountInfoSync && wx.getAccountInfoSync()
  const develop = info && info.miniProgram && info.miniProgram.envVersion === 'develop'
  if (!force && !develop && g.catalog && !g.catalogOffline) {
    showCatalogSource(false)
    return Promise.resolve(g.catalog)
  }
  const generation = ++catalogGeneration
  return request('/catalog').then(data => {
    if (!data || !Array.isArray(data.beads)) throw new Error('材料目录格式不正确')
    if (generation === catalogGeneration) { g.catalogOffline = false; g.catalog = data; showCatalogSource(false) }
    return data
  }).catch(error => {
    // Checkout uses force=true: an offline example must never authorize an order.
    if (!develop || force) throw error
    const snapshot = require('./catalog-preview')
    if (generation === catalogGeneration) { g.catalogOffline = true; g.catalog = snapshot; showCatalogSource(true) }
    return snapshot
  })
}
module.exports = {request,catalog,networkError}
