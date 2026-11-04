// Native WebGL preview. Colors are approximations, not product photographs.
function compile(gl, type, source) {
  const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}
function mesh() {
  const p = [], n = [], idx = [], rings = 12, seg = 20
  for (let y = 0; y <= rings; y++) { const phi = Math.PI * y / rings
    for (let x = 0; x <= seg; x++) { const t = Math.PI * 2 * x / seg, a = Math.sin(phi) * Math.cos(t), b = Math.cos(phi), c = Math.sin(phi) * Math.sin(t); p.push(a,b,c); n.push(a,b,c) }
  }
  for (let y = 0; y < rings; y++) for (let x = 0; x < seg; x++) { const a = y*(seg+1)+x, b = a+seg+1; idx.push(a,b,a+1,b,b+1,a+1) }
  return {p:new Float32Array(p),n:new Float32Array(n),idx:new Uint16Array(idx)}
}
function rgb(hex) {
  const s = String(hex || '#bdb8b3').replace('#',''), v = /^[0-9a-f]{6}$/i.test(s) ? s : 'bdb8b3'
  return [0,2,4].map(i => parseInt(v.slice(i,i+2),16)/255)
}
Component({
  properties: { beads: {type:Array,value:[]}, catalog:{type:Array,value:[]}, selected:{type:Number,value:-1}, skin:{type:String,value:'#d7ad91'}, wrist:{type:Number,value:15} },
  data:{error:''},
  observers:{'beads,catalog,selected,skin,wrist':function(){this.render()}},
  lifetimes:{ready(){this.init()},detached(){if(this.threeRenderer)this.threeRenderer.dispose();this.threeRenderer=null;this.gl=null;this.canvas=null}},
  methods:{
    init(){
      this.createSelectorQuery().select('#bracelet3d').fields({node:true,size:true}).exec(res=>{
        try {
          const item=res&&res[0]; if(!item||!item.node) throw new Error('no canvas')
          this.canvas=item.node; const d=wx.getSystemInfoSync().pixelRatio||1
          this.width=item.width; this.height=item.height; this.canvas.width=Math.round(item.width*d); this.canvas.height=Math.round(item.height*d)
          try {this.rx=.45;this.ry=-.6;this.threeRenderer=require('../three-tryon').create(this.canvas,this.width,this.height,d,()=>this.render(),'model');this.render();return} catch(e){this.threeRenderer=null;console.warn('Three.js 模型手不可用，使用示意模型',e)}
          const gl=this.gl=this.canvas.getContext('webgl',{alpha:true,antialias:true}); if(!gl) throw new Error('no webgl')
          const vs=compile(gl,gl.VERTEX_SHADER,'attribute vec3 p; attribute vec3 n; uniform vec3 center; uniform vec3 shape; uniform mat3 rot; uniform vec2 scale; varying float light; void main(){ vec3 q=rot*(center+p*shape); vec3 normal=normalize(rot*(n/shape)); light=0.34+0.66*max(dot(normal,normalize(vec3(-0.4,0.7,1.0))),0.0); gl_Position=vec4(q.x*scale.x,q.y*scale.y,-q.z*0.004,1.0); }')
          const fs=compile(gl,gl.FRAGMENT_SHADER,'precision mediump float; uniform vec3 color; varying float light; void main(){gl_FragColor=vec4(color*light,1.0);}')
          const pr=this.program=gl.createProgram(); gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));gl.useProgram(pr)
          const m=mesh(); for(const [name,arr] of [['p',m.p],['n',m.n]]){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);const loc=gl.getAttribLocation(pr,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0)}
          const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.idx,gl.STATIC_DRAW);this.indexCount=m.idx.length;gl.enable(gl.DEPTH_TEST);this.rx=-0.95;this.ry=0;this.render()
        }catch(e){this.setData({error:'当前设备无法显示 3D 预览，请使用平面预览。'});this.triggerEvent('unavailable')}
      })
    },
    render(){const beads=this.properties.beads||[], map={};(this.properties.catalog||[]).forEach(x=>map[x.id]=x);const list=beads.map((x,index)=>({item:map[typeof x==='string'?x:x.id],index})).filter(x=>x.item).map(x=>({...x.item,sourceIndex:x.index}));if(this.threeRenderer){const sizes={};list.filter(x=>!x.spacer&&Number(x.mm)>=6).forEach(x=>{sizes[x.mm]=(sizes[x.mm]||0)+1});const mainSize=Number(Object.keys(sizes).sort((a,b)=>sizes[b]-sizes[a])[0])||8;try{this.threeRenderer.update(list,{rx:this.rx,ry:this.ry,skin:this.properties.skin,wrist:this.properties.wrist,mainSize});}catch(e){this.setData({error:'3D 模型暂不可用，请使用照片试戴。'});this.triggerEvent('unavailable')}return}const gl=this.gl;if(!gl||!this.program)return;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!list.length)return
      const total=list.reduce((s,b)=>s+(Number(b.mm)||8),0), R=total/(2*Math.PI), extent=Math.max(10,R+Math.max(...list.map(b=>Number(b.mm)||8))), sx=.82/extent, sy=sx*this.width/this.height
      const cx=Math.cos(this.rx),sxr=Math.sin(this.rx),cy=Math.cos(this.ry),syr=Math.sin(this.ry)
      const rot=new Float32Array([cy,sxr*syr,-cx*syr,0,cx,sxr,syr,-sxr*cy,cx*cy]);gl.uniformMatrix3fv(gl.getUniformLocation(this.program,'rot'),false,rot);gl.uniform2f(gl.getUniformLocation(this.program,'scale'),sx,sy)
      gl.uniform3f(gl.getUniformLocation(this.program,'center'),0,0,0);gl.uniform3f(gl.getUniformLocation(this.program,'shape'),R*.68,R*.68,R*3.0);gl.uniform3fv(gl.getUniformLocation(this.program,'color'),rgb(this.properties.skin));gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);this.points=[];let a=Math.PI/2
      list.forEach((b,i)=>{const mm=Number(b.mm)||8, step=mm/total*Math.PI*2, mid=a-step/2;a-=step;const x=R*Math.cos(mid),y=R*Math.sin(mid),size=mm*.5*(b.sourceIndex===this.properties.selected?1.16:1);gl.uniform3f(gl.getUniformLocation(this.program,'center'),x,y,0);gl.uniform3f(gl.getUniformLocation(this.program,'shape'),size,size,size);gl.uniform3fv(gl.getUniformLocation(this.program,'color'),rgb(b.c&&b.c[0]));gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);this.points.push({i:b.sourceIndex,x:cy*x,y:sxr*syr*x+cx*y,z:-cx*syr*x+sxr*y,r:size})})
      this.scaleX=sx;this.scaleY=sy
    },
    start(e){const p=e.touches&&e.touches[0];if(p)this.touch={x:p.x,y:p.y,startX:p.x,startY:p.y,moved:false}},
    move(e){const p=e.touches&&e.touches[0],t=this.touch;if(!p||!t)return;const dx=p.x-t.x,dy=p.y-t.y;this.ry+=dx*.012;this.rx=Math.max(-1.4,Math.min(1.4,this.rx+dy*.012));t.x=p.x;t.y=p.y;if(Math.abs(p.x-t.startX)+Math.abs(p.y-t.startY)>6)t.moved=true;this.render()},
    end(){const t=this.touch;this.touch=null;if(!t||t.moved||!this.points)return;const x=(t.x/this.width*2-1)/this.scaleX,y=(1-t.y/this.height*2)/this.scaleY;const hits=this.points.filter(p=>(x-p.x)**2+(y-p.y)**2<(p.r*1.4)**2).sort((a,b)=>b.z-a.z);if(hits.length)this.triggerEvent('select',{index:hits[0].i})}
  }
})
