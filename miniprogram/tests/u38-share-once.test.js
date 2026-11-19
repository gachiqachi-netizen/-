const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
let definition
let imageFailure = false
const design = {id:'u38',name:'好运连连',wrist:15,beads:['a']}
const app = {globalData:{apiBase:'http://localhost'}}
global.Page = value => { definition = value }
global.getApp = () => app
global.wx = {
  getStorageSync: key => key==='cgz_current_design'?design:null,
  setStorageSync() {},
  getImageInfo({success}) {success({path:''})},
  downloadFile({success}) {success({statusCode:200,tempFilePath:'/tmp/qr.png'})},
  createCanvasContext() {
    const gradient=()=>({addColorStop(){}})
    return {save(){},restore(){},beginPath(){},arc(){},clip(){},translate(){},rotate(){},drawImage(){},
      setFillStyle(){},fillRect(){},setFontSize(){},fillText(){},createCircularGradient:gradient,
      createLinearGradient:gradient,draw(_reserve,callback){callback()}}
  },
  canvasToTempFilePath({success,fail}) {if(imageFailure)fail();else success({tempFilePath:'/tmp/share.png'})},
}
require('../pages/share/share')
const api = require('../utils/api')
const auth = require('../utils/auth')
const originalCatalog = api.catalog, originalRequest = auth.authorized
const bead = {id:'a',name:'黑曜石',mm:8,mat:'stone',colors:['#444','#111'],price:3}
const flush = () => new Promise(resolve=>setImmediate(resolve))
function page() {
  return {...definition,data:{...definition.data},canvasReady:true,
    setData(patch,callback){Object.assign(this.data,patch);if(callback)callback()}}
}
const wxml = fs.readFileSync(path.join(__dirname,'../pages/share/share.wxml'),'utf8')

test('button states are preparing disabled, ready share, and failure retry', async () => {
  assert.match(wxml,/wx:elif="\{\{!shareReady\}\}"[^>]*disabled="\{\{true\}\}">准备中…/)
  assert.match(wxml,/wx:if="\{\{shareError\}\}"[^>]*bindtap="retry">重试/)
  assert.match(wxml,/wx:else[^>]*open-type="share">发给好友/)
  api.catalog = async () => ({beads:[bead]})
  auth.authorized = async () => ({shareId:'share-1'})
  try {
    const ready=page()
    ready.onShow()
    assert.equal(ready.data.shareReady,false)
    assert.equal(ready.data.shareError,'')
    await flush();await flush()
    assert.equal(ready.data.shareId,'share-1')
    assert.equal(ready.data.shareImage,'/tmp/share.png')
    assert.equal(ready.data.shareReady,true)
    assert.match(ready.onShareAppMessage().path,/share-1/)
    imageFailure = true
    const imageFailed=page()
    imageFailed.onShow()
    await flush();await flush()
    assert.equal(imageFailed.data.shareReady,false)
    assert.match(imageFailed.data.shareError,/分享图片生成失败/)
    imageFailure = false
    auth.authorized = async () => {throw new Error('网络错误')}
    const failed=page()
    failed.onShow()
    await flush();await flush()
    assert.equal(failed.data.shareReady,false)
    assert.match(failed.data.shareError,/网络错误/)
  } finally {imageFailure=false;api.catalog=originalCatalog;auth.authorized=originalRequest}
})

test('menu sharing waits for preparation, then falls back after timeout', async () => {
  const waiting=page()
  waiting.data.design=design
  waiting.shareTimeoutMs=10
  const pending=waiting.onShareAppMessage()
  assert.equal(typeof pending.then,'function')
  assert.deepEqual(await pending,{title:'珠养养',path:'/pages/home/home'})
  const completed=page()
  completed.data.design=design
  completed.data.shareId='share-2'
  completed.data.shareImage='/tmp/share.png'
  completed.shareKey=JSON.stringify([design.name,design.wrist,design.beads])
  completed.shareTimeoutMs=50
  const next=completed.onShareAppMessage()
  completed.data.shareReady=true
  completed.notifyShareReady()
  assert.match((await next).path,/share-2/)
})
