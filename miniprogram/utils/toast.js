// 浮动提示队列（任务卡 C0g，稿 85 / 04 第 28.1 节）。
// 纯函数部分 createQueue({ now, setTimer, clearTimer })：定时器全部注入，node:test 可测。
// 规则：纯提示默认 1000ms，带操作或失败 3000ms（可用 duration 覆盖）；新的顶掉旧的；点操作立即消失并调 onAction。
// 页面通过 c-toast 订阅此队列显示提示。
function createQueue({ now, setTimer, clearTimer }) {
  let timer = null
  let current = null
  const listeners = new Set()

  function emit() { listeners.forEach(listener => listener(current)) }

  function dismiss() {
    if (timer) { clearTimer(timer); timer = null }
    if (current) { current = null; emit() }
  }

  function show({ text, action, onAction, duration } = {}) {
    if (timer) { clearTimer(timer); timer = null }
    current = { text, action, onAction }
    const ms = duration != null ? duration : (action || onAction ? 3000 : 1000)
    timer = setTimer(() => { timer = null; current = null; emit() }, ms)
    emit()
    return current
  }

  // 点操作：立即消失并回调
  function action() {
    const item = current
    dismiss()
    if (item && typeof item.onAction === 'function') item.onAction()
  }

  function subscribe(listener) {
    listeners.add(listener)
    listener(current)
    return () => listeners.delete(listener)
  }

  // now 供需要读取当前时间的调用方使用；队列本身只用相对定时
  void now
  return { show, dismiss, action, subscribe }
}

// 小程序环境的全站单例：页面放一个 <c-toast />，任何地方 require 这个 queue 调 show。
const queue = createQueue({
  now: () => Date.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: id => clearTimeout(id),
})

module.exports = { createQueue, queue }
