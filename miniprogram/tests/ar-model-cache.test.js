const test = require('node:test');
const assert = require('node:assert/strict');
const {createModelLoader,resolveModelConfig}=require('../ar-hand/model-cache');

function fixture() {
 const disk=new Map(), dirs=new Set(['/user']), calls=[];
 const fs={accessSync:p=>{if(!disk.has(p)&&!dirs.has(p))throw Error('missing')},readFileSync:(p,e)=>{if(!disk.has(p))throw Error('missing');return disk.get(p)},writeFileSync:(p,d)=>disk.set(p,d),statSync:p=>{if(!disk.has(p))throw Error('missing');const d=disk.get(p);return {size:typeof d==='string'?Buffer.byteLength(d):d.byteLength}},mkdirSync:p=>{let s='';p.split('/').filter(Boolean).forEach(v=>{s+='/'+v;dirs.add(s)})},readdirSync:p=>[...dirs].filter(x=>x.startsWith(p+'/')&&!x.slice(p.length+1).includes('/')).map(x=>x.slice(p.length+1)),rmdirSync:p=>{for(const x of disk.keys())if(x.startsWith(p+'/'))disk.delete(x);for(const x of dirs)if(x===p||x.startsWith(p+'/'))dirs.delete(x)},unlinkSync:p=>disk.delete(p),renameSync:(a,b)=>{disk.set(b,disk.get(a));disk.delete(a)}};
 const wxApi={env:{USER_DATA_PATH:'/user'},getFileSystemManager:()=>fs,downloadFile:o=>{
  calls.push(o.url);let progress;
  const timer=setTimeout(()=>{if(wxApi.fail)return o.fail({errMsg:wxApi.fail});const d=o.url.endsWith('model.json')?JSON.stringify({weightsManifest:[{paths:['group1-shard1of2.bin','group1-shard2of2.bin']}] }):o.url.endsWith('anchors.json')?'[[0,0]]':new Uint8Array(8).buffer;disk.set(o.filePath,d);if(progress)progress({progress:100,totalBytesExpectedToWrite:8});o.success({statusCode:200})},wxApi.delay||1);
  return {abort(){clearTimeout(timer);o.fail({errMsg:'abort'})},onProgressUpdate:fn=>progress=fn};
 }};
 return {wxApi,disk,calls};
}
const config={base:'https://static.example.com',version:'v1'};
test('environment model root/version and release HTTPS validation',()=>{
 assert.deepEqual(resolveModelConfig({apiBase:'http://localhost:8801'},'develop'),{base:'http://localhost:8801/models',version:'v1'});
 assert.equal(resolveModelConfig({},'trial').base,'https://static.example.com');
 assert.equal(resolveModelConfig({modelBase:'https://cdn.example.com/',modelVersion:'v2'},'release').version,'v2');
 assert.throws(()=>resolveModelConfig({modelBase:'http://example.com'},'release'));
 assert.throws(()=>resolveModelConfig({modelBase:'https://example.com',modelVersion:'../bad'},'develop'));
});
test('first load persists all seven files; same version uses cache without network; new version downloads',async()=>{
 const {wxApi,calls,disk}=fixture(),progress=[];
 await createModelLoader(wxApi,config,p=>progress.push(p)).prepare();
 assert.equal(calls.length,7);assert.equal(progress.at(-1),100);assert.ok(progress.every((p,i)=>!i||p>=progress[i-1]));
 const cached=createModelLoader(wxApi,config);await cached.prepare();assert.equal(calls.length,7);
 assert.deepEqual(await (await cached.fetch('beadloop-model://anchors.json')).json(),[[0,0]]);
 await createModelLoader(wxApi,{...config,version:'v2'}).prepare();assert.equal(calls.length,14);
 assert.ok([...disk.keys()].every(p=>!p.includes('/v1/')));
});
test('incomplete or damaged cache redownloads instead of giving corrupt data to TFJS',async()=>{
 const {wxApi,calls,disk}=fixture();await createModelLoader(wxApi,config).prepare();
 disk.delete('/user/beadloop-handpose/v1/handdetector/group1-shard1of2.bin');
 await createModelLoader(wxApi,config).prepare();assert.equal(calls.length,8);
});
test('download failure has actionable photo fallback error and never records completed cache',async()=>{
 const {wxApi,disk}=fixture();wxApi.fail='network';
 await assert.rejects(createModelLoader(wxApi,config).prepare(),/照片试戴/);
 assert.ok(!disk.has('/user/beadloop-handpose/v1/complete.json'));
});
test('timeout aborts pending download, quota errors are explicit, unsafe remote manifest paths rejected',async()=>{
 const f=fixture();f.wxApi.delay=100;
 await assert.rejects(createModelLoader(f.wxApi,config,()=>{},{timeoutMs:5}).prepare(),/20 秒|取消/);
 const q=fixture();await assert.rejects(createModelLoader(q.wxApi,config,()=>{},{limitBytes:4}).prepare(),/空间/);
 const loader=createModelLoader(f.wxApi,config);await assert.rejects(loader.fetch('beadloop-model://../secret'),/路径/);
});
test('legacy AR entry redirects to photo page after subpackage failure',()=>{
 let definition;global.Page=d=>definition=d;
 delete require.cache[require.resolve('../pages/ar-tryon/ar-tryon')];require('../pages/ar-tryon/ar-tryon');
 const page={...definition,data:{},setData(d){Object.assign(this.data,d)}};let route='';
 global.wx={redirectTo:o=>{route=o.url;if(o.fail)o.fail({})}};
 page.onLoad();assert.match(page.data.error,/照片试戴/);page.photoTryon();assert.equal(route,'/pages/tryon/tryon');
 delete global.Page;delete global.wx;
});
test('AR model download failure exits loading state and provides photo navigation',async()=>{
 let definition;global.Page=d=>definition=d;
 const runtimePath=require.resolve('../ar-hand/runtime');
 const old=require.cache[runtimePath];require.cache[runtimePath]={id:runtimePath,filename:runtimePath,loaded:true,exports:{createTracker:async()=>{throw Error('模型下载失败')}}};
 delete require.cache[require.resolve('../ar-hand/index')];require('../ar-hand/index');
 let route='';global.getApp=()=>({globalData:{apiBase:'http://localhost:8801'}});
 global.wx={authorize:o=>o.success(),getAccountInfoSync:()=>({miniProgram:{envVersion:'develop'}}),redirectTo:o=>route=o.url};
 const page={...definition,data:{...definition.data,beads:['sample']},setData(d){Object.assign(this.data,d)},createSelectorQuery(){return {select(){return this},fields(){return this},exec(cb){cb([{node:{getContext:()=>({})}}])}}}};
 await page.initialize();assert.match(page.data.error,/模型下载失败/);assert.equal(page.data.modelLoading,false);assert.equal(page.data.cameraMounted,false);page.photoTryon();assert.equal(route,'/pages/tryon/tryon');
 if(old)require.cache[runtimePath]=old;else delete require.cache[runtimePath];delete global.Page;delete global.wx;delete global.getApp;
});

test('slow download with continuing progress is not cut off by initial deadline',async()=>{
 const f=fixture(), original=f.wxApi.downloadFile;
 f.wxApi.downloadFile=o=>{
  assert.equal(Object.hasOwn(o,'timeout'),false,'单文件下载不能设置总时限');
  const task=original(o);
  let tick;const before=task.onProgressUpdate;
  task.onProgressUpdate=fn=>{before(fn);tick=setInterval(()=>fn({progress:25,totalBytesExpectedToWrite:8}),4)};
  const abort=task.abort;task.abort=()=>{clearInterval(tick);abort()};
  const success=o.success,fail=o.fail;
  o.success=result=>{clearInterval(tick);success(result)};o.fail=error=>{clearInterval(tick);fail(error)};
  return task;
 };
 f.wxApi.delay=35;
 await createModelLoader(f.wxApi,config,()=>{},{timeoutMs:8}).prepare();
 assert.equal(f.calls.length,7);
});
test('retry after midway failure downloads only missing files',async()=>{
 const f=fixture(),original=f.wxApi.downloadFile;let attempts=0;
 f.wxApi.downloadFile=o=>{attempts++;if(attempts===4){setTimeout(()=>o.fail({errMsg:'network'}),1);return {abort(){},onProgressUpdate(){}}}return original(o)};
 await assert.rejects(createModelLoader(f.wxApi,config).prepare(),/照片试戴/);
 assert.equal(f.calls.length,3);
 await createModelLoader(f.wxApi,config).prepare();
 assert.equal(f.calls.length,7);
 assert.ok(f.disk.has('/user/beadloop-handpose/v1/complete.json'));
});
