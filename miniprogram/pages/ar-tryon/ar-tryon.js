// Keep existing entry links; use native camera + local TFJS, never VKSession.
Page({onLoad(){wx.redirectTo({url:'/ar-hand/index',fail:e=>wx.showModal({title:'AR 页面加载失败',content:e.errMsg,showCancel:false})})}});
