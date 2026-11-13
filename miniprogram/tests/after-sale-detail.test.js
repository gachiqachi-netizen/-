const test=require('node:test'),assert=require('node:assert/strict')
const {saleView,trackingError}=require('../features/after-sale/detail-model')
const labels=require('../utils/contract').statusLabels.afterSaleStatus
const sale={no:'AS-1',type:'退货退款',status:'requested',reason:'珠子有裂纹',refundFen:7800,photoIds:['p1'],contactPhone:'',history:[{status:'requested',at:100}],customerActions:['cancel_after_sale']}
test('售后状态文字只来自契约',()=>{
 for(const status of ['requested','reviewing','approved','returning','refunding','completed','closed','rejected']){
  assert.equal(saleView({...sale,status}).label,labels[status])
 }
})
test('售后记录直接保留照片编号与联系电话，不把申请失败原因当状态',()=>{
 const view=saleView({...sale,contactPhone:'TEST-PHONE',result:'审核说明'})
 assert.deepEqual(view.photos,['p1']);assert.equal(view.contactPhone,'TEST-PHONE')
 assert.equal(view.history[0].label,labels.requested)
})
test('只有需寄回且审核通过时显示寄回动作',()=>{
 assert.equal(saleView({...sale,status:'approved',customerActions:['submit_return']}).canSubmitReturn,true)
 assert.equal(saleView({...sale,type:'仅退款',status:'approved',customerActions:[]}).canSubmitReturn,false)
 assert.equal(saleView({...sale,status:'requested'}).canSubmitReturn,false)
})
test('寄回单号为空或格式不对时不能提交',()=>{
 assert.equal(trackingError(''),'先填单号')
 assert.equal(trackingError('!!!'),'单号看起来不对，再核对一下')
 assert.equal(trackingError('SF1234567890'),'')
})

test('详情页接受售后记录并展示契约状态、照片数量和联系电话',()=>{
 let definition;global.Page=value=>{definition=value}
 delete require.cache[require.resolve('../features/after-sale/detail')]
 require('../features/after-sale/detail')
 const page={...definition,data:{...definition.data},setData(patch){Object.assign(this.data,patch)}}
 page.showRecord({...sale,contactPhone:'TEST-PHONE'})
 assert.equal(page.data.view.label,labels.requested)
 assert.equal(page.data.view.photos.length,1)
 assert.equal(page.data.view.contactPhone,'TEST-PHONE')
 delete global.Page
})

test('详情页按售后编号读取本人记录并刷新',async()=>{
 let definition;global.Page=value=>{definition=value}
 global.wx={stopPullDownRefresh(){}}
 delete require.cache[require.resolve('../features/after-sale/detail')]
 require('../features/after-sale/detail')
 const auth=require('../utils/auth'),old=auth.authorized,calls=[]
 auth.authorized=async path=>{calls.push(path);return path.includes('/my/after-sales/')?{afterSale:{...sale,orderNo:'O-1'}}:{name:'测试订单'}}
 try{
  const page={...definition,data:{...definition.data},setData(patch){Object.assign(this.data,patch)}}
  await page.onLoad({no:'AS-1'})
  assert.deepEqual(calls,['/my/after-sales/AS-1','/my/orders/O-1'])
  assert.equal(page.data.view.label,labels.requested)
 }finally{auth.authorized=old;delete global.Page;delete global.wx}
})

test('寄回页校验后提交承运方和单号',async()=>{
 let definition;global.Page=value=>{definition=value}
 let backed=false;global.wx={navigateBack(){backed=true}}
 delete require.cache[require.resolve('../features/after-sale/return')]
 require('../features/after-sale/return')
 const auth=require('../utils/auth'),old=auth.authorized,calls=[]
 auth.authorized=async(path,data,method)=>{calls.push({path,data,method});return path.endsWith('/return')?{afterSale:{status:'returning'}}:{afterSale:{...sale,customerActions:['submit_return']}}}
 try{
  const page={...definition,data:{...definition.data},setData(patch){Object.assign(this.data,patch)}}
  await page.onLoad({no:'AS-1'})
  page.data.carrier='顺丰';page.data.trackingNo='SF1234567890'
  await page.submit()
  assert.deepEqual(calls[1],{path:'/my/after-sales/AS-1/return',data:{carrierName:'顺丰',trackingNo:'SF1234567890'},method:'POST'})
  assert.equal(backed,true)
 }finally{auth.authorized=old;delete global.Page;delete global.wx}
})

test('寄回地址只从接口记录复制，未配置时不复制',()=>{
 let definition;global.Page=value=>{definition=value}
 let copied='';global.wx={setClipboardData:({data,success})=>{copied=data;success()}}
 delete require.cache[require.resolve('../features/after-sale/return')]
 require('../features/after-sale/return')
 const page={...definition,data:{...definition.data,sale:{...sale,returnAddress:null}}}
 page.copyAddress();assert.equal(copied,'')
 page.data.sale.returnAddress={person:'测试收件人',phone:'000-0000000',address:'测试路 1 号'}
 page.copyAddress();assert.equal(copied,'测试收件人 000-0000000 测试路 1 号')
 delete global.Page;delete global.wx
})
