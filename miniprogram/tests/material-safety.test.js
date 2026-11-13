const test=require('node:test'),assert=require('node:assert/strict')
const materials=require('../pages/diy/materials')
test('material rows group by SKU, keep first order and calculate integer fen',()=>{
 const rows=materials.fromCatalog(['b','a','b'],[{id:'a',name:'甲',mm:6,price:0.1},{id:'b',name:'乙',mm:8,price:0.29,points:['圆珠','红色'],meaning:'寓意美好',safety:{note:'不可入口'}}])
 assert.deepEqual(rows.map(r=>[r.id,r.qty,r.subtotalFen]),[['b',2,58],['a',1,10]])
 assert.equal(rows[0].subtotal,'0.58');assert.equal(rows[0].pointsText,'圆珠 · 红色');assert.equal(rows[0].explanation,'寓意美好');assert.equal(materials.safetyLines(rows),'乙：不可入口')
})
test('order snapshot can display independently of current catalog and accepts legacy fields',()=>{
 const rows=materials.fromSnapshot([{id:'a',name:'旧材料',price:99,unitPriceFen:123,safety:'勿入口',summary:'材料说明'},{id:'a',name:'旧材料',unitPriceFen:123},{id:'b',price:1}])
 assert.equal(rows[0].subtotal,'2.46');assert.equal(rows[0].explanation,'材料说明');assert.equal(rows[1].safety,'');assert.equal(rows[1].pointsText,'')
 assert.deepEqual(materials.fromCatalog(['missing'],[]),[])
})
test('safety notice stays visible and unchecked agreement blocks submission',async()=>{
 const api=require('../utils/api'),auth=require('../utils/auth');let definition,posts=0
 const oldCatalog=api.catalog,oldAuth=auth.authorized,oldSession=auth.hasSession
 global.Page=p=>{definition=p};global.wx={getStorageSync:()=>({}),setStorageSync(){},reLaunch(){},vibrateShort(){}}
 const bead={id:'safe-test',name:'测试材料',mm:8,price:1,safety:'不可入口',points:['圆珠'],meaning:'寓意美好'}
 api.catalog=async()=>({beads:[bead]});auth.hasSession=()=>true;auth.authorized=async()=>{posts++;return {no:'test'}}
 try{
  delete require.cache[require.resolve('../pages/order/order')];require('../pages/order/order')
  const p={...definition,data:{...definition.data,design:{name:'测试',beads:Array(21).fill(bead.id),wrist:15},person:'测试',phone:'1'+'0'.repeat(10),addr:'测试占位'},catalog:[bead],setData(data){Object.assign(this.data,data)}}
  p.calculate();p.data.catalogReady=true
  assert.equal(p.data.fit,'长度基本合适');assert.equal(p.data.safety,'测试材料：不可入口');assert.equal(p.data.hasSafety,true)
  const markup=require('fs').readFileSync(require('path').join(__dirname,'../pages/order/order.wxml'),'utf8')
  assert.match(markup,/\{\{item\.safety\}\}/);assert.match(markup,/wx:if="\{\{hasSafety\}\}"[^>]*>材料安全提示/)
  await p.submit();assert.equal(posts,0);assert.equal(p.data.agreeError,true)
  p.toggleAgreed();await p.submit();assert.equal(posts,1)
 }finally{api.catalog=oldCatalog;auth.authorized=oldAuth;auth.hasSession=oldSession}
})
test('short bracelet and safety warning render near the single submit agreement',async()=>{
 const api=require('../utils/api'),auth=require('../utils/auth');let definition,posts=0
 const oldCatalog=api.catalog,oldAuth=auth.authorized,oldSession=auth.hasSession
 global.Page=p=>{definition=p};global.wx={getStorageSync:()=>({}),setStorageSync(){},vibrateShort(){}}
 const bead={id:'safe-test',name:'测试材料',mm:8,price:1,safety:'不可入口'}
 api.catalog=async()=>({beads:[bead]});auth.hasSession=()=>true;auth.authorized=async()=>{posts++;return {no:'test'}}
 try{
  delete require.cache[require.resolve('../pages/order/order')];require('../pages/order/order')
  const p={...definition,data:{...definition.data,design:{name:'测试',beads:Array(6).fill(bead.id),wrist:15},person:'测试',phone:'1'+'0'.repeat(10),addr:'测试占位'},catalog:[bead],setData(data){Object.assign(this.data,data)}}
  p.calculate();p.data.catalogReady=true
  assert.notEqual(p.data.fit,'长度基本合适');assert.match(p.data.safety,/不可入口/)
  const markup=require('fs').readFileSync(require('path').join(__dirname,'../pages/order/order.wxml'),'utf8')
  assert.match(markup,/class="length-note"[^>]*>\{\{fit\}\}/)
  assert.match(markup,/class="agreement /);assert.match(markup,/材料安全提示/)
  await p.submit();assert.equal(posts,0);assert.equal(p.data.agreeError,true)
 }finally{api.catalog=oldCatalog;auth.authorized=oldAuth;auth.hasSession=oldSession}
})
