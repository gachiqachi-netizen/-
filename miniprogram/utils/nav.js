const store = require('./design')
const { queue } = require('./toast')
const TABS = ['pages/home/home', 'pages/diy/diy', 'pages/ai/ai', 'pages/mine/mine']

function pages() { return typeof getCurrentPages === 'function' ? getCurrentPages() : [] }
function open(route) {
  const stack = pages()
  const target = route.replace(/^\//, '')
  const index = stack.map(page => page.route).lastIndexOf(target)
  if (index >= 0) {
    const delta = stack.length - 1 - index
    if (delta > 0) wx.navigateBack({ delta })
    return
  }
  if (stack.length >= 8) wx.redirectTo({ url: '/' + target })
  else wx.navigateTo({ url: '/' + target })
}
function openWorkbench(design) {
  const stack = pages()
  const source = stack[stack.length - 1]
  const global = typeof getApp === 'function' && getApp().globalData
  if (global) global.workbenchReturn = source && source.route !== 'pages/diy/diy' ? { route: source.route, options: { ...(source.options || {}) } } : null
  const current = store.current()
  const next = design || current
  if (current && next && current.id !== next.id) {
    const saved = store.list().find(item => item.id === current.id)
    if (!saved || JSON.stringify(saved) !== JSON.stringify(current)) {
      store.save(current)
      queue.show({ text: '原来那条已存到我的作品' })
    }
  }
  if (next) store.selected(next)
  wx.switchTab({ url: '/pages/diy/diy' })
}
function backFromWorkbench(source) {
  if (!source || !source.route) return
  const route = source.route.replace(/^\//, '')
  if (TABS.includes(route)) return wx.switchTab({ url: '/' + route })
  const stack = pages()
  const index = stack.map(page => page.route).lastIndexOf(route)
  if (index >= 0 && index < stack.length - 1) return wx.navigateBack({ delta: stack.length - 1 - index })
  const query = Object.keys(source.options || {}).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(source.options[key])).join('&')
  wx.navigateTo({ url: '/' + route + (query ? '?' + query : '') })
}
function wrist() {
  const saved = Number(wx.getStorageSync('cgz_wrist'))
  const measured = saved >= 8 && saved <= 30
  return { value: measured ? saved : 15, measured }
}
function openEditor(design) { openWorkbench(design) }
function openOrder() {
  if (wx.getStorageSync('cgz_wrist_confirmed')) return open('pages/order/order')
  const measure = wrist()
  const current = store.current()
  if (current && !measure.measured) store.selected({ ...current, wrist: 15 })
  queue.show({ text: measure.measured ? `手围 ${measure.value}cm，确认后去下单` : '先按常见的 15cm，确认后去下单',
               action: '去下单', onAction: () => {
                 wx.setStorageSync('cgz_wrist_confirmed', true)
                 open('pages/order/order')
               } })
}
function orderComplete(no) { wx.reLaunch({ url: '/features/order-detail/order-detail?no=' + encodeURIComponent(no) }) }
module.exports = { openWorkbench, backFromWorkbench, wrist, openEditor, openOrder, orderComplete }
