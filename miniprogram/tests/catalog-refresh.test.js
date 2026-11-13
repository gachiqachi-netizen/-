const test=require('node:test'),assert=require('node:assert/strict')
const api=require('../utils/api'),store=require('../utils/design')
let definition;global.Page=p=>definition=p;require('../pages/order/order')
function setup(){const g={apiBase:'http://localhost:8801',catalog:{beads:[{id:'a',name:'材料',mm:8,price:3}]}};global.getApp=()=>({globalData:g});const banners=[];global.getCurrentPages=()=>[{setData:d=>banners.push(d)}];global.wx={getAccountInfoSync:()=>({miniProgram:{envVersion:'develop'}})};return {g,banners}}
test('开发目录优先真实请求，失败才回退且重试恢复',async()=>{
 const {g,banners}=setup();const real={beads:[{id:'a',points:['实拍'],safety:'避免入口'}]};let count=0
 wx.request=o=>{count++;o.success({statusCode:200,data:real})};assert.equal(await api.catalog(),real);assert.equal(count,1);assert.equal(g.catalogOffline,false)
 wx.request=o=>o.fail({errMsg:'offline'});const offline=await api.catalog();assert.ok(offline.beads.length);assert.equal(g.catalogOffline,true);assert.equal(banners.at(-1).catalogOffline,true)
 await assert.rejects(api.catalog(true));
 wx.request=o=>o.success({statusCode:200,data:real});assert.equal(await api.catalog(),real);assert.equal(banners.at(-1).catalogOffline,false)
})
test('体验和正式请求失败不能降级为示例',async()=>{
 for(const env of ['trial','release']){const {g}=setup();g.catalog=null;wx.getAccountInfoSync=()=>({miniProgram:{envVersion:env}});wx.request=o=>o.fail({errMsg:'offline'});await assert.rejects(api.catalog())}
})
function page(){const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(d){Object.assign(this.data,d)}};store.current=()=>({id:'test',name:'测试',wrist:15,beads:['a','a']});return p}
test('进入下单强制刷新，改价列明并确认，取消保持禁用',async()=>{
 setup();wx.request=o=>o.success({statusCode:200,data:{beads:[{id:'a',name:'材料',mm:8,price:5}]}})
 const p=page();await p.onShow();assert.match(p.data.quoteChanges[0],/3.00 → ¥5.00/);assert.equal(p.data.quotePending,true);assert.equal(p.data.catalogReady,false);assert.equal(p.data.goods,'10.00');p.confirmQuote();assert.equal(p.data.quotePending,false);assert.equal(p.data.catalogReady,true)
})
test('材料下架不可确认，目录失联不可下单',async()=>{
 setup();wx.request=o=>o.success({statusCode:200,data:{beads:[]}});const p=page();await p.onShow();assert.match(p.data.quoteChanges[0],/下架/);p.confirmQuote();assert.equal(p.data.catalogReady,false)
 wx.request=o=>o.fail({errMsg:'offline'});await p.onShow();assert.equal(p.data.catalogReady,false);assert.match(p.data.error,/加载失败/);p.setGift({detail:{value:true}});assert.equal(p.data.quotePending,true)
})
test('改价待确认时切换礼盒仍不能提交',async()=>{
 setup();wx.request=o=>o.success({statusCode:200,data:{beads:[{id:'a',name:'材料',mm:8,price:5}]}})
 const p=page();await p.onShow();p.setGift({detail:{value:true}})
 assert.equal(p.data.quotePending,true);assert.equal(p.data.catalogReady,false)
 await p.submit();assert.equal(p.data.error,'请先确认新价格')
})
test('首次目录加载失败后切换礼盒和编织绳不报错',async()=>{
 setup();wx.request=o=>o.fail({errMsg:'offline'});const p=page();await p.onShow()
 assert.equal(p.catalog,undefined);assert.doesNotThrow(()=>p.setGift({detail:{value:true}}))
 assert.doesNotThrow(()=>p.setCord({currentTarget:{dataset:{cord:1}}}))
 assert.equal(p.data.catalogReady,false)
})
test('旧页面请求不能覆盖新进入页面的报价',async()=>{
 setup();const requests=[];wx.request=o=>requests.push(o);const p=page();const first=p.onShow(),second=p.onShow();requests[1].success({statusCode:200,data:{beads:[{id:'a',name:'材料',mm:8,price:5}]}});await second;requests[0].success({statusCode:200,data:{beads:[{id:'a',name:'材料',mm:8,price:2}]}});await first;assert.equal(p.data.goods,'10.00')
})
test('刷新脚本保留卖点安全提示，失败不覆盖原快照',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{refresh}=require('../../tools/refresh-catalog-preview')
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'catalog-test-')),file=path.join(dir,'snapshot.js'),original=global.fetch
 try {
  global.fetch=async()=>({ok:true,json:async()=>({beads:[{id:'a',points:['纹理'],safety:'请勿入口'}],privateData:'must-not-copy'})})
  await refresh('http://localhost:8801',file);const text=fs.readFileSync(file,'utf8');assert.match(text,/请勿入口/);assert.match(text,/纹理/);assert.ok(!text.includes('must-not-copy'))
  global.fetch=async()=>({ok:false,status:500});await assert.rejects(refresh('http://localhost:8801',file));assert.equal(fs.readFileSync(file,'utf8'),text)
 }finally{global.fetch=original;fs.rmSync(dir,{recursive:true,force:true})}
})
