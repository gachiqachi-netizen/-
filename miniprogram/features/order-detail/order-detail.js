const materials=require('../../pages/editor/materials')
const auth=require('../../utils/auth')
const store=require('../../utils/design')
const orderState=require('../../utils/order-state')

Page({
  data:{order:null,items:[],loading:true,error:'',actionBusy:'',logisticsOpen:false},
  onLoad(q){this.no=q.no;this.load()},
  async load(){
    this.setData({loading:true,error:''})
    try{
      const rows=await auth.authorized('/my/orders')
      const raw=(Array.isArray(rows)?rows:[]).find(o=>o.no===this.no)
      if(!raw)throw new Error('未找到该订单')
      const order=orderState.decorate(raw)
      this.setData({order,items:materials.fromSnapshot(order.items||[])})
    }catch(e){this.setData({error:e.message})}
    finally{this.setData({loading:false})}
  },
  runAction(e){
    const code=e.currentTarget.dataset.code
    if(!code||this.data.actionBusy)return
    if(code==='reorder')return this.reorder()
    if(code==='view_logistics')return this.setData({logisticsOpen:!this.data.logisticsOpen})
    if(code==='cancel_order')return this.confirmAction(code,'取消订单','确定取消这笔订单吗？')
    if(code==='confirm_receipt')return this.confirmAction(code,'确认收货','请确认已经收到商品。确认后订单将完成。')
  },
  confirmAction(code,title,content){
    wx.showModal({title,content,confirmColor:'#c8302e',success:r=>{if(r.confirm)this.performAction(code)}})
  },
  async performAction(code){
    this.setData({actionBusy:code})
    try{
      await auth.authorized('/my/orders/'+encodeURIComponent(this.no)+'/actions',{action:code},'POST')
      wx.showToast({title:code==='cancel_order'?'订单已取消':'已确认收货',icon:'success'})
      await this.load()
    }catch(e){wx.showToast({title:e.message||'操作失败',icon:'none'})}
    finally{this.setData({actionBusy:''})}
  },
  reorder(){
    const o=this.data.order
    if(!o||!Array.isArray(o.beads)||!o.beads.length)return wx.showToast({title:'订单材料不可用',icon:'none'})
    const d=store.create();Object.assign(d,{name:o.name,wrist:o.wrist,beads:o.beads.slice(),reorder:true})
    store.selected(d);wx.navigateTo({url:'/pages/order/order'})
  }
})
