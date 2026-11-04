import * as tf from '@tensorflow/tfjs-core';
import * as webgl from '@tensorflow/tfjs-backend-webgl';
import * as handpose from './vendor/handpose';
import {setupWechatPlatform} from './vendor/wechat_platform';

function fetchModel(url, options = {}) {
 return new Promise((resolve,reject)=>wx.request({url,method:'GET',timeout:60000,
  responseType:/\.json(?:\?|$)/.test(url)?'text':'arraybuffer',dataType:'text',
  success:r=>{if(r.statusCode!==200)return reject(new Error('模型下载 HTTP '+r.statusCode));
   resolve({ok:true,status:r.statusCode,json:async()=>typeof r.data==='string'?JSON.parse(r.data):r.data,
    arrayBuffer:async()=>r.data,text:async()=>r.data,headers:{get:k=>r.header[k]||r.header[k.toLowerCase()]}})},
  fail:e=>reject(new Error('模型下载失败：'+e.errMsg))
 }));
}
export async function createTracker(canvas) {
 // Page-owned canvas: a global offscreen canvas may be invalid after navigation.
 if(tf.findBackend('wechat-webgl'))tf.removeBackend('wechat-webgl');
 setupWechatPlatform({tf,webgl,canvas,fetchFunc:fetchModel});
 await tf.setBackend('wechat-webgl');await tf.ready();
 const model=await handpose.load({maxContinuousChecks:8,detectionConfidence:0.8});
 let disposed=false;
 return {
  diagnostics(){return {confidence:(model as any).pipeline.lastConfidence,backend:tf.getBackend(),tensors:tf.memory().numTensors}},
  async estimate(frame){if(disposed)return [];return model.estimateHands({width:frame.width,height:frame.height,data:new Uint8Array(frame.data)},false)},
  dispose(){if(disposed)return;disposed=true;const pipeline=(model as any).pipeline;
   const detector=pipeline.boundingBoxDetector;
   pipeline.meshDetector.dispose();detector.model.dispose();
   detector.anchorsTensor.dispose();detector.inputSizeTensor.dispose();detector.doubleInputSizeTensor.dispose();
   tf.removeBackend('wechat-webgl');
  }
 };
}
