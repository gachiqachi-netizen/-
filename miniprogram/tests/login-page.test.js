const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const auth = require('../utils/auth')
let pageDefinition
global.Page = definition => { pageDefinition = definition }
global.wx = { getAccountInfoSync: () => ({ miniProgram: { envVersion: 'release' } }),
  showToast: () => {}, navigateBack: () => {}, navigateTo: () => {} }
require('../pages/login/login')

function page() {
  const instance = { ...pageDefinition, data: { ...pageDefinition.data },
    setData(patch) { Object.assign(this.data, patch) } }
  instance.onLoad({})
  return instance
}

test('both consent paths use the WeChat phone button and page starts unchecked', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../pages/login/login.wxml'), 'utf8')
  assert.equal((wxml.match(/open-type="getPhoneNumber"/g) || []).length, 2)
  assert.match(wxml, /bindgetphonenumber="onPhone"/)
  assert.match(wxml, /bindgetphonenumber="agreeAndPhone"/)
  assert.equal(page().data.agreed, false)
})

test('unchecked phone action opens agreement sheet', async () => {
  const instance = page()
  await instance.onPhone({ detail: { code: 'phone-code' } })
  assert.equal(instance.data.sheet, true)
})

test('denial stays on page and shows retry text', async () => {
  const instance = page()
  instance.setData({ agreed: true })
  await instance.onPhone({ detail: { errMsg: 'getPhoneNumber:fail deny' } })
  assert.equal(instance.data.error, '没拿到手机号，可以再点一次，或先逛逛')
  assert.equal(instance.data.busy, false)
})

test('successful phone code binds and continues saved action', async () => {
  const instance = page()
  const calls = []
  const original = { bindPhone: auth.bindPhone, syncLocalWorks: auth.syncLocalWorks,
    continueAfterLogin: auth.continueAfterLogin }
  auth.bindPhone = async code => { calls.push(code) }
  auth.syncLocalWorks = async () => false
  auth.continueAfterLogin = next => { calls.push(next) }
  try {
    instance.onLoad({ next: encodeURIComponent(JSON.stringify({ type: 'submitOrder' })) })
    instance.setData({ agreed: true })
    await instance.onPhone({ detail: { code: 'phone-code' } })
    assert.deepEqual(calls, ['phone-code', { type: 'submitOrder' }])
    assert.equal(instance.data.busy, false)
  } finally { Object.assign(auth, original) }
})

test('develop environment can use a fake code when WeChat supplies none', async () => {
  const instance = page()
  const original = { bindPhone: auth.bindPhone, syncLocalWorks: auth.syncLocalWorks,
    continueAfterLogin: auth.continueAfterLogin }
  let usedCode
  auth.bindPhone = async code => { usedCode = code }
  auth.syncLocalWorks = async () => false
  auth.continueAfterLogin = () => {}
  try {
    wx.getAccountInfoSync = () => ({ miniProgram: { envVersion: 'develop' } })
    instance.onLoad({})
    instance.setData({ agreed: true })
    await instance.onPhone({ detail: {} })
    assert.match(usedCode, /^dev-/)
  } finally {
    Object.assign(auth, original)
    wx.getAccountInfoSync = () => ({ miniProgram: { envVersion: 'release' } })
  }
})
