function open(route) {
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const target = route.replace(/^\//, '')
  const index = pages.map(page => page.route).lastIndexOf(target)
  if (index >= 0) {
    const delta = pages.length - 1 - index
    if (delta > 0) wx.navigateBack({ delta })
    return
  }
  if (pages.length >= 8) wx.redirectTo({ url: '/' + target })
  else wx.navigateTo({ url: '/' + target })
}
function openEditor() { open('pages/editor/editor') }
function openOrder() { open('pages/order/order') }
function orderComplete(no) { wx.reLaunch({ url: '/pages/order-detail/order-detail?no=' + encodeURIComponent(no) }) }
module.exports = { openEditor, openOrder, orderComplete }
