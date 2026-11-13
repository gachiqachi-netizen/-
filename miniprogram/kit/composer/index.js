// 组件预览临时页（只在开发版能打开）。由任务卡 C0i AI 输入区 填内容；C11 收尾时整个 kit 分包删除。
Page({
  data: {
    value: '',
    tag: '手围 15cm',
    chips: ['想要清冷一点，上班也能戴', '送闺蜜生日，她喜欢粉色', '想要夏天海边的感觉'],
    lastEvent: '（还没有事件）',
    lastText: '',
  },

  onLoad() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const version = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
    if (version !== 'develop') {
      wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/home/home' }) } })
    }
  },

  _log(name, e) {
    const text = e && e.detail && (e.detail.text || e.detail.value)
    this.setData({ lastEvent: name, lastText: text || '' })
  },

  onInput(e) {
    this.setData({ value: e.detail.value })
  },

  onSend(e) { this._log('send（发送）', e) },
  onPlus() { this._log('plus（照片）') },
  onTag() { this._log('tag（条件标签）') },
  onChip(e) { this._log('chip（快捷回复）', e) },
  onVoiceStart() { this._log('voicestart（按住说话）') },
  onVoiceEnd() { this._log('voiceend（松开发送）') },
  onVoiceCancel() { this._log('voicecancel（上滑取消）') },
})
