const KEY='cgz_miniprogram_designs'
const queues = Object.create(null)
function list(){return wx.getStorageSync(KEY)||[]}
function save(d){const all=list(), i=all.findIndex(x=>x.id===d.id); if(i<0) all.unshift(d); else all[i]=d; wx.setStorageSync(KEY,all); return d}
function selected(d){wx.setStorageSync('cgz_current_design',d)}
function current(){return wx.getStorageSync('cgz_current_design')||null}
function create(){return {id:'d'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:'我的手串',wrist:15,beads:[]}}
function sync(d){
  const id=d.id, snapshot={name:d.name,beads:d.beads.slice(),wrist:d.wrist}
  for(const key of ['special','pattern','tail','fixed','source','tplId','meaning','edited']) if(d[key]!==undefined) snapshot[key]=Array.isArray(d[key])?d[key].slice():d[key]
  const prior=queues[id]||Promise.resolve()
  const task=prior.catch(()=>{}).then(()=>{
    const auth=require('./auth'), latest=list().find(x=>x.id===id)
    if(!latest)throw new Error('本机设计不存在')
    const payload={...snapshot}; if(latest.cloudId && latest.cloudUpdatedAt)payload.expectedUpdatedAt=latest.cloudUpdatedAt
    return auth.authorized('/designs'+(latest.cloudId?'/'+encodeURIComponent(latest.cloudId):''),payload,latest.cloudId?'PUT':'POST')
  }).then(remote=>{
    const latest=list().find(x=>x.id===id)
    if(latest){latest.cloudId=remote.id;latest.cloudUpdatedAt=remote.updatedAt;latest.syncedAt=Date.now();latest.syncedSnapshot=JSON.stringify(snapshot);save(latest);const open=current();if(open&&open.id===id){open.cloudId=remote.id;open.cloudUpdatedAt=remote.updatedAt;selected(open)}}
    return remote
  })
  queues[id]=task
  task.finally(()=>{if(queues[id]===task)delete queues[id]}).catch(()=>{})
  return task
}
module.exports={list,save,sync,selected,current,create}
