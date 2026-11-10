const api = require('../../utils/api')
const store = require('../../utils/design')
const templates = require('../../utils/template')
const wrist = require('../home/data').wrist
const nav = require('../../utils/nav')
Page({
  data: { text: '', messages: [], busy: false, error: '', wrist: 15, hasResults: false, catalog: [], refines:['颜色淡一点','100 以内','换成水晶','男生戴的','再来三条'] },
  onShow() { this.setData({wrist:wrist()}); if (typeof wx.getStorageSync === 'function') { const old=wx.getStorageSync('cgz_ai_chat'); if (Array.isArray(old) && !this.data.messages.length) this.setData({messages:old,hasResults:old.some(m=>m.results&&m.results.length)}); } api.catalog().then(c=>{this.catalog=c.beads||[]; this.setData({catalog:this.catalog}); if(this.data.messages.length)this.setData({messages:this.data.messages.map(m=>m.results?{...m,results:m.results.map(r=>this.decorate(r))}:m)});}).catch(()=>{}); },
  clear() { this.setData({messages:[],hasResults:false,error:''}); if (typeof wx.removeStorageSync === 'function') wx.removeStorageSync('cgz_ai_chat'); },
  refine(e) { this.setData({text:e.currentTarget.dataset.text}); this.submit(); },
  decorate(t) { const catalog=this.catalog||[], map=Object.fromEntries(catalog.map(b=>[b.id,b])); const fixed=Number.isInteger(t.fixed)&&t.fixed>0?t.fixed:null; const ids=(t.pattern||[]).length?(templates.build({...t,fixed},catalog,this.data.wrist)||[]):[]; const materials=ids.map(id=>map[id]); const calculatedPrice=ids.length&&materials.every(Boolean)?Math.round((materials.reduce((sum,b)=>sum+Number(b.price||0),0)+15)*100)/100:''; return {...t,fixed,price:t.price==null||t.price===''?calculatedPrice:t.price,beads:ids,preview:ids.map((id,i)=>{const b=map[id]||{},a=2*Math.PI*i/ids.length-Math.PI/2;return {key:i,x:50+35*Math.cos(a),y:50+35*Math.sin(a),color:(b.c||[])[0]||'#ccc',dark:(b.c||[])[1]||'#aaa',photo:b.photo||''}})} },
  input(e) { this.setData({ text: e.detail.value }) },
  example(e) { this.setData({ text: e.currentTarget.dataset.text }) },
  voice() { wx.showToast({ title: '语音识别暂不可用，请使用文字输入', icon: 'none', duration: 2500 }) },
  async submit() {
    const text = this.data.text.trim()
    if (!text || this.data.busy) return
    const history = this.data.messages.filter(m => m.role === 'me').map(m => m.text).slice(-4)
    const prior = this.data.messages.slice()
    this.setData({ text: '', busy: true, error: '', messages: prior.concat({ role: 'me', text }) })
    try {
      const wristSize = wrist()
      if (this.data.wrist !== wristSize) this.setData({ wrist: wristSize })
      let result, aiError, planError
      // This is the AI entry point: ask the model first so users do not keep
      // receiving the same rule-library defaults. The plan library is only a
      // resilience fallback when the model is unavailable or returns no usable SKU.
      try {
        const design = await api.request('/ai/design', { text, wrist: wristSize, history: this.data.messages.slice(-6).map(m => (m.role === 'me' ? '用户：' : '你：') + m.text) }, 'POST', { timeout: 180000 })
        if (Array.isArray(design.designs) && design.designs.length) result = { results: design.designs, reply: design.reply, by: 'ai' }
      } catch (err) { aiError = err }
      if (!result) {
        try { result = await api.request('/plans/match', { text, wrist: wristSize, history }) } catch (err) { planError = err }
      }
      if (!result) throw aiError || planError || new Error('搭配暂不可用')
      const results = Array.isArray(result.results) ? result.results.map(r=>this.decorate(r)) : []
      const fromAI = result.by === 'ai'
      const reply = result.reply || (results.length ? '为你找到了这些搭配。' : '暂时没有找到合适的搭配，请换个说法试试。')
      const assistantText = fromAI ? reply : 'AI 暂时未响应，先为你展示方案库推荐。\n' + reply
      this.setData({ messages: this.data.messages.concat({ role: 'assistant', text: assistantText, results, source: fromAI ? 'AI 生成' : '方案库兜底' }), hasResults: this.data.hasResults || results.length>0 }); if (typeof wx.setStorageSync==='function') wx.setStorageSync('cgz_ai_chat',this.data.messages.slice(-20))
    } catch (err) {
      const draft = this.data.text.trim()
      this.setData({ text: draft || text, error: (err.message || '搭配失败，请重试') + (draft ? '。上次未发送成功：' + text : ''), messages: prior })
    } finally { this.setData({ busy: false }) }
  },
  use(e) {
    const message = this.data.messages[Number(e.currentTarget.dataset.message)]
    const t = message && message.results[Number(e.currentTarget.dataset.index)]
    if (!t || !t.pattern || !t.pattern.length) return wx.showToast({ title: '方案无法使用', icon: 'none' })
    const d = store.fromTemplate(t, this.catalog || [], wrist())
    store.selected(d)
    nav.openEditor()
  }
})
