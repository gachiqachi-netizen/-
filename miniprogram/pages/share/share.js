const { queue: toast } = require('../../utils/toast')
const api=require('../../utils/api'),store=require('../../utils/design'),auth=require('../../utils/auth')
const { layout } = require('../../utils/bracelet-layout')
const braceletStyle = require('../../components/bracelet/style.js')
const { materialParams } = require('../../components/bracelet/fallback.js')
const keyOf=d=>d&&JSON.stringify([d.name,d.wrist,d.beads])
function wrap(text,maxChars,maxLines){const chars=Array.from(String(text||''));const lines=[];let i=0;while(i<chars.length&&lines.length<maxLines){const line=chars.slice(i,i+maxChars);i+=line.length;while(i<chars.length&&/^[，。！？、；：,.!?;:]$/.test(chars[i]))line.push(chars[i++]);lines.push(line.join(''))}if(i<chars.length&&lines.length)lines[lines.length-1]=lines[lines.length-1].slice(0,-1)+'…';return lines}
function posterSize(windowWidth){const width=Math.floor(Math.max(201,Math.min(430,windowWidth-40))/3)*3;return {width,height:width*4/3}}
function posterTop(windowHeight,height){return Math.max(0,Math.min(90,windowHeight-height-120))}
function drawBead(ctx,point,path,x,y,params=materialParams(point.bead||point,'l')){
 const r=point.r,colors=point.colors||[],light=colors[0]||braceletStyle.fallbackColors[0],dark=colors[1]||braceletStyle.fallbackColors[1]
 ctx.save()
 if(!path&&params.shadowAlpha&&ctx.setShadow&&ctx.fill){ctx.setShadow(0,r*.12,r*.28,`rgba(0,0,0,${params.shadowAlpha})`);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.setFillStyle(dark);ctx.fill();ctx.setShadow(0,0,0,'transparent')}
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip()
 if(path){ctx.translate(x,y);ctx.rotate(point.rotate*Math.PI/180);ctx.drawImage(path,-r,-r,2*r,2*r)}
 else{
  const base=params.kind==='metal'&&ctx.createLinearGradient?ctx.createLinearGradient(x-r,y-r,x+r,y+r):ctx.createCircularGradient(x-r*.25,y-r*.25,r*1.65)
  if(params.kind==='metal'&&ctx.createLinearGradient){[[0,dark],[.31,light],[.55,dark],[.72,light],[1,dark]].forEach(stop=>base.addColorStop(...stop))}
  else{base.addColorStop(0,light);base.addColorStop(params.colorStop/100,light);base.addColorStop(1,dark)}
  ctx.setFillStyle(base);ctx.fillRect(x-r,y-r,2*r,2*r)
  const shine=ctx.createCircularGradient(x-r*.4,y-r*.4,r*.72)
  shine.addColorStop(0,`rgba(255,255,255,${params.highlightAlpha})`);shine.addColorStop(params.highlightStop/100,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(255,255,255,0)')
  ctx.setFillStyle(shine);ctx.fillRect(x-r,y-r,2*r,2*r)
  const glow=ctx.createCircularGradient(x+r*.16,y+r*.25,r*.8)
  glow.addColorStop(0,`rgba(255,255,255,${params.glowAlpha})`);glow.addColorStop(params.glowStop/100,'rgba(255,255,255,0)');glow.addColorStop(1,'rgba(255,255,255,0)')
  ctx.setFillStyle(glow);ctx.fillRect(x-r,y-r,2*r,2*r)
  const shade=ctx.createCircularGradient(x,y,r)
  shade.addColorStop(.66,'rgba(0,0,0,0)');shade.addColorStop(1,`rgba(0,0,0,${params.shadeAlpha})`)
  ctx.setFillStyle(shade);ctx.fillRect(x-r,y-r,2*r,2*r)
 }
 ctx.restore()
}

function posterLayout(w,h){
 const unit=w/750,pad=40*unit,topH=h*2/3
 const title={y:topH+pad*.5,height:64*unit}
 const meaning={y:title.y+title.height+16*unit,height:72*unit,lineHeight:36*unit}
 const footer={y:h-pad*.5-25*unit,height:25*unit}
 const qrSide=168*unit,qr={x:w-pad-qrSide,y:footer.y+footer.height-qrSide,width:qrSide,height:qrSide}
 return {unit,pad,topH,title,meaning,footer,qr}
}
function drawPoster(ctx,{width:w,height:h,items,paths,design,meaning,qrPath,day}){
 const style=braceletStyle,{unit,pad,topH,title,meaning:meaningBox,footer,qr}=posterLayout(w,h)
 ctx.setFillStyle(style.background.poster);ctx.fillRect(0,0,w,h)
 ctx.setFillStyle(style.background.paper);ctx.fillRect(0,topH,w,h-topH)
 // 画布与 c-wordmark 小号一致的位置；只出现这一次品牌字样。
 ctx.setFillStyle('#111111');ctx.setFontSize(w*32/750);ctx.fillText('珠养养',pad,pad+w*19/750)
 const artwork=w*.8,drawSize=artwork*style.fillRatio,points=layout(items,drawSize)
 const left=(w-drawSize)/2,top=(topH-drawSize)/2
 points.forEach((point,i)=>drawBead(ctx,{...point,bead:items[i]},paths[i],left+point.x,top+point.y,materialParams(items[i],'l')))
 ctx.setFillStyle('#111111');ctx.setFontSize(56*unit)
 const titleText=String(design.name||'我的手串').slice(0,12)
 const titleBaseline=title.y+56*unit
 ctx.fillText(titleText,pad,titleBaseline);ctx.fillText(titleText,pad+.35,titleBaseline)
 const meaningSize=28*unit,maxChars=Math.max(5,Math.floor((qr.x-pad-18*unit)/meaningSize))
 ctx.setFillStyle('#6e6e6e');ctx.setFontSize(meaningSize)
 wrap(meaning,maxChars,2).forEach((line,i)=>ctx.fillText(line,pad,meaningBox.y+(i+1)*meaningBox.lineHeight-5*unit))
 const date=day||new Date();const label=`我自己串的 · ${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()}`
 ctx.setFontSize(25*unit);ctx.fillText(label,pad,footer.y+footer.height)
 if(qrPath){const imageSide=qr.width-24*unit;ctx.drawImage(qrPath,qr.x+12*unit,qr.y,imageSide,imageSide);ctx.setFillStyle('#111111');ctx.setFontSize(18*unit);ctx.fillText('长按识别 串一条你的',qr.x+3*unit,qr.y+qr.height-4*unit)}
 else{ctx.setFillStyle(style.background.poster);ctx.fillRect(qr.x,qr.y,qr.width,qr.height);ctx.setFillStyle('#111111');ctx.setFontSize(29*unit);ctx.fillText('微信搜索',qr.x+(qr.width-4*29*unit)/2,qr.y+qr.height*.45);ctx.fillText('珠养养',qr.x+(qr.width-3*29*unit)/2,qr.y+qr.height*.7)}
 return points
}
Page({
 data:{design:null,width:348,height:464,previewTop:0,loading:true,ready:false,preview:false,missing:0,error:'',saveBusy:false,shareBusy:false,shareId:'',shareError:'',items:[],catalog:[],snapshot:"",snapshotFailed:false,tags:[],meaning:'',qrPath:'',qrFallback:true,albumDenied:false,moreOpen:false},
 onLoad(){const info=wx.getSystemInfoSync(),{width,height}=posterSize(info.windowWidth);this.setData({width,height,previewTop:posterTop(info.windowHeight,height)})},
 onReady(){this.canvasReady=true;this.renderCard()},
 onShow(){const d=store.current(),key=keyOf(d);if(!d||!Array.isArray(d.beads)||!d.beads.length){this.setData({design:null,loading:false,error:'',ready:false});return}if(key!==this.shareKey)this.setData({shareId:'',shareError:''});this.designKey=key;this.setData({design:d,loading:true,error:'',ready:false,snapshot:'',snapshotFailed:false});api.catalog().then(c=>{if(keyOf(store.current())!==key)return;this.catalog=c.beads||[];this.calculate(d);this.setData({catalog:this.catalog,loading:false},()=>this.renderCard())}).catch(e=>this.setData({loading:false,error:api.userMessage(e),ready:false}))},
 retry(){this.onShow()},
 calculate(d){const map={};this.catalog.forEach(b=>{map[b.id]=b});this.map=map;let missing=0;const tags=[];const items=d.beads.map((id,i)=>{const b=map[id];if(!b){missing++;return null}(b.tags||[]).forEach(t=>{if(t!=='点缀'&&!tags.includes(t))tags.push(t)});return {...b,colors:b.colors||b.c||[]}}).filter(Boolean);const meaning=d.meaning||d.aiMeaning||tags.slice(0,3).join(' · ');this.setData({items,missing,tags:tags.slice(0,3),meaning})},
 photoPath(photo){
  if(!photo)return ''
  if(/^(https?:|data:|wxfile:)/.test(photo))return photo
  const base=getApp().globalData.apiBase
  return base?base+photo:''
 },
 localPhoto(photo){return new Promise(resolve=>{
   const url=this.photoPath(photo)
   if(!url)return resolve('')
   wx.getImageInfo({src:url,success:r=>resolve(r.path||''),fail:()=>resolve('')})
 })},
 async renderCard(){
  if(!this.canvasReady||this.data.loading||!this.data.design||!this.map||this.data.preview||!this.data.items.length)return
  const revision=this.renderRevision=(this.renderRevision||0)+1
  const d=this.data.design,items=this.data.items,w=this.data.width,h=this.data.height
  const drawSize=w*.8*braceletStyle.fillRatio
  const points=layout(items,drawSize)
  const paths=await Promise.all(items.map((b,i)=>this.localPhoto((points[i].r*2<=96?b.photoSm:points[i].r*2<=240?b.photoMd:b.photo)||b.photo)))
  if(revision!==this.renderRevision||keyOf(store.current())!==this.designKey)return
  const ctx=wx.createCanvasContext('shareCard',this)
  drawPoster(ctx,{width:w,height:h,items,paths,design:d,meaning:this.data.meaning,qrPath:this.data.qrPath})
  ctx.draw(false,()=>{if(revision===this.renderRevision&&keyOf(store.current())===this.designKey){this.setData({ready:true});wx.canvasToTempFilePath({canvasId:'shareCard',x:0,y:0,width:w,height:h,destWidth:w*2,destHeight:h*2,success:r=>this.setData({shareImage:r.tempFilePath})},this)}})
 },
 saveCard(){if(!this.data.ready||this.data.saveBusy)return;this.setData({saveBusy:true,error:'',albumDenied:false});wx.canvasToTempFilePath({canvasId:'shareCard',destWidth:this.data.width*2,destHeight:this.data.height*2,success:r=>wx.saveImageToPhotosAlbum({filePath:r.tempFilePath,success:()=>toast.show({ text: '已保存到相册' }),fail:e=>{const denied=/auth|authorize|deny|permission|scope/i.test(e.errMsg||'');this.setData({albumDenied:denied,error:denied?'没有相册权限，去设置里打开':'保存失败，请稍后重试。'})},complete:()=>this.setData({saveBusy:false})}),fail:()=>this.setData({saveBusy:false,error:'图片生成失败，请重试。'})},this)},
 openAlbumSettings(){wx.openSetting({success:r=>{if(r.authSetting&&r.authSetting['scope.writePhotosAlbum'])this.setData({albumDenied:false,error:''})}})},
 more(){if(!this.data.shareId)return toast.show({ text: '请先准备分享' });this.setData({moreOpen:true})},
 closeMore(){this.setData({moreOpen:false})},
 viewFriend(){this.closeMore();wx.navigateTo({url:'/features/shared/shared?id='+encodeURIComponent(this.data.shareId)})},
 loadCode(id){const base=getApp().globalData.apiBase;if(!base)return;wx.downloadFile({url:base+'/api/shares/'+encodeURIComponent(id)+'/qrcode',success:r=>{if(r.statusCode===200){this.setData({qrPath:r.tempFilePath,qrFallback:false},()=>this.renderCard())}else this.setData({qrPath:'',qrFallback:true},()=>this.renderCard())},fail:()=>this.setData({qrPath:'',qrFallback:true},()=>this.renderCard())})},
 prepareShare(){const d=this.data.design;if(!d||this.data.shareBusy)return;const key=keyOf(d);this.setData({shareBusy:true,shareError:''});auth.authorized('/shares',{name:d.name||'我的手串',wrist:d.wrist,beads:d.beads.slice(),meaning:this.data.meaning}).then(r=>{if(keyOf(store.current())!==key)return this.setData({shareError:'设计已更改，请重新准备分享。'});if(!r.shareId)throw new Error('未生成分享链接');this.shareKey=key;this.setData({shareId:r.shareId},()=>this.loadCode(r.shareId))}).catch(e=>this.setData({shareError:'分享准备失败：'+(e.message||'请稍后重试')})).finally(()=>this.setData({shareBusy:false}))},
 onShareAppMessage(){if(!this.data.shareId||keyOf(store.current())!==this.shareKey)return {title:'珠养养',path:'/pages/home/home'};return {title:`看看我串的‘${this.data.design.name||'我的手串'}’`,path:'/features/shared/shared?id='+encodeURIComponent(this.data.shareId),imageUrl:this.data.shareImage||undefined}},
 preview(){this.setData({preview:true})},
 closePreview(){this.setData({preview:false},()=>this.renderCard())},
 use(){const d=this.data.design;if(!d)return;store.save(d);const next=store.create();next.name=d.name;next.wrist=d.wrist;next.beads=d.beads.slice();store.selected(next);require('../../utils/nav').openWorkbench(next)},
 buySame(){if(this.data.missing)return toast.show({ text: '请先替换下架材料' });const original=this.data.design;const next={...store.create(),name:original.name,wrist:original.wrist,beads:original.beads.slice(),meaning:original.meaning,source:'shared'};store.selected(next);wx.navigateTo({url:'/pages/order/order'})},
 order(){if(this.data.missing)return toast.show({ text: '请先替换下架材料' });wx.navigateTo({url:'/pages/order/order'})},
  privacyRejected() { this.setData({ saveBusy: false, error: '没有相册权限，去设置里打开', albumDenied: true }) },
})
module.exports = { wrap, drawBead, drawPoster, posterLayout, posterSize, posterTop }
