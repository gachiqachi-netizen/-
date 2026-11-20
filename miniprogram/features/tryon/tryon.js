const { queue: toast } = require('../../utils/toast')
const api = require('../../utils/api')
const store = require('../../utils/design')
const logic = require('../../pages/diy/logic')
const { pickTryonDesign } = require('./selection')
const braceletStyle = require('../../components/bracelet/style')
const { photoLayout } = require('./photo-layout')
const { validateHands } = require('../../utils/wrist-ring')
const {recognizePhoto,defaultEllipse}=require('./my-hand')
const SKINS = ['#e9c2a6','#d7ad91','#b98462','#80543d']
Page({
  data: { showDesigns:false, showModes:false, designName:'', designChoices:[], aligned:false, fromOrder:false, mode:'hand', hands:[], selectedHand:null, spin:0, handReady:false, handError:'', photo:'', myHand:null, recognizing:false, modelProgress:0, recognitionHint:'', width:320, height:400, size:42, angle:0, flatten:28, hideBack:false, photoFallback:false, photoReady:false, xpos:0, ypos:0, saving:false, error:'', skin:SKINS[1], skins:SKINS, catalog:[], beads:[], wrist:15, length:'--', fit:'', price:'--', missing:0, modelError:false },
  onUnload(){this._myHandClosed=true;this._photoRequest=(this._photoRequest||0)+1;if(this._myHandModelControl)this._myHandModelControl.cancel()},
  onLoad(options={}) {
    const current=store.current(), saved=store.list().filter(d=>d.beads&&d.beads.length)
    const width=Math.max(200,wx.getSystemInfoSync().windowWidth)
    this.x=width/2;this.y=width*.7
    this.setData({width,height:Math.round(width*1.25),xpos:this.x,ypos:this.y,fromOrder:options.from==='order'})
    this.loadHands()
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
      // The real model hand is the public entry; legacy modes remain in code.
    }).catch(()=>this.setData({error:'材料信息暂不可用，请稍后重试'}))
  },
  loadHands(){
    const base=getApp().globalData.modelBase
    const fallback=()=>this.setData({mode:'photo',hands:[],selectedHand:null,handReady:false,handError:''})
    if(!base)return fallback()
    this.setData({handError:''})
    wx.request({url:base+'/tryon-hands/v1/hands.json',success:r=>{
      try {if(r.statusCode!==200)throw new Error('not found')
        const hands=validateHands(r.data).map(hand=>{
          const absolute=src=>/^https?:\/\//.test(src)?src:src.startsWith('/models/')?base.replace(/\/models$/,'')+src:base+'/tryon-hands/v1/'+src
          return {...hand,photo:absolute(hand.photo),cutout:absolute(hand.cutout),thumb:hand.thumb?absolute(hand.thumb):''}
        })
        this.setData({mode:'hand',hands,selectedHand:hands[0],handReady:false})
      }catch(_){fallback()}
    },fail:fallback})
  },
  selectHand(e){const hand=this.data.hands[e.currentTarget.dataset.index];if(hand)this.setData({selectedHand:hand,handReady:false,spin:0})},
  spinHand(e){this.setData({spin:this.data.spin+e.detail.delta})},
  handRendered(){if(!this.data.handReady)this.setData({handReady:true})},
  handUnavailable(){this.setData({mode:'photo',handError:'',selectedHand:null,handReady:false})},
  comingSoon(){this.setData({mode:'photo',aligned:false});},
  useDesign(design){
    this.design=design;store.selected(design)
    const stats=logic.stats(design.beads,this.catalogData.beads||[],design.wrist||15)
    this.catalog=stats.map
    this.setData({handBeads:design.beads.map(id=>{const b=stats.map[id]||{};const photo=b.photoMd||b.photo||'';const base=getApp().globalData.apiBase||'';return {...b,mm:Number(b.mm)||8,photo:photo&&photo[0]==='/'?base+photo:photo}}),designName:design.name||'我的手串',beads:design.beads,wrist:design.wrist||15,missing:stats.missing,length:stats.missing?'--':(stats.length/10).toFixed(1),fit:stats.fit,price:stats.missing?'--':(stats.price+15).toFixed(2),error:''},()=>{if(this.data.photo&&this.data.photoFallback)this.draw()})
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
    if(!this.design)return toast.show({ text: '请先设计手串' })
    if(e&&e.currentTarget&&e.currentTarget.dataset.source==='camera')return this.setData({cameraOpen:true})
    wx.chooseMedia({count:1,mediaType:['image'],sourceType:e&&e.currentTarget&&e.currentTarget.dataset.source?[e.currentTarget.dataset.source]:['camera','album'],success:r=>{
      const f=r.tempFiles&&r.tempFiles[0];if(!f)return
      this.acceptPhoto(f.tempFilePath)
    },fail:err=>{if(err&&err.errMsg&&!/cancel/i.test(err.errMsg))this.setData({error:'无法打开相机或相册，请检查权限。'})}})
  },
  closeCamera(){this.setData({cameraOpen:false})},
  takePhoto(){wx.createCameraContext().takePhoto({quality:'high',success:r=>{this.setData({cameraOpen:false});this.acceptPhoto(r.tempImagePath)},fail:()=>this.setData({error:'拍照失败，请重试。'})})},
  acceptPhoto(path){
      wx.getImageInfo({src:path,success:info=>{
        if(!info.width||!info.height)return this.setData({error:'照片无法读取，请重新选择。'})
        this.imageInfo=info
        const windowInfo=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()
        const {width,height,x,y,size,flatten}=photoLayout(info.width,info.height,windowInfo.windowWidth,windowInfo.windowHeight)
        this.x=x;this.y=y
        const request=this._photoRequest=(this._photoRequest||0)+1
        if(this._myHandModelControl)this._myHandModelControl.cancel()
        this.setData({photo:path,width,height,size,flatten,xpos:this.x,ypos:this.y,photoReady:false,photoFallback:false,aligned:false,error:'',recognitionHint:'',recognizing:true,modelProgress:0,myHand:null},async()=>{
          try{
            const pose=await recognizePhoto(this,path,width,height,this.data.wrist,percent=>{if(request===this._photoRequest)this.setData({modelProgress:percent})})
            if(request!==this._photoRequest||this._myHandClosed)return
            this.setData({myHand:{...(pose||defaultEllipse(width,height,this.data.wrist)),photo:path},recognizing:false,
              recognitionHint:pose?'':'没认出手腕，拖一下对准'})
          }catch(err){if(request!==this._photoRequest||this._myHandClosed)return;this.setData({myHand:{...defaultEllipse(width,height,this.data.wrist),photo:path},recognizing:false,recognitionHint:'没认出手腕，拖一下对准'})}
        })
      },fail:()=>this.setData({error:'照片无法读取，请重新选择。'})})
  },
  touchStart(e){const t=e.touches[0];if(t)this.touch={x:t.x,y:t.y}},
  touchMove(e){const t=e.touches[0];if(!t||!this.touch)return;this.x=Math.max(0,Math.min(this.data.width,this.x+t.x-this.touch.x));this.y=Math.max(0,Math.min(this.data.height,this.y+t.y-this.touch.y));this.touch={x:t.x,y:t.y};this.draw()},
  touchEnd(){this.touch=null;this.align()},
  align(){if(!this.data.photo||this.data.aligned)return;this.setData({aligned:true});if(wx.vibrateShort)wx.vibrateShort({type:'light'})},
  photoMove(e){const dx=Number(e.detail.dx)||0,dy=Number(e.detail.dy)||0;this.x=Math.max(0,Math.min(this.data.width,this.x+dx));this.y=Math.max(0,Math.min(this.data.height,this.y+dy));this.setData({xpos:this.x,ypos:this.y});this.align()},
  photoScale(e){const ratio=Number(e.detail.ratio)||1;this.setData({size:Math.max(8,Math.min(95,this.data.size*ratio))});this.align()},
  photoUnavailable(){this.setData({photoFallback:true,photoReady:false},()=>this.draw())},
  photoLoaded(){if(!this.data.photoReady)this.setData({photoReady:true})},
  myHandMove(e){const h=this.data.myHand;if(!h)return;this.setData({myHand:{...h,cx:Math.max(0,Math.min(this.data.width,h.cx+e.detail.dx)),cy:Math.max(0,Math.min(this.data.height,h.cy+e.detail.dy))},aligned:true})},
  myHandTransform(e){const h=this.data.myHand;if(!h)return;const ratio=Math.max(.5,Math.min(2,e.detail.ratio||1));this.setData({myHand:{...h,rx:h.rx*ratio,ry:h.ry*ratio,angle:h.angle+(e.detail.angle||0)},aligned:true})},
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
    const ctx=wx.createCanvasContext('tryonCanvas',this);ctx.drawImage(this.data.photo,(w-iw)/2,(h-ih)/2,iw,ih)
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(angle*Math.PI/180)
    const beads=this.design.beads, map=this.catalog||{}, sizes=beads.map(id=>Math.max(1,Number((map[id]||{}).mm)||8)), total=sizes.reduce((a,b)=>a+b,0)
    const rx=w*size/200, ry=rx*Math.cos(flatten*Math.PI/180);let a=-Math.PI/2
    beads.forEach((id,i)=>{
      const step=Math.PI*2*sizes[i]/total, mid=a+step/2;a+=step
      // This is a manual approximation, not arm segmentation.
      if(hideBack&&Math.sin(mid)<0)return
      const item=map[id]||{},radius=Math.max(2.5,Math.min(12,rx*Math.PI*sizes[i]/total*.95)),x=rx*Math.cos(mid),y=ry*Math.sin(mid)
      const mat=item.mat==='metal'?'metal':/^(crystal|amber|glass)$/.test(item.mat)?'translucent':'matte'
      const style={...braceletStyle.regular,...braceletStyle.materials[mat]}
      ctx.save();ctx.setShadow(2,3,8,'rgba(0,0,0,.3)')
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.setFillStyle((item.c||[])[0]||braceletStyle.fallbackColors[0]);ctx.fill();ctx.restore()
      ctx.beginPath();ctx.arc(x-radius*style.highlightX/100,y-radius*style.highlightY/100,Math.max(1,radius*style.highlightStop/100),0,Math.PI*2);ctx.setFillStyle('rgba(255,255,255,'+style.highlightAlpha+')');ctx.fill()
    })
    ctx.restore();ctx.draw(false,()=>{if(!this.data.photoReady)this.setData({photoReady:true});if(done)done()})
  },
  watermark(ctx,w,h){ctx.setFillStyle('#111111');ctx.setTextAlign('right');ctx.setFontSize(13);ctx.fillText('珠养养',w-14,h-25);ctx.setFontSize(7);ctx.fillText('ZHU YANG YANG',w-14,h-12)},
  saveImage(){
    if(this.data.mode==='photo'&&this.data.myHand){
      const layer=this.selectComponent('#myHandTryon');if(!layer||this.data.saving)return
      this.setData({saving:true});return layer.exportImage((err,path)=>{
        if(err)return this.setData({saving:false,error:'图片生成失败，请重试。'})
        wx.saveImageToPhotosAlbum({filePath:path,success:()=>toast.show({text:'已保存到相册'}),fail:()=>this.setData({error:'没有相册权限，请去设置后重试'}),complete:()=>this.setData({saving:false})})
      })
    }
    if(this.data.mode==='hand'){
      if(this.data.saving||!this.data.handReady)return
      const layer=this.selectComponent('#wristTryon');if(!layer)return
      this.setData({saving:true});return layer.exportImage((err,path)=>{
        if(err)return this.setData({saving:false,error:'图片生成失败，请重试。'})
        wx.saveImageToPhotosAlbum({filePath:path,success:()=>toast.show({text:'已保存到相册'}),fail:()=>this.setData({error:'没有相册权限，请去设置后重试'}),complete:()=>this.setData({saving:false})})
      })
    }
    if(this.data.saving||!this.data.photo||this.data.mode!=='photo'||!this.data.photoReady)return
    this.setData({saving:true,error:''});const save=id=>wx.canvasToTempFilePath({canvasId:id,destWidth:Math.round(this.data.width*Math.min(2,(wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()).pixelRatio||1)),destHeight:Math.round(this.data.height*Math.min(2,(wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync()).pixelRatio||1)),success:r=>wx.saveImageToPhotosAlbum({filePath:r.tempFilePath,success:()=>toast.show({ text: '已保存到相册' }),fail:()=>this.setData({error:'没有相册权限，请去设置后重试'}),complete:()=>this.setData({saving:false})}),fail:()=>this.setData({saving:false,error:'图片生成失败，请重试。'})},this)
    if(this.data.photoFallback)return this.draw(()=>{const w=this.data.width,h=this.data.height,ctx=wx.createCanvasContext('tryonCanvas',this);this.watermark(ctx,w,h);ctx.draw(true,()=>save('tryonCanvas'))})
    const layer=this.selectComponent('#photo3d');if(!layer)return this.setData({saving:false,error:'3D 预览尚未准备好，请重试。'})
    layer.exportImage((err,path)=>{if(err)return this.setData({saving:false,error:err.message});const w=this.data.width,h=this.data.height,img=this.imageInfo,k=Math.min(w/img.width,h/img.height),iw=img.width*k,ih=img.height*k,ctx=wx.createCanvasContext('composeCanvas',this);ctx.drawImage(this.data.photo,(w-iw)/2,(h-ih)/2,iw,ih);ctx.drawImage(path,0,0,w,h);this.watermark(ctx,w,h);ctx.draw(false,()=>save('composeCanvas'))})
  },
  openAR(){wx.navigateTo({url:'/ar-hand/index',fail:()=>this.setData({error:'AR 页面暂时无法打开，可以用照片试戴'})})},
  openSettings(){wx.openSetting&&wx.openSetting({})},
  order(){if(this.data.missing)return toast.show({ text: '请先替换下架材料' });require('../../utils/nav').openOrder()},
  privacyRejected(){this.setData({error:'未授权照片或相机权限。你仍可使用 3D 模型手预览。',mode:'model'})}
})
