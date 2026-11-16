// 款式格（任务卡 C0h，稿 03）：上面手串图，下面名字（粗）、一句寓意、小字价格。
// 名字和一句寓意的字号、位置在 wxss 里写死（09 第 31 条），不开放属性改小。
// 价格用 C0d 的 yuan（整数分 → 元）。
const { yuan } = require('../../utils/money')

if (typeof Component === 'function') {
  Component({
    options: { styleIsolation: 'apply-shared', multipleSlots: true },
    properties: {
      design: { type: Object, value: null }, // {name, line, beads, priceFen}
      label: { type: String, value: '' },
      value: { type: String, value: '' },
      arrow: { type: Boolean, value: false },
      switch: { type: Boolean, value: false },
      checked: { type: Boolean, value: false },
    },
    data: { price: '' },
    observers: {
      design: function (design) {
        this.setData({ price: design && Number.isInteger(design.priceFen) ? yuan(design.priceFen) : '' })
      },
    },
    methods: {
      onSwitch() { this.triggerEvent('change', { value: !this.data.checked }) },
      onTap() { this.triggerEvent('tap') },
    },
  })
}
