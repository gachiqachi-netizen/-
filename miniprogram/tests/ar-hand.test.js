const test=require('node:test'),assert=require('node:assert/strict');
const {placement}=require('../ar-hand/geometry');
function hand(){const p=Array.from({length:21},()=>[100,100,0]);p[0]=[100,160,0];p[5]=[70,100,0];p[17]=[130,100,0];return p}
test('wrist placement uses wrist landmark, not bottommost fingertip',()=>{const p=hand();p[8]=[50,230,0];const r=placement(p,200,300,400,600);assert.equal(r.x,200);assert.equal(r.y,339.2);assert.equal(r.angle,-90)});
test('cover crop matches camera frame and preserves aspect ratio',()=>{const r=placement(hand(),200,300,300,300);assert.equal(r.x,150);assert.equal(r.y,179.39999999999998);assert.equal(r.size,34.5)});
test('missing or malformed hand cannot leave a phantom bracelet',()=>{assert.equal(placement([],200,300,300,300),null);const p=hand();p[0][0]=NaN;assert.equal(placement(p,200,300,300,300),null)});

test('rotation smoothing crosses angle boundary without flipping',()=>{const {smooth}=require('../ar-hand/geometry');const r=smooth({x:10,y:10,size:20,angle:179},{x:12,y:12,size:22,angle:-179});assert.ok(r.angle>179&&r.angle<182);assert.ok(r.size>20&&r.size<22)});
