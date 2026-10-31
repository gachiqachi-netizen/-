const store = require('../../utils/store')
const { patinaOf, levelOf } = require('../../utils/beads')

Page({
  data: { list: [], cur: '' },

  onShow() { this.load() },

  load() {
    const cur = store.current().id
    const list = store.list().map(b => ({
      id: b.id, name: b.name, beads: b.beads, size: b.size, count: b.count,
      patina: patinaOf(b.count), level: levelOf(b.count).name
    }))
    this.setData({ list, cur })
  },

  use(e) {
    store.setCurrent(e.currentTarget.dataset.id)
    wx.switchTab({ url: '/pages/index/index' })
  },

  del(e) {
    const { id, name } = e.currentTarget.dataset
    if (this.data.list.length <= 1) return wx.showToast({ title: '至少留一串', icon: 'none' })
    wx.showModal({
      title: '删除手串',
      content: `确定删除「${name}」吗？盘珠记录也会一起删除。`,
      success: r => {
        if (!r.confirm) return
        store.remove(id)
        if (id === this.data.cur) store.setCurrent(store.list()[0].id)
        this.load()
      }
    })
  }
})
