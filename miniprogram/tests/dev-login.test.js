const test=require('node:test'),assert=require('node:assert/strict')
test('开发者工具在微信未配置时改用开发登录',async()=>{
  const storage={}
  global.getApp=()=>({globalData:{apiBase:'http://127.0.0.1:8801'}})
  global.wx={getStorageSync:k=>storage[k],setStorageSync:(k,v)=>storage[k]=v,
    getAccountInfoSync:()=>({miniProgram:{envVersion:'develop'}}),getDeviceInfo:()=>({platform:'devtools'}),
    login:o=>o.success({code:'code'}),request:o=>o.success(o.url.endsWith('/auth/wechat')?{statusCode:503,data:{error:'微信登录尚未配置'}}:{statusCode:200,data:{token:'dev-token',expiresAt:Math.floor(Date.now()/1000)+600}})}
  delete require.cache[require.resolve('../utils/auth')]
  const auth=require('../utils/auth')
  assert.equal(await auth.login(),'dev-token')
})
