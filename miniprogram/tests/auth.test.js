// Run with: node miniprogram/tests/auth.test.js
const assert=require('assert'), storage={cgz_token:'old',cgz_expiry:Math.floor(Date.now()/1000)+600}
let logins=0,sends=0
global.getApp=()=>({globalData:{apiBase:'https://example.test'}})
global.wx={getStorageSync:k=>storage[k],setStorageSync:(k,v)=>{storage[k]=v},removeStorageSync:k=>delete storage[k],
  navigateTo:o=>{global.lastNavigation=o.url},navigateBack:o=>{if(o&&o.success)o.success()},
  login:o=>{logins++;o.success({code:'test'})},
  request:o=>{if(o.url.endsWith('/api/auth/wechat'))return o.success({statusCode:200,data:{token:'new',expiresAt:Math.floor(Date.now()/1000)+600}});sends++;o.success(o.header.Authorization==='Bearer old'?{statusCode:401,data:{error:'expired'}}:{statusCode:200,data:{ok:true}})}}
const auth=require('../utils/auth')
Promise.all([auth.authorized('/designs'),auth.authorized('/designs')]).then(values=>{
  assert(values.every(v=>v.ok));assert.strictEqual(logins,1);assert.strictEqual(sends,4)
  auth.goLogin({type:'navigate',url:'/features/orders/orders'})
  assert(global.lastNavigation.startsWith('/pages/login/login?next='))
  assert.deepStrictEqual(JSON.parse(decodeURIComponent(global.lastNavigation.split('next=')[1])),{type:'navigate',url:'/features/orders/orders'})
  assert.throws(()=>auth.goLogin({type:'navigate',url:'https://example.test'}))
  console.log('过期会话自动重登与并发合并检查通过')
}).catch(e=>{console.error(e);process.exitCode=1})
