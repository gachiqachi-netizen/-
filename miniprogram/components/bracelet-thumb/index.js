const thumbs = require('../../utils/thumb-cache')

Component({
  properties: {
    beads: { type: Array, value: [] },
    catalog: { type: Array, value: [] },
    // Kept for compatibility with existing callers; list previews are static.
    selected: { type: Number, value: -1 }
  },
  data: { src: thumbs.PLACEHOLDER, items: [], sizeRpx: 160 },
  observers: { 'beads,catalog': function () { if (this.thumbReady) this.render() } },
  lifetimes: {
    ready() { this.thumbReady = true; this.measure() },
    detached() { this.thumbReady = false; this.thumbRevision = (this.thumbRevision || 0) + 1 }
  },
  pageLifetimes: { resize() { if (this.thumbReady) this.measure() } },
  methods: {
    measure() {
      this.createSelectorQuery().select('.thumbnail').boundingClientRect(rect => {
        if (!this.thumbReady) return
        const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
        const ratio = Math.min(2, Number(info.pixelRatio) || 1)
        const side = rect && rect.width > 0 && rect.height > 0 ? Math.min(rect.width, rect.height) : 80
        this.thumbSize = Math.ceil(side * ratio)
        this.setData({ sizeRpx: Math.max(24, Math.floor(side * 750 / (info.windowWidth || info.screenWidth || 375))) })
        this.render()
      }).exec()
    },
    render() {
      const revision = this.thumbRevision = (this.thumbRevision || 0) + 1
      const catalog = this.properties.catalog || []
      const byId = Object.fromEntries(catalog.map(bead => [bead.id, bead]))
      const items = (this.properties.beads || []).map(id => byId[id]).filter(Boolean)
      this.setData({ items, src: items.length ? this.data.src || thumbs.PLACEHOLDER : thumbs.PLACEHOLDER })
      thumbs.get(this.properties.beads, this.properties.catalog, this.thumbSize).then(result => {
        // A recycled/detached component must not receive an old request's image.
        if (!this.thumbReady || revision !== this.thumbRevision) return
        this.thumbKey = result.key
        this.setData({ src: result.src })
      })
    },
    imageError() {
      if (this.thumbKey) thumbs.invalidate(this.thumbKey)
      if (this.data.src !== thumbs.PLACEHOLDER) this.setData({ src: thumbs.PLACEHOLDER })
    }
  }
})
