const store=require('../../utils/design')
const auth=require('../../utils/auth')
const orderState=require('../../utils/order-state')
const ui=require('../home/data')

Page({
 data:{loggedIn:false,name:'',avatar:'',designCount:0,orderCount:0,recent:null,orderError:false,wrist:15},
 onShow(){
  const loggedIn=auth.hasSession(),works=store.list()
  this.setData({loggedIn,name:wx.getStorageSync('cgz_display_name')||'',avatar:wx.getStorageSync('cgz_avatar')||'',designCount:works.length,wrist:ui.wrist(),orderCount:0,recent:null,orderError:false})
  if(loggedIn)this.loadOrders()
 },
 loadOrders(){
  auth.authorized('/my/orders').then(rows=>{
   const orders=Array.isArray(rows)?rows:[]
   this.setData({orderCount:orders.length,recent:orders.length?orderState.decorate(orders[0]):null,orderError:false})
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
})
