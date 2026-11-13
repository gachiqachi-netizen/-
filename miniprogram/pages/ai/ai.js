const { queue: toast } = require('../../utils/toast')
const api = require('../../utils/api')
const store = require('../../utils/design')
const templates = require('../../utils/template')
const wrist = require('../home/data').wrist
const nav = require('../../utils/nav')
const { queue } = require('../../utils/toast')
const { totalHand } = require('../finish/total')
const money = require('../../utils/money')

const STORAGE = 'cgz_ai_chat'
const EXAMPLES = ['想要清冷一点，上班也能戴', '送闺蜜生日，她喜欢粉色', '想要夏天海边的感觉']
function timeLabel(at) {
  const date = new Date(at), today = new Date()
  const day = date.toDateString() === today.toDateString() ? '今天' : `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return `${day} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
function safeReply(reply, count) {
  const text = String(reply || '')
  return /[0-9０-９¥￥]|\b(?:mm|cm)\b/i.test(text) ? (count ? '为你配了三条，先看看第一条的寓意。' : '这次的条件暂时配不出来，可以换个说法试试。') : (text || (count ? '为你配了三条，先看看第一条的寓意。' : '暂时没有找到合适的搭配，可以换个说法试试。'))
}
function quickReplies(item) {
  if (!item) return []
  return ['都不喜欢，换三条', `更${item.name || '温柔'}一点`, '再便宜一点']
}

Page({
  data: { text: '', messages: [], busy: false, error: '', wrist: 15, hasResults: false, catalog: [], examples: EXAMPLES, chips: [], waitText: '', navTop: 0, navHeight: 88, scrollTo: '' },
  onLoad() {
    if (typeof wx.getSystemInfoSync !== 'function') return
    const info = wx.getSystemInfoSync(), menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect()
    const ratio = 750 / (info.windowWidth || 375)
    this.setData({ navTop: (info.statusBarHeight || 0) * ratio, navHeight: menu ? (menu.bottom - (info.statusBarHeight || 0) + menu.top - (info.statusBarHeight || 0)) * ratio : 88 })
  },
  onShow() {
    const currentWrist = wrist()
    if (this.lastWrist && this.lastWrist !== currentWrist) queue.show({ text: `已按 ${currentWrist}cm 重新判断` })
    this.lastWrist = currentWrist
    this.setData({ wrist: currentWrist })
    const old = typeof wx.getStorageSync === 'function' && wx.getStorageSync(STORAGE)
    if (Array.isArray(old) && !this.data.messages.length) {
      const latest = old.slice().reverse().find(m => m.results && m.results.length)
      this.setData({ messages: old, hasResults: !!latest, chips: latest ? quickReplies(latest.results[latest.activeIndex || 0]) : [] })
    }
    api.catalog().then(c => {
      this.catalog = c.beads || []
      this.pricing = c.pricing || {}
      this.setData({ catalog: this.catalog })
      if (this.data.messages.length) this.setData({ messages: this.data.messages.map(m => m.results ? { ...m, results: m.results.map(r => this.decorate(r)) } : m) })
    }).catch(() => {})
  },
  persist() { if (typeof wx.setStorageSync === 'function') wx.setStorageSync(STORAGE, this.data.messages.slice(-20)) },
  clear() { this.setData({ messages: [], hasResults: false, error: '', text: '', chips: [] }); if (typeof wx.removeStorageSync === 'function') wx.removeStorageSync(STORAGE) },
  input(e) { this.setData({ text: e.detail.value == null ? e.detail : e.detail.value }) },
  example(e) { this.setData({ text: e.currentTarget.dataset.text }); return this.submit() },
  refine(e) { this.setData({ text: e.detail.text || e.currentTarget.dataset.text }); return this.submit() },
  onChip(e) { this.setData({ text: e.detail.text }); return this.submit() },
  onTag() { wx.navigateTo({ url: '/pages/wrist/wrist' }) },
  decorate(t) {
    const catalog = this.catalog || [], map = Object.fromEntries(catalog.map(b => [b.id, b]))
    const fixed = Number.isInteger(t.fixed) && t.fixed > 0 ? t.fixed : null
    const ids = Array.isArray(t.beads) && t.beads.length ? t.beads : ((t.pattern || []).length ? templates.build({ ...t, fixed }, catalog, this.data.wrist) || [] : [])
    const materials = ids.map(id => map[id])
    const goodsFen = materials.length && materials.every(Boolean) ? materials.reduce((sum, b) => sum + (Number.isInteger(b.priceFen) ? b.priceFen : Math.round(Number(b.price || 0) * 100)), 0) : null
    const payableFen = Number.isInteger(t.payableFen) ? t.payableFen : (goodsFen == null ? null : totalHand(goodsFen, this.pricing).payableFen)
    const price = payableFen == null ? '' : payableFen / 100
    const lengthCm = Number.isFinite(t.lengthMm) && t.lengthMm > 0 ? (t.lengthMm / 10).toFixed(1) : ''
    return { ...t, fixed, price, priceText: payableFen == null ? '' : money.yuan(payableFen), beads: ids, beadObjects: materials.filter(Boolean), line: t.line || t.meaning || t.summary || '', tags: t.tags || (t.line ? t.line.split(/[、·]/).filter(Boolean) : []), count: Number.isInteger(t.count) ? t.count : ids.length, lengthCm }

  },
  copyMessage(e) {
    const m = this.data.messages[Number(e.currentTarget.dataset.index)]
    if (m && m.text && wx.setClipboardData) wx.setClipboardData({ data: m.text })
  },
  editMessage(e) { const m = this.data.messages[Number(e.currentTarget.dataset.index)]; if (m && m.role === 'me') this.setData({ text: m.text }) },
  cardScroll(e) {
    const mi = Number(e.currentTarget.dataset.message), m = this.data.messages[mi]
    if (!m || !m.results || !m.results.length) return
    const info = wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: 375 }
    const itemPx = 600 * info.windowWidth / 750
    const index = Math.min(m.results.length - 1, Math.max(0, Math.round(e.detail.scrollLeft / itemPx)))
    if (index === (m.activeIndex || 0)) return
    const messages = this.data.messages.slice(); messages[mi] = { ...m, activeIndex: index }
    this.setData({ messages, chips: quickReplies(m.results[index]) })
  },
  nextCard(e) {
    const mi = Number(e.currentTarget.dataset.message), m = this.data.messages[mi]
    if (!m || !m.results || !m.results.length) return
    const index = ((m.activeIndex || 0) + 1) % m.results.length
    const messages = this.data.messages.slice(); messages[mi] = { ...m, activeIndex: index, scrollId: `rec-${mi}-${index}` }
    this.setData({ messages, chips: quickReplies(m.results[index]) })
  },
  async submit() {
    const text = String(this.data.text || '').trim()
    if (!text || this.data.busy) return
    const history = this.data.messages.filter(m => m.role === 'me').map(m => m.text).slice(-4)
    const prior = this.data.messages.slice(), now = Date.now(), last = prior[prior.length - 1]
    const marker = !last || now - Number(last.at || 0) >= 300000 || new Date(last.at).toDateString() !== new Date(now).toDateString()
    this.setData({ text: '', busy: true, error: '', waitText: '正在配……', messages: prior.concat({ role: 'me', text, at: now, time: marker ? timeLabel(now) : '' }) })
    this.waitTimer1 = setTimeout(() => this.setData({ waitText: '还在挑珠子……' }), 5000)
    this.waitTimer2 = setTimeout(() => this.setData({ waitText: '比平时慢，再等一下' }), 12000)
    try {
      const wristSize = wrist()
      if (this.data.wrist !== wristSize) this.setData({ wrist: wristSize })
      let result, aiError, planError
      try {
        const design = await api.request('/ai/design', { text, wrist: wristSize, history: this.data.messages.slice(-6).map(m => (m.role === 'me' ? '用户：' : '你：') + m.text) }, 'POST', { timeout: 180000 })
        if (Array.isArray(design.plans) && design.plans.length) result = { results: design.plans.map((p, i) => ({ ...(design.designs || [])[i], name: p.name, beads: p.beads, count: p.count, lengthMm: p.lengthMm, payableFen: p.payableFen, line: p.line, fromPlan: true })), reply: design.reply || design.message, by: 'ai', quickReplies: design.quickReplies }
        else if (Array.isArray(design.designs) && design.designs.length) result = { results: design.designs, reply: design.reply || design.message, by: 'ai', quickReplies: design.quickReplies }
      } catch (err) { aiError = err }
      if (!result) {
        try { result = await api.request('/plans/match', { text, wrist: wristSize, history }) } catch (err) { planError = err }
      }
      if (!result) throw aiError || planError || new Error('搭配暂不可用')
      const results = Array.isArray(result.results) ? result.results.map(r => this.decorate(r)) : []
      const fromAI = result.by === 'ai'
      const reply = safeReply(result.reply, results.length)
      const assistantText = fromAI ? reply : 'AI 暂时未响应，先为你展示方案库推荐。\n' + reply
      const messages = this.data.messages.concat({ role: 'assistant', text: assistantText, results, activeIndex: 0, source: fromAI ? 'AI 生成' : '方案库兜底', at: Date.now() })
      this.setData({ messages, hasResults: this.data.hasResults || results.length > 0, chips: quickReplies(results[0]), scrollTo: 'chat-end' })
      this.persist()
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
    } catch (err) {
      const draft = String(this.data.text || '').trim()
      this.setData({ text: draft || text, error: (err.message || '搭配失败，请重试') + (draft ? '。上次未发送成功：' + text : ''), messages: prior.concat({ role: 'me', text, at: now, failed: true, time: marker ? timeLabel(now) : '' }), scrollTo: 'chat-end' })
      this.persist()
    } finally {
      clearTimeout(this.waitTimer1); clearTimeout(this.waitTimer2)
      this.setData({ busy: false, waitText: '' })
    }
  },
  retry(e) { const m = this.data.messages[Number(e.currentTarget.dataset.index)]; if (!m) return; this.setData({ messages: this.data.messages.filter(x => x !== m), text: m.text, error: '' }); return this.submit() },
  designAt(e) {
    const m = this.data.messages[Number(e.currentTarget.dataset.message)]
    return m && m.results && m.results[Number(e.currentTarget.dataset.index)]
  },
  saveResult(t) { const d = t.fromPlan && t.beads && t.beads.length ? { ...store.create(), name: t.name, meaning: t.meaning || t.line, beads: t.beads.slice(), wrist: wrist(), source: 'ai' } : store.fromTemplate(t, this.catalog || [], wrist()); if (typeof wx.setStorageSync === 'function') store.save(d); store.selected(d); return d },
  openDetail(e) { const t = this.designAt(e); if (!t) return; this.saveResult(t); wx.navigateTo({ url: '/pages/finish/finish' }) },
  use(e) {
    const t = this.designAt(e)
    if (!t || (!(t.pattern && t.pattern.length) && !(t.fromPlan && t.beads && t.beads.length))) return toast.show({ text: '方案无法使用' })
    this.saveResult(t); nav.openEditor()
  },
  order(e) { const t = this.designAt(e); if (!t) return; this.saveResult(t); nav.openOrder() },
})
