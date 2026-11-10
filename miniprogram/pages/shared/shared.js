const api = require('../../utils/api')
const store = require('../../utils/design')

function viewerWrist() {
  const value = Number(wx.getStorageSync('cgz_wrist'))
  return value >= 8 && value <= 30 ? { value, measured: true } : { value: 15, measured: false }
}

function reflow(shared, catalog, wrist) {
  if ((shared.pattern || []).length) return store.fromTemplate(shared, catalog, wrist)
  return { ...store.create(), ...shared, wrist, beads: (shared.beads || []).slice(), source: 'shared' }
}

Page({
  data: { design: null, catalog: [], items: [], notes: [], price: '--', error: '', loading: true, measured: false },
  onLoad(options) {
    const id = options.id || ''
    if (!/^[A-Za-z0-9_-]{43}$/.test(id)) { this.setData({ loading: false, error: '分享链接无效' }); return }
    Promise.all([api.request('/shares/' + id), api.catalog()]).then(([shared, response]) => {
      const catalog = response.beads || [], wrist = viewerWrist()
      const design = reflow(shared, catalog, wrist.value)
      const map = Object.fromEntries(catalog.map(b => [b.id, b]))
      const missing = design.beads.some(id => !map[id])
      const items = design.beads.map((id, i) => { const a = 2 * Math.PI * i / design.beads.length - Math.PI / 2; return { id, x: 50 + 37 * Math.cos(a), y: 50 + 37 * Math.sin(a), color: map[id] && map[id].c && map[id].c[0] || '#bbb' } })
      const notes = Array.from(new Set(design.beads)).filter(id => map[id]).map(id => ({ id, name: map[id].name, meaning: (map[id].tags || []).join(' · ') || '精心搭配' }))
      const price = missing ? '--' : (15 + design.beads.reduce((sum, id) => sum + Number(map[id].price || 0), 0)).toFixed(2)
      this.setData({ design, catalog, items, notes, price, missing, measured: wrist.measured, loading: false })
    }).catch(e => this.setData({ loading: false, error: e.message || '分享暂不可用' }))
  },
  use() { if (!this.data.design) return; store.selected(this.data.design); wx.navigateTo({ url: '/pages/editor/editor' }) },
  buySame() { if (!this.data.design || this.data.missing) return; store.selected(this.data.design); wx.navigateTo({ url: '/pages/order/order' }) }
})

module.exports = { viewerWrist, reflow }
