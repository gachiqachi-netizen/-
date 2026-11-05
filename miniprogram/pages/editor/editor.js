const materials=require('./materials')
const api=require('../../utils/api'), store=require('../../utils/design'), logic=require('./logic'), templates=require('../../utils/template')
const CATS={wood:'木质',bodhi:'菩提',jade:'玉石',stone:'玉石',crystal:'水晶',metal:'金属配件'}
Page({
  data:{soundOn:true,dragging:false,trashHover:false,dragX:0,dragY:0,dragColor:'#888',settingsOpen:false,prefSize:'all',prefWrist:15,prefColor:'全部',prefMeaning:'全部',prefRecipient:'自己',prefSizes:[6,8,10,12],prefWrists:[14.5,15,16,17.5],prefColors:['全部','深色系','浅色系','暖色系','冷色系'],prefMeanings:['全部','平安','好运','学业','事业','爱情'],prefRecipients:['自己','爱人','朋友','爸妈'],materialTab:"beads",filterOpen:false,moreOpen:false,detailBead:null,design:null,catalog:[],catalogReady:false,filtered:[],cats:[],sizes:[],cat:'all',size:'all',items:[],missingItems:[],price:'0.00',length:'0.0',fit:'',missing:0,error:'',selected:-1,selectedLabel:'',canUndo:false,hasPattern:false,renderFallback:false,viewMode:'ring',detailsOpen:false,countsOpen:false,counts:[12,14,18,21],tags:[],notes:[],meterFill:0,meterZoneLeft:0,meterZoneWidth:0,fitOK:false,fillCount:0,fillLabel:'',wristConfirmed:false},
  onShow(){
    const d=store.current()||store.create();this.setData({soundOn:wx.getStorageSync('cgz_sound')!==false})
    if (!this.data.design || this.data.design.id!==d.id) { this.history=[]; this.setData({selected:-1,renderFallback:false}) }
    this.setData({design:d,catalogReady:false,wristConfirmed:!!wx.getStorageSync('cgz_wrist_confirmed')}); api.catalog().then(c=>{if(!this.data.design||this.data.design.id!==d.id)return;const beads=c.beads||[], cats=[...new Set(beads.map(b=>b.mat))].map(id=>({id,name:CATS[id]||id}));this.setData({catalog:beads,cats,catalogReady:true,error:''});this.update()}).catch(e=>this.setData({catalogReady:false,error:e.message}))
    api.request('/kb/rules').then(r=>{if(Array.isArray(r.counts)){const counts=[...new Set(r.counts.filter(c=>c.count>=11&&c.count<=30&&c.confidence!=='low').map(c=>c.count))].sort((a,b)=>a-b);if(counts.length)this.setData({counts})}}).catch(()=>{})
  },
  update(){
    const d=this.data.design; if(!d)return
    const result=logic.stats(d.beads,this.data.catalog,d.wrist), map=result.map
    const items=d.beads.map((id,i)=>{const b=map[id];if(!b)return null;const a=2*Math.PI*i/d.beads.length-Math.PI/2;return {...b,x:50+37*Math.cos(a),y:50+37*Math.sin(a),sourceIndex:i}}).filter(Boolean)
    const category=this.data.catalog.filter(b=>(this.data.materialTab==='accessories'?(b.mat==='metal'||b.spacer):!(b.mat==='metal'||b.spacer))&&(this.data.cat==='all'||b.mat===this.data.cat)), sizes=[...new Set(category.map(b=>Number(b.mm)).filter(n=>n>0))].sort((a,b)=>a-b)
    const size=this.data.size!=='all' && !sizes.includes(Number(this.data.size))?'all':this.data.size
    const filtered=category.filter(b=>size==='all'||Number(b.mm)===Number(size)||b.spacer).map(b=>({...b,photoUrl:b.photo?(/^(https?:|data:)/.test(b.photo)?b.photo:getApp().globalData.apiBase+b.photo):'',perRound:b.spacer||b.mat==='metal'?'点缀':`一圈约 ${Math.round((Number(d.wrist)*10+Math.max(8,2.5*Number(b.mm)-5))/Number(b.mm))} 颗`}))
    const pref=d.preferences||{};
    const score=b=>{let score=0;const hex=(b.c&&b.c[0]||'').replace('#','');if(hex.length===6){const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),blue=parseInt(hex.slice(4,6),16),lum=.2126*r+.7152*g+.0722*blue;if(pref.color==='深色系')score+=(255-lum)/255;if(pref.color==='浅色系')score+=lum/255;if(pref.color==='暖色系')score+=(r-blue)/255;if(pref.color==='冷色系')score+=(blue+g-2*r)/510}if(pref.meaning&&pref.meaning!=='全部'&&((b.tags||[]).join('')+(b.meaning||'')).includes(pref.meaning))score+=2;return score};filtered.sort((a,b)=>score(b)-score(a));
    const selectedItem=map[d.beads[this.data.selected]]
    const missingItems=d.beads.map((id,index)=>({id,index})).filter(x=>!map[x.id])
    const countMap={},tags=[]; d.beads.forEach(id=>{const bead=map[id];if(!bead)return;countMap[id]=(countMap[id]||0)+1;(bead.tags||[]).forEach(t=>{if(t!=='点缀'&&!tags.includes(t))tags.push(t)})})
    const notes=materials.fromCatalog(d.beads,this.data.catalog)
    const last=[...d.beads].reverse().find(id=>{const b=map[id];return b&&!b.spacer&&b.mat!=='metal'}), next=last?logic.fill(d.beads,this.data.catalog,d.wrist,last):[]
    const max=result.target*1.25, diff=result.length-result.target, fitOK=!result.missing&&d.beads.length>0&&(d.beads.length>=54||(diff>=-4&&diff<=6))
    this.setData({items,missingItems,price:result.missing?'--':(result.price+(d.beads.length?15:0)).toFixed(2),length:result.missing?'--':(result.length/10).toFixed(1),fit:result.fit,missing:result.missing,filtered,sizes,size,tags:tags.slice(0,4),notes,safetyNotice:materials.safetyLines(notes),meterFill:Math.min(100,result.length/max*100),meterZoneLeft:(result.target-4)/max*100,meterZoneWidth:10/max*100,fitOK,fillCount:Math.max(0,next.length-d.beads.length),fillLabel:last?`${map[last].name} ${map[last].mm}mm`:'',hasPattern:!!(d.pattern&&d.pattern.length),selectedLabel:selectedItem?`${selectedItem.name} ${selectedItem.mm}mm`:this.data.selected>=0?'已下架材料':'',canUndo:!!(this.history&&this.history.length)})
    store.selected(d)
  },
  changeBeads(next, selected){ const d=this.data.design;this.history=this.history||[];this.history.push(d.beads.slice());if(this.history.length>60)this.history.shift();d.beads=next;this.setData({design:d,selected:selected==null?-1:selected});this.update();this.saveDraftSoon() },
  saveDraftSoon(){clearTimeout(this.draftTimer);const id=this.data.design.id;this.draftTimer=setTimeout(()=>{const d=this.data.design;if(d&&d.id===id)store.save(d)},400)},
  onHide(){if(this.audio)this.audio.stop();this.dragCancel();clearTimeout(this.draftTimer);const d=this.data.design;if(d)store.save(d)},
  playSound(kind='bead'){if(!this.data.soundOn||!wx.createInnerAudioContext)return;try{if(!this.audio){this.audio=wx.createInnerAudioContext();this.audio.obeyMuteSwitch=true;this.audio.onError(()=>{})}this.audio.stop();this.audio.src='/assets/sounds/'+kind+'.wav';this.audio.play()}catch(_){}},
  toggleSound(){const soundOn=!this.data.soundOn;this.setData({soundOn});wx.setStorageSync('cgz_sound',soundOn);if(soundOn)this.playSound()},
  flip(){const c=this.selectComponent('#editor-preview');if(c)c.flip()},
  dragStart(e){const b=this.data.catalog.find(b=>b.id===this.data.design.beads[e.detail.index]);this.dragIndex=e.detail.index;this.setData({dragging:true,trashHover:false,dragX:e.detail.x,dragY:e.detail.y,dragColor:b&&b.c?b.c[0]:'#888'});this.createSelectorQuery().select('.trash-target').boundingClientRect(r=>this.trashRect=r).exec()},
  overTrash(x,y){const r=this.trashRect;return !!r&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom},
  dragMove(e){this.setData({dragX:e.detail.x,dragY:e.detail.y,trashHover:this.overTrash(e.detail.x,e.detail.y)})},
  dragEnd(e){if(this.overTrash(e.detail.x,e.detail.y)){this.setData({selected:this.dragIndex});this.remove()}this.dragCancel()},
  dragCancel(){this.dragIndex=null;this.setData({dragging:false,trashHover:false})},
  trash(){if(this.data.selected>=0)return this.remove();if(!this.data.design.beads.length)return;wx.showModal({title:'清空手串？',content:'清空后可以撤销恢复。',success:r=>{if(r.confirm){this.changeBeads([]);this.playSound('remove')}}})},
  openSettings(){const p=this.data.design.preferences||{};this.setData({settingsOpen:true,prefWrist:this.data.design.wrist,prefSize:p.size||'all',prefColor:p.color||'全部',prefMeaning:p.meaning||'全部',prefRecipient:p.recipient||'自己'})},
  closeSettings(){this.setData({settingsOpen:false})},
  preference(e){this.setData({[e.currentTarget.dataset.key]:e.currentTarget.dataset.value})},
  resetPreferences(){this.setData({prefSize:'all',prefWrist:15,prefColor:'全部',prefMeaning:'全部',prefRecipient:'自己'})},
  applyPreferences(){const d=this.data.design;d.wrist=Number(this.data.prefWrist);d.preferences={size:this.data.prefSize,color:this.data.prefColor,meaning:this.data.prefMeaning,recipient:this.data.prefRecipient};this.setData({design:d,size:this.data.prefSize,settingsOpen:false});this.update();this.saveDraftSoon()},
  onUnload(){clearTimeout(this.draftTimer);if(this.audio)this.audio.destroy()},
  materialTab(e){this.setData({materialTab:e.currentTarget.dataset.tab,cat:'all',size:'all'});this.update()},
  toggleFilter(){this.setData({filterOpen:!this.data.filterOpen})},
  toggleMore(){this.setData({moreOpen:!this.data.moreOpen})},
  inspect(e){const b=this.data.filtered.find(b=>b.id===e.currentTarget.dataset.id);if(b)this.setData({detailBead:b});this.suppressTapUntil=Date.now()+600},
  closeInspect(){this.setData({detailBead:null})},
  noop(){},
  chooseCord(e){const d={...this.data.design,cord:Number(e.currentTarget.dataset.cord)};this.setData({design:d});store.selected(d);this.saveDraftSoon()},
  category(e){this.setData({cat:e.currentTarget.dataset.id,size:'all'});this.update()},
  sizeFilter(e){this.setData({size:e.currentTarget.dataset.size});this.update()},
  add(e){if(Date.now()<(this.suppressTapUntil||0))return;const d=this.data.design,id=e.currentTarget.dataset.id, beads=d.beads.slice();if(this.data.selected>=0)beads[this.data.selected]=id;else {if(beads.length>=80)return wx.showToast({title:'最多添加 80 颗',icon:'none'});beads.push(id)}this.changeBeads(beads);this.playSound()},
  select(e){const i=Number(e.currentTarget.dataset.i);this.setData({selected:i===this.data.selected?-1:i});this.update()},
  select3d(e){const i=Number(e.detail.index);this.setData({selected:i===this.data.selected?-1:i});this.update()},
  deselect(){this.setData({selected:-1});this.update()},
  renderUnavailable(){this.setData({renderFallback:true})},
  toggleView(e){this.setData({viewMode:e.currentTarget.dataset.mode})},
  toggleDetails(){this.setData({detailsOpen:!this.data.detailsOpen})},
  toggleCounts(){this.setData({countsOpen:!this.data.countsOpen})},
  rename(e){const d=this.data.design;d.name=e.detail.value.slice(0,12);this.setData({design:d});store.selected(d);this.saveDraftSoon()},
  count(e){const n=Number(e.currentTarget.dataset.count),d=this.data.design,result=logic.setCount(d.beads,this.data.catalog,d.wrist,n);if(!result)return wx.showToast({title:'没有合适的珠子尺寸',icon:'none'});this.changeBeads(result.seq);wx.showToast({title:`已按 ${n} 颗搭配`,icon:'none'})},
  refit(){const d=this.data.design;if(!d.pattern||!d.pattern.length)return;const beads=templates.build(d,this.data.catalog,d.wrist);if(!beads)return wx.showToast({title:'模板材料不可用',icon:'none'});this.changeBeads(beads)},
  wristPage(){wx.navigateTo({url:'/pages/wrist/wrist?source=editor'})},
  remove(){const i=this.data.selected, beads=this.data.design.beads.slice();if(i<0||i>=beads.length)return;beads.splice(i,1);this.changeBeads(beads);this.playSound('remove')},
  move(e){const i=this.data.selected,delta=Number(e.currentTarget.dataset.delta),result=logic.move(this.data.design.beads,i,delta);if(result.index!==i)this.changeBeads(result.items,result.index)},
  undo(){if(!this.history||!this.history.length)return;const d=this.data.design;d.beads=this.history.pop();this.setData({design:d,selected:-1});this.update();this.saveDraftSoon()},
  fill(){const d=this.data.design, last=[...d.beads].reverse().find(id=>{const b=this.data.catalog.find(x=>x.id===id);return b&&!b.spacer&&b.mat!=='metal'});if(!last)return wx.showToast({title:'请先选择一颗主珠',icon:'none'});const next=logic.fill(d.beads,this.data.catalog,d.wrist,last);if(next.length===d.beads.length)return wx.showToast({title:this.data.missing?'请先替换下架材料':'当前长度无需补齐',icon:'none'});this.changeBeads(next)},
  wrist(e){const d=this.data.design, value=Number(e.detail.value);if(!Number.isFinite(value)||value<8||value>30){wx.showToast({title:'手围请输入 8–30 cm',icon:'none'});this.setData({'design.wrist':d.wrist});return}d.wrist=value;this.setData({design:d});this.update()},
  save(){const d=this.data.design;if(!d.beads.length)return wx.showToast({title:'请先选珠',icon:'none'});store.save(d);store.selected(d);wx.showToast({title:'已保存在本机',icon:'none'});store.sync(d).then(()=>wx.showToast({title:'已同步保存版本',icon:'none'})).catch(e=>wx.showToast({title:e.message&&e.message.includes('冲突')?'云端版本冲突，已保存本机':'仅保存在本机，未同步',icon:'none',duration:3000}))},
  share(){if(this.data.design.beads.length<6)return;this.save();wx.navigateTo({url:'/pages/share/share'})},
  finish(){if(this.data.design.beads.length<6)return wx.showToast({title:'请至少选择 6 颗珠子',icon:'none'});if(!this.data.catalogReady)return wx.showToast({title:'材料加载中，请稍后重试',icon:'none'});if(this.data.missing)return wx.showToast({title:'请先替换下架材料',icon:'none'});this.save();wx.navigateTo({url:'/pages/finish/finish'})}
})
