const api=require('./api')
let loginPending=null
function isDevelop(){
  const info=wx.getAccountInfoSync&&wx.getAccountInfoSync()
  if(info&&info.miniProgram&&info.miniProgram.envVersion==='develop')return true
  // Some DevTools preview/debug sessions report a non-develop envVersion.
  // A loopback API base can only be reached by the local simulator, so it is
  // safe to allow the explicitly local development login in that case.
  const app=typeof getApp==='function'&&getApp()
  const base=app&&app.globalData&&app.globalData.apiBase||''
  return /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(base)
}
function login(){const token=wx.getStorageSync('cgz_token'),expiry=wx.getStorageSync('cgz_expiry');if(token&&expiry * 1000 > Date.now())return Promise.resolve(token);if(loginPending)return loginPending;loginPending=new Promise((resolve,reject)=>wx.login({success:r=>r.code?resolve(r.code):reject(new Error('微信登录失败')),fail:()=>reject(new Error('微信登录失败'))})).then(code=>api.request('/auth/wechat',{code}).catch(error=>{if(isDevelop()&&error.status===503)return api.request('/auth/dev',{name:'dev'});throw error})).then(r=>{wx.setStorageSync('cgz_token',r.token);wx.setStorageSync('cgz_expiry',r.expiresAt);return r.token}).finally(()=>{loginPending=null});return loginPending}
function send(path,data,method,token){return new Promise((resolve,reject)=>wx.request({url:getApp().globalData.apiBase+'/api'+path,method:method||(data?'POST':'GET'),data,header:{Authorization:'Bearer '+token},success(r){if(r.statusCode>=200&&r.statusCode<300)resolve(r.data);else {const e=new Error((r.data&&r.data.error)||'请求失败');e.code=r.data&&r.data.code;e.status=r.statusCode;reject(e)}},fail(error){reject(api.networkError(error))}}))}
async function authorized(path,data,method){const token=await login();try{return await send(path,data,method,token)}catch(e){if(e.status!==401)throw e;if(wx.getStorageSync('cgz_token')===token){wx.removeStorageSync('cgz_token');wx.removeStorageSync('cgz_expiry')}return send(path,data,method,await login())}}
function hasSession(){return !!wx.getStorageSync('cgz_token') && Number(wx.getStorageSync('cgz_expiry')) * 1000 > Date.now()}
module.exports={login,authorized,hasSession}
