// Adapted from prototype.html's Three.js ring, materials and studio lighting.
// threejs-miniprogram is MIT-licensed and based on Three.js r108 (prototype: r128).
const { createScopedThreejs } = require('../../components/bracelet3d/vendor/three')
function colors(hex){const s=String(hex||'#bdb8b3').replace('#','');const v=/^[0-9a-f]{6}$/i.test(s)?s:'bdb8b3';return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16))}
function textureData(THREE,item){
  // Match the original H5 canvas textures; the fallback remains available on older runtimes.
  try {
    const cv=wx.createOffscreenCanvas({type:'2d',width:512,height:256}), x=cv.getContext('2d'), W=512,H=256
    const key=[item.id,item.mat,(item.c||[]).join(),item.texture||''].join('|'); let seed=7
    for(const ch of key)seed=(seed*31+ch.charCodeAt(0))%2147483647
    const r=()=>((seed=(seed*16807)%2147483647)/2147483647), a=(item.c||[])[0]||'#bdb8b3',b=(item.c||[])[1]||a
    const grad=x.createLinearGradient(0,0,0,H);grad.addColorStop(0,b);grad.addColorStop(.5,a);grad.addColorStop(1,b);x.fillStyle=item.mat==='crystal'||item.mat==='bodhi'?a:grad;x.fillRect(0,0,W,H)
    if(item.mat==='wood')for(let k=0;k<46;k++){x.strokeStyle=b;x.globalAlpha=.18+r()*.35;x.lineWidth=.8+r()*2.4;x.beginPath();const y0=r()*H,amp=3+r()*9,f=1+Math.floor(r()*3),ph=r()*6;for(let u=0;u<=W;u+=6){const y=y0+Math.sin(u/W*Math.PI*2*f+ph)*amp;u?x.lineTo(u,y):x.moveTo(u,y)}x.stroke()}
    else if(item.mat==='bodhi'){for(let k=0;k<1500;k++){x.fillStyle=b;x.globalAlpha=.55+r()*.45;x.beginPath();x.arc(r()*W,20+r()*(H-40),.8+r()*1.8,0,7);x.fill()}for(let k=0;k<3;k++){const cx=60+k*170+r()*40,cy=H/2+(r()-.5)*40;x.globalAlpha=.9;x.fillStyle=b;x.beginPath();x.arc(cx,cy,16,0,7);x.fill();x.fillStyle=a;x.beginPath();x.arc(cx,cy,10,0,7);x.fill()}}
    else if(item.mat==='stone'){for(let k=0;k<160;k++){const cx=r()*W,cy=r()*H,rr=8+r()*40,g=x.createRadialGradient(cx,cy,0,cx,cy,rr),c=r()>.5?a:b;g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=.25;x.fillStyle=g;x.fillRect(cx-rr,cy-rr,rr*2,rr*2)}x.globalAlpha=.18;x.strokeStyle='#ffffff';x.lineWidth=1;for(let k=0;k<6;k++){x.beginPath();x.moveTo(r()*W,r()*H);x.bezierCurveTo(r()*W,r()*H,r()*W,r()*H,r()*W,r()*H);x.stroke()}}
    else if(item.mat==='crystal'){const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,a);g.addColorStop(.5,b);g.addColorStop(1,a);x.globalAlpha=.5;x.fillStyle=g;x.fillRect(0,0,W,H);x.globalAlpha=.35;x.strokeStyle='#fff';for(let k=0;k<10;k++){x.lineWidth=.5+r();x.beginPath();x.moveTo(r()*W,r()*H);x.lineTo(r()*W,r()*H);x.stroke()}}
    else {const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(.5,b);g.addColorStop(1,a);x.fillStyle=g;x.fillRect(0,0,W,H)}
    const data=x.getImageData(0,0,W,H).data,tex=new THREE.DataTexture(new Uint8Array(data),W,H,THREE.RGBAFormat);tex.needsUpdate=true;tex.encoding=THREE.sRGBEncoding;return tex
  } catch (_) {
    const a=colors(item.c&&item.c[0]),data=new Uint8Array([a[0],a[1],a[2],255]);const tex=new THREE.DataTexture(data,1,1,THREE.RGBAFormat);tex.needsUpdate=true;tex.encoding=THREE.sRGBEncoding;return tex
  }
}
function makeEnvironment(T, renderer){
  const w=128,h=64,data=new Uint8Array(w*h*4)
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const t=y/(h-1),base=t<.45?255-39*t/.45:216-105*(t-.45)/.55;let light=0;for(const [cx,cy,r] of [[32,15,13],[95,20,9],[65,7,18]]){const d=Math.hypot(x-cx,y-cy)/r;light+=Math.max(0,1-d)*95}const i=(y*w+x)*4;data[i]=Math.min(255,base+light);data[i+1]=Math.min(255,base*.97+light);data[i+2]=Math.min(255,base*.94+light);data[i+3]=255}
  const tex=new T.DataTexture(data,w,h,T.RGBAFormat);tex.needsUpdate=true;tex.mapping=T.EquirectangularReflectionMapping;tex.encoding=T.sRGBEncoding
  try{const pm=new T.PMREMGenerator(renderer),env=pm.fromEquirectangular(tex).texture;pm.dispose();tex.dispose();return env}catch(_){return tex}
}
// Shared H5-style renderer for a model hand or a transparent photo overlay.
function create(canvas,width,height,pixelRatio,onReady,mode){
 const T=createScopedThreejs(canvas),renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true})
 renderer.setPixelRatio(Math.min(2,pixelRatio||1));renderer.setSize(width,height,false);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1
 const scene=new T.Scene(),env=makeEnvironment(T,renderer),camera=mode==='photo'?new T.OrthographicCamera(-width/2,width/2,height/2,-height/2,-1000,1000):new T.PerspectiveCamera(30,width/height,1,3000),root=new T.Group();scene.add(root)
 scene.add(new T.HemisphereLight(0xfff1df,0x2a1c14,.5));const key=new T.DirectionalLight(0xffffff,1.1);key.position.set(60,140,120);scene.add(key);const rim=new T.DirectionalLight(0xffd29a,.5);rim.position.set(-100,30,-80);scene.add(rim)
 let ring=null,arm=null,ringKey=null,armKey=null,built=null,disposed=false;const imageCache={},textureCache={}
 function dispose(group){if(!group)return;root.remove(group);group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map&&!o.material.map._beadloopShared)o.material.map.dispose();o.material.dispose()}})}
 function mapFor(item){if(item.texture&&canvas.createImage){const base=(getApp().globalData.apiBase||'').replace(/\/$/,'');const url=/^https?:\/\//.test(item.texture)?item.texture:item.texture[0]==='/'?base+item.texture:base+'/_blob/'+item.texture;if(url){if(imageCache[url]&&imageCache[url].ready)return imageCache[url].texture;if(!imageCache[url]){const entry=imageCache[url]={};try{const image=canvas.createImage();image.onload=()=>{entry.texture=new T.Texture(image);entry.texture.encoding=T.sRGBEncoding;entry.texture._beadloopShared=true;entry.texture.needsUpdate=true;entry.ready=true;ringKey=null;if(!disposed)onReady()};image.onerror=()=>{};image.src=url}catch(_){}}}}const key=[item.id,item.mat,(item.c||[]).join(),item.texture||''].join('|');if(!textureCache[key]){textureCache[key]=textureData(T,item);textureCache[key]._beadloopShared=true}return textureCache[key]}
 function buildRing(list){const g=new T.Group(),total=list.reduce((s,b)=>s+(Number(b.mm)||8),0),R=total/(2*Math.PI);let cur=Math.PI/2,maxD=8
  list.forEach(it=>{const mm=Number(it.mm)||8,a=cur-mm/total*Math.PI;cur-=mm/total*2*Math.PI;maxD=Math.max(maxD,mm);const p=({wood:[.55,0,.35],bodhi:[.5,0,.25],stone:[.22,0,.9],jade:[.22,0,.9],crystal:[.05,0,1],metal:[.22,1,.2]})[it.mat]||[.4,0,.5],mat=new T.MeshPhysicalMaterial({map:mapFor(it),roughness:p[0],metalness:p[1],clearcoat:p[2],clearcoatRoughness:.08,transparent:it.mat==='crystal',opacity:it.mat==='crystal'?.8:1,envMap:env,envMapIntensity:mode==='photo'?(it.mat==='metal'?.5:.32):(it.mat==='metal'?1.2:.9)}),geo=it.spacer?new T.CylinderGeometry(4.6,4.6,mm,36):new T.SphereGeometry(mm/2,48,32),m=new T.Mesh(geo,mat);m.position.set(R*Math.cos(a),R*Math.sin(a),0);m.rotation.z=a;m.userData.bead=true;g.add(m)})
  if(list.length)g.add(new T.Mesh(new T.TorusGeometry(R,.5,8,160),new T.MeshStandardMaterial({color:0x8c2a1c,roughness:.8})))
  return {group:g,R,maxD}
 }
 function buildArm(wrist,skin){const g=new T.Group(),k=Number(wrist||15)*10*.92/(2*Math.PI*1.011),mat=new T.MeshStandardMaterial({color:skin,roughness:.7,metalness:0})
  const fore=new T.Mesh(new T.CylinderGeometry(k,k*1.35,170,48,1,true),mat);fore.rotation.z=Math.PI/2;fore.position.x=85;fore.scale.set(.85,1,1.15);g.add(fore)
  const joint=new T.Mesh(new T.SphereGeometry(k,40,24),mat);joint.scale.set(.9,.85,1.15);g.add(joint)
  const palm=new T.Mesh(new T.SphereGeometry(1,40,28),mat);palm.scale.set(k*2.3,k*.78,k*1.5);palm.position.x=-k*2.2;g.add(palm)
  const thumb=new T.Mesh(new T.SphereGeometry(1,24,16),mat);thumb.scale.set(k*1.3,k*.45,k*.45);thumb.position.set(-k*2.2,-k*.1,k*1.45);thumb.rotation.y=.5;g.add(thumb);return {group:g,k}
 }
 return {update(list,opts){
  const nextRingKey=JSON.stringify(list.map(b=>[b.id,b.mm,b.mat,b.c,b.spacer,b.texture]));
  if(nextRingKey!==ringKey){dispose(ring);ring=null;built=null;ringKey=nextRingKey;if(list.length){built=buildRing(list);ring=new T.Group();ring.add(built.group);root.add(ring)}}
  if(!list.length){dispose(arm);arm=null;armKey=null;renderer.render(scene,camera);return}
  const g=built.group,R=built.R
  if(mode==='model'){
   const nextArmKey=String(opts.wrist)+'|'+String(opts.skin)
   if(nextArmKey!==armKey){dispose(arm);const a=buildArm(opts.wrist,opts.skin);arm=a.group;armKey=nextArmKey;root.add(arm)}
   const k=Number(opts.wrist||15)*10*.92/(2*Math.PI*1.011);g.rotation.y=Math.PI/2;const main=Number(opts.mainSize)||8,sag=Math.max(0,(R-main/2)-k*.85);g.position.set(10,-sag,0);camera.position.set(0,0,260);camera.lookAt(0,0,0);root.rotation.set(opts.rx,opts.ry,0)
  } else {
   root.rotation.set(0,0,0);const px=Number(opts.size)/100*width/(2*R+built.maxD);g.scale.setScalar(px);g.rotation.set(0,Number(opts.tilt)*Math.PI/180,0);ring.rotation.z=-Number(opts.angle)*Math.PI/180;ring.position.set(Number(opts.x)-width/2,height/2-Number(opts.y),0);ring.updateMatrixWorld(true);const v=new T.Vector3();g.children.forEach(m=>{if(!m.userData.bead){m.visible=!opts.hideBack;return}m.getWorldPosition(v);m.visible=!opts.hideBack||v.z>-R*px*.15})
  }
  camera.updateProjectionMatrix();renderer.render(scene,camera)
 },dispose(){disposed=true;dispose(ring);dispose(arm);Object.values(imageCache).forEach(x=>{if(x.texture)x.texture.dispose()});Object.values(textureCache).forEach(x=>x.dispose());if(env)env.dispose();renderer.dispose()}}

}
module.exports={create}
