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
async function bindPhone(code){
  if(!code)throw new Error('没拿到手机号，可以再点一次，或先逛逛')
  const result=await authorized('/auth/phone',{code},'POST')
  wx.setStorageSync('cgz_phone_masked',result.phoneMasked||'')
  return result
}
function goLogin(next){
  if(next&&(!['submitOrder','navigate'].includes(next.type)||
    (next.type==='navigate'&&(!next.url||typeof next.url!=='string'||!next.url.startsWith('/')||next.url.includes('..')||next.url.includes('://')))))throw new Error('登录后续动作不正确')
  const query=next?'?next='+encodeURIComponent(JSON.stringify(next)):''
  wx.navigateTo({url:'/pages/login/login'+query})
}
function continueAfterLogin(next){
  if(!next)return wx.navigateBack()
  if(next.type==='navigate')return wx.navigateBack({success:()=>wx.navigateTo({url:next.url})})
  if(next.type==='submitOrder')return wx.navigateBack({success:()=>{
    const pages=typeof getCurrentPages==='function'?getCurrentPages():[]
    const previous=pages[pages.length-1]
    if(previous&&typeof previous.submit==='function')previous.submit()
  }})
}
async function syncLocalWorks(){
  const store=require('./design')
  const works=store.list()
  if(!works.length)return false
  await Promise.all(works.map(work=>store.sync(work)))
  return true
}
module.exports={login,authorized,hasSession,bindPhone,goLogin,continueAfterLogin,syncLocalWorks}
