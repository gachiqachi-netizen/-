const { request } = require('../../utils/api')

function sections(body) {
  return String(body || '').split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
    const marker = line.match(/^([^：:]{2,20})[：:]\s*(.+)$/)
    return marker ? { heading: marker[1], text: marker[2] } : { heading: '', text: line }
  })
}

Page({
  data: { title: '', sections: [], loading: true, error: '' },
  onLoad(options) {
    this.termType = options && options.type ? decodeURIComponent(options.type) : ''
    this.load()
  },
  async load() {
    this.setData({ loading: true, error: '' })
    try {
      const list = await request('/terms')
      const term = Array.isArray(list) && list.find(item => item.type === this.termType)
      if (!term) throw new Error('这份说明暂时还没有发布')
      const detail = await request('/terms/' + encodeURIComponent(term.id))
      this.setData({ title: detail.title, sections: sections(detail.body), loading: false })
      wx.setNavigationBarTitle({ title: detail.title })
    } catch (error) {
      this.setData({ loading: false, error: error.message || '暂时没能加载说明' })
    }
  },
})
