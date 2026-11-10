const KEY='cgz_miniprogram_designs'
const templates=require('./template')
const queues = Object.create(null)
const CLOUD_FIELDS=['special','pattern','tail','fixed','source','tplId','meaning','edited']
function snapshotOf(d){const s={name:d.name,beads:(d.beads||[]).slice(),wrist:d.wrist};for(const k of CLOUD_FIELDS)if(d[k]!==undefined)s[k]=Array.isArray(d[k])?d[k].slice():d[k];return s}
// 旧内存对象不允许覆盖掉已知的云端版本号，否则后续同步永远 409
function mergeCloud(d,prev){if(!prev||prev.id!==d.id||!prev.cloudId)return d;const m={...d};if(!m.cloudId)m.cloudId=prev.cloudId;if(m.cloudId===prev.cloudId&&(!m.cloudUpdatedAt||prev.cloudUpdatedAt>m.cloudUpdatedAt)){m.cloudUpdatedAt=prev.cloudUpdatedAt;m.syncedAt=prev.syncedAt;m.syncedSnapshot=prev.syncedSnapshot}return m}
function list(){return wx.getStorageSync(KEY)||[]}
function save(d){const all=list(), i=all.findIndex(x=>x.id===d.id); const merged=i<0?d:mergeCloud(d,all[i]); if(i<0) all.unshift(merged); else all[i]=merged; wx.setStorageSync(KEY,all); return merged}
function selected(d){wx.setStorageSync('cgz_current_design',mergeCloud(d,wx.getStorageSync('cgz_current_design')))}
function current(){return wx.getStorageSync('cgz_current_design')||null}
function create(){return {id:'d'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:'我的手串',wrist:15,beads:[]}}
function fromTemplate(source,catalog,wrist){
  const d=create(), fixed=Number.isInteger(source.fixed)&&source.fixed>0?source.fixed:null
  d.name=source.name||'我的手串';d.wrist=wrist;d.pattern=(source.pattern||[]).slice();d.special=(source.special||[]).slice();d.tail=(source.tail||[]).slice()
  d.fixed=fixed;d.meaning=source.meaning||'';d.source=source.source||source.src||'ai';d.tplId=source.tplId||source.id||''
  d.beads=templates.build({...source,fixed},catalog,wrist)||[]
  return d
}
function sync(d){
  const id=d.id, snapshot=snapshotOf(d)
  const prior=queues[id]||Promise.resolve()
  const task=prior.catch(()=>{}).then(async ()=>{
    const auth=require('./auth'), latest=list().find(x=>x.id===id)
    if(!latest)throw new Error('本机设计不存在')
    if(!latest.cloudId)return auth.authorized('/designs',{...snapshot},'POST')
    const put=expected=>{const payload={...snapshot};if(expected)payload.expectedUpdatedAt=expected;return auth.authorized('/designs/'+encodeURIComponent(latest.cloudId),payload,'PUT')}
    try{return await put(latest.cloudUpdatedAt)}
    catch(e){
      if(e.code!=='design_conflict')throw e
      const rows=await auth.authorized('/designs'), remote=(rows||[]).find(r=>r.id===latest.cloudId)
      if(!remote)throw e
      const now=list().find(x=>x.id===id)||latest
      // 云端内容和上次同步一致（或旧数据没有快照）：只是本机版本号落后，刷新后重试一次；真被别的设备改过才报冲突
      if(now.syncedSnapshot&&JSON.stringify(snapshotOf(remote))!==now.syncedSnapshot)throw e
      return put(remote.updatedAt)
    }
  }).then(remote=>{
    const latest=list().find(x=>x.id===id)
    if(latest){latest.cloudId=remote.id;latest.cloudUpdatedAt=remote.updatedAt;latest.syncedAt=Date.now();latest.syncedSnapshot=JSON.stringify(snapshot);save(latest);const open=current();if(open&&open.id===id){open.cloudId=remote.id;open.cloudUpdatedAt=remote.updatedAt;selected(open)}}
    return remote
  })
  queues[id]=task
  task.finally(()=>{if(queues[id]===task)delete queues[id]}).catch(()=>{})
  return task
}
module.exports={list,save,sync,selected,current,create,fromTemplate}
