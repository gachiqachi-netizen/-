const test=require('node:test'),assert=require('node:assert/strict')
const {photoLayout}=require('../features/tryon/photo-layout')
test('wide photo fills the viewport width at its original aspect ratio',()=>{
 const p=photoLayout(1200,800,390,844)
 assert.equal(p.width,390);assert.equal(p.height,260)
 assert.equal(p.size,42);assert.equal(p.y,260*.68)
})
test('tall photo stays within 65 percent of viewport height',()=>{
 const p=photoLayout(800,1600,390,844)
 assert.ok(p.height<=Math.round(844*.65))
 assert.ok(Math.abs(p.width/p.height-.5)<.01)
 assert.equal(p.flatten,28)
})
