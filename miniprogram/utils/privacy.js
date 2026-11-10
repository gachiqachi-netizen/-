let installed = false
let pending = null
const listeners = new Set()

function emit(visible) { listeners.forEach(listener => listener(visible)) }

function install() {
  if (installed || !wx.onNeedPrivacyAuthorization) return
  installed = true
  wx.onNeedPrivacyAuthorization(resolve => {
    pending = resolve
    emit(true)
  })
}

function subscribe(listener) {
  listeners.add(listener)
  if (pending) listener(true)
  return () => listeners.delete(listener)
}

function finish(agreed) {
  if (!pending) return false
  const resolve = pending
  pending = null
  emit(false)
  resolve(agreed ? {buttonId: 'agree-btn', event: 'agree'} : {event: 'disagree'})
  return true
}

function resetForTest() { installed = false; pending = null; listeners.clear() }

module.exports = { install, subscribe, finish, resetForTest }
