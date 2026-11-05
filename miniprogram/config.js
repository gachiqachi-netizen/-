// Public deployment addresses only; never put credentials in this file.
const environments = {
  trial: {apiBase: 'https://api.example.com', modelBase: 'https://static.example.com', modelVersion: 'v1'},
  release: {apiBase: 'https://api.example.com', modelBase: 'https://static.example.com', modelVersion: 'v1'}
}
function validBase(value, httpsOnly) {
  if (typeof value !== 'string') return false
  return (httpsOnly ? /^https:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/ : /^https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/).test(value) && !value.includes('@')
}
function placeholderBase(value) {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host === 'example.com' || host.endsWith('.example.com') || host === 'example.org' || host.endsWith('.example.org') || host === 'example.net' || host.endsWith('.example.net') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.invalid') || host.endsWith('.test')
  } catch (_) { return false }
}
function resolveConfig(envVersion, platform, local, deployments = environments) {
  if (!['develop', 'trial', 'release'].includes(envVersion)) throw new Error('无法确定小程序版本，请重新编译后重试')
  let apiBase, modelBase
  if (envVersion === 'develop') {
    apiBase = platform === 'devtools' ? 'http://127.0.0.1:8801' : local && local.apiBase
    if (!validBase(apiBase, false)) throw new Error('请配置 miniprogram/config.local.js 中的 apiBase 为电脑可访问的局域网服务地址，再重新编译')
    modelBase = local && local.modelBase || apiBase.replace(/\/+$/, '') + '/models'
    if (!validBase(modelBase, false)) throw new Error('模型服务地址配置无效')
  } else {
    const config = deployments[envVersion] || {}
    apiBase = config.apiBase
    modelBase = config.modelBase
    if (!validBase(apiBase, true) || !validBase(modelBase, true)) throw new Error('体验版和正式版的接口及模型地址必须使用 HTTPS')
    if (placeholderBase(apiBase) || placeholderBase(modelBase)) throw new Error('正式环境地址未配置')
  }
  return {envVersion, apiBase: apiBase.replace(/\/+$/, ''), modelBase: modelBase.replace(/\/+$/, ''), modelVersion: (envVersion === 'develop' ? local && local.modelVersion : deployments[envVersion].modelVersion) || 'v1'}
}
function loadConfig(wxApi) {
  const info = wxApi.getAccountInfoSync()
  const env = info && info.miniProgram && info.miniProgram.envVersion
  const platform = (wxApi.getDeviceInfo ? wxApi.getDeviceInfo() : wxApi.getSystemInfoSync()).platform
  let local = null
  if (env === 'develop') {
    try { local = require('./config.local.js') } catch (error) {
      // Only an absent optional config is tolerated. Syntax errors must be visible.
      if (!/not found|cannot find|module.*not.*defined/i.test(error.message || '')) throw error
    }
  }
  return resolveConfig(env, platform, local)
}
module.exports = {environments, resolveConfig, loadConfig}
