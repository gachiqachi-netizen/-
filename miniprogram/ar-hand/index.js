const {createTracker}=require('./runtime');
const {placement,smooth}=require('./geometry');
const {resolveModelConfig}=require('./model-cache');
const store=require('../utils/design');
const api=require('../utils/api');
Page({
 data:{modelProgress:0,modelLoading:false,frozen:false,scalePercent:135,renderFailed:false,width:320,height:440,beads:[],catalog:[],cameraMounted:false,position:'back',tracked:false,status:'正在准备独立手部识别…',error:'',diag:'TFJS 独立识别 · 不使用微信视觉会话',x:160,y:220,size:30,angle:0,tilt:45},
 onLoad(){const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync(),d=store.current();this.setData({width:info.windowWidth-32,height:Math.min(520,Math.round(info.windowHeight*.60)),beads:d&&d.beads||[]});api.catalog().then(c=>{if(!this._closed)this.setData({catalog:c.beads||[]})}).catch(()=>this.fail('材料加载失败，请返回后重试'));},
 onReady(){this.initialize()},
 onShow(){this._hidden=false;if(this._tracker&&this._cameraReady)this.startFrames()},
 onHide(){this._hidden=true;this.stopFrames();this.setData({tracked:false})},
 onUnload(){this._closed=true;if(this._modelControl&&this._modelControl.cancel)this._modelControl.cancel();this.stopFrames();if(!this._busy)this.disposeTracker()},
 async initialize(){
  if(this._loading||this._closed)return;
  if(!this.data.beads.length){this.fail('请返回先选择一条手串');return}
  this._loading=true;this.setData({error:'',modelProgress:0,modelLoading:true,status:'正在加载手部模型…'});
  try {
   await new Promise((resolve,reject)=>wx.authorize({scope:'scope.camera',success:resolve,fail:()=>reject(new Error('请允许摄像头权限后重试'))}));
   const canvas=await new Promise((resolve,reject)=>this.createSelectorQuery().select('#compute').fields({node:true}).exec(r=>r&&r[0]&&r[0].node?resolve(r[0].node):reject(new Error('识别画布创建失败'))));
   const output=await new Promise((resolve,reject)=>this.createSelectorQuery().select('#picture').fields({node:true}).exec(r=>r&&r[0]&&r[0].node?resolve(r[0].node):reject(new Error('画面画布创建失败'))));
   this._output=output;this._ctx=output.getContext('2d');
   const env=wx.getAccountInfoSync?wx.getAccountInfoSync().miniProgram.envVersion:'develop';
   const config=resolveModelConfig(getApp().globalData||{},env);
   const control=this._modelControl={};
   const loading=createTracker(canvas,{config,control,onProgress:percent=>{if(!this._closed)this.setData({modelProgress:percent})}});
   loading.then(tracker=>{if(this._closed)tracker.dispose()},()=>{});
   this._tracker=await loading;
   if(this._closed){this.disposeTracker();return}
   if(!this.data.renderFailed)this.setData({cameraMounted:true,status:'模型已加载，正在打开相机…'});
  }catch(e){this.fail(e.message||e.errMsg||String(e))}finally{this._loading=false;if(!this._closed)this.setData({modelLoading:false})}
 },
 photoTryon(){if(this._modelControl&&this._modelControl.cancel)this._modelControl.cancel();this.stopFrames();wx.redirectTo({url:'/features/tryon/tryon'})},
 cameraReady(){this._cameraReady=true;this.setData({status:'相机已启动，等待视频帧…'});this.startFrames()},
 cameraError(e){this.fail('相机启动失败：'+((e.detail||{}).errMsg||'未知原因'))},
 startFrames(){if(this.data.renderFailed||this._listener||this._hidden||this._closed||!this._tracker)return;
  this._seenFrame=false;
  try{const context=wx.createCameraContext();this._listener=context.onCameraFrame(f=>this.processFrame(f));this._listener.start({fail:e=>this.fail('读取视频帧失败：'+e.errMsg)});
   clearTimeout(this._frameTimeout);this._frameTimeout=setTimeout(()=>{if(!this._seenFrame&&!this._hidden&&!this._closed)this.fail('相机已打开，但没有返回视频帧；请复制诊断信息')},10000);
  }catch(e){this.fail('视频帧接口不可用：'+e.message)}
 },
 async processFrame(frame){
  if(this.data.frozen||this.data.renderFailed||this._busy||this._closed||this._hidden||!this._tracker||Date.now()-(this._last||0)<100)return;
  this._seenFrame=true;clearTimeout(this._frameTimeout);this._busy=true;this._last=Date.now();
  const version=this._version||0,t=Date.now();
  try{
   if(frame.data.byteLength!==frame.width*frame.height*4)throw new Error('相机帧格式非 RGBA');
   const frozen={width:frame.width,height:frame.height,data:frame.data.slice(0)};
   const predictions=await this._tracker.estimate(frozen);
   if(this.data.frozen||this.data.renderFailed||this._closed||this._hidden||version!==(this._version||0))return;
   // Draw the exact inference frame to prevent camera/landmark crop or mirror mismatch.
   const out=this._output,ctx=this._ctx;
   if(out.width!==frame.width||out.height!==frame.height){out.width=frame.width;out.height=frame.height}
   const image=out.createImageData?out.createImageData(new Uint8ClampedArray(frozen.data),frame.width,frame.height):ctx.createImageData(frame.width,frame.height);
   image.data.set(new Uint8ClampedArray(frozen.data));ctx.putImageData(image,0,0);
   const s=Math.max(this.data.width/frame.width,this.data.height/frame.height);
   const first=predictions[0],rawPose=first&&first.handInViewConfidence>=.8?placement(first.landmarks,frame.width,frame.height,this.data.width,this.data.height):null;
   const outside=rawPose&&(rawPose.x<0||rawPose.x>this.data.width||rawPose.y<0||rawPose.y>this.data.height);
   let pose=null;
   if(outside)this._pose=null;
   if(rawPose&&!outside){this._pose=smooth(this._pose,rawPose);this._lastSeen=Date.now();pose=this._pose}
   else if(this._pose&&Date.now()-(this._lastSeen||0)<250)pose=this._pose;
   else this._pose=null;
   if(pose)pose={...pose,size:Math.min(95,pose.size*this.data.scalePercent/100)};
   this.setData({...pose,tracked:!!pose,pictureWidth:frame.width*s,pictureHeight:frame.height*s,
    status:pose?(pose.size<18?'手腕太远，请适当靠近镜头':'已识别手腕 · 可定格查看'):(outside?'请将手腕移到画面中央':'请将手背和手腕完整放入画面'),
    diag:'TFJS · '+frame.width+'×'+frame.height+' · 推理 '+(Date.now()-t)+' ms · '+predictions.length+' 只手'});
  }catch(e){this.fail('独立手部推理失败：'+(e.message||String(e)));this.stopFrames()}
  finally{this._busy=false;if(this._closed)this.disposeTracker()}
 },
 stopFrames(){clearTimeout(this._frameTimeout);if(this._listener){try{this._listener.stop()}catch(_){}this._listener=null}},
 disposeTracker(){if(this._tracker){try{this._tracker.dispose()}catch(_){}this._tracker=null}},
 setScale(e){const value=Number(e.detail.value);if(!Number.isFinite(value))return;this.setData({scalePercent:value,...(this._pose?{size:Math.min(95,this._pose.size*value/100)}:{})})},
 toggleFreeze(){if(this.data.frozen){this._pose=null;this.setData({frozen:false,tracked:false,status:'请将手背和手腕放入画面'});return}if(this.data.tracked)this.setData({frozen:true,status:'已定格 · 可以调节手串大小'})},
 switchCamera(){if(this._busy)return;this._pose=null;this.setData({frozen:false});this.stopFrames();this._version=(this._version||0)+1;this._cameraReady=false;this._seenFrame=false;this.setData({cameraMounted:false,tracked:false},()=>{if(!this._closed)this.setData({position:this.data.position==='back'?'front':'back',cameraMounted:true,status:'正在切换相机…'})})},
 retry(){if(this._busy||this._loading)return;if(this.data.renderFailed){wx.redirectTo({url:'/ar-hand/index'});return;}this.stopFrames();this._seenFrame=false;this._cameraReady=false;this.setData({cameraMounted:false,error:'',tracked:false},()=>{if(this._tracker)this.setData({cameraMounted:true,status:'正在重启相机…'});else this.initialize()})},
 fail(message){console.error('[AR-TFJS]',message);if(!this._closed)this.setData({error:message,status:'测试未通过',tracked:false})},
 overlayError(e){this._renderFailure=e&&e.detail||{};this.stopFrames();this.setData({renderFailed:true});this.fail('手串 3D 渲染失败（'+(this._renderFailure.stage||'unknown')+'）：'+(this._renderFailure.message||'未知错误'))},
 copyDiagnostic(){const d=wx.getDeviceInfo?wx.getDeviceInfo():wx.getSystemInfoSync();wx.setClipboardData({data:JSON.stringify({build:'tfjs-hand-03',scalePercent:this.data.scalePercent,render:this._renderFailure||null,platform:d.platform,model:d.model,system:d.system,status:this.data.status,diag:this.data.diag,error:this.data.error})})},
 privacyRejected(){this.stopFrames();this.setData({cameraMounted:false,error:'未授权摄像头。可以改用照片试戴。',status:'已取消实时试戴'})}
});
