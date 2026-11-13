const auth = require('../../utils/auth')
const api = require('../../utils/api')
const contract = require('../../utils/contract')
const store = require('../../utils/design')
const { saleView, copyOrderDesign } = require('./detail-model')
const { queue } = require('../../utils/toast')
Page({
  data:{sale:null,view:null,order:null,product:null,productSub:'',catalog:[],error:'',loading:false,historyOpen:false,cancelOpen:false,
    cancelLabel:contract.actions.cancel_after_sale,returnLabel:contract.actions.submit_return,reapplyLabel:contract.actions.request_after_sale},
  onLoad(query){this.no=query&&query.no||'';return this.load()},
  onShow(){if(this.no&&this.data.sale)this.load()},
  async load(){
    if(!this.no)return this.setData({error:'缺少售后编号'})
    this.setData({loading:true,error:''})
    try{
      const response=await auth.authorized('/my/after-sales/'+encodeURIComponent(this.no))
      const sale=response.afterSale
      this.showRecord(sale)
      if(sale.orderNo){
        try{const order=await auth.authorized('/my/orders/'+encodeURIComponent(sale.orderNo));this.setOrder(order);Promise.resolve().then(()=>api.catalog()).then(result=>this.setData({catalog:result.beads||[]})).catch(()=>{})}
        catch(_){this.setData({order:null})}
      }
    }catch(error){this.setData({error:error.message||'售后记录暂时无法读取'})}
    finally{this.setData({loading:false});if(wx.stopPullDownRefresh)wx.stopPullDownRefresh()}
  },
  onPullDownRefresh(){this.load()},
  showRecord(sale,order){this.setData({sale,view:saleView(sale),error:''});if(order)this.setOrder(order)},
  setOrder(order){this.setData({order,product:{name:order.name||'手串',line:order.meaning||'',beads:order.beads||[]},productSub:`${(order.beads||[]).length} 颗 · 手围 ${order.wrist||15}cm`})},
  openHistory(){this.setData({historyOpen:true})},closeHistory(){this.setData({historyOpen:false})},
  openCancel(){this.setData({cancelOpen:true})},closeCancel(){this.setData({cancelOpen:false})},
  async confirmCancel(){
    if(!this.data.view||!this.data.view.canCancel)return
    try{const response=await auth.authorized('/my/after-sales/'+encodeURIComponent(this.no)+'/cancel',{},'POST');this.showRecord(response.afterSale);this.closeCancel();queue.show({text:'已撤销申请'})}
    catch(error){queue.show({text:error.message||'撤销失败，请重试'})}
  },
  goReturn(){wx.navigateTo({url:'/features/after-sale/return?no='+encodeURIComponent(this.no)})},
  reapply(){const sale=this.data.sale;if(sale&&sale.orderNo)wx.navigateTo({url:'/features/after-sale/type?no='+encodeURIComponent(sale.orderNo)})},
  copyAgain(){const order=this.data.order;if(!order||!Array.isArray(order.beads)||!order.beads.length)return queue.show({text:'这单没有可复制的手串'});const design=copyOrderDesign(order,store.create());store.selected(design);require('../../utils/nav').openWorkbench(design)},
  copyAddress(){const address=this.data.sale&&this.data.sale.returnAddress;if(!address)return;wx.setClipboardData({data:[address.person,address.phone,address.address].filter(Boolean).join(' '),success:()=>queue.show({text:'寄回地址已复制'})})}
})
