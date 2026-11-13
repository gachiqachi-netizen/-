const test=require('node:test'), assert=require('node:assert/strict')
let definition
global.Page=value=>{definition=value}
global.wx={getStorageSync:()=>null,setStorageSync(){},getSystemInfoSync:()=>({windowWidth:375}),hideTabBar(){}}
require('../pages/diy/diy')
const {queue}=require('../utils/toast')
const bead={id:'moon8',name:'月光石',mat:'stone',mm:8,price:8}
function page(count=18){const p={...definition,data:{...definition.data,detailBead:bead,detailOpen:true,design:{id:'test',wrist:15,beads:Array(count).fill(bead.id)},catalog:[bead]},setData(patch){Object.assign(this.data,patch)},saveDraftSoon(){},playSound(){},vibrate(){}};p.update();return p}
test('选三颗后依次加入，长度与提示按现有规则更新',async()=>{
 const p=page(), messages=[],unsubscribe=queue.subscribe(value=>{if(value)messages.push(value.text)})
 p.addInspected({detail:{id:'moon8',quantity:3}})
 assert.equal(p.data.detailOpen,false)
 await new Promise(resolve=>setTimeout(resolve,350))
 assert.equal(p.data.design.beads.length,21)
 assert.equal(p.data.lengthMm,168)
 assert.equal(p.data.fitState,'ok')
 assert.ok(messages.includes('+3 月光石 · 刚好合适'))
 unsubscribe()
})
test('安全珠需先确认，取消不加入',()=>{
 const p=page(0), safe={...bead,safety:'安全提示'}
 p.data.catalog=[safe];p.data.detailBead=safe
 p.openSafety=bead=>p.setData({safetyOpen:true,safetyBead:bead})
 p.addInspected({detail:{id:safe.id,quantity:3}})
 assert.equal(p.data.safetyOpen,true)
 assert.equal(p.data.design.beads.length,0)
 p.cancelSafety()
 assert.equal(p.pendingSheetAdd,null)
})
test('长按安全珠会展示知识库安全原文',async()=>{
 const p=page(0), safe={...bead,kb:'zhusha',safety:'目录提示'}
 p.data.filtered=[safe]
 const api=require('../utils/api'),old=api.request
 api.request=async()=>({safety:{note:'知识库安全原文'},care:'知识库护理原文'})
 try{
  p.inspect({currentTarget:{dataset:{id:safe.id}}})
  await new Promise(resolve=>setImmediate(resolve))
  assert.equal(p.data.detailOpen,true)
  assert.equal(p.data.detailSafetyNote,'知识库安全原文')
  assert.equal(p.data.detailSafetyCare,'知识库护理原文')
 }finally{api.request=old}
})
