const test=require('node:test'),assert=require('node:assert/strict')
function setup(envVersion,platform,wechatResponse){
  const storage={},calls=[]
  global.getApp=()=>({globalData:{apiBase:'http://127.0.0.1:8801'}})
  global.wx={getStorageSync:k=>storage[k],setStorageSync:(k,v)=>storage[k]=v,
    getAccountInfoSync:()=>({miniProgram:{envVersion}}),getDeviceInfo:()=>({platform}),
    login:o=>o.success({code:'code'}),
    request:o=>{calls.push(o.url);o.success(o.url.endsWith('/auth/wechat')?wechatResponse:{statusCode:200,data:{token:'dev-token',expiresAt:Math.floor(Date.now()/1000)+600}})}}
  delete require.cache[require.resolve('../utils/auth')]
  return {auth:require('../utils/auth'),calls}
}
test('开发者工具在微信未配置时改用开发登录',async()=>{
  const {auth}=setup('develop','devtools',{statusCode:503,data:{error:'微信登录尚未配置'}})
  assert.equal(await auth.login(),'dev-token')
})
test('开发版手机预览在微信未配置时同样改用开发登录',async()=>{
  const {auth,calls}=setup('develop','ios',{statusCode:503,data:{error:'微信登录尚未配置'}})
  assert.equal(await auth.login(),'dev-token')
  assert.ok(calls.some(u=>u.endsWith('/auth/dev')))
})
test('正式版不走开发登录，503 直接抛错',async()=>{
  const {auth,calls}=setup('release','ios',{statusCode:503,data:{error:'微信登录尚未配置'}})
  await assert.rejects(auth.login(),/微信登录尚未配置/)
  assert.ok(!calls.some(u=>u.endsWith('/auth/dev')))
})
test('体验版不走开发登录，503 直接抛错',async()=>{
  const {auth,calls}=setup('trial','devtools',{statusCode:503,data:{error:'微信登录尚未配置'}})
  await assert.rejects(auth.login(),/微信登录尚未配置/)
  assert.ok(!calls.some(u=>u.endsWith('/auth/dev')))
})
test('只认 503 状态码：相同报错文字的其他状态不降级',async()=>{
  const {auth,calls}=setup('develop','devtools',{statusCode:500,data:{error:'微信登录尚未配置'}})
  await assert.rejects(auth.login(),/微信登录尚未配置/)
  assert.ok(!calls.some(u=>u.endsWith('/auth/dev')))
})
