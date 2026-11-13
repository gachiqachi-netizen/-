const auth = require('../../utils/auth')
const { trackingError } = require('./detail-model')
const { queue } = require('../../utils/toast')
Page({
  data:{sale:null,carrier:'',carriers:['顺丰','中通','圆通','韵达','申通','其他'],carrierOpen:false,trackingNo:'',error:'',submitting:false},
  onLoad(query){this.no=query&&query.no||'';return this.load()},
  async load(){
    if(!this.no)return this.setData({error:'缺少售后编号'})
    try{const response=await auth.authorized('/my/after-sales/'+encodeURIComponent(this.no));this.setData({sale:response.afterSale,error:''})}
    catch(error){this.setData({error:error.message||'售后记录暂时无法读取'})}
  },
  toggleCarriers(){this.setData({carrierOpen:!this.data.carrierOpen})},
  chooseCarrier(e){this.setData({carrier:e.currentTarget.dataset.name,carrierOpen:false})},
  inputTracking(e){this.setData({trackingNo:e.detail.value,error:''})},
  scan(){if(!wx.scanCode)return;wx.scanCode({onlyFromCamera:true,success:result=>{this.setData({trackingNo:result.result,error:''});if(wx.vibrateShort)wx.vibrateShort({type:'light'})}})},
  copyAddress(){const address=this.data.sale&&this.data.sale.returnAddress;if(!address)return;wx.setClipboardData({data:[address.person,address.phone,address.address].filter(Boolean).join(' '),success:()=>queue.show({text:'寄回地址已复制'})})},
  async submit(){
    const error=trackingError(this.data.trackingNo)
    if(error){this.setData({error});return}
    if(!this.data.carrier){this.setData({error:'请选择快递公司'});return}
    if(!this.data.sale||!(this.data.sale.customerActions||[]).includes('submit_return'))return
    this.setData({submitting:true,error:''})
    try{await auth.authorized('/my/after-sales/'+encodeURIComponent(this.no)+'/return',
      {carrierName:this.data.carrier,trackingNo:this.data.trackingNo.trim()},'POST')
      queue.show({text:'已提交'});wx.navigateBack({delta:1})}
    catch(error){this.setData({error:error.message||'提交失败，请重试'})}
    finally{this.setData({submitting:false})}
  }
})
