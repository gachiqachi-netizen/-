const materials=require('./materials')
const api=require('../../utils/api'), store=require('../../utils/design'), logic=require('./logic'), templates=require('../../utils/template')
const nav=require('../../utils/nav'), {fitText,meterPos}=require('../../utils/fit-text'), {queue}=require('../../utils/toast')
const {totalHand}=require('../finish/total'), {yuan}=require('../../utils/money')
const {message}=require('./feedback')
const {layout}=require('../../components/bracelet/index')
const CATS={wood:'木质',bodhi:'菩提',jade:'玉石',stone:'玉石',crystal:'水晶',metal:'金属配件'}
Page({
  data:{soundOn:true,dragging:false,trashHover:false,dragX:0,dragY:0,dragColor:'#888',settingsOpen:false,prefSize:'all',prefWrist:15,prefColor:'全部',prefMeaning:'全部',prefRecipient:'自己',prefSizes:[6,8,10,12],prefWrists:[14.5,15,16,17.5],prefColors:['全部','深色系','浅色系','暖色系','冷色系'],prefMeanings:['全部','平安','好运','学业','事业','爱情'],prefRecipients:['自己','爱人','朋友','爸妈'],materialTab:"beads",filterOpen:false,moreOpen:false,detailBead:null,design:null,catalog:[],catalogReady:false,filtered:[],cats:[],sizes:[],cat:'all',size:'all',items:[],missingItems:[],price:'0.00',handPrice:'¥0',length:'0.0',lengthMm:0,fit:'',missing:0,error:'',selected:-1,selectedLabel:'',canUndo:false,hasPattern:false,renderFallback:false,viewMode:'ring',detailsOpen:false,countsOpen:false,counts:[12,14,18,21],tags:[],notes:[],meterFill:0,meterZoneLeft:0,meterZoneWidth:0,fitOK:false,fillCount:0,fillLabel:'',wristConfirmed:false,picked:[],beadCount:0,selectedKind:'',replaceMode:false,safetyOpen:false,safetyBead:null,detailOpen:false,flight:null,meterShake:false,saveDot:false,scrollBeadId:'',focusedBeadId:''},
  onLoad(options){this.pendingBeadKbId=options&&options.beadKbId?decodeURIComponent(options.beadKbId):''},
  onShow(){
    if(wx.hideTabBar)wx.hideTabBar()
    const global=typeof getApp==='function'&&getApp().globalData
    if(global&&global.pendingWorkbenchBeadKbId){this.pendingBeadKbId=global.pendingWorkbenchBeadKbId;delete global.pendingWorkbenchBeadKbId}
    const d=store.current()||store.create();this.setData({soundOn:wx.getStorageSync('cgz_sound')!==false})
    if (!this.data.design || this.data.design.id!==d.id) { this.history=[]; this.setData({selected:-1,renderFallback:false}) }
    this.setData({design:d,catalogReady:false,wristConfirmed:!!wx.getStorageSync('cgz_wrist_confirmed')}); api.catalog().then(c=>{if(!this.data.design||this.data.design.id!==d.id)return;const beads=c.beads||[], cats=[...new Set(beads.map(b=>b.mat))].map(id=>({id,name:CATS[id]||id}));this.setData({catalog:beads,pricing:c.pricing||{},cats,catalogReady:true,error:''});this.update();this.focusKbBead()}).catch(e=>this.setData({catalogReady:false,error:e.message}))
    api.request('/kb/rules').then(r=>{if(Array.isArray(r.counts)){const counts=[...new Set(r.counts.filter(c=>c.count>=11&&c.count<=30&&c.confidence!=='low').map(c=>c.count))].sort((a,b)=>a-b);if(counts.length)this.setData({counts})}}).catch(()=>{})
  },
  update(){
    const d=this.data.design; if(!d)return
    const result=logic.stats(d.beads,this.data.catalog,d.wrist), map=result.map
    const items=d.beads.map((id,i)=>{const b=map[id];if(!b)return null;const a=2*Math.PI*i/d.beads.length-Math.PI/2;return {...b,x:50+37*Math.cos(a),y:50+37*Math.sin(a),sourceIndex:i}}).filter(Boolean)
    const pref=d.preferences||{};
    const filterKey=JSON.stringify([this.data.materialTab,this.data.cat,this.data.size,d.wrist,pref.color,pref.meaning,this.data.catalog.length])
    let filterPatch={}
    if(filterKey!==this.filterKey){
      const category=this.data.catalog.filter(b=>(this.data.materialTab==='accessories'?(b.mat==='metal'||b.spacer):!(b.mat==='metal'||b.spacer))&&(this.data.cat==='all'||b.mat===this.data.cat)), sizes=[...new Set(category.map(b=>Number(b.mm)).filter(n=>n>0))].sort((a,b)=>a-b)
      const size=this.data.size!=='all' && !sizes.includes(Number(this.data.size))?'all':this.data.size
      const filtered=category.filter(b=>size==='all'||Number(b.mm)===Number(size)||b.spacer).map(b=>({...b,photoUrl:b.photo?(/^(https?:|data:)/.test(b.photo)?b.photo:getApp().globalData.apiBase+b.photo):'',perRound:b.spacer||b.mat==='metal'?'点缀':`一圈约 ${Math.round((Number(d.wrist)*10+Math.max(8,2.5*Number(b.mm)-5))/Number(b.mm))} 颗`}))
      const score=b=>{let score=0;const hex=(b.c&&b.c[0]||'').replace('#','');if(hex.length===6){const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),blue=parseInt(hex.slice(4,6),16),lum=.2126*r+.7152*g+.0722*blue;if(pref.color==='深色系')score+=(255-lum)/255;if(pref.color==='浅色系')score+=lum/255;if(pref.color==='暖色系')score+=(r-blue)/255;if(pref.color==='冷色系')score+=(blue+g-2*r)/510}if(pref.meaning&&pref.meaning!=='全部'&&((b.tags||[]).join('')+(b.meaning||'')).includes(pref.meaning))score+=2;return score};filtered.sort((a,b)=>score(b)-score(a))
      this.filterKey=filterKey;filterPatch={filtered,sizes,size}
    }
    const selectedItem=map[d.beads[this.data.selected]]
    const missingItems=d.beads.map((id,index)=>({id,index})).filter(x=>!map[x.id])
    const countMap={},tags=[]; d.beads.forEach(id=>{const bead=map[id];if(!bead)return;countMap[id]=(countMap[id]||0)+1;(bead.tags||[]).forEach(t=>{if(t!=='点缀'&&!tags.includes(t))tags.push(t)})})
    const picked=Object.keys(countMap).map(id=>({id,name:map[id].name,n:countMap[id],bead:map[id]})).sort((a,b)=>b.n-a.n)
    const displayBeads=(filterPatch.filtered||this.data.filtered).map(b=>({...b,selectedCount:countMap[b.id]||0}))
    const goodsFen=d.beads.reduce((sum,id)=>sum+(map[id]?Math.round(Number(map[id].price||0)*100):0),0)
    const handPrice=result.missing?'--':yuan(totalHand(goodsFen,this.data.pricing).payableFen)
    const notes=materials.fromCatalog(d.beads,this.data.catalog)
    const last=[...d.beads].reverse().find(id=>{const b=map[id];return b&&!b.spacer&&b.mat!=='metal'}), next=last?logic.fill(d.beads,this.data.catalog,d.wrist,last):[]
    const fitResult=fitText(result,d.beads.length)
    const fitOK=!result.missing&&d.beads.length>0&&['ok','multi'].includes(fitResult.state)
    const withoutLast=d.beads.length?logic.stats(d.beads.slice(0,-1),this.data.catalog,d.wrist):null
    const overHint=fitResult.state==='long'&&withoutLast&&fitText(withoutLast,d.beads.length-1).state==='ok'?'去掉 1 颗刚好合适':''
    const kindPositions=this.data.selectedKind?layout(items,470).filter((p,i)=>d.beads[i]===this.data.selectedKind):[]
    this.setData({...filterPatch,items,missingItems,picked,displayBeads,kindPositions,overHint,beadCount:d.beads.length,handPrice,price:result.missing?'--':(result.price+(d.beads.length?15:0)).toFixed(2),length:result.missing?'--':(result.length/10).toFixed(1),lengthMm:result.missing?'--':Math.round(result.length),fit:result.missing?'部分材料已下架，请替换后继续':d.beads.length?fitResult.word:'还没有珠子',fitState:d.beads.length?fitResult.state:'empty',shortMm:fitResult.mm||0,missing:result.missing,tags:tags.slice(0,3),tagLine:tags.slice(0,3).join(' · '),notes,safetyNotice:materials.safetyLines(notes),meterFill:meterPos(result),meterZoneLeft:43,meterZoneWidth:17,fitOK,fillCount:Math.max(0,next.length-d.beads.length),fillLabel:last?`${map[last].name} ${map[last].mm}mm`:'',selectedLabel:selectedItem?`${selectedItem.name} ${selectedItem.mm}mm`:this.data.selected>=0?'已下架材料':'',canUndo:!!(this.history&&this.history.length)})
    store.selected(d)
  },
  changeBeads(next, selected){ const d=this.data.design;this.history=this.history||[];this.history.push(d.beads.slice());if(this.history.length>60)this.history.shift();d.beads=next;this.setData({design:d,selected:selected==null?-1:selected});this.update();this.saveDraftSoon() },
  saveDraftSoon(){clearTimeout(this.draftTimer);const id=this.data.design.id;this.setData({saveDot:true});this.draftTimer=setTimeout(()=>{const d=this.data.design;if(d&&d.id===id){store.save(d);if(!this.savedNotified){this.savedNotified=true;this.say('autoSave')}this.setData({saveDot:false})}},400)},
  onHide(){if(wx.showTabBar)wx.showTabBar();if(this.audio)this.audio.stop();this.dragCancel();clearTimeout(this.draftTimer);const d=this.data.design;if(d)store.save(d)},
  back(){nav.backFromWorkbench()},
  works(){wx.navigateTo({url:'/features/works/works'})},
  retryCatalog(){this.onShow()},
  say(type,state,extra){const value=message(type,state);if(value)queue.show({text:value,...extra})},
  vibrate(type='light'){if(wx.vibrateShort)wx.vibrateShort({type,fail(){}})},
  focusKbBead(){const id=this.pendingBeadKbId;if(!id)return;const bead=this.data.catalog.find(b=>b.kbId===id||b.kb===id||b.id===id);if(!bead)return;this.pendingBeadKbId='';this.setData({cat:'all',size:'all',materialTab:bead.mat==='metal'||bead.spacer?'accessories':'beads',focusedBeadId:bead.id,scrollBeadId:'bead-'+bead.id});this.filterKey='';this.update()},
  clearFocus(){this.setData({focusedBeadId:'',scrollBeadId:''})},
  selectTray(e){if(!this.data.items.length||!this.createSelectorQuery)return;this.createSelectorQuery().select('#workbench-bracelet').boundingClientRect(rect=>{if(!rect)return;const x=(e.detail.x-rect.left)/rect.width*470,y=(e.detail.y-rect.top)/rect.height*470;const positions=layout(this.data.items,470);let best=-1,distance=Infinity;positions.forEach((p,i)=>{const dx=x-(p.x+p.box/2),dy=y-(p.y+p.box/2),d=dx*dx+dy*dy;if(d<distance){distance=d;best=i}});if(best>=0)this.select({currentTarget:{dataset:{i:best}}})}).exec()},
  stack(){const others=store.list().filter(d=>d.id!==this.data.design.id&&d.beads&&d.beads.length);if(!others.length)return this.say('stackEmpty');queue.show({text:'叠戴预览即将开放'})},
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
  inspect(e){const b=this.data.filtered.find(b=>b.id===e.currentTarget.dataset.id);if(b){this.setData({detailBead:b,detailOpen:true});this.vibrate()}this.suppressTapUntil=Date.now()+600},
  closeInspect(){this.setData({detailBead:null,detailOpen:false});setTimeout(()=>{if(wx.hideTabBar)wx.hideTabBar()},0)},
  addInspected(){const b=this.data.detailBead;this.closeInspect();if(b)this.add({currentTarget:{dataset:{id:b.id}}})},
  noop(){},
  chooseCord(e){const d={...this.data.design,cord:Number(e.currentTarget.dataset.cord)};this.setData({design:d});store.selected(d);this.saveDraftSoon()},
  category(e){this.setData({cat:e.currentTarget.dataset.id,size:'all'});this.update()},
  sizeFilter(e){this.setData({size:e.currentTarget.dataset.size});this.update()},
  add(e){if(Date.now()<(this.suppressTapUntil||0))return;const bead=this.data.catalog.find(b=>b.id===e.currentTarget.dataset.id);if(!bead)return;if(bead.stock==='out_of_stock'||bead.onSale===false){const similar=this.data.catalog.find(b=>b.id!==bead.id&&b.stock!=='out_of_stock'&&b.mat===bead.mat);this.say('outOfStock',{}, {action:similar?similar.name:'看相似的',onAction:()=>this.focusSimilar(bead)});this.vibrate();this.setData({outOfStockId:bead.id});setTimeout(()=>this.setData({outOfStockId:''}),400);return}this.clearFocus();if(bead.safety&&!(this.safetyAccepted&&this.safetyAccepted.has(bead.kb||bead.id))){this.openSafety(bead);return}this.addBead(bead,e.detail)},
  addBead(bead,point){const d=this.data.design,beads=d.beads.slice(),first=!beads.length,replacing=this.data.replaceMode&&this.data.selected>=0;if(replacing)beads[this.data.selected]=bead.id;else{if(beads.length>=80)return queue.show({text:'最多添加 80 颗'});beads.push(bead.id)}this.changeBeads(beads,replacing?this.data.selected:-1);this.setData({replaceMode:false,selectedKind:''});if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y)){this.setData({flight:{bead,x:point.x,y:point.y}});setTimeout(()=>{const width=wx.getSystemInfoSync?wx.getSystemInfoSync().windowWidth:375;this.setData({flight:{bead,x:width/2,y:220}})},10);setTimeout(()=>this.setData({flight:null}),250)}this.playSound();this.vibrate();if(replacing)this.say('replace',{name:bead.name},{action:'撤销',onAction:()=>this.undo()});else if(first&&!this.firstBeadHintShown){this.firstBeadHintShown=true;this.say('firstAdd',{name:bead.name})}else if(this.data.fitState==='ok'){this.say('fit',{name:bead.name});this.vibrate('medium')}else if(this.data.fitState==='multi'&&beads.length===54)this.say('multi');else if(this.data.fitState!=='long')this.say('add',{name:bead.name})},
  focusSimilar(bead){const match=this.data.catalog.find(b=>b.id!==bead.id&&b.stock!=='out_of_stock'&&b.mat===bead.mat);if(match){this.setData({cat:'all',size:'all',scrollBeadId:'bead-'+match.id,focusedBeadId:match.id});this.filterKey='';this.update()}},
  openSafety(bead){const kbId=bead.kb||bead.kbId;if(!kbId){this.setData({safetyBead:bead,safetyNote:typeof bead.safety==='string'?bead.safety:bead.safety.note,safetyCare:bead.care||'',safetyOpen:true});return}api.request('/kb/bead/'+encodeURIComponent(kbId)).then(kb=>{const note=kb.safety&&kb.safety.note;if(!note){queue.show({text:'安全说明暂时无法读取，请稍后再试'});return}this.setData({safetyBead:bead,safetyNote:note,safetyCare:kb.care||'',safetyOpen:true})}).catch(()=>queue.show({text:'安全说明暂时无法读取，请稍后再试'}))},
  cancelSafety(){this.setData({safetyOpen:false,safetyBead:null});setTimeout(()=>{if(wx.hideTabBar)wx.hideTabBar()},0)},
  confirmSafety(){const bead=this.data.safetyBead;if(!bead)return;this.safetyAccepted=this.safetyAccepted||new Set();this.safetyAccepted.add(bead.kb||bead.id);this.cancelSafety();this.addBead(bead)},
  select(e){const i=Number(e.currentTarget.dataset.i);this.setData({selected:i===this.data.selected?-1:i,selectedKind:'',replaceMode:false});this.update();this.vibrate()},
  select3d(e){const i=Number(e.detail.index);this.setData({selected:i===this.data.selected?-1:i,selectedKind:'',replaceMode:false});this.update();this.vibrate()},
  selectKind(e){const id=e.currentTarget.dataset.id;const index=this.data.design.beads.indexOf(id);this.setData({selectedKind:id,selected:index,replaceMode:false});this.update();this.vibrate()},
  removeKind(){const id=this.data.selectedKind;if(!id)return;const bead=this.data.catalog.find(b=>b.id===id),next=this.data.design.beads.filter(x=>x!==id);this.changeBeads(next);this.setData({selectedKind:''});this.say('delete',{name:bead&&bead.name},{action:'撤销',onAction:()=>this.undo(),duration:3000})},
  replaceSelected(){this.setData({replaceMode:true,selectedKind:''})},
  deselect(){this.setData({selected:-1});this.update()},
  renderUnavailable(){this.setData({renderFallback:true})},
  toggleView(e){this.setData({viewMode:e.currentTarget.dataset.mode})},
  toggleDetails(){this.setData({detailsOpen:!this.data.detailsOpen})},
  toggleCounts(){this.setData({countsOpen:!this.data.countsOpen})},
  rename(e){const d=this.data.design;d.name=e.detail.value.slice(0,12);this.setData({design:d});store.selected(d);this.saveDraftSoon();this.say('rename')},
  count(e){const n=Number(e.currentTarget.dataset.count),d=this.data.design,result=logic.setCount(d.beads,this.data.catalog,d.wrist,n);if(!result)return queue.show({text:'没有合适的珠子尺寸'});this.changeBeads(result.seq);queue.show({text:`已按 ${n} 颗搭配`})},
  refit(){const d=this.data.design;if(!d.pattern||!d.pattern.length)return;const beads=templates.build(d,this.data.catalog,d.wrist);if(!beads)return queue.show({text:'模板材料不可用'});this.changeBeads(beads)},
  wristPage(){wx.navigateTo({url:'/pages/wrist/wrist?source=editor'})},
  remove(){const i=this.data.selected,beads=this.data.design.beads.slice();if(i<0||i>=beads.length)return;const bead=this.data.catalog.find(b=>b.id===beads[i]);beads.splice(i,1);this.changeBeads(beads);this.playSound('remove');this.say('delete',{name:bead&&bead.name},{action:'撤销',onAction:()=>this.undo(),duration:3000})},
  removeLast(){const beads=this.data.design.beads.slice();if(!beads.length)return;const bead=this.data.catalog.find(b=>b.id===beads.pop());this.changeBeads(beads);this.vibrate();this.playSound('remove');this.say('removeLast',{name:bead&&bead.name},{action:'撤销',onAction:()=>this.undo(),duration:3000})},
  move(e){const i=this.data.selected,delta=Number(e.currentTarget.dataset.delta),result=logic.move(this.data.design.beads,i,delta);if(result.index!==i){this.changeBeads(result.items,result.index);this.vibrate()}},
  undo(){if(!this.history||!this.history.length)return;const d=this.data.design;d.beads=this.history.pop();this.setData({design:d,selected:-1,selectedKind:''});this.update();this.saveDraftSoon();this.vibrate();this.say('undo')},
  fill(){const d=this.data.design,last=[...d.beads].reverse().find(id=>{const b=this.data.catalog.find(x=>x.id===id);return b&&!b.spacer&&b.mat!=='metal'});if(!last)return queue.show({text:'请先选择一颗主珠'});const next=logic.fill(d.beads,this.data.catalog,d.wrist,last);if(next.length===d.beads.length)return queue.show({text:this.data.missing?'请先替换下架材料':'当前长度无需补齐'});this.changeBeads(next)},
  wrist(e){const d=this.data.design,value=Number(e.detail.value);if(!Number.isFinite(value)||value<8||value>30){queue.show({text:'手围请输入 8–30 cm'});this.setData({'design.wrist':d.wrist});return}d.wrist=value;this.setData({design:d});this.update();this.say('wrist',{wrist:value})},
  save(){const d=this.data.design;if(!d.beads.length)return queue.show({text:'请先选珠'});store.save(d);store.selected(d);queue.show({text:'已保存在本机'});store.sync(d).then(()=>queue.show({text:'已同步保存版本'})).catch(e=>queue.show({text:e.message&&e.message.includes('冲突')?'云端版本冲突，已保存本机':'仅保存在本机，未同步',duration:3000}))},
  share(){if(this.data.design.beads.length<6)return this.say('shareFew');this.save();wx.navigateTo({url:'/pages/share/share'})},
  finish(){const count=this.data.design.beads.length;if(count<6){this.shakeMeter();return this.say('finishFew',{count})}if(!this.data.catalogReady)return queue.show({text:'材料加载中，请稍后重试'});if(this.data.missing)return queue.show({text:'请先替换下架材料'});if(this.data.fitState==='short'){this.shakeMeter();this.vibrate();return this.say('finishShort',{mm:this.data.shortMm})}this.save();this.vibrate();wx.navigateTo({url:'/pages/finish/finish'})},
  shakeMeter(){this.setData({meterShake:true});setTimeout(()=>this.setData({meterShake:false}),350)}
})
