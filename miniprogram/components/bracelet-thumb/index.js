const thumbs = require('../../utils/thumb-cache')

Component({
  properties: {
    beads: { type: Array, value: [] },
    catalog: { type: Array, value: [] },
    // Kept for compatibility with existing callers; list previews are static.
    selected: { type: Number, value: -1 }
  },
  data: { src: thumbs.PLACEHOLDER },
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
        this.thumbSize = rect && rect.width > 0 && rect.height > 0
          ? Math.ceil(Math.max(rect.width, rect.height) * ratio) : 256
        this.render()
      }).exec()
    },
    render() {
      const revision = this.thumbRevision = (this.thumbRevision || 0) + 1
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
