const test=require('node:test')
const assert=require('node:assert/strict')
const path=require('node:path')
const file=path.join(__dirname,'../components/wrist-tryon/index.js')
test('ten spin updates reuse each canvas image and merge draws per frame',async()=>{
  let definition,frames=[],loads=new Map(),draws=0
  global.Component=value=>{definition=value}
  global.wx={getWindowInfo:()=>({pixelRatio:1}),getImageInfo:({src,success})=>{
    loads.set(src,(loads.get(src)||0)+1);success({path:src})
  }}
  delete require.cache[require.resolve(file)];require(file)
  const ctx=new Proxy({setTransform(){},drawImage(){draws++}}, {get(target,key){return key in target?target[key]:()=>{}},set(target,key,value){target[key]=value;return true}})
  const canvas={width:0,height:0,getContext:()=>ctx,requestAnimationFrame:fn=>frames.push(fn),createImage:()=>{
    const image={width:750,height:1000};Object.defineProperty(image,'src',{set(){queueMicrotask(()=>image.onload())}});return image
  }}
  const instance={...definition.methods,readyCanvas:true,canvas,properties:{hand:{cx:375,cy:480,rx:170,ry:55,angle:0,wristWidthPx:300,wristWidthMm:60,thumb:'thumb.jpg',photo:'hand.jpg',cutout:'cutout.png'},beads:Array.from({length:21},()=>({mm:8,photo:'bead.png'})),spin:0,width:375,height:500},triggerEvent(){}}
  const flush=async()=>{while(frames.length){frames.shift()();await new Promise(resolve=>setTimeout(resolve,0))}}
  instance.render();await flush()
  assert(draws>0)
  for(let i=0;i<10;i++){instance.properties.spin=i;instance.render()}
  assert.equal(frames.length,1)
  await flush()
  assert.deepEqual(Object.fromEntries(loads),{'thumb.jpg':1,'hand.jpg':1,'cutout.png':1,'bead.png':1})
  delete global.Component;delete global.wx
})
