const { queue: toast } = require('../../utils/toast')
const api=require('../../utils/api'),store=require('../../utils/design'),auth=require('../../utils/auth')
const { layout } = require('../../utils/bracelet-layout')
const keyOf=d=>d&&JSON.stringify([d.name,d.wrist,d.beads])
function wrap(text,maxChars,maxLines){const chars=Array.from(String(text||''));const lines=[];let i=0;while(i<chars.length&&lines.length<maxLines){const line=chars.slice(i,i+maxChars);i+=line.length;while(i<chars.length&&/^[，。！？、；：,.!?;:]$/.test(chars[i]))line.push(chars[i++]);lines.push(line.join(''))}if(i<chars.length&&lines.length)lines[lines.length-1]=lines[lines.length-1].slice(0,-1)+'…';return lines}
function drawBead(ctx,point,path,x,y){
 const r=point.r,colors=point.colors||[],light=colors[0]||'#f4f4f4',dark=colors[1]||'#c9c9c9'
 ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip()
 if(path){ctx.translate(x,y);ctx.rotate(point.rotate*Math.PI/180);ctx.drawImage(path,-r,-r,2*r,2*r)}
 else{
  const base=ctx.createCircularGradient(x-r*.28,y-r*.4,r*1.8)
  base.addColorStop(0,light);base.addColorStop(.45,light);base.addColorStop(1,dark)
  ctx.setFillStyle(base);ctx.fillRect(x-r,y-r,2*r,2*r)
  const shine=ctx.createCircularGradient(x-r*.36,y-r*.45,r*.95)
  shine.addColorStop(0,'rgba(255,255,255,0.9)');shine.addColorStop(.26,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(255,255,255,0)')
  ctx.setFillStyle(shine);ctx.fillRect(x-r,y-r,2*r,2*r)
  const glow=ctx.createCircularGradient(x+r*.28,y+r*.48,r*.8)
  glow.addColorStop(0,'rgba(255,255,255,0.35)');glow.addColorStop(.42,'rgba(255,255,255,0)');glow.addColorStop(1,'rgba(255,255,255,0)')
  ctx.setFillStyle(glow);ctx.fillRect(x-r,y-r,2*r,2*r)
  const shade=ctx.createCircularGradient(x,y,r)
  shade.addColorStop(.65,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,0.16)')
  ctx.setFillStyle(shade);ctx.fillRect(x-r,y-r,2*r,2*r)
 }
 ctx.restore()
}
Page({
 data:{design:null,width:343,height:505,loading:true,ready:false,preview:false,missing:0,error:'',saveBusy:false,shareBusy:false,shareId:'',shareError:'',items:[],catalog:[],snapshot:"",snapshotFailed:false,tags:[],meaning:'',qrPath:'',qrFallback:true,albumDenied:false,moreOpen:false},
 onLoad(){const w=Math.max(200,Math.min(430,wx.getSystemInfoSync().windowWidth-32));this.setData({width:w,height:Math.round(w*1060/720)})},
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
  const d=this.data.design,items=this.data.items,w=this.data.width,h=this.data.height,s=w/720
  const points=layout(items,500*s)
  const paths=await Promise.all(items.map((b,i)=>this.localPhoto((points[i].r*2<=96?b.photoSm:points[i].r*2<=240?b.photoMd:b.photo)||b.photo)))
  if(revision!==this.renderRevision||keyOf(store.current())!==this.designKey)return
  const ctx=wx.createCanvasContext('shareCard',this)
  ctx.setFillStyle('#fff');ctx.fillRect(0,0,w,h);ctx.setFillStyle('#f5f4f2');ctx.fillRect(16*s,16*s,688*s,620*s)
  const left=110*s,top=82*s
  const centerX=left+250*s,centerY=top+250*s
  const inner=points.length?Math.min(...points.map(point=>Math.hypot(point.x-250*s,point.y-250*s)-point.r)):0
  const markWidth=Math.min(200*s,Math.max(0,inner*2-20*s))
  if(markWidth>0)ctx.drawImage('/pages/share/wordmark-line.png',centerX-markWidth/2,centerY-markWidth*128/259/2,markWidth,markWidth*128/259)
  points.forEach((point,i)=>{
    drawBead(ctx,point,paths[i],left+point.x,top+point.y)
  })
  ctx.setFillStyle('#111');ctx.setFontSize(28*s);ctx.fillText('珠养养',56*s,74*s)
  ctx.setFontSize(42*s);ctx.fillText(String(d.name||'我的手串').slice(0,12),56*s,715*s)
  ctx.setFontSize(26*s);wrap(this.data.meaning,20,2).forEach((line,i)=>ctx.fillText(line,56*s,(795+i*40)*s))
  const day=new Date();ctx.setFontSize(22*s);ctx.fillText(`我自己串的 · ${day.getFullYear()}.${day.getMonth()+1}.${day.getDate()}`,56*s,935*s)
  ctx.fillText('你也来串一条',56*s,980*s)
  if(this.data.qrPath)ctx.drawImage(this.data.qrPath,540*s,870*s,120*s,120*s)
  else{ctx.setFontSize(20*s);ctx.fillText('微信搜索「珠养养」小程序',350*s,1010*s)}
  ctx.draw(false,()=>{if(revision===this.renderRevision&&keyOf(store.current())===this.designKey){this.setData({ready:true});wx.canvasToTempFilePath({canvasId:'shareCard',x:0,y:0,width:w,height:w*4/5,destWidth:w*2,destHeight:Math.round(w*8/5),success:r=>this.setData({shareImage:r.tempFilePath})},this)}})
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
 order(){if(this.data.missing)return toast.show({ text: '请先替换下架材料' });wx.navigateTo({url:'/pages/order/order'})}
})
module.exports = { wrap, drawBead }
