const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const api = require('../utils/api')
const store = require('../utils/design')
const {queue} = require('../utils/toast')
let definition
const storage = {}
global.Page = page => { definition = page }
global.getApp = () => ({globalData:{apiBase:'http://localhost'}})
global.wx = {getStorageSync:key=>storage[key],setStorageSync:(key,value)=>{storage[key]=value},hideTabBar(){},showTabBar(){}}
require('../pages/diy/diy')
const bead = require('../utils/catalog-preview').beads[0]
function page(beads=[]){return {...definition,data:{...definition.data,design:{id:'w1',name:'草稿',wrist:15,beads:beads.slice()},catalog:[bead],catalogReady:true},setData(patch){Object.assign(this.data,patch)},saveDraftSoon(){},playSound(){},vibrate(){}}}
test('本机草稿在目录请求未完成时已经绘制到托盘', async () => {
  const oldCurrent=store.current,oldCatalog=api.catalog,oldRequest=api.request
  store.current=()=>({id:'draft',name:'草稿',wrist:15,beads:[bead.id]})
  api.catalog=()=>new Promise(()=>{})
  api.request=()=>new Promise(()=>{})
  try { const p=page();p.onShow();assert.equal(p.data.items.length,1);assert.equal(p.data.catalogReady,false) }
  finally {store.current=oldCurrent;api.catalog=oldCatalog;api.request=oldRequest}
})
test('第 55 颗不会进入手串并提示 54 颗上限', () => {
  const p=page(Array(54).fill(bead.id));p.update()
  let text='';const oldShow=queue.show;queue.show=entry=>{text=entry.text}
  try {p.addBead(bead);assert.equal(p.data.design.beads.length,54);assert.equal(text,'这一版最多串 54 颗，多圈手串之后会开放')}
  finally {queue.show=oldShow}
})
test('工作台底栏采用 c-bar 价格排法，弹层不管理 tab 栏', () => {
  const wxml=fs.readFileSync(path.join(__dirname,'../pages/diy/diy.wxml'),'utf8')
  const sheet=fs.readFileSync(path.join(__dirname,'../components/sheet/index.js'),'utf8')
  assert.match(wxml,/<c-bar[^>]*layout="price"/)
  assert.match(wxml,/<view slot="left">{{handPrice}}<\/view>/)
  assert.doesNotMatch(sheet,/hideTabBar|showTabBar/)
})
test('离开工作台后延时关闭弹层不再隐藏 tab 栏', async () => {
  const p=page();p.visible=true;let hides=0;global.wx.hideTabBar=()=>{hides++}
  p.rehideTabBarSoon();p.visible=false
  await new Promise(resolve=>setTimeout(resolve,10))
  assert.equal(hides,0)
})
