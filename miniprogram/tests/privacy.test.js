const test = require('node:test')
const assert = require('node:assert/strict')

test('隐私请求同意和拒绝都正确回传微信并通知页面', () => {
  let handler
  global.wx = {onNeedPrivacyAuthorization(fn) { handler = fn }}
  const privacy = require('../utils/privacy')
  privacy.resetForTest()
  const states = []
  privacy.subscribe(value => states.push(value))
  privacy.install()

  let result
  handler(value => { result = value })
  assert.deepEqual(states, [true])
  assert.equal(privacy.finish(true), true)
  assert.deepEqual(result, {buttonId: 'agree-btn', event: 'agree'})
  assert.deepEqual(states, [true, false])

  handler(value => { result = value })
  assert.equal(privacy.finish(false), true)
  assert.deepEqual(result, {event: 'disagree'})
})
