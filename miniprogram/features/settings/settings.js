const { queue: toast } = require('../../utils/toast')
Page({
 data:{about:false},
 showAbout(){this.setData({about:true});wx.setNavigationBarTitle({title:'关于珠养养'})},
 backSettings(){this.setData({about:false});wx.setNavigationBarTitle({title:'设置'})},
 open(e){const type=e.currentTarget.dataset.type;wx.navigateTo({url:'/features/doc/doc?type='+encodeURIComponent(type)})},
 clearCache(){
  const keys=(wx.getStorageInfoSync().keys||[]).filter(key=>/^cgz_(catalog|thumb|model)_/.test(key))
  keys.forEach(key=>wx.removeStorageSync(key))
  toast.show({ text: '已清除' })
 }
})
