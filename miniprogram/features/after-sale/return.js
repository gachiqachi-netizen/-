const { trackingError } = require('./detail-model')
const { queue } = require('../../utils/toast')
Page({
  data:{sale:null,carrier:'',carriers:['顺丰','中通','圆通','韵达','申通','其他'],carrierOpen:false,trackingNo:'',error:'',submitting:false},
  onLoad(query){this.no=query&&query.no||'';const app=getApp(),sale=app.globalData&&app.globalData.pendingAfterSale;if(sale&&sale.no===this.no)this.setData({sale});else this.setData({error:'售后记录暂时无法读取，请返回详情页稍后再试'})},
  toggleCarriers(){this.setData({carrierOpen:!this.data.carrierOpen})},
  chooseCarrier(e){this.setData({carrier:e.currentTarget.dataset.name,carrierOpen:false})},
  inputTracking(e){this.setData({trackingNo:e.detail.value,error:''})},
  scan(){if(!wx.scanCode)return;wx.scanCode({onlyFromCamera:true,success:result=>{this.setData({trackingNo:result.result,error:''});if(wx.vibrateShort)wx.vibrateShort({type:'light'})}})},
  copyAddress(){const address=this.data.sale&&this.data.sale.returnAddress;if(!address)return;wx.setClipboardData({data:typeof address==='string'?address:[address.person,address.phone,address.detail].filter(Boolean).join(' '),success:()=>queue.show({text:'寄回地址已复制'})})},
  submit(){const error=trackingError(this.data.trackingNo);if(error){this.setData({error});return}if(!this.data.carrier){this.setData({error:'请选择快递公司'});return}this.setData({error:'寄回单号暂时无法提交，请稍后再试'})}
})
