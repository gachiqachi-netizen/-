import * as tf from '@tensorflow/tfjs-core';
import * as webgl from '@tensorflow/tfjs-backend-webgl';
import * as handpose from './vendor/handpose';
import {setupWechatPlatform} from './vendor/wechat_platform';

import {createModelLoader} from '../../miniprogram/ar-hand/model-cache';

let backendOwner = null;

export async function createTracker(canvas, options) {
 const owner = {}; let cancelled = false;
 const checkCancelled = () => { if(cancelled) throw new Error('模型加载已取消'); };
 const removeOwnedBackend = () => { if(backendOwner===owner){tf.removeBackend('wechat-webgl');backendOwner=null;} };
 const loader=createModelLoader(wx,options.config,options.onProgress);
 if(options.control)options.control.cancel=()=>{cancelled=true;loader.cancel();};
 await loader.prepare();
 checkCancelled();
 // Page-owned canvas: a global offscreen canvas may be invalid after navigation.
 if(tf.findBackend('wechat-webgl'))tf.removeBackend('wechat-webgl');
 backendOwner=owner;
 let model;
 try {
  setupWechatPlatform({tf,webgl,canvas,fetchFunc:loader.fetch});
  await tf.setBackend('wechat-webgl');checkCancelled();
  await tf.ready();checkCancelled();
  model=await handpose.load({maxContinuousChecks:8,detectionConfidence:0.8});
 } catch(error){loader.cancel();removeOwnedBackend();throw error;}
 let disposed=false;
 const tracker = {
  diagnostics(){return {confidence:(model as any).pipeline.lastConfidence,backend:tf.getBackend(),tensors:tf.memory().numTensors}},
  async estimate(frame){if(disposed)return [];return model.estimateHands({width:frame.width,height:frame.height,data:new Uint8Array(frame.data)},false)},
  dispose(){if(disposed)return;disposed=true;const pipeline=(model as any).pipeline;
   const detector=pipeline.boundingBoxDetector;
   pipeline.meshDetector.dispose();detector.model.dispose();
   detector.anchorsTensor.dispose();detector.inputSizeTensor.dispose();detector.doubleInputSizeTensor.dispose();
   removeOwnedBackend();
  }
 };
 if(cancelled){tracker.dispose();throw new Error('模型加载已取消');}
 return tracker;
}
