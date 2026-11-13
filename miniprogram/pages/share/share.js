const api=require('../../utils/api'),store=require('../../utils/design'),auth=require('../../utils/auth')
const keyOf=d=>d&&JSON.stringify([d.name,d.wrist,d.beads])
function wrap(text,maxChars,maxLines){const chars=Array.from(String(text||''));const lines=[];for(let i=0;i<chars.length&&lines.length<maxLines;i+=maxChars)lines.push(chars.slice(i,i+maxChars).join(''));if(chars.length>maxChars*maxLines)lines[maxLines-1]=lines[maxLines-1].slice(0,-1)+'…';return lines}
Page({
 data:{design:null,width:343,height:505,loading:true,ready:false,preview:false,missing:0,error:'',saveBusy:false,shareBusy:false,shareId:'',shareError:'',items:[],catalog:[],snapshot:"",snapshotFailed:false,tags:[],meaning:'',qrPath:'',qrFallback:true,albumDenied:false},
 onLoad(){const w=Math.max(200,Math.min(430,wx.getSystemInfoSync().windowWidth-32));this.setData({width:w,height:Math.round(w*1060/720)})},
 onReady(){this.canvasReady=true;this.renderCard()},
 onShow(){const d=store.current(),key=keyOf(d);if(!d||!Array.isArray(d.beads)||!d.beads.length){this.setData({loading:false,error:'请先完成手串设计。',ready:false});return}if(key!==this.shareKey)this.setData({shareId:'',shareError:''});this.designKey=key;this.setData({design:d,loading:true,error:'',ready:false,snapshot:'',snapshotFailed:false});api.catalog().then(c=>{if(keyOf(store.current())!==key)return;this.catalog=c.beads||[];this.calculate(d);this.setData({catalog:this.catalog,loading:false},()=>this.renderCard())}).catch(()=>this.setData({loading:false,error:'材料信息暂不可用，请稍后重试。',ready:false}))},
 calculate(d){const map={};this.catalog.forEach(b=>{map[b.id]=b});this.map=map;let missing=0;const tags=[];const items=d.beads.map((id,i)=>{const b=map[id];if(!b){missing++;return null}(b.tags||[]).forEach(t=>{if(t!=='点缀'&&!tags.includes(t))tags.push(t)});const a=2*Math.PI*i/d.beads.length-Math.PI/2;return {index:i,x:50+35*Math.cos(a),y:50+35*Math.sin(a),color:(b.c||[])[0]||'#bcb6b1'}}).filter(Boolean);const meaning=d.meaning||d.aiMeaning||tags.slice(0,3).join(' · ');this.setData({items,missing,tags:tags.slice(0,3),meaning})},
 snapshotReady(){if(this.snapshotBusy||this.data.snapshot||!this.data.design)return;const component=this.selectComponent('#share3d');if(!component)return;this.snapshotBusy=true;const key=this.designKey;component.exportImage((err,path)=>{this.snapshotBusy=false;if(key!==keyOf(store.current()))return;if(err){this.snapshotUnavailable();return}this.setData({snapshot:path},()=>this.renderCard())})},
 snapshotUnavailable(){this.setData({snapshotFailed:true,error:'3D 分享图暂不可用，请稍后重试。',ready:false})},
 renderCard(){if(!this.canvasReady||this.data.loading||!this.data.design||!this.map||this.data.preview||!this.data.snapshot)return;const d=this.data.design,ctx=wx.createCanvasContext('shareCard',this),w=this.data.width,h=this.data.height,s=w/720
  ctx.setFillStyle('#fff');ctx.fillRect(0,0,w,h);ctx.setFillStyle('#f5f4f2');ctx.fillRect(16*s,16*s,688*s,620*s)
  ctx.drawImage(this.data.snapshot,92*s,112*s,536*s,411*s)
  ctx.setFillStyle('#111');ctx.setFontSize(28*s);ctx.fillText('珠养养 ZHU YANG YANG',56*s,74*s)
  ctx.setFontSize(42*s);ctx.fillText(String(d.name||'我的手串').slice(0,12),56*s,715*s)
  ctx.setFontSize(26*s);wrap(this.data.meaning,20,2).forEach((line,i)=>ctx.fillText(line,56*s,(795+i*40)*s))
  const day=new Date();ctx.setFontSize(22*s);ctx.fillText(`我自己串的 · ${day.getFullYear()}.${day.getMonth()+1}.${day.getDate()}`,56*s,935*s)
  ctx.fillText('你也来串一条',56*s,980*s)
  if(this.data.qrPath)ctx.drawImage(this.data.qrPath,540*s,870*s,120*s,120*s)
  else {ctx.setFontSize(20*s);ctx.fillText('微信搜索「珠养养」小程序',350*s,1010*s)}
  ctx.draw(false,()=>{if(keyOf(store.current())===this.designKey){this.setData({ready:true});wx.canvasToTempFilePath({canvasId:'shareCard',x:0,y:0,width:w,height:w*4/5,destWidth:w*2,destHeight:Math.round(w*8/5),success:r=>this.setData({shareImage:r.tempFilePath})},this)}})
 },
 saveCard(){if(!this.data.ready||this.data.saveBusy)return;this.setData({saveBusy:true,error:''});wx.canvasToTempFilePath({canvasId:'shareCard',destWidth:this.data.width*2,destHeight:this.data.height*2,success:r=>wx.saveImageToPhotosAlbum({filePath:r.tempFilePath,success:()=>wx.showToast({title:'已保存到相册'}),fail:e=>this.setData({albumDenied:/auth|authorize|deny/i.test(e.errMsg||''),error:'保存失败，请稍后重试。'}),complete:()=>this.setData({saveBusy:false})}),fail:()=>this.setData({saveBusy:false,error:'图片生成失败，请重试。'})},this)},
 openAlbumSettings(){wx.openSetting({})},
 more(){if(!this.data.shareId)return wx.showToast({title:'请先准备分享',icon:'none'});wx.showActionSheet({itemList:['看看朋友打开是什么样'],success:r=>{if(r.tapIndex===0)wx.navigateTo({url:'/features/shared/shared?id='+encodeURIComponent(this.data.shareId)})}})},
 loadCode(id){const base=getApp().globalData.apiBase;if(!base)return;wx.downloadFile({url:base+'/api/shares/'+encodeURIComponent(id)+'/qrcode',success:r=>{if(r.statusCode===200){this.setData({qrPath:r.tempFilePath,qrFallback:false},()=>this.renderCard())}else this.setData({qrPath:'',qrFallback:true},()=>this.renderCard())},fail:()=>this.setData({qrPath:'',qrFallback:true},()=>this.renderCard())})},
 prepareShare(){const d=this.data.design;if(!d||this.data.shareBusy)return;const key=keyOf(d);this.setData({shareBusy:true,shareError:''});auth.authorized('/shares',{name:d.name||'我的手串',wrist:d.wrist,beads:d.beads.slice(),meaning:this.data.meaning}).then(r=>{if(keyOf(store.current())!==key)return this.setData({shareError:'设计已更改，请重新准备分享。'});if(!r.shareId)throw new Error('未生成分享链接');this.shareKey=key;this.setData({shareId:r.shareId},()=>this.loadCode(r.shareId))}).catch(e=>this.setData({shareError:'分享准备失败：'+(e.message||'请稍后重试')})).finally(()=>this.setData({shareBusy:false}))},
 onShareAppMessage(){if(!this.data.shareId||keyOf(store.current())!==this.shareKey)return {title:'珠养养',path:'/pages/home/home'};return {title:`看看我串的‘${this.data.design.name||'我的手串'}’`,path:'/features/shared/shared?id='+encodeURIComponent(this.data.shareId),imageUrl:this.data.shareImage||undefined}},
 preview(){this.setData({preview:true})},
 closePreview(){this.setData({preview:false},()=>this.renderCard())},
 use(){const d=this.data.design;if(!d)return;store.save(d);const next=store.create();next.name=d.name;next.wrist=d.wrist;next.beads=d.beads.slice();store.selected(next);require('../../utils/nav').openWorkbench(next)},
 buySame(){if(this.data.missing)return wx.showToast({title:'请先替换下架材料',icon:'none'});const original=this.data.design;const next={...store.create(),name:original.name,wrist:original.wrist,beads:original.beads.slice(),meaning:original.meaning,source:'shared'};store.selected(next);wx.navigateTo({url:'/pages/order/order'})},
 order(){if(this.data.missing)return wx.showToast({title:'请先替换下架材料',icon:'none'});wx.navigateTo({url:'/pages/order/order'})}
})
