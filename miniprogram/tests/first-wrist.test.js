const test=require('node:test')
const assert=require('node:assert/strict')
const api=require('../utils/api')
const store=require('../utils/design')
let definition
const storage={}
global.Page=page=>{definition=page}
global.getApp=()=>({globalData:{apiBase:'http://localhost'}})
global.wx={getStorageSync:key=>storage[key],setStorageSync:(key,value)=>{storage[key]=value},hideTabBar(){},showTabBar(){},navigateTo({url}){global.lastWristUrl=url}}
require('../pages/diy/diy')
const design={id:'first-wrist',name:'草稿',wrist:16,beads:[]}
function page(){return {...definition,data:{...definition.data},setData(patch){Object.assign(this.data,patch)}}}
test('未确认时打开工作台显示当前草稿手围',()=>{
  const oldCurrent=store.current,oldCatalog=api.catalog,oldRequest=api.request
  delete storage.cgz_wrist_confirmed
  store.current=()=>design;api.catalog=()=>new Promise(()=>{});api.request=()=>new Promise(()=>{})
  try{const p=page();p.onLoad({});p.onShow();assert.equal(p.data.firstWristOpen,true);assert.equal(p.data.design.wrist,16)}
  finally{store.current=oldCurrent;api.catalog=oldCatalog;api.request=oldRequest}
})
test('就用当前手围写入确认标记，下次不弹',()=>{
  const p=page();p.setData({firstWristOpen:true});p.confirmFirstWrist()
  assert.equal(storage.cgz_wrist_confirmed,true);assert.equal(p.data.firstWristOpen,false)
  const oldCurrent=store.current,oldCatalog=api.catalog,oldRequest=api.request
  store.current=()=>design;api.catalog=()=>new Promise(()=>{});api.request=()=>new Promise(()=>{})
  try{const next=page();next.onShow();assert.equal(next.data.firstWristOpen,false)}
  finally{store.current=oldCurrent;api.catalog=oldCatalog;api.request=oldRequest}
})
test('量一下进入测量页，回来按新手围重排',async()=>{
  const p=page();p.setData({design:{...design,beads:['a']}});p.measureFirstWrist()
  assert.equal(global.lastWristUrl,'/pages/wrist/wrist?source=editor');assert.equal(p.pendingWristReflow,true)
})
