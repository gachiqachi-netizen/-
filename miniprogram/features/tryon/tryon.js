const api = require('../../utils/api')
const store = require('../../utils/design')
const logic = require('../../pages/diy/logic')
const { pickTryonDesign } = require('./selection')
const SKINS = ['#e9c2a6','#d7ad91','#b98462','#80543d']
Page({
  data: { showDesigns:false, showModes:false, designName:'', designChoices:[], aligned:false, fromOrder:false, mode:'photo', photo:'', width:320, height:400, size:38, angle:0, flatten:45, hideBack:false, photoFallback:false, photoReady:false, xpos:0, ypos:0, saving:false, error:'', skin:SKINS[1], skins:SKINS, catalog:[], beads:[], wrist:15, length:'--', fit:'', price:'--', missing:0, modelError:false },
  onLoad(options={}) {
    const current=store.current(), saved=store.list().filter(d=>d.beads&&d.beads.length)
    const width=Math.max(200,Math.min(430,wx.getSystemInfoSync().windowWidth-32))
    this.x=width/2;this.y=width*.625
    this.setData({width,height:Math.round(width*1.25),xpos:this.x,ypos:this.y,fromOrder:options.from==='order'})
    api.catalog().then(c=>{
      this.catalogData=c
      const catalog=c.beads||[]
      const templates=require('../../utils/template')
      const popular=(c.templates||[]).map(t=>({...t,beads:templates.build(t,catalog,15)})).filter(t=>t.beads&&t.beads.length)
      this.choices=[...saved.map(d=>({...d,group:'我的作品'})),...popular.map(t=>({...t,group:'热门款'}))]
      this.setData({catalog,designChoices:this.choices.map((d,i)=>({index:i,name:d.name,group:d.group}))})
      const design=pickTryonDesign(current,saved,popular)
      if(design)this.useDesign(design)
      else this.setData({error:'暂时没有可试戴的手串'})
      if(this.design)this.startBestMode()
    }).catch(()=>this.setData({error:'材料信息暂不可用，请稍后重试'}))
  },
  useDesign(design){
    this.design=design;store.selected(design)
    const stats=logic.stats(design.beads,this.catalogData.beads||[],design.wrist||15)
    this.catalog=stats.map
    this.setData({designName:design.name||'我的手串',beads:design.beads,wrist:design.wrist||15,missing:stats.missing,length:stats.missing?'--':(stats.length/10).toFixed(1),fit:stats.fit,price:stats.missing?'--':(stats.price+15).toFixed(2),error:''},()=>{if(this.data.photo&&this.data.photoFallback)this.draw()})
  },
  startBestMode(){
    if(wx.canIUse&&wx.canIUse('createVKSession'))this.openAR()
    else this.choose()
  },
  openDesigns(){this.setData({showDesigns:true})},
  closeDesigns(){this.setData({showDesigns:false})},
  selectDesign(e){const d=this.choices[e.currentTarget.dataset.index];if(!d)return;this.useDesign(d);this.closeDesigns()},
  openModes(){this.setData({showModes:true})},
  closeModes(){this.setData({showModes:false})},
  selectMode(e){const mode=e.currentTarget.dataset.mode;this.closeModes();if(mode==='ar')return this.openAR();if(mode==='photo'){this.setData({mode:'photo'});return this.choose()}this.setData({mode:'model',aligned:false})},
  toggle(e){const mode=e.currentTarget.dataset.mode;if(mode===this.data.mode)return;this.setData({mode},()=>{if(mode==='photo'&&this.data.photo)this.draw()})},
  saveOrChoose(){if(this.data.aligned)this.saveImage();else this.choose()},
  choose(e) {
    if(!this.design)return wx.showToast({title:'请先设计手串',icon:'none'})
    wx.chooseMedia({count:1,mediaType:['image'],sourceType:e&&e.currentTarget&&e.currentTarget.dataset.source?[e.currentTarget.dataset.source]:['camera','album'],success:r=>{
      const f=r.tempFiles&&r.tempFiles[0];if(!f)return
      wx.getImageInfo({src:f.tempFilePath,success:info=>{
        if(!info.width||!info.height)return this.setData({error:'照片无法读取，请重新选择。'})
        this.imageInfo=info
        const windowInfo=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()
        const maxWidth=Math.max(1,Math.min(430,windowInfo.windowWidth-32))
        const maxHeight=Math.max(160,Math.min(360,Math.round(windowInfo.windowHeight*.38)))
        const scale=Math.min(maxWidth/info.width,maxHeight/info.height)
        const width=Math.max(1,Math.round(info.width*scale)),height=Math.max(1,Math.round(info.height*scale))
        this.x=width/2;this.y=height/2
        this.setData({photo:f.tempFilePath,width,height,xpos:this.x,ypos:this.y,photoReady:false,photoFallback:false,aligned:false,error:''},()=>this.draw())
      },fail:()=>this.setData({error:'照片无法读取，请重新选择。'})})
    },fail:err=>{if(err&&err.errMsg&&!/cancel/i.test(err.errMsg))this.setData({error:'无法打开相机或相册，请检查权限。'})}})
  },
  touchStart(e){const t=e.touches[0];if(t)this.touch={x:t.x,y:t.y}},
  touchMove(e){const t=e.touches[0];if(!t||!this.touch)return;this.x=Math.max(0,Math.min(this.data.width,this.x+t.x-this.touch.x));this.y=Math.max(0,Math.min(this.data.height,this.y+t.y-this.touch.y));this.touch={x:t.x,y:t.y};this.draw()},
  touchEnd(){this.touch=null;this.align()},
  align(){if(!this.data.photo||this.data.aligned)return;this.setData({aligned:true});if(wx.vibrateShort)wx.vibrateShort({type:'light'})},
  photoMove(e){const dx=Number(e.detail.dx)||0,dy=Number(e.detail.dy)||0;this.x=Math.max(0,Math.min(this.data.width,this.x+dx));this.y=Math.max(0,Math.min(this.data.height,this.y+dy));this.setData({xpos:this.x,ypos:this.y});this.align()},
  photoScale(e){const ratio=Number(e.detail.ratio)||1;this.setData({size:Math.max(8,Math.min(95,this.data.size*ratio))});this.align()},
  photoUnavailable(){this.setData({photoFallback:true,photoReady:false},()=>this.draw())},
  photoLoaded(){if(!this.data.photoReady)this.setData({photoReady:true})},
  sizeChange(e){this.setData({size:Number(e.detail.value)});this.draw()},
  angleChange(e){this.setData({angle:Number(e.detail.value)});this.draw()},
  flattenChange(e){this.setData({flatten:Number(e.detail.value)});this.draw()},
  hideChange(e){this.setData({hideBack:!!e.detail.value});this.draw()},
  skinChange(e){this.setData({skin:e.currentTarget.dataset.skin})},
  modelUnavailable(){this.setData({modelError:true})},
  draw(done) {
    if(!this.data.photo||!this.imageInfo||!this.design||this.data.mode!=='photo'||!this.data.photoFallback)return
    const {width:w,height:h,size,angle,flatten,hideBack}=this.data, img=this.imageInfo
    // Fit the whole photo; letterboxing is preferable to silently cropping the user's wrist.
    const scale=Math.min(w/img.width,h/img.height),iw=img.width*scale,ih=img.height*scale
    const ctx=wx.createCanvasContext('tryonCanvas',this);ctx.setFillStyle('#f7f6f4');ctx.fillRect(0,0,w,h);ctx.drawImage(this.data.photo,(w-iw)/2,(h-ih)/2,iw,ih)
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(angle*Math.PI/180)
    const beads=this.design.beads, map=this.catalog||{}, sizes=beads.map(id=>Math.max(1,Number((map[id]||{}).mm)||8)), total=sizes.reduce((a,b)=>a+b,0)
    const rx=w*size/200, ry=rx*Math.cos(flatten*Math.PI/180);let a=-Math.PI/2
    beads.forEach((id,i)=>{
      const step=Math.PI*2*sizes[i]/total, mid=a+step/2;a+=step
      // This is a manual approximation, not arm segmentation.
      if(hideBack&&Math.sin(mid)<0)return
      const item=map[id]||{},radius=Math.max(2.5,Math.min(12,rx*Math.PI*sizes[i]/total*.95)),x=rx*Math.cos(mid),y=ry*Math.sin(mid)
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.setFillStyle((item.c||[])[0]||'#bcb6b1');ctx.fill();ctx.setStrokeStyle('rgba(30,30,30,.18)');ctx.setLineWidth(.7);ctx.stroke()
      ctx.beginPath();ctx.arc(x-radius*.27,y-radius*.3,Math.max(1,radius*.16),0,Math.PI*2);ctx.setFillStyle('rgba(255,255,255,.6)');ctx.fill()
    })
    ctx.restore();ctx.draw(false,()=>{if(!this.data.photoReady)this.setData({photoReady:true});if(done)done()})
  },
  watermark(ctx,w,h){ctx.setFillStyle('#111111');ctx.setTextAlign('right');ctx.setFontSize(13);ctx.fillText('珠养养',w-14,h-25);ctx.setFontSize(7);ctx.fillText('ZHU YANG YANG',w-14,h-12)},
  saveImage(){
    if(this.data.saving||!this.data.photo||this.data.mode!=='photo'||!this.data.photoReady)return
    this.setData({saving:true,error:''});const save=id=>wx.canvasToTempFilePath({canvasId:id,destWidth:Math.round(this.data.width*Math.min(2,(wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()).pixelRatio||1)),destHeight:Math.round(this.data.height*Math.min(2,(wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()).pixelRatio||1)),success:r=>wx.saveImageToPhotosAlbum({filePath:r.tempFilePath,success:()=>wx.showToast({title:'已保存到相册'}),fail:()=>this.setData({error:'没有相册权限，请去设置后重试'}),complete:()=>this.setData({saving:false})}),fail:()=>this.setData({saving:false,error:'图片生成失败，请重试。'})},this)
    if(this.data.photoFallback)return this.draw(()=>{const w=this.data.width,h=this.data.height,ctx=wx.createCanvasContext('tryonCanvas',this);this.watermark(ctx,w,h);ctx.draw(true,()=>save('tryonCanvas'))})
    const layer=this.selectComponent('#photo3d');if(!layer)return this.setData({saving:false,error:'3D 预览尚未准备好，请重试。'})
    layer.exportImage((err,path)=>{if(err)return this.setData({saving:false,error:err.message});const w=this.data.width,h=this.data.height,img=this.imageInfo,k=Math.min(w/img.width,h/img.height),iw=img.width*k,ih=img.height*k,ctx=wx.createCanvasContext('composeCanvas',this);ctx.setFillStyle('#f7f6f4');ctx.fillRect(0,0,w,h);ctx.drawImage(this.data.photo,(w-iw)/2,(h-ih)/2,iw,ih);ctx.drawImage(path,0,0,w,h);this.watermark(ctx,w,h);ctx.draw(false,()=>save('composeCanvas'))})
  },
  openAR(){wx.navigateTo({url:'/ar-hand/index',fail:()=>this.setData({error:'AR 页面暂时无法打开，可以用照片试戴'})})},
  openSettings(){wx.openSetting&&wx.openSetting({})},
  order(){if(this.data.missing)return wx.showToast({title:'请先替换下架材料',icon:'none'});require('../../utils/nav').openOrder()},
  privacyRejected(){this.setData({error:'未授权照片或相机权限。你仍可使用 3D 模型手预览。',mode:'model'})}
})
