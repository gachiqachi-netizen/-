Component({
 properties:{viewportWidth:{type:Number,value:0},viewportHeight:{type:Number,value:0},beads:{type:Array,value:[]},catalog:{type:Array,value:[]},size:{type:Number,value:38},angle:{type:Number,value:0},tilt:{type:Number,value:45},hideBack:{type:Boolean,value:false},xpos:{type:Number,value:0},ypos:{type:Number,value:0}},
 data:{error:''},
 observers:{'beads,catalog,size,angle,tilt,hideBack,xpos,ypos':function(){this.render()}},
 lifetimes:{ready(){this._alive=true;this.initRenderer(0)},detached(){this._alive=false;clearTimeout(this._initTimer);if(this.photoRenderer)this.photoRenderer.dispose();this.photoRenderer=null;this.canvas=null}},
 methods:{
  initRenderer(attempt){
   if(!this._alive)return;
   this.createSelectorQuery().select('#photoCanvas').fields({node:true,size:true}).exec(r=>{
    if(!this._alive)return;
    const item=r&&r[0],width=this.properties.viewportWidth||(item&&item.width),height=this.properties.viewportHeight||(item&&item.height);
    if(!item||!item.node||!width||!height){
     if(attempt<4){this._initTimer=setTimeout(()=>this.initRenderer(attempt+1),80);return}
     this.reportFailure(new Error('画布未就绪：'+JSON.stringify({node:!!(item&&item.node),width,height})),'canvas');return;
    }
    try{this.canvas=item.node;this.width=width;this.height=height;const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
     this.photoRenderer=require('../three-tryon').create(this.canvas,width,height,info.pixelRatio||1,()=>this.render(),'photo');this.render();
    }catch(e){this.reportFailure(e,'initialize')}
   });
  },
  reportFailure(e,stage){
   if(!this._alive||this._failed)return;
   this._failed=true;
   const detail={stage,message:e&&(e.message||e.errMsg)||String(e),stack:e&&e.stack||'',width:this.width||0,height:this.height||0};
   console.error('[AR-RENDER]',JSON.stringify(detail));
   this.setData({error:'3D 叠加失败：'+detail.message});this.triggerEvent('unavailable',detail);
  },
  render(){if(!this.photoRenderer||this._failed||!this._alive)return;const map={};(this.properties.catalog||[]).forEach(x=>{map[x.id]=x});const list=(this.properties.beads||[]).map((id,i)=>map[id]?{...map[id],sourceIndex:i}:null).filter(Boolean);if(!list.length)return;try{this.photoRenderer.update(list,{size:this.properties.size,angle:this.properties.angle,tilt:this.properties.tilt,hideBack:this.properties.hideBack,x:Number.isFinite(this.properties.xpos)?this.properties.xpos:this.width/2,y:Number.isFinite(this.properties.ypos)?this.properties.ypos:this.height/2});this.triggerEvent('rendered')}catch(e){this.reportFailure(e,'render')}},
  start(e){const t=e.touches&&e.touches[0];if(t)this.touch={x:t.x,y:t.y}},
  move(e){const t=e.touches&&e.touches[0];if(!t||!this.touch)return;const dx=t.x-this.touch.x,dy=t.y-this.touch.y;this.touch={x:t.x,y:t.y};this.triggerEvent('move',{dx,dy})},
  end(){this.touch=null},
  exportImage(callback){if(!this.canvas||!this.photoRenderer)return callback(new Error('3D 预览尚未准备好'));wx.canvasToTempFilePath({canvas:this.canvas,destWidth:this.canvas.width,destHeight:this.canvas.height,success:r=>callback(null,r.tempFilePath),fail:()=>callback(new Error('3D 图层导出失败'))},this)}
 }
})
