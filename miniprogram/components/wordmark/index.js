Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    tone: { type: String, value: 'text' },
    size: { type: String, value: 'nav' },
  },
  data: {
    src: '',
    height: '40rpx',
  },
  observers: {
    'tone, size': function (tone, size) {
      const heights = { nav: '40rpx', tray: '64rpx', corner: '28rpx', block: '120rpx' }
      this.setData({
        src: `/assets/brand/wordmark${tone === 'text' ? '' : '-' + tone}.svg`,
        height: heights[size] || heights.nav,
      })
    },
  },
})
