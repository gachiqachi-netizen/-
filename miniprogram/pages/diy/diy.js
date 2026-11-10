const api=require('../../utils/api'), store=require('../../utils/design'), ui=require('../home/data')
Page({
 data:{templates:[],catalog:[],wrist:15,resume:null,resumePrice:0,error:''},
 onShow(){if(!wx.getStorageSync('cgz_wrist_confirmed')&&!this.wristPrompted){this.wristPrompted=true;ui.goWrist()}const d=store.current(), saved=d&&d.beads&&d.beads.length?d:null;api.catalog(true).then(c=>{const dict=Object.fromEntries((c.beads||[]).map(b=>[b.id,b]));const price=saved&&saved.beads.every(id=>dict[id])?saved.beads.reduce((n,id)=>n+Number(dict[id].price||0),15):0;this.setData({catalog:c.beads||[],templates:ui.catalogCards(c),wrist:ui.wrist(),resume:saved,resumePrice:Math.round(price*100)/100,error:''})}).catch(e=>this.setData({error:e.message,wrist:ui.wrist(),resume:saved}))},
 wrist(){ui.goWrist()},resume(){if(this.data.resume){store.selected(this.data.resume);require('../../utils/nav').openEditor()}},
 blank(){ui.openEditor()},photo(){wx.navigateTo({url:'/pages/photo/photo'})},use(e){const t=this.data.templates[e.currentTarget.dataset.i];if(t)ui.openEditor(t)}
})
