const api = require('../../utils/api')
const store = require('../../utils/design')
const templates = require('../../utils/template')
const wrist = require('../home/data').wrist
const imageCompress = require('./compress')
const distance = (a,b) => 2*(a[0]-b[0])**2+4*(a[1]-b[1])**2+3*(a[2]-b[2])**2
const rgb = h => {const x=String(h||'').match(/^#([a-f0-9]{6})$/i); return x ? [0,2,4].map(i=>parseInt(x[1].slice(i,i+2),16)) : [190,190,190]}
const beadRgb = b => {const a=rgb((b.c||[])[0]), c=rgb((b.c||[])[1]||(b.c||[])[0]);return a.map((n,i)=>n*.45+c[i]*.55)}
const within = (promise, ms, fallback = null) => new Promise(resolve => {
  let done = false
  const finish = value => { if (done) return; done = true; clearTimeout(timer); resolve(value) }
  const timer = setTimeout(() => finish(fallback), ms)
  Promise.resolve(promise).then(finish, () => finish(fallback))
})
const bounded = (promise, ms, message) => new Promise((resolve, reject) => {
  let done = false
  const timer = setTimeout(() => {
    if (done) return
    done = true
    reject(new Error(message))
  }, ms)
  Promise.resolve(promise).then(value => {
    if (done) return
    done = true
    clearTimeout(timer)
    resolve(value)
  }, error => {
    if (done) return
    done = true
    clearTimeout(timer)
    reject(error)
  })
})
function metalColor(c) {let [r,g,b]=c.map(x=>x/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0;if(mx!==mn){let d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return (h>=30&&h<=60&&s>.35&&l>.5)||(s<.1&&l>.72)}
function palette(data,n) {
 const at=(x,y)=>{let i=(y*n+x)*4;return [data[i],data[i+1],data[i+2]]},border=[]
 for(let k=0;k<n;k++)border.push(at(k,0),at(k,n-1),at(0,k),at(n-1,k))
 const bg=[0,1,2].map(i=>border.reduce((s,c)=>s+c[i],0)/border.length),pixels=[]
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const c=at(x,y);if(distance(c,bg)>9*40*40)pixels.push(c)}
 if(pixels.length<40)return []
 pixels.sort((a,b)=>a[0]+a[1]+a[2]-b[0]-b[1]-b[2])
 let centers=[.15,.4,.65,.9].map(f=>pixels[Math.floor(f*(pixels.length-1))].slice())
 for(let i=0;i<10;i++){let sums=centers.map(()=>[0,0,0,0]);pixels.forEach(p=>{let best=0;centers.forEach((c,j)=>{if(distance(p,c)<distance(p,centers[best]))best=j});let a=sums[best];p.forEach((v,j)=>a[j]+=v);a[3]++});centers=sums.map((s,j)=>s[3]?[s[0]/s[3],s[1]/s[3],s[2]/s[3]]:centers[j])}
 let sums=centers.map(()=>0);pixels.forEach(p=>{let best=0;centers.forEach((c,j)=>{if(distance(p,c)<distance(p,centers[best]))best=j});sums[best]++})
 return centers.map((c,i)=>({rgb:c,share:sums[i]/pixels.length})).filter(x=>x.share>=.04).sort((a,b)=>b.share-a.share)
}
Page({
  data: { photo: '', busy: false, stage: '', result: null, catalog: [], options: [], mainIndex: 0, accentIndex: 0, metalIndex: 0, every: 4, error: '', preview: [], price: 0, length: 0, beadCount: 0, roles: [], selectedMain:'',selectedAccent:'',selectedMetal:'', wrist:15, intervals:[2,3,4,6] },
  onLoad() {
    api.catalog().then(c => {
      const catalog = c.beads || []
      this.setData({wrist: wrist()})
      const options = [{ id: '', name: '不使用' }].concat(catalog.map(b => ({ id: b.id, name: `${b.name} ${b.mm}mm` })))
      this.setData({ catalog, options })
    }).catch(e => this.setData({ error: e.message }))
  },
  choose() {
    if (this.data.busy) return
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], success: r => {
      const file = r.tempFiles && r.tempFiles[0]
      if (!file) return
      this.setData({ photo: file.tempFilePath, result: null, error: '' }, () => this.recognize())
    }, fail: () => {} })
  },
  async recognize() {
    if (!this.data.photo || this.data.busy) return
    const run = (this.recognitionRun || 0) + 1
    this.recognitionRun = run
    const hardTimer = setTimeout(() => {
      if (this.recognitionRun !== run) return
      this.recognitionRun++
      this.setData({ busy: false, error: '识别超时，请换一张较小、更清晰的手串照片后重试。', stage: '' })
    }, this.recognitionHardTimeoutMs || 45000)
    this.setData({ busy: true, error: '', stage: '正在处理照片…' })
    try {
      const prepared = await bounded(imageCompress.prepare(this.data.photo), this.compressTimeoutMs || 20000, '图片压缩超时，请裁剪照片或换一张后重试。')
      const compressed = prepared.path
      if (this.recognitionRun !== run) return
      this.setData({ stage: '正在读取照片…' })
      const base64 = await bounded(new Promise((resolve, reject) => wx.getFileSystemManager().readFile({ filePath: compressed, encoding: 'base64', success: r => resolve(r.data), fail: reject })), this.readTimeoutMs || 8000, '图片读取超时')
      if (this.recognitionRun !== run) return
      const type = base64.startsWith('iVBORw0KGgo') ? 'png' : base64.startsWith('UklGR') ? 'webp' : base64.startsWith('/9j/') ? 'jpeg' : ''
      if (!type) { this.setData({ error: '请使用 PNG、JPEG 或 WebP 图片。' }); return }
      let result
      // Some HarmonyOS WeChat builds never fire offscreen-image load/error.
      // Start AI immediately and bound the optional local colour fallback so the
      // page always leaves its loading state.
      this.setData({ stage: '正在识别珠子…' })
      const localPromise = within(this.localRecognize(compressed), this.localTimeoutMs || 2500)
      const aiPromise = api.request('/ai/photo', { image: `data:image/${type};base64,${base64}` }, undefined, { timeout: 30000 })
      try { result = await aiPromise; result.source = 'ai' }
      catch (err) { result = await localPromise; if (!result) throw err }
      if (this.recognitionRun !== run) return
      const local = await localPromise
      if (result.ok === false) { this.setData({ error: (result.seen || '没有识别到可用的手串') + '，请换一张清晰照片。', result: null }); return }
      const pool = this.data.catalog.filter(b => b.mat !== 'metal' && !b.spacer && b.mm >= 6 && b.mm <= 12 && !/佛头|三通/.test(b.name))
      if (!pool.some(b => b.id === result.main)) result = local
      if (!result || !pool.some(b => b.id === result.main)) { this.setData({ error: '没有识别到可用的手串，请换一张清晰照片。', result: null }); return }
      if (!pool.some(b => b.id === result.accent) || result.accent === result.main) result.accent = ''
      if (!this.data.catalog.some(b => b.mat === 'metal' && b.id === result.metal)) result.metal = ''
      result.colors = local && local.colors || {}
      result.every = Math.max(2, Math.min(6, Math.round(Number(result.every)) || 4))
      const find = id => Math.max(0, this.data.options.findIndex(o => o.id === id))
      this.setData({ result, mainIndex: find(result.main), accentIndex: find(result.accent), metalIndex: find(result.metal), every: result.every || 4 }, () => this.renderResult())
    } catch (err) {
      this.setData({ error: err.message || '识别暂不可用，请稍后再试。', result: null })
    } finally {
      clearTimeout(hardTimer)
      if (this.recognitionRun === run) this.setData({ busy: false, stage: '' })
    }
  },
  async paletteFor(path) {
    if (typeof wx.createOffscreenCanvas !== 'function') throw new Error('本机颜色识别不可用')
    const n=64,canvas=wx.createOffscreenCanvas({type:'2d',width:n,height:n}),ctx=canvas.getContext('2d'),img=canvas.createImage()
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=path})
    const side=Math.min(img.width,img.height);ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,n,n)
    return palette(ctx.getImageData(0,0,n,n).data,n)
  },
  async localRecognize(path) {
    const colors=await this.paletteFor(path),body=colors.filter(c=>!metalColor(c.rgb)),metal=colors.find(c=>metalColor(c.rgb))
    if(!body.length) throw new Error('未识别颜色')
    const pool=this.data.catalog.filter(b=>b.mat!=='metal'&&!b.spacer&&b.mm>=6&&b.mm<=12&&!/佛头|三通/.test(b.name)), metals=this.data.catalog.filter(b=>b.mat==='metal')
    const rank=(color,list,mm)=>list.slice().sort((a,b)=>distance(color,beadRgb(a))+(mm&&a.mm!==mm?6000:0)-distance(color,beadRgb(b))-(mm&&b.mm!==mm?6000:0))
    const main=rank(body[0].rgb,pool,8)[0];if(!main)throw new Error('未找到相近材料')
    const accentColor=body.slice(1).find(p=>p.share>=.12&&distance(p.rgb,body[0].rgb)>9*45*45),accent=accentColor&&rank(accentColor.rgb,pool.filter(b=>b.name!==main.name),main.mm)[0],metalBead=metal&&rank(metal.rgb,metals)[0]
    const share=accentColor?accentColor.share/(body[0].share+accentColor.share):0
    return {ok:true,source:'local',seen:'按照片颜色估算，请确认实际材料',main:main.id,accent:accent&&accent.id||'',metal:metalBead&&metalBead.id||'',every:accentColor?Math.max(2,Math.min(6,Math.round(1/Math.max(share,.17)))):4,colors:{main:body[0].rgb,accent:accentColor&&accentColor.rgb,metal:metal&&metal.rgb}}
  },
  change(e) { this.setData({ [e.currentTarget.dataset.key]: Number(e.detail.value) },()=>this.renderResult()) },
  chooseRole(e) { const key=e.currentTarget.dataset.role+'Index', id=e.currentTarget.dataset.id; const index=this.data.options.findIndex(o=>o.id===id); const changes={[key]:Math.max(0,index)}; if(e.currentTarget.dataset.role==='main' && this.data.options[this.data.accentIndex] && this.data.options[this.data.accentIndex].id===id) changes.accentIndex=0; this.setData(changes,()=>this.renderResult()) },
  interval(e) {this.setData({every:Number(e.currentTarget.dataset.value)},()=>this.renderResult())},
  renderResult() {
    const {options,catalog,mainIndex,accentIndex,metalIndex,every,wrist}=this.data; const main=options[mainIndex],accent=options[accentIndex],metal=options[metalIndex]; if(!main||!main.id)return;
    const mainBead=catalog.find(b=>b.id===main.id); if(!mainBead)return;
    const pool=catalog.filter(b=>b.mat!=='metal'&&!b.spacer&&b.mm>=6&&b.mm<=12&&!/佛头|三通/.test(b.name)), metals=catalog.filter(b=>b.mat==='metal');
    const colors=this.data.result && this.data.result.colors || {}; const rank=(selected,list,role)=>[...list].sort((a,b)=>Number(b.id===selected)-Number(a.id===selected)||(colors[role] ? distance(colors[role],beadRgb(a))-distance(colors[role],beadRgb(b))+(role!=='metal'&&a.mm!==mainBead.mm?6000:0)-(role!=='metal'&&b.mm!==mainBead.mm?6000:0) : Math.abs((a.mm||0)-mainBead.mm)-Math.abs((b.mm||0)-mainBead.mm))).slice(0,6).map(b=>({...b,color:(b.c||[])[0]||'#ccc',dark:(b.c||[])[1]||'#999',active:b.id===selected}));
    const roles=[{key:'main',title:'主珠',hint:'数量最多的',none:false,options:rank(main.id,pool,'main')},{key:'accent',title:'配珠',none:true,noneActive:!accent||!accent.id,options:rank(accent&&accent.id,pool.filter(b=>b.id!==main.id),'accent')},{key:'metal',title:'金属点缀',none:true,noneActive:!metal||!metal.id,options:rank(metal&&metal.id,metals,'metal')}];
    const interval=Math.max(2,Math.min(6,Number(every)||4));const pattern=Array(interval-1).fill(main.id);pattern.push(accent&&accent.id||main.id);if(metal&&metal.id)pattern.push(metal.id);
    const ids=templates.build({pattern},catalog,wrist)||[], map=Object.fromEntries(catalog.map(b=>[b.id,b])); let price=15,length=0;
    const preview=ids.map((id,i)=>{const b=map[id],a=2*Math.PI*i/ids.length-Math.PI/2; price+=Number(b.price)||0;length+=Number(b.mm)||0;return {key:i,x:50+35*Math.cos(a),y:50+35*Math.sin(a),color:(b.c||[])[0]||'#ccc',dark:(b.c||[])[1]||'#999'}});
    this.setData({roles,preview,previewIds:ids,price:price.toFixed(2),length,beadCount:ids.length,selectedMain:main.id,selectedAccent:accent&&accent.id||'',selectedMetal:metal&&metal.id||''})
  },
  edit() {
    const { options, catalog, mainIndex, accentIndex, metalIndex, every } = this.data
    const main = options[mainIndex], accent = options[accentIndex], metal = options[metalIndex]
    if (!main || !main.id) return wx.showToast({ title: '请选择主珠', icon: 'none' })
    const bead = catalog.find(b => b.id === main.id); if (!bead || !bead.mm) return wx.showToast({ title: '珠子资料不可用', icon: 'none' })
    const d = store.create(); d.wrist = wrist()
    const interval = Math.max(2, Math.min(6, Number(every) || 4))
    const pattern = Array(interval-1).fill(main.id); pattern.push(accent && accent.id || main.id); if (metal && metal.id) pattern.push(metal.id)
    const beads = templates.build({pattern}, catalog, d.wrist)
    if (!beads || beads.length < 6) return wx.showToast({title:'材料无法生成合适的手串，请调整后重试',icon:'none'})
    d.name = '照片同款'; d.beads = beads; store.selected(d)
    require('../../utils/nav').openEditor()
  },
  privacyRejected() { this.setData({busy:false, error:'未授权照片或相机权限。你仍可返回首页使用模板或自由 DIY。'}) }
})
