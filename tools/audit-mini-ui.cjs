const fs=require('fs'),path=require('path');
const a=require(process.env.AUTOMATOR_MODULE||'/tmp/beadloop-automation/node_modules/miniprogram-automator');
(async()=>{const m=await a.connect({wsEndpoint:'ws://127.0.0.1:9421'});const out=path.resolve('output/frontend-audit');const results=[];const exceptions=[];m.on('exception',e=>exceptions.push(String(e.message||e)));
const keys=['cgz_current_design','cgz_miniprogram_designs'];const backup={};for(const k of keys)backup[k]=await m.callWxMethod('getStorageSync',k);
try{await m.callWxMethod('setStorageSync','cgz_current_design',{id:'ui-audit',name:'测试手串',wrist:15,beads:Array(20).fill('zt8')});
for(const name of (process.env.AUDIT_PAGES?process.env.AUDIT_PAGES.split(','):['home','diy','editor','finish','order','ai','mine','wrist','photo','shared','tryon','login','share'])){
 const url=`/pages/${name}/${name}`;
 await m.reLaunch(url);await new Promise(r=>setTimeout(r,1500)); if((await m.currentPage()).path!==url.slice(1)){await m.reLaunch(url);await new Promise(r=>setTimeout(r,1500));} if((await m.currentPage()).path!==url.slice(1))throw new Error('Navigation failed: '+url);
 const layout=await m.evaluate(()=>new Promise(resolve=>{const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();wx.createSelectorQuery().selectAll('view,button,input,textarea,scroll-view').boundingClientRect().exec(r=>resolve({width:info.windowWidth,height:info.windowHeight,nodes:(r[0]||[]).map(x=>({id:x.id,left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height})),route:getCurrentPages().slice(-1)[0].route}));}));
 await m.screenshot({path:path.join(out,name+'.png')});results.push({name,...layout});console.log(name,layout.width,layout.height,'overflow',layout.nodes.filter(x=>x.left < -2||x.right>layout.width+2).length);
}
}finally{for(const k of keys)await m.callWxMethod('setStorageSync',k,backup[k]);await m.disconnect();fs.writeFileSync(path.join(out,(process.env.AUDIT_PAGES?'recheck':'results')+'.json'),JSON.stringify({results,exceptions},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
