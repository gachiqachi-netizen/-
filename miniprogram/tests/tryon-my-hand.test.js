const test=require('node:test'),assert=require('node:assert/strict');
const {wristEllipse}=require('../ar-hand/geometry');
const {defaultEllipse,poseFromPredictions,WRIST_WIDTH_FACTOR}=require('../features/tryon/my-hand');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const points=()=>{const p=Array.from({length:21},()=>[100,100,0]);p[0]=[100,160,0];p[5]=[70,100,0];p[17]=[130,100,0];return p};
test('still photo landmarks produce center, angle and wrist width at fitted scale',()=>{
 const a=wristEllipse(points(),200,300,400,600);
 assert.equal(a.cx,200);assert.equal(a.cy,339.2);assert.equal(a.angle,-180);
 assert.equal(a.wristWidthPx,138);assert.equal(a.rx,138*.62);
 const b=wristEllipse(points(),200,300,300,300);
 assert.equal(b.wristWidthPx,69);assert.equal(b.cx,150);
 const rotated=points();rotated[5]=[130,130,0];rotated[17]=[130,190,0];
 assert.ok(Math.abs(wristEllipse(rotated,200,300,200,300).angle+90)<.001);
});
test('low confidence and no hand fall back to a usable guide position',()=>{
 assert.equal(poseFromPredictions([],200,300,400,600,15,wristEllipse),null);
 assert.equal(poseFromPredictions([{handInViewConfidence:.79,landmarks:points()}],200,300,400,600,15,wristEllipse),null);
 const fallback=defaultEllipse(400,600,15);assert.equal(fallback.cx,200);assert.ok(Math.abs(fallback.cy-408)<.001);
 const recognized=poseFromPredictions([{handInViewConfidence:.9,landmarks:points()}],200,300,400,600,15,wristEllipse);
 assert.equal(recognized.wristWidthMm,150/Math.PI*WRIST_WIDTH_FACTOR);
});
test('no-cutout mode hides rear beads in the wrist band but keeps side and front beads',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../components/wrist-tryon/index.js'),'utf8');
 const scope={Component(){},module:{exports:{}},require:name=>name==='../../utils/wrist-ring'?{wristRing(){}}:require(name)};vm.runInNewContext(source,scope);
 const {hiddenBehindWrist}=scope.module.exports,hand={cx:100,cy:100,angle:0,wristWidthPx:80};
 assert.equal(hiddenBehindWrist({x:110,y:100,front:false},hand),true);
 assert.equal(hiddenBehindWrist({x:160,y:100,front:false},hand),false);
 assert.equal(hiddenBehindWrist({x:110,y:100,front:true},hand),false);
});
