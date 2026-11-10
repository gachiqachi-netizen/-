// Keep existing entry links; use native camera + local TFJS, never VKSession.
Page({data:{error:''},onLoad(){wx.redirectTo({url:'/ar-hand/index',fail:()=>this.setData({error:'AR 页面暂时无法打开，可以改用照片试戴。'})})},photoTryon(){wx.redirectTo({url:'/features/tryon/tryon'})}});
