const store=require('../../utils/design')
const auth=require('../../utils/auth')
const orderState=require('../../utils/order-state')
const api=require('../../utils/api')
const ui=require('../home/data')

Page({
 data:{loggedIn:false,name:'',avatar:'',designCount:0,orderCount:0,recent:null,recentBeads:[],catalog:[],orderError:false,wrist:15},
 onShow(){
  const loggedIn=auth.hasSession()&&!!wx.getStorageSync('cgz_phone_masked'),works=store.list()
  this.setData({loggedIn,name:wx.getStorageSync('cgz_display_name')||'',avatar:wx.getStorageSync('cgz_avatar')||'',designCount:works.length,wrist:ui.wrist(),orderCount:0,recent:null,recentBeads:[],orderError:false})
  api.catalog().then(c=>{this.setData({catalog:c.beads||[]});this.refreshRecentBeads()}).catch(()=>{})
  if(loggedIn)this.loadOrders()
 },
 onPullDownRefresh(){this.onShow();wx.stopPullDownRefresh()},
 refreshRecentBeads(){
  const beads=this.data.recent&&Array.isArray(this.data.recent.beads)?this.data.recent.beads:[]
  this.setData({recentBeads:beads.map(id=>this.data.catalog.find(b=>b.id===(id.id||id))||id).filter(b=>b&&b.mm)})
 },
 loadOrders(){
  auth.authorized('/my/orders').then(rows=>{
   const orders=Array.isArray(rows)?rows:[]
   const recent=orders.length?orderState.decorate(orders[0]):null
   this.setData({orderCount:orders.length,recent,orderError:false});this.refreshRecentBeads()
  }).catch(()=>this.setData({orderError:true}))
 },
 chooseAvatar(e){
  const url=e.detail&&e.detail.avatarUrl
  if(!url)return
  wx.setStorageSync('cgz_avatar',url);this.setData({avatar:url});wx.showToast({title:'已保存',icon:'none'})
 },
 changeName(e){
  const name=String(e.detail.value||'').trim().slice(0,20)
  if(!name)return
  wx.setStorageSync('cgz_display_name',name);this.setData({name});wx.showToast({title:'已保存',icon:'none'})
 },
 goLogin(){auth.goLogin()},
 goOrders(){if(!this.data.loggedIn)return auth.goLogin({type:'navigate',url:'/features/orders/orders'});wx.navigateTo({url:'/features/orders/orders'})},
 goWorks(){wx.navigateTo({url:'/features/works/works'})},
 goWrist(){ui.goWrist()},
 goAddress(){if(!this.data.loggedIn)return auth.goLogin({type:'navigate',url:'/features/address/address'});wx.navigateTo({url:'/features/address/address'})},
 goSettings(){wx.navigateTo({url:'/features/settings/settings'})},
 viewRecent(){if(this.data.recent)wx.navigateTo({url:'/features/order-detail/order-detail?no='+encodeURIComponent(this.data.recent.no)})},
 mergeWorks(rows){
  const local=store.list(),seen=new Set(local.map(d=>d.cloudId).filter(Boolean))
  const extra=rows.filter(d=>!seen.has(d.id)).map(d=>({...d,id:'cloud-'+d.id,cloudId:d.id,remoteOnly:true}))
  this.setData({designs:local.concat(extra)})
 },
 viewOrder(e){const order=this.data.orders&&this.data.orders[e.currentTarget.dataset.i];if(order)wx.navigateTo({url:'/features/order-detail/order-detail?no='+encodeURIComponent(order.no)})},
})
