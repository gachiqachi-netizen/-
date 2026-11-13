// c-composer：AI 输入区（稿 21/24 输入框、稿 22 按住说话）。
// 只发事件，不接语音识别、不做请求。金额/地址等一律由页面处理。

var DEFAULT_PLACEHOLDER = '说说想要的感觉、送谁、预算…'
var CANCEL_DISTANCE_RPX = 80 // 上滑超过这个距离触发 voicecancel

function pxToRpx(px) {
  var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  return (px * 750) / info.windowWidth
}

Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: DEFAULT_PLACEHOLDER },
    tag: { type: String, value: '' },
    chips: { type: Array, value: [] },
    voice: { type: Boolean, value: true },
    photo: { type: Boolean, value: true },
    sending: { type: Boolean, value: false },
  },
  data: {
    draft: '',
    hasText: false,
    speaking: false,
    willCancel: false,
  },
  observers: {
    value: function (v) {
      this._sync({ draft: v || '' })
    },
  },
  methods: {
    _sync: function (extra) {
      var data = Object.assign({ hasText: this.data.draft.trim().length > 0 }, extra || {})
      this.setData(data)
    },

    onInput: function (e) {
      this._sync({ draft: e.detail.value })
      this.triggerEvent('input', { value: e.detail.value })
    },

    onSend: function () {
      var text = this.data.draft.trim()
      if (!text || this.data.sending) return
      this.triggerEvent('send', { text: text })
    },

    onPlus: function () {
      this.triggerEvent('plus')
    },

    onTag: function () {
      this.triggerEvent('tag')
    },

    onChip: function (e) {
      this.triggerEvent('chip', { text: e.currentTarget.dataset.text })
    },

    onVoiceStart: function (e) {
      if (!this.data.voice) return
      this._startY = e.touches[0].clientY
      this._cancelled = false
      this.setData({ speaking: true, willCancel: false })
      this.triggerEvent('voicestart')
    },

    onVoiceMove: function (e) {
      if (!this.data.speaking || this._cancelled) return
      var up = this._startY - e.touches[0].clientY
      if (pxToRpx(up) > CANCEL_DISTANCE_RPX) {
        this._cancelled = true
        this.setData({ willCancel: true })
        this.triggerEvent('voicecancel')
      }
    },

    onVoiceEnd: function () {
      if (!this.data.speaking) return
      this.setData({ speaking: false, willCancel: false })
      if (!this._cancelled) this.triggerEvent('voiceend')
    },
  },
})
