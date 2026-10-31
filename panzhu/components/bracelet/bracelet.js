const { layout, beadBg } = require('../../utils/beads')

Component({
  properties: {
    beads: { type: Array, value: [] },
    size: { type: Number, value: 70 },      // 单颗珠子直径 rpx
    box: { type: Number, value: 600 },      // 容器边长 rpx
    maxScale: { type: Number, value: 1 },
    patina: { type: Number, value: 0 },     // 包浆 0~1
    rotate: { type: Number, value: 0 },
    animate: { type: Boolean, value: false }
  },
  data: { items: [], r: 0, s: 0 },
  observers: {
    'beads, size, box, maxScale, patina': function (beads, size, box, maxScale, patina) {
      const { items, r, s } = layout(beads, size, box, maxScale)
      items.forEach(it => { it.bg = beadBg(it.id, patina) })
      this.setData({ items, r, s })
    }
  },
  methods: {
    onTap(e) {
      this.triggerEvent('beadtap', { index: e.currentTarget.dataset.i })
    }
  }
})
