// 组件预览临时页（只在开发版能打开）。由任务卡 C0g 弹层、底栏、浮动提示 填内容；C11 收尾时整个 kit 分包删除。
const { queue } = require('../../utils/toast')

Page({
  data: { sheetShow: false, sheetFixedShow: false },

  onLoad() {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
    const version = info && info.miniProgram ? info.miniProgram.envVersion : 'develop'
    if (version !== 'develop') {
      wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/home/home' }) } })
    }
  },

  openSheet() { this.setData({ sheetShow: true }) },
  onSheetClose() { this.setData({ sheetShow: false }) },
  openSheetFixed() { this.setData({ sheetFixedShow: true }) },
  onSheetFixedClose() { this.setData({ sheetFixedShow: false }) },

  toastSuccess() { queue.show({ text: '已存到我的作品' }) },
  toastUndo() {
    queue.show({ text: '已删除 1 颗月光石', action: '撤销', onAction: () => queue.show({ text: '已撤销' }) })
  },
  toastSimilar() { queue.show({ text: '这颗暂时缺货，看看相似的', action: '月光石' }) },
  toastRetry() {
    queue.show({ text: '没存上，网络不太好', action: '再试一次', onAction: () => queue.show({ text: '没存上，网络不太好', action: '再试一次' }) })
  },
  toastSync() { queue.show({ text: '已按 16cm 重新判断' }) },

  onBuy() { queue.show({ text: '已确定' }) },
})
