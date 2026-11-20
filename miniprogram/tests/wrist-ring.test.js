const test = require('node:test')
const assert = require('node:assert/strict')
const {wristRing,validateHands} = require('../utils/wrist-ring')
const hand={cx:375,cy:480,rx:170,ry:55,angle:0,wristWidthPx:300,wristWidthMm:60}
test('real scale, front/back and one full spin',()=>{
  const beads=Array.from({length:21},()=>({mm:8,photo:'/photo.png'}))
  const points=wristRing(hand,beads),round=wristRing(hand,beads,Math.PI*2)
  assert.equal(points.length,21)
  assert(points.some(p=>p.front)&&points.some(p=>!p.front))
  points.forEach((p,i)=>{assert(Math.abs(p.x-round[i].x)<.00001);assert(Math.abs(p.y-round[i].y)<.00001);assert(Math.abs(p.size-(p.front?40:34))<6)})
  const front={...hand,ry:hand.rx};const one=wristRing(front,[{mm:8},{mm:8}])
  assert(Math.abs(one[0].size-40)<.1)
})
test('diameters determine circumference and bead centers',()=>{
  const small=wristRing(hand,Array.from({length:21},()=>({mm:8})))
  const large=wristRing(hand,Array.from({length:21},()=>({mm:10})))
  assert(Math.abs(large[0].x-hand.cx)>Math.abs(small[0].x-hand.cx))
  assert.notDeepEqual(wristRing(hand,[{mm:8},{mm:12},{mm:8}]).map(p=>p.x),wristRing(hand,[{mm:8},{mm:8},{mm:8}]).map(p=>p.x))
})
test('3D circle size and bead spacing use circular arc length',()=>{
  const photographed={...hand,cx:0,cy:0,rx:94.5,ry:39.7,wristWidthPx:189,wristWidthMm:48}
  const beads=Array.from({length:21},()=>({mm:8}))
  const points=wristRing(photographed,beads)
  const expectedRx=168*(189/48)/(2*Math.PI)
  const phase=i=>(i+.5)*2*Math.PI/21
  assert(Math.abs(points[0].x/Math.cos(phase(0))-expectedRx)<.00001)
  assert(Math.abs(points[0].y/Math.sin(phase(0))-expectedRx*(39.7/94.5))<.00001)
  for(let i=0;i<20;i++){
    const a=Math.atan2(points[i].y/(expectedRx*39.7/94.5),points[i].x/expectedRx)
    const b=Math.atan2(points[i+1].y/(expectedRx*39.7/94.5),points[i+1].x/expectedRx)
    const delta=(b-a+2*Math.PI)%(2*Math.PI)
    assert(Math.abs(delta-8/168*2*Math.PI)<.00001)
  }
  const round=wristRing(photographed,beads,2*Math.PI)
  points.forEach((p,i)=>{assert(Math.abs(p.x-round[i].x)<.00001);assert(Math.abs(p.y-round[i].y)<.00001)})
})
test('missing model hand field is rejected',()=>{
  assert.throws(()=>validateHands([{id:'a',label:'手',photo:'a',cutout:'b',cx:1}]))
})
test('hidden legacy entries',()=>{
  const wxml=require('node:fs').readFileSync(require('node:path').join(__dirname,'../features/tryon/tryon.wxml'),'utf8')
  assert(!wxml.includes('data-mode="ar"'));assert(!wxml.includes('data-mode="model"'))
})
