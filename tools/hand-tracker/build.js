const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
esbuild.build({
 entryPoints:[path.join(__dirname,'runtime.ts')], outfile:path.resolve(__dirname,'../../miniprogram/ar-hand/runtime.js'),
 bundle:true, platform:'browser', format:'cjs', target:'es2018', minify:true, legalComments:'eof',
 plugins:[{name:'wechat-model-paths',setup(build){build.onLoad({filter:/\.ts$/},args=>{
 let contents=fs.readFileSync(args.path,'utf8');
 contents=contents.replace('https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1/anchors.json?tfjs-format=file','https://cdn.static.oppenlab.com/weblf/test/handpose/anchors.json')
 .replace('https://tfhub.dev/mediapipe/tfjs-model/handdetector/1/default/1','https://cdn.static.oppenlab.com/weblf/test/handdetector_1_default_1/model.json')
 .replace('https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1','https://cdn.static.oppenlab.com/weblf/test/handskeleton_1_default_1/model.json')
 .replace(/fromTFHub: true/g,'fromTFHub: false');
 return {contents,loader:'ts'};
 })}}]
}).catch(e=>{console.error(e);process.exit(1)});
