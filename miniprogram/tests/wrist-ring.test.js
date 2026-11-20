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
test('missing model hand field is rejected',()=>{
  assert.throws(()=>validateHands([{id:'a',label:'手',photo:'a',cutout:'b',cx:1}]))
})
test('hidden legacy entries',()=>{
  const wxml=require('node:fs').readFileSync(require('node:path').join(__dirname,'../features/tryon/tryon.wxml'),'utf8')
  assert(!wxml.includes('data-mode="ar"'));assert(!wxml.includes('data-mode="model"'))
})
