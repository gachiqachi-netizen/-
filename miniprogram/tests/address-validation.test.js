const { test } = require('node:test')
const assert = require('node:assert/strict')
const { validateAddress, payloadOf } = require('../features/address-edit/validation')

const valid = { person: '示例收件人', phone: '13800000000', region: ['浙江省', '杭州市', '西湖区'], detail: '示例路 1 号', isDefault: true }

test('address form reports the first missing row and each field error', () => {
  const result = validateAddress({})
  assert.equal(result.first, 'person')
  assert.deepEqual(Object.keys(result.errors), ['person', 'phone', 'region', 'detail'])
})

test('address form rejects a 10-digit phone on the phone row', () => {
  const result = validateAddress({ ...valid, phone: '1380000000' })
  assert.equal(result.first, 'phone')
  assert.equal(result.errors.phone, '手机号是 11 位数字')
})

test('address form accepts a complete address and normalizes its payload', () => {
  const result = validateAddress(valid)
  assert.equal(result.first, '')
  assert.deepEqual(result.errors, {})
  assert.deepEqual(payloadOf({ ...valid, person: ' 示例收件人 ' }), valid)
})
