// Native WebGL preview. Colors are approximations, not product photographs.
function compile(gl, type, source) {
  const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}
function mesh() {
  const p = [], n = [], idx = [], rings = 24, seg = 36
  for (let y = 0; y <= rings; y++) { const phi = Math.PI * y / rings
    for (let x = 0; x <= seg; x++) { const t = Math.PI * 2 * x / seg, a = Math.sin(phi) * Math.cos(t), b = Math.cos(phi), c = Math.sin(phi) * Math.sin(t); p.push(a,b,c); n.push(a,b,c) }
  }
  for (let y = 0; y < rings; y++) for (let x = 0; x < seg; x++) { const a = y*(seg+1)+x, b = a+seg+1; idx.push(a,b,a+1,b,b+1,a+1) }
  return {p:new Float32Array(p),n:new Float32Array(n),idx:new Uint16Array(idx)}
}
function cylinderMesh() {
  const p=[], n=[], idx=[], seg=36
  for(let i=0;i<=seg;i++) { const a=i*Math.PI*2/seg, x=Math.cos(a), z=Math.sin(a); p.push(x,-1,z,x,1,z); n.push(x,0,z,x,0,z) }
  for(let i=0;i<seg;i++){const j=i*2;idx.push(j,j+1,j+2,j+1,j+3,j+2)}
  for(const side of [-1,1]) { const start=p.length/3; p.push(0,side,0);n.push(0,side,0)
    for(let i=0;i<=seg;i++){const a=i*Math.PI*2/seg;p.push(Math.cos(a),side,Math.sin(a));n.push(0,side,0)}
    for(let i=0;i<seg;i++) side>0 ? idx.push(start,start+i+2,start+i+1) : idx.push(start,start+i+1,start+i+2)
  }
  return {p:new Float32Array(p),n:new Float32Array(n),idx:new Uint16Array(idx)}
}
function torusMesh() {
  const p=[],n=[],idx=[],seg=128,tube=8
  for(let i=0;i<=seg;i++){const a=i*Math.PI*2/seg,x=Math.cos(a),y=Math.sin(a)
    for(let j=0;j<=tube;j++){const b=j*Math.PI*2/tube;p.push(x,y,0);n.push(x*Math.cos(b),y*Math.cos(b),Math.sin(b))}
  }
  for(let i=0;i<seg;i++)for(let j=0;j<tube;j++){const a=i*(tube+1)+j,b=a+tube+1;idx.push(a,b,a+1,b,b+1,a+1)}
  return {p:new Float32Array(p),n:new Float32Array(n),idx:new Uint16Array(idx)}
}
function makeBuffers(gl,m){
  const buffers={count:m.idx.length}
  for(const key of ['p','n']){buffers[key]=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffers[key]);gl.bufferData(gl.ARRAY_BUFFER,m[key],gl.STATIC_DRAW)}
  buffers.idx=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers.idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.idx,gl.STATIC_DRAW)
  return buffers
}
function bindBuffers(gl,pr,m){
  for(const key of ['p','n']){gl.bindBuffer(gl.ARRAY_BUFFER,m[key]);const loc=gl.getAttribLocation(pr,key);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0)}
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.idx)
}
function rgb(hex) {
  const s = String(hex || '#bdb8b3').replace('#',''), v = /^[0-9a-f]{6}$/i.test(s) ? s : 'bdb8b3'
  return [0,2,4].map(i => parseInt(v.slice(i,i+2),16)/255)
}
Component({
  properties: { editable:{type:Boolean,value:false}, height:{type:Number,value:460}, beads: {type:Array,value:[]}, catalog:{type:Array,value:[]}, selected:{type:Number,value:-1} },
  data:{error:''},
  observers:{'beads,catalog,selected':function(){this.render()}},
  lifetimes:{ready(){this.init()},detached(){clearTimeout(this.dragTimer);clearTimeout(this.flipTimer);if(this.threeRenderer)this.threeRenderer.dispose();this.threeRenderer=null;if(this.gl && this.textureCache) Object.values(this.textureCache).forEach(t=>{if(t.texture)this.gl.deleteTexture(t.texture)});if(this.gl && this.meshes) Object.values(this.meshes).forEach(m=>['p','n','idx'].forEach(k=>this.gl.deleteBuffer(m[k])));this.textureCache=null;this.meshes=null;this.gl=null;this.canvas=null}},
  methods:{
    init(){
      this.createSelectorQuery().select('#bracelet3d').fields({node:true,size:true}).exec(res=>{
        try {
          const item=res&&res[0]; if(!item||!item.node) throw new Error('no canvas')
          this.canvas=item.node; const d=(wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio||1
          this.width=item.width; this.height=item.height; this.canvas.width=Math.round(item.width*d); this.canvas.height=Math.round(item.height*d)
          this.rx=-0.85;this.ry=0
          try {
            this.threeRenderer=require('./three-renderer').create(this.canvas,this.width,this.height,d,()=>this.render())
            this.render();return
          } catch(e) { this.threeRenderer=null;console.warn('Three.js 不可用，使用兼容渲染',e) }
          const gl=this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true}); if(!gl) throw new Error('no webgl')
          // Procedural material approximations keep the H5 material distinction without
          // presenting a generated surface as a photograph of a particular bead.
          const vs=compile(gl,gl.VERTEX_SHADER, `
            attribute vec3 p; attribute vec3 n;
            uniform vec3 center; uniform vec3 shape; uniform float spin; uniform float ringRadius; uniform float ringMode; uniform mat3 rot; uniform vec2 scale;
            varying vec3 vNormal; varying vec3 vObject;
            void main(){
              float c=cos(spin), s=sin(spin); mat3 turn=mat3(c,s,0.0,-s,c,0.0,0.0,0.0,1.0);
              vec3 local=ringMode>0.5 ? p*ringRadius+n*0.5 : turn*(p*shape);
              vec3 q=rot*(center+local);
              vNormal=normalize(rot*(ringMode>0.5 ? n : turn*(n/shape))); vObject=p;
              gl_Position=vec4(q.x*scale.x,q.y*scale.y,-q.z*0.004,1.0);
            }`)
          const fs=compile(gl,gl.FRAGMENT_SHADER, `
            precision mediump float;
            uniform vec3 color; uniform vec3 darkColor; uniform float kind; uniform float seed;
            uniform sampler2D beadMap; uniform float hasMap; uniform float selected;
            varying vec3 vNormal; varying vec3 vObject;
            float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7))+seed*31.0)*43758.5453);}
            void main(){
              vec3 n=normalize(vNormal), p=normalize(vObject);
              float light=max(dot(n,normalize(vec3(-0.45,0.70,1.0))),0.0);
              float fill=max(dot(n,normalize(vec3(0.7,0.25,0.8))),0.0);
              vec3 c=color; float gloss=0.24, shine=18.0;
              if(kind<0.5){
                float grain=sin(p.y*65.0+sin(p.x*13.0+seed)*4.0)*0.5+0.5;
                c=mix(color,darkColor,0.10+grain*0.28); gloss=0.18; shine=18.0;
              }else if(kind<1.5){
                vec2 cell=floor((p.xy+1.0)*45.0);
                float spot=step(0.90,hash(cell));
                c=mix(color,darkColor,spot*0.55); gloss=0.18; shine=18.0;
              }else if(kind<2.5){
                float cloud=sin(p.x*12.0+sin(p.y*9.0+seed)*2.3)*sin(p.z*11.0-p.y*5.0);
                c=mix(color,darkColor,0.12+0.19*(cloud*0.5+0.5)); gloss=0.48; shine=44.0;
              }else if(kind<3.5){
                float cloud=sin(p.x*10.0+sin(p.y*8.0+seed))*0.5+0.5;
                c=mix(color,darkColor,0.15+cloud*0.18);
                c=mix(c,vec3(1.0),0.15+0.20*(1.0-abs(n.z))); gloss=0.75; shine=70.0;
              }else if(kind<4.5){
                float bands=0.5+0.5*sin(p.y*28.0+seed);
                c=mix(darkColor,color,0.4+0.4*bands); gloss=0.8; shine=60.0;
              }else{c=color;gloss=0.05;shine=12.0;}
              if(hasMap>0.5){
                vec2 uv=vec2(atan(p.z,p.x)/6.28318530718+0.5, asin(clamp(p.y,-1.0,1.0))/3.14159265359+0.5);
                c=texture2D(beadMap,uv).rgb;
              }
              vec3 halfVec=normalize(normalize(vec3(-0.45,0.70,1.0))+vec3(0.0,0.0,1.0));
              float spec=pow(max(dot(n,halfVec),0.0),shine)*gloss;
              vec3 outColor=c*(0.44+0.45*light+0.11*fill)+vec3(spec)+selected*vec3(0.10,0.06,0.01);
              gl_FragColor=vec4(clamp(outColor,0.0,1.0),1.0);
            }`)
          const pr=this.program=gl.createProgram(); gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));gl.useProgram(pr)
          this.meshes={sphere:makeBuffers(gl,mesh()),spacer:makeBuffers(gl,cylinderMesh()),cord:makeBuffers(gl,torusMesh())}
          gl.enable(gl.DEPTH_TEST);this.rx=-0.45;this.ry=0;this.render()
        }catch(e){this.setData({error:'当前设备无法显示 3D 预览，请使用平面预览。'});this.triggerEvent('unavailable')}
      })
    },
    // A separately supplied flat texture is used when available. A product photo is
    // intentionally not wrapped around the sphere: H5 makes the same distinction.
    textureFor(path){
      if(!path || !this.gl || !this.canvas || !this.canvas.createImage) return null
      const base=(getApp().globalData.apiBase || '').replace(/\/$/, '')
      const url=/^https?:\/\//i.test(path) ? path : path[0]==='/' ? base+path : ''
      if(!url) return null
      this.textureCache=this.textureCache||{}
      if(this.textureCache[url]) return this.textureCache[url].ready ? this.textureCache[url].texture : null
      const gl=this.gl, entry={ready:false}; this.textureCache[url]=entry
      try {
        const image=this.canvas.createImage()
        image.onload=()=>{
          if(this.gl!==gl) return
          try {
            const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true)
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image)
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
            entry.texture=texture;entry.ready=true;this.render()
          }catch(_){entry.failed=true}
        }
        image.onerror=()=>{entry.failed=true}
        image.src=url
      }catch(_){entry.failed=true}
      return null
    },
    render(){const beads=this.properties.beads||[], map={};(this.properties.catalog||[]).forEach(x=>map[x.id]=x);const list=beads.map((x,index)=>({item:map[typeof x==='string'?x:x.id],index})).filter(x=>x.item).map(x=>({...x.item,sourceIndex:x.index}));if(this.threeRenderer){try{this.threeRenderer.update(list,this.properties.selected,this.rx,this.ry);if(list.length&&this.triggerEvent)this.triggerEvent('rendered');return}catch(e){console.warn('Three.js 渲染失败',e);this.threeRenderer.dispose();this.threeRenderer=null;this.setData({error:'当前设备无法显示 3D 预览，请使用平面预览。'});this.triggerEvent('unavailable');return}}const gl=this.gl;if(!gl||!this.program)return;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!list.length)return
      const total=list.reduce((s,b)=>s+(Number(b.mm)||8),0), R=total/(2*Math.PI), extent=Math.max(10,R+Math.max(...list.map(b=>Number(b.mm)||8))), sx=.82/extent, sy=sx*this.width/this.height
      const cx=Math.cos(this.rx),sxr=Math.sin(this.rx),cy=Math.cos(this.ry),syr=Math.sin(this.ry)
      const rot=new Float32Array([cy,sxr*syr,-cx*syr,0,cx,sxr,syr,-sxr*cy,cx*cy]);gl.uniformMatrix3fv(gl.getUniformLocation(this.program,'rot'),false,rot);gl.uniform2f(gl.getUniformLocation(this.program,'scale'),sx,sy)
      const u=name=>gl.getUniformLocation(this.program,name)
      const draw=(key)=>{const m=this.meshes[key];bindBuffers(gl,this.program,m);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0)}
      gl.uniform3f(u('center'),0,0,0);gl.uniform3f(u('shape'),1,1,1);gl.uniform1f(u('spin'),0);gl.uniform1f(u('ringRadius'),R);gl.uniform1f(u('ringMode'),1);gl.uniform1f(u('kind'),5);gl.uniform1f(u('selected'),0);gl.uniform1f(u('hasMap'),0);gl.uniform3fv(u('color'),rgb('#8c2a1c'));gl.uniform3fv(u('darkColor'),rgb('#8c2a1c'));draw('cord')
      gl.uniform1f(u('ringMode'),0)
      this.points=[];let a=Math.PI/2
      list.forEach(b=>{
        const mm=Number(b.mm)||8, step=mm/total*Math.PI*2, mid=a-step/2;a-=step
        const x=R*Math.cos(mid),y=R*Math.sin(mid),isSelected=b.sourceIndex===this.properties.selected, factor=isSelected?1.12:1, size=mm*.5*factor
        const spacer=!!b.spacer
        gl.uniform3f(u('center'),x,y,0);gl.uniform3f(u('shape'),spacer?4.6*factor:size,size,spacer?4.6*factor:size);gl.uniform1f(u('spin'),spacer?mid:0);gl.uniform1f(u('selected'),isSelected?1:0)
        gl.uniform3fv(u('color'),rgb(b.c&&b.c[0]));gl.uniform3fv(u('darkColor'),rgb(b.c&&b.c[1]||b.c&&b.c[0]));gl.uniform1f(u('kind'),({wood:0,bodhi:1,stone:2,jade:2,crystal:3,metal:4}[b.mat] ?? 2));gl.uniform1f(u('seed'),(String(b.id||'').split('').reduce((h,c)=>(h*31+c.charCodeAt(0))%997,7))/997)
        const mapTexture=this.textureFor(b.texture);gl.uniform1f(u('hasMap'),mapTexture?1:0);if(mapTexture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,mapTexture);gl.uniform1i(u('beadMap'),0)}
        draw(spacer?'spacer':'sphere');this.points.push({i:b.sourceIndex,x:cy*x,y:sxr*syr*x+cx*y,z:-cx*syr*x+sxr*y,r:spacer?Math.max(size,4.6*factor):size})
      })
      this.scaleX=sx;this.scaleY=sy;if(this.triggerEvent)this.triggerEvent('rendered')
    },
    exportImage(callback){if(!this.canvas)return callback(new Error('3D 预览尚未准备好'));wx.canvasToTempFilePath({canvas:this.canvas,success:r=>callback(null,r.tempFilePath),fail:()=>callback(new Error('3D 图层导出失败'))},this)},
    pickAt(x,y){if(this.threeRenderer)return this.threeRenderer.pick(x,y);if(!this.points)return null;const px=(x/this.width*2-1)/this.scaleX,py=(1-y/this.height*2)/this.scaleY;const hit=this.points.filter(p=>(px-p.x)**2+(py-p.y)**2<(p.r*1.4)**2).sort((a,b)=>b.z-a.z)[0];return hit?hit.i:null},
    flip(){clearTimeout(this.flipTimer);const from=this.ry||0,start=Date.now();const tick=()=>{const t=Math.min(1,(Date.now()-start)/350);this.ry=from+Math.PI*(t*t*(3-2*t));this.render();if(t<1)this.flipTimer=setTimeout(tick,16)};tick()},
    dragEvent(name,p,t){this.triggerEvent(name,{index:t.index,x:p.clientX==null?p.x:p.clientX,y:p.clientY==null?p.y:p.clientY})},
    start(e){clearTimeout(this.dragTimer);const p=e.touches&&e.touches[0];if(!p)return;const t=this.touch={x:p.x,y:p.y,startX:p.x,startY:p.y,moved:false,index:this.pickAt(p.x,p.y),last:p};if(this.properties.editable&&t.index!==null&&t.index>=0)this.dragTimer=setTimeout(()=>{if(this.touch!==t||t.moved)return;t.dragging=true;this.dragEvent('beaddragstart',t.last,t)},300)},
    move(e){const p=e.touches&&e.touches[0],t=this.touch;if(!p||!t)return;t.last=p;if(t.dragging){this.dragEvent('beaddragmove',p,t);return}const dx=p.x-t.x,dy=p.y-t.y;this.ry+=dx*.012;this.rx=Math.max(-1.4,Math.min(1.4,this.rx+dy*.012));t.x=p.x;t.y=p.y;if(Math.abs(p.x-t.startX)+Math.abs(p.y-t.startY)>6){t.moved=true;clearTimeout(this.dragTimer)}this.render()},
    cancel(){clearTimeout(this.dragTimer);const t=this.touch;this.touch=null;if(t&&t.dragging)this.triggerEvent('beaddragcancel')},
    end(e){clearTimeout(this.dragTimer);const t=this.touch;this.touch=null;if(!t)return;if(t.dragging){this.dragEvent('beaddragend',(e.changedTouches&&e.changedTouches[0])||t.last,t);return}if(!t.moved&&t.index!==null)this.triggerEvent('select',{index:t.index})}
  }
})
