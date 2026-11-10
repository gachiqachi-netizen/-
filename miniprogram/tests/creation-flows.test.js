// Run with: node miniprogram/tests/creation-flows.test.js
const assert = require('assert'), api = require('../utils/api'), store = require('../utils/design')
let def, current=null, savedWrist=15, toast='', navigated='', opened=0
global.Page = value => { def=value }
global.wx = {getStorageSync:key=>key==='cgz_wrist'?savedWrist:undefined,showToast:o=>{toast=o.title},switchTab:o=>{navigated=o.url},navigateTo:o=>{navigated=o.url},chooseMedia:()=>{opened++}}
store.create=()=>({id:'test',name:'我的手串',wrist:15,beads:[]})
store.current=()=>current;store.selected=d=>{current=d}
function page() { const p={...def,data:JSON.parse(JSON.stringify(def.data))};p.setData=(v,cb)=>{Object.assign(p.data,v);if(cb)cb()};return p }
async function run() {
  require('../pages/photo/photo');let p=page()
  p.data.busy=true;p.choose();assert.strictEqual(opened,0)
  p.data.busy=false;p.data.catalog=[{id:'main',mm:12,c:['#fff']}];p.data.options=[{id:'',name:'不使用'},{id:'main',name:'主珠'}];p.data.mainIndex=1
  p.edit();assert.strictEqual(current.beads.length,15);assert.strictEqual(navigated,'/pages/editor/editor')
  p.data.mainIndex=0;p.edit();assert.match(toast,/主珠/)
  current=null;savedWrist=16;navigated='';require('../pages/ai/ai');p=page();p.catalog=[{id:'main',mm:10,price:3,c:['#fff']}];p.data.catalog=p.catalog;p.data.text='送爸妈平安'
  let aiCall
  api.request=async(path,data,method,options)=>{aiCall={path,data,method,options};return {designs:[{name:'AI 方案',pattern:['main'],count:17}],reply:'按你的要求配好了'}}
  await p.submit();assert.strictEqual(aiCall.path,'/ai/design');assert.strictEqual(aiCall.data.wrist,16);assert.strictEqual(aiCall.method,'POST');assert.strictEqual(aiCall.options.timeout,65000);assert.strictEqual(p.data.messages[1].source,'AI 生成');assert.strictEqual(p.data.messages[1].results[0].price,66);p.use({currentTarget:{dataset:{message:1,index:0}}});assert.strictEqual(current.beads.length,17);assert.strictEqual(current.wrist,16);assert.strictEqual(navigated,'/pages/editor/editor')
  p=page();p.data.text='送爸妈';let calls=[];api.request=async(path)=>{calls.push(path);if(path==='/ai/design')throw new Error('AI 暂时不可用');return {by:'rules',results:[{name:'兜底方案',pattern:['main'],count:17}]}};await p.submit();assert.deepStrictEqual(calls,['/ai/design','/plans/match']);assert.strictEqual(p.data.messages[1].source,'方案库兜底');assert.match(p.data.messages[1].text,/AI 暂时未响应/)
  p=page();p.data.text='送朋友';api.request=async()=>{throw new Error('连接失败')};await p.submit();assert.strictEqual(p.data.text,'送朋友');assert.match(p.data.error,/连接失败/)
  p=page();p.data.text='原始需求';api.request=async()=>{p.data.text='新的输入';throw new Error('连接失败')};await p.submit();assert.strictEqual(p.data.text,'新的输入');assert.match(p.data.error,/原始需求/)
  console.log('照片同款尺寸与 AI 方案、失败状态检查通过')
}
run().catch(e=>{console.error(e);process.exitCode=1})
