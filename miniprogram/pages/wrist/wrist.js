const store=require('../../utils/design')
Page({
 data:{wrist:15, presets:[13,14,15,16,17,18], fill:50, input:'15'},
 onLoad(options){const d=store.current(), saved=Number(wx.getStorageSync('cgz_wrist')), current=Number(d&&d.wrist), fromEditor=options&&options.source==='editor';this.setWrist(fromEditor&&current>=8&&current<=30?current:saved>=8&&saved<=30?saved:current>=8&&current<=30?current:15)},
 setWrist(value){const wrist=Math.max(8,Math.min(30,Math.round(value*10)/10));this.setData({wrist,input:String(wrist),fill:(wrist-8)/22*100})},
 step(e){this.setWrist(this.data.wrist+Number(e.currentTarget.dataset.step))},
 preset(e){this.setWrist(Number(e.currentTarget.dataset.value))},
 input(e){this.setData({input:e.detail.value})},
 confirm(){const v=Number(this.data.input);if(!Number.isFinite(v)||v<8||v>30){wx.showToast({title:'请输入 8–30 cm',icon:'none'});return}this.setWrist(v);const wrist=this.data.wrist;wx.setStorageSync('cgz_wrist',wrist);wx.setStorageSync('cgz_wrist_confirmed',true);const d=store.current();if(d){d.wrist=wrist;store.selected(d)}wx.navigateBack()}
})
