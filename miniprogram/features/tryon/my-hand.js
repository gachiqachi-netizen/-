// Empirical circumference-to-visible-width estimate; it is not a measurement.
const WRIST_WIDTH_FACTOR=1.15;
const MIN_CONFIDENCE=.8;
function defaultEllipse(width,height,wristCm=15){
 const wristWidthPx=width*.30;
 return {cx:width*.5,cy:height*.68,rx:wristWidthPx*.62,ry:wristWidthPx*.34,
  angle:-45,wristWidthPx,wristWidthMm:wristCm*10/Math.PI*WRIST_WIDTH_FACTOR};
}
function poseFromPredictions(predictions,fw,fh,width,height,wristCm,wristEllipse){
 const first=predictions&&predictions[0];
 if(!first||!(first.handInViewConfidence>=MIN_CONFIDENCE))return null;
 const pose=wristEllipse(first.landmarks,fw,fh,width,height);
 return pose?{...pose,wristWidthMm:wristCm*10/Math.PI*WRIST_WIDTH_FACTOR}:null;
}
function canvasNode(page,id){return new Promise((resolve,reject)=>page.createSelectorQuery().select(id).fields({node:true}).exec(r=>r&&r[0]&&r[0].node?resolve(r[0].node):reject(new Error('识别画布创建失败'))));}
function loadImage(canvas,path){return new Promise((resolve,reject)=>{const image=canvas.createImage();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('照片无法读取'));image.src=path;});}
async function recognizePhoto(page,path,displayWidth,displayHeight,wristCm,onProgress){
 // ar-hand is another subpackage: WeChat must load its modules asynchronously.
 const [runtime,modelCache,geometry]=await Promise.all([
  require.async('../../ar-hand/runtime'),
  require.async('../../ar-hand/model-cache'),
  require.async('../../ar-hand/geometry')]);
 const {createTracker}=runtime,{resolveModelConfig}=modelCache;
 const canvas=await canvasNode(page,'#myHandPixels');
 const inferenceCanvas=await canvasNode(page,'#myHandCompute');
 const image=await loadImage(canvas,path);
 // Bound inference memory while preserving the entire photo and its aspect ratio.
 const scale=Math.min(1,768/Math.max(image.width,image.height));
 const width=Math.max(1,Math.round(image.width*scale)),height=Math.max(1,Math.round(image.height*scale));
 canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,width,height);
 const pixels=ctx.getImageData(0,0,width,height);
 const env=wx.getAccountInfoSync?wx.getAccountInfoSync().miniProgram.envVersion:'develop';
 const config=resolveModelConfig(getApp().globalData||{},env);
 const control={};page._myHandModelControl=control;
 let tracker;
 try{
  const loading=createTracker(inferenceCanvas,{config,control,onProgress});
  tracker=await loading;
  if(page._myHandClosed)return null;
  const predictions=await tracker.estimate({width,height,data:pixels.data});
  return poseFromPredictions(predictions,width,height,displayWidth,displayHeight,wristCm,geometry.wristEllipse);
 }finally{
  if(tracker)tracker.dispose();
  if(page._myHandModelControl===control)page._myHandModelControl=null;
 }
}
module.exports={WRIST_WIDTH_FACTOR,defaultEllipse,poseFromPredictions,recognizePhoto};
