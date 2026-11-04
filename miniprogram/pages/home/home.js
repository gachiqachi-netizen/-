const api=require('../../utils/api'), store=require('../../utils/design'), ui=require('./data')
Page({
 data:{offline:false,templates:[],catalog:[],banners:[],wrist:15,wristConfirmed:false,error:''},
 onShow(){this.load();const next=this.pendingWrist;this.pendingWrist=null;if(next&&wx.getStorageSync('cgz_wrist_confirmed'))next()},
 requireWrist(action){if(wx.getStorageSync('cgz_wrist_confirmed'))return action();this.pendingWrist=action;ui.goWrist()},
 load(){api.catalog(true).then(c=>{const cards=ui.catalogCards(c), byId=Object.fromEntries(cards.map(t=>[t.id,t]));const banners=(c.banners||[]).filter(b=>!b.tpl||byId[b.tpl]).map(b=>({...b,card:byId[b.tpl]||cards[0]}));this.setData({offline:!!getApp().globalData.catalogOffline,templates:cards,catalog:c.beads||[],banners,wrist:ui.wrist(),wristConfirmed:!!wx.getStorageSync('cgz_wrist_confirmed'),error:''})}).catch(e=>this.setData({error:e.message}))},
 start(){wx.switchTab({url:'/pages/diy/diy'})},
 ai(){this.requireWrist(()=>wx.switchTab({url:'/pages/ai/ai'}))},photo(){this.requireWrist(()=>wx.navigateTo({url:'/pages/photo/photo'}))},wrist(){ui.goWrist()},
 tryLast(){const d=store.current();if(d&&d.beads&&d.beads.length)return wx.navigateTo({url:'/pages/tryon/tryon'});wx.showToast({title:'先挑一款，点卡片上的试戴',icon:'none'})},
 use(e){const t=this.data.templates[e.currentTarget.dataset.i]; if(t)this.requireWrist(()=>ui.openEditor(ui.catalogCards({beads:this.data.catalog,templates:[t]})[0]))},
 tryCard(e){const t=this.data.templates[e.currentTarget.dataset.i]; if(t)ui.openEditor(t,'try')},
 bannerTap(e){const b=this.data.banners[e.currentTarget.dataset.i];if(!b)return;if(b.tpl&&b.card)this.requireWrist(()=>ui.openEditor(ui.catalogCards({beads:this.data.catalog,templates:[b.card]})[0]));else if(b.go==='ai')this.ai();else this.start()}
})
