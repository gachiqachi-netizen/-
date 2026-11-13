const store = require('../../utils/design')
const auth = require('../../utils/auth')
const api = require('../../utils/api')
const nav = require('../../utils/nav')
const { queue } = require('../../utils/toast')
const KEY = 'cgz_miniprogram_designs'

function rowsOf(items) {
  return items.map(d => {
    const date = new Date(d.updatedAt || d.createdAt || 0)
    const when = date.getTime() ? (date.toDateString() === new Date().toDateString()
      ? `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      : `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`) : ''
    return { ...d, line: d.meaning || '自己串的，独一无二', sub: `${(d.beads || []).length} 颗${when ? ' · ' + when : ''}${d.cloudId ? '' : ' · 还没同步'}` }
  })
}

Page({
  data: { works: [], catalog: [], loading: false, failed: false, menu: false, editing: '', rename: '', active: null },
  onShow() {
    this.refresh()
    api.catalog().then(c => this.setData({ catalog: c.beads || [] })).catch(() => {})
    if (auth.hasSession()) this.sync()
  },
  onUnload() { if (this.deleteTimer) clearTimeout(this.deleteTimer) },
  refresh() { this.setData({ works: rowsOf(store.list()) }) },
  async sync() {
    this.setData({ loading: true, failed: false })
    try {
      await auth.syncLocalWorks()
      const remote = await auth.authorized('/designs')
      const known = new Set(store.list().map(d => d.cloudId).filter(Boolean))
      for (const d of remote || []) if (!known.has(d.id)) store.save({ ...d, id: 'cloud-' + d.id, cloudId: d.id, cloudUpdatedAt: d.updatedAt })
      this.refresh()
      queue.show({ text: '作品已同步' })
    } catch (_) { this.setData({ failed: true }) }
    finally { this.setData({ loading: false }) }
  },
  back() { wx.navigateBack() },
  newWork() { const d = store.create(); store.selected(d); nav.openWorkbench(d) },
  open(e) { const d = store.list().find(item => item.id === e.currentTarget.dataset.id); if (d) nav.openWorkbench(d) },
  more(e) { const d = store.list().find(item => item.id === e.currentTarget.dataset.id); if (d) this.setData({ active: d, menu: true }) },
  closeMenu() { this.setData({ menu: false }) },
  copy() {
    const source = this.data.active
    const d = { ...source, id: store.create().id, name: source.name + ' 2', cloudId: '', cloudUpdatedAt: '', syncedAt: 0, updatedAt: Date.now(), beads: (source.beads || []).slice() }
    store.save(d); this.closeMenu(); this.refresh(); queue.show({ text: '已复制' })
    if (auth.hasSession()) store.sync(d).then(() => this.refresh()).catch(() => {})
  },
  startRename() { this.setData({ editing: this.data.active.id, rename: this.data.active.name, menu: false }) },
  renameInput(e) { this.setData({ rename: e.detail.value }) },
  finishRename() {
    const name = this.data.rename.trim(), d = store.list().find(item => item.id === this.data.editing)
    this.setData({ editing: '' })
    if (!d || !name || name === d.name) return
    d.name = name; d.updatedAt = Date.now(); store.save(d); this.refresh(); queue.show({ text: '已改名' })
    if (auth.hasSession()) store.sync(d).then(() => this.refresh()).catch(() => {})
  },
  onShareAppMessage() { const d = this.data.active; return { title: d ? d.name : '我的作品', path: '/features/works/works' } },
  remove() {
    const d = this.data.active, all = store.list(), index = all.findIndex(item => item.id === d.id)
    if (index < 0) return
    this.closeMenu()
    wx.setStorageSync(KEY, all.filter(item => item.id !== d.id)); this.refresh()
    const pending = { d, index, undone: false }
    this.pendingDelete = pending
    queue.show({ text: `已删除“${d.name}”`, action: '撤销', onAction: () => {
      pending.undone = true
      if (this.deleteTimer) clearTimeout(this.deleteTimer)
      const latest = store.list(); latest.splice(Math.min(index, latest.length), 0, d)
      wx.setStorageSync(KEY, latest); this.refresh()
    } })
    this.deleteTimer = setTimeout(() => {
      if (pending.undone || !d.cloudId || !auth.hasSession()) return
      auth.authorized('/designs/' + encodeURIComponent(d.cloudId), undefined, 'DELETE').catch(() => {
        store.save(d); this.refresh(); queue.show({ text: '没删成，作品已恢复' })
      })
    }, 3000)
  },
})
