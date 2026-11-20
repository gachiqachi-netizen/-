const { wristRing } = require('../../utils/wrist-ring')
const TAU = Math.PI * 2
Component({
  properties: {hand:{type:Object,value:null},beads:{type:Array,value:[]},spin:{type:Number,value:0},width:{type:Number,value:375},height:{type:Number,value:500}},
  observers: {'hand,beads,spin,width,height':function(){this.render()}},
  lifetimes: {ready(){this.readyCanvas=true;this.render()}},
  methods: {
    touchStart(e){if(e.touches.length!==1)return;this.touch={x:e.touches[0].x,y:e.touches[0].y}},
    touchMove(e){if(e.touches.length!==1){this.touch=null;return}const t=e.touches[0];if(!this.touch)return
      const dx=t.x-this.touch.x,dy=t.y-this.touch.y;this.touch={x:t.x,y:t.y}
      if(Math.abs(dx)>Math.abs(dy))this.triggerEvent('spin',{delta:dx/this.properties.width*TAU})
    },
    touchEnd(){this.touch=null},
    exportImage(callback){if(!this.canvas)return callback(new Error('画布尚未准备好'));wx.canvasToTempFilePath({canvas:this.canvas,success:r=>callback(null,r.tempFilePath),fail:callback},this)},
    image(src){
      if(!src)return Promise.resolve(null)
      if(!this.imageCache)this.imageCache=new Map()
      if(this.imageCache.has(src))return this.imageCache.get(src)
      const task=new Promise((resolve,reject)=>wx.getImageInfo({src,success:info=>{
        const image=this.canvas.createImage();image.onload=()=>resolve(image);image.onerror=reject;image.src=info.path||src
      },fail:reject}))
      this.imageCache.set(src,task)
      return task
    },
    render(){
      if(!this.readyCanvas||!this.properties.hand||this.frameRequested)return
      this.frameRequested=true
      const frame=()=>{this.frameRequested=false;this.drawFrame()}
      if(this.canvas&&this.canvas.requestAnimationFrame)this.canvas.requestAnimationFrame(frame)
      else this.createSelectorQuery().select('#wristCanvas').fields({node:true,size:true}).exec(results=>{
        if(results&&results[0]&&results[0].node){this.canvas=results[0].node;this.canvas.requestAnimationFrame?this.canvas.requestAnimationFrame(frame):setTimeout(frame,16)}
        else {this.frameRequested=false;this.triggerEvent('unavailable',{message:'画布不可用'})}
      })
    },
    drawFrame(){if(this.rendering){this.pending=true;return}this.rendering=true
      Promise.resolve().then(async()=>{
        try {
          const canvas=this.canvas;if(!canvas)throw new Error('画布不可用')
          const ctx=canvas.getContext('2d'),dpr=wx.getWindowInfo?wx.getWindowInfo().pixelRatio:wx.getSystemInfoSync().pixelRatio
          const pixelWidth=Math.round(this.properties.width*(dpr||1)),pixelHeight=Math.round(this.properties.height*(dpr||1))
          if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight}
          ctx.setTransform(dpr||1,0,0,dpr||1,0,0)

          const hand=this.properties.hand,beads=this.properties.beads||[]
          const thumb=await this.image(hand.thumb||hand.photo).catch(()=>null)
          if(thumb){ctx.fillStyle='#f5f0eb';ctx.fillRect(0,0,this.properties.width,this.properties.height);ctx.drawImage(thumb,0,0,this.properties.width,this.properties.width*thumb.height/thumb.width)}
          const sources=[hand.photo,hand.cutout,...beads.map(b=>b.photo||'')]
          const loaded=await Promise.all(sources.map(src=>this.image(src).catch(()=>null)))
          if(!thumb&&!loaded[0])throw new Error('模特照片无法读取')
          const base=loaded[0]||thumb,scale=this.properties.width/base.width,drawHeight=base.height*scale
          ctx.fillStyle='#f5f0eb';ctx.fillRect(0,0,this.properties.width,this.properties.height)
          ctx.drawImage(base,0,0,this.properties.width,drawHeight)
          const points=wristRing(hand,beads,this.properties.spin).map(p=>({...p,x:p.x*scale,y:p.y*scale,size:p.size*scale}))
          const paint=(p,index,back)=>{const radius=p.size/2,photo=loaded[index+2];ctx.save();if(back){ctx.globalAlpha=.9;ctx.filter='brightness(0.88)'}
            if(photo)ctx.drawImage(photo,p.x-radius,p.y-radius,p.size,p.size)
            else {ctx.fillStyle=(beads[index].c||[])[0]||'#b38c69';ctx.beginPath();ctx.arc(p.x,p.y,radius,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.arc(p.x-radius*.25,p.y-radius*.3,radius*.22,0,TAU);ctx.fill()}
            ctx.restore()}
          points.forEach((p,i)=>{if(!p.front)paint(p,i,true)})
          if(loaded[1])ctx.drawImage(loaded[1],0,0,this.properties.width,drawHeight)
          // Shadow follows the front semicircle; a small soft contact shadow anchors each bead.
          ctx.save();ctx.filter='blur(7px)';ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=Math.max(4,Number(hand.wristWidthPx)*scale*.035)
          ctx.beginPath();let started=false;points.filter(p=>p.front).forEach(p=>{if(!started){ctx.moveTo(p.x,p.y+Number(hand.wristWidthPx)*scale*.03);started=true}else ctx.lineTo(p.x,p.y+Number(hand.wristWidthPx)*scale*.03)})
          if(started)ctx.stroke();ctx.restore()
          points.forEach((p,i)=>{if(p.front){paint(p,i,false);ctx.save();ctx.fillStyle='rgba(0,0,0,.08)';ctx.beginPath();ctx.ellipse(p.x,p.y+p.size*.33,p.size*.32,p.size*.07,0,0,TAU);ctx.fill();ctx.restore()}})
          this.triggerEvent('rendered')
        } catch(error){this.triggerEvent('unavailable',{message:error.message||'画布渲染失败'})}
        this.rendering=false;if(this.pending){this.pending=false;this.render()}
      })
    }
  }
})
