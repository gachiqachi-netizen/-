const { saleView } = require('./detail-model')
const { queue } = require('../../utils/toast')
Page({
  data:{sale:null,view:null,order:null,error:'',loading:false,historyOpen:false,cancelOpen:false},
  onLoad(query){this.no=query&&query.no||'';this.load()},
  load(){
    const app=getApp(),pending=app.globalData&&app.globalData.pendingAfterSale
    if(pending&&pending.no===this.no)this.showRecord(pending)
    else this.setData({error:'售后记录暂时无法读取，请返回订单详情稍后再试'})
    if(wx.stopPullDownRefresh)wx.stopPullDownRefresh()
  },
  onPullDownRefresh(){this.load()},
  showRecord(sale,order){this.setData({sale,view:saleView(sale),order:order||null,error:''})},
  openHistory(){this.setData({historyOpen:true})},closeHistory(){this.setData({historyOpen:false})},
  openCancel(){this.setData({cancelOpen:true})},closeCancel(){this.setData({cancelOpen:false})},
  confirmCancel(){this.closeCancel();queue.show({text:'当前无法撤销申请，请稍后再试'})},
  goReturn(){wx.navigateTo({url:'/features/after-sale/return?no='+encodeURIComponent(this.no)})},
  copyAddress(){const address=this.data.sale&&this.data.sale.returnAddress;if(!address)return;wx.setClipboardData({data:typeof address==='string'?address:[address.person,address.phone,address.detail].filter(Boolean).join(' '),success:()=>queue.show({text:'寄回地址已复制'})})}
})
