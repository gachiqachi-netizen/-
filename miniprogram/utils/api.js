function networkError(error) {
  const result = new Error('网络不太好，检查一下网络再试')
  result.code = 'NETWORK'
  return result
}
function responseError(response) {
  const status = response.statusCode
  const raw = response.data || {}
  const error = new Error(status >= 500 ? '系统开小差了，稍后再试' : (raw.error || '请求没有完成，请再试一次'))
  error.status = status
  error.code = raw.code
  return error
}
function userMessage(error) {
  if (error && (error.code === 'NETWORK' || /连接失败|offline|network|timeout/i.test(error.message || ''))) return '网络不太好，检查一下网络再试'
  if (error && error.status >= 400 && error.status < 500) return error.message || '请求没有完成，请再试一次'
  if (error && /^(未找到|找不到|订单不存在)/.test(error.message || '')) return error.message
  return '系统开小差了，稍后再试'
}
function request(path, data, method, options) {
  const g = getApp().globalData
  if (g.configError || !g.apiBase) return Promise.reject(new Error(g.configError || '服务地址尚未配置'))
  const base = g.apiBase
  const timeout = options && Number(options.timeout)
  return new Promise((resolve, reject) => wx.request({url: base + '/api' + path, method: method || (data ? 'POST' : 'GET'), data, timeout:timeout > 0 ? timeout : 10000, success(r) { if (r.statusCode >= 200 && r.statusCode < 300) resolve(r.data); else reject(responseError(r)) }, fail(error) { reject(networkError(error)) } }))
}
function showCatalogSource(offline) {
  if (typeof getCurrentPages !== 'function') return
  getCurrentPages().forEach(page => { if (page && page.setData) page.setData({catalogOffline:offline}) })
}
const CATALOG_VERSION_KEY = 'cgz_catalog_version'
const catalogKey = version => 'cgz_catalog_v_' + version
function cachedCatalog() {
  if (!wx.getStorageSync) return null
  try {
    const version = wx.getStorageSync(CATALOG_VERSION_KEY)
    if (!/^[0-9a-f]{16}$/.test(version || '')) return null
    const data = wx.getStorageSync(catalogKey(version))
    return data && data.version === version && Array.isArray(data.beads) ? data : null
  } catch (_) { return null }
}
function utf8Size(text) {
  let size = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) size++
    else if (code < 0x800) size += 2
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) { size += 4; i++ }
    else size += 3
  }
  return size
}
function saveCatalog(data) {
  if (!wx.setStorageSync || !/^[0-9a-f]{16}$/.test(data.version || '')) return
  try {
    if (utf8Size(JSON.stringify(data)) > 1024 * 1024) return
    const previous = wx.getStorageSync && wx.getStorageSync(CATALOG_VERSION_KEY)
    wx.setStorageSync(catalogKey(data.version), data)
    wx.setStorageSync(CATALOG_VERSION_KEY, data.version)
    if (previous && previous !== data.version && wx.removeStorageSync) wx.removeStorageSync(catalogKey(previous))
  } catch (_) { /* Storage full: use the in-memory copy. */ }
}
function notifyCatalogChanged() {
  if (typeof getCurrentPages !== 'function') return
  setTimeout(() => getCurrentPages().forEach(page => {
    if (!page) return
    if (page.route === 'pages/diy/diy' && typeof page.onShow === 'function') page.onShow()
    else if (typeof page.load === 'function') page.load()
  }), 0)
}
let refreshPromise = null
let catalogGeneration = 0
function fetchCatalog(version, allowPreview, refreshPages, dedupe) {
  if (dedupe && refreshPromise) return refreshPromise
  const generation = ++catalogGeneration
  const path = '/catalog' + (version ? '?v=' + encodeURIComponent(version) : '')
  const g = getApp().globalData
  const task = request(path).then(data => {
    if (generation !== catalogGeneration) return data && data.unchanged ? g.catalog : data
    if (data && data.unchanged && data.version === version && g.catalog) {
      g.catalogOffline = false
      showCatalogSource(false)
      return g.catalog
    }
    if (!data || !Array.isArray(data.beads)) throw new Error('材料目录格式不正确')
    const changed = !!version && data.version !== version
    g.catalogOffline = false
    g.catalog = data
    saveCatalog(data)
    showCatalogSource(false)
    if (changed && refreshPages) notifyCatalogChanged()
    return data
  }).catch(error => {
    if (generation !== catalogGeneration) throw error
    if (!allowPreview) throw error
    const snapshot = require('./catalog-preview')
    g.catalogOffline = true
    g.catalog = snapshot
    showCatalogSource(true)
    return snapshot
  }).finally(() => { if (dedupe && refreshPromise === task) refreshPromise = null })
  if (dedupe) refreshPromise = task
  return task
}
function catalog(force) {
  const g = getApp().globalData
  if (g.configError || !g.apiBase) return Promise.reject(new Error(g.configError || '服务地址尚未配置'))
  const info = wx.getAccountInfoSync && wx.getAccountInfoSync()
  const develop = info && info.miniProgram && info.miniProgram.envVersion === 'develop'
  if (force) return fetchCatalog('', false, false)
  const cached = cachedCatalog() || (!develop && g.catalog && g.catalog.version ? g.catalog : null)
  if (cached) {
    g.catalog = cached
    g.catalogOffline = false
    showCatalogSource(false)
    fetchCatalog(cached.version, false, true, true).catch(() => {
      if (g.catalog !== cached) return
      g.catalogOffline = true
      showCatalogSource(true)
    })
    return Promise.resolve(cached)
  }
  return fetchCatalog('', !!develop, false)
}
module.exports = {request,catalog,networkError,responseError,userMessage}
