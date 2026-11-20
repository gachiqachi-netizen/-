const test=require('node:test')
const assert=require('node:assert/strict')
let definition
global.Page=value=>{definition=value}
global.wx={getStorageSync:()=>null,hideTabBar(){}}
require('../pages/diy/diy')
const api=require('../utils/api')
const store=require('../utils/design')
const catalog=[{id:'pink',name:'粉晶',mat:'crystal',mm:8,price:3},{id:'silver',name:'银隔珠',mat:'metal',mm:4,price:1}]
const originalCatalog=api.catalog,originalRequest=api.request,originalCurrent=store.current
api.catalog=()=>Promise.resolve({beads:catalog})
api.request=()=>Promise.resolve({})
store.current=()=>({id:'photo-test',name:'照片同款',wrist:15,beads:['pink']})
async function enter(category){
  const globalData={pendingWorkbenchCategory:category}
  global.getApp=()=>({globalData})
  const p={...definition,data:{...definition.data},setData(patch){Object.assign(this.data,patch)},update(){},refreshStackPreview(){},focusKbBead(){}}
  p.onShow();await new Promise(resolve=>setImmediate(resolve))
  return {page:p,globalData}
}
test('带有效分类进入工作台，读取后清掉一次性值',async()=>{
  const {page,globalData}=await enter('crystal')
  assert.equal(page.data.cat,'crystal')
  assert.equal('pendingWorkbenchCategory' in globalData,false)
})
test('不存在的分类回到全部并清掉一次性值',async()=>{
  const {page,globalData}=await enter('unknown')
  assert.equal(page.data.cat,'all')
  assert.equal('pendingWorkbenchCategory' in globalData,false)
})
test('没有传分类时停在全部',async()=>{
  const {page,globalData}=await enter(undefined)
  assert.equal(page.data.cat,'all')
  assert.equal('pendingWorkbenchCategory' in globalData,false)
})
test.after(()=>{api.catalog=originalCatalog;api.request=originalRequest;store.current=originalCurrent})
