Page({
 open(e){const type=e.currentTarget.dataset.type;wx.navigateTo({url:'/features/doc/doc?type='+encodeURIComponent(type)})},
 clearCache(){
  const keys=(wx.getStorageInfoSync().keys||[]).filter(key=>/^cgz_(catalog|thumb|model)_/.test(key))
  keys.forEach(key=>wx.removeStorageSync(key))
  wx.showToast({title:'已清除',icon:'none'})
 }
})
