const test=require('node:test'),assert=require('node:assert/strict')
const {saleView,trackingError}=require('../features/after-sale/detail-model')
const labels=require('../utils/contract').statusLabels.afterSaleStatus
const sale={no:'AS-1',type:'退货退款',status:'requested',reason:'珠子有裂纹',refundFen:7800,photoIds:['p1'],contactPhone:'',history:[{to:'requested',at:100,note:'申请'}]}
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
 assert.equal(saleView({...sale,status:'approved'}).canSubmitReturn,true)
 assert.equal(saleView({...sale,type:'仅退款',status:'approved'}).canSubmitReturn,false)
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
