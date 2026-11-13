const api = require('../../utils/api')
const store = require('../../utils/design')
const nav = require('../../utils/nav')

function viewerWrist() {
  const value = Number(wx.getStorageSync('cgz_wrist'))
  return value >= 8 && value <= 30 ? { value, measured: true } : { value: 15, measured: false }
}

function reflow(shared, catalog, wrist) {
  if ((shared.pattern || []).length) return store.fromTemplate(shared, catalog, wrist)
  return { ...store.create(), ...shared, wrist, beads: (shared.beads || []).slice(), source: 'shared' }
}

function meaningFor(shared, catalog) {
  const written = String(shared.meaning || '').trim()
  if (written) return written
  const byId = Object.fromEntries(catalog.map(bead => [bead.id, bead]))
  const words = []
  ;(shared.beads || []).forEach(id => {
    const bead = byId[id]
    if (!bead) return
    ;(bead.tags || []).forEach(tag => {
      if (tag && tag !== '点缀' && !words.includes(tag) && words.length < 3) words.push(tag)
    })
  })
  return words.join(' · ')
}

function dateLabel(milliseconds) {
  const date = new Date(Number(milliseconds))
  return Number.isFinite(date.getTime()) ? `${date.getMonth() + 1} 月 ${date.getDate()} 日串的` : ''
}

Page({
  data: { design: null, catalog: [], notes: [], error: '', loading: true, deleted: false, measured: false, authorLabel: '', dateLabel: '', meaning: '', tags: '' },
  onLoad(options) {
    const id = options.id || options.scene || ''
    if (!/^[A-Za-z0-9_-]{43}$/.test(id)) { this.setData({ loading: false, error: '分享链接无效' }); return }
    Promise.all([api.request('/shares/' + id), api.catalog()]).then(([shared, response]) => {
      const catalog = response.beads || [], wrist = viewerWrist()
      const design = reflow(shared, catalog, wrist.value)
      const map = Object.fromEntries(catalog.map(b => [b.id, b]))
      const missing = design.beads.some(id => !map[id])
      const counts = {}
      shared.beads.forEach(id => { counts[id] = (counts[id] || 0) + 1 })
      const notes = Object.keys(counts).filter(id => map[id]).map(id => ({ id, name: map[id].name, meaning: map[id].meaning || (map[id].tags || []).join(' · '), count: counts[id] }))
      this.setData({ design, catalog, notes, missing, measured: wrist.measured, loading: false,
        authorLabel: shared.authorLabel || '来自珠养养的一位用户', dateLabel: dateLabel(shared.createdAt),
        meaning: meaningFor(shared, catalog), tags: notes.flatMap(item => item.meaning ? item.meaning.split(' · ') : []).slice(0, 3).join(' · ') })
    }).catch(e => this.setData({ loading: false, deleted: e.status === 404, error: e.status === 404 ? '' : '暂时没连上，请再试一次' }))
  },
  home() { wx.switchTab({ url: '/pages/home/home' }) },
  start() { const design = store.create(); store.selected(design); nav.openWorkbench(design) },
  use() { if (!this.data.design) return; const design = this.data.design; store.selected(design); nav.openWorkbench(design); wx.showToast({ title: this.data.measured ? `已按你的 ${design.wrist}cm 手围排成 ${design.beads.length} 颗` : '先按常见的 15cm 排好', icon: 'none' }) }
})

module.exports = { viewerWrist, reflow, meaningFor, dateLabel }
