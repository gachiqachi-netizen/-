const PHONE = /^1\d{10}$/
const FIELDS = ['person', 'phone', 'region', 'detail']

function validateAddress(value) {
  const address = value || {}
  const errors = {}
  if (!String(address.person || '').trim()) errors.person = '请填收货人'
  if (!PHONE.test(String(address.phone || '').trim())) errors.phone = '手机号是 11 位数字'
  if (!Array.isArray(address.region) || address.region.length < 3 || address.region.some(part => !String(part || '').trim())) errors.region = '请选所在地区'
  if (!String(address.detail || '').trim()) errors.detail = '请填详细地址'
  return { errors, first: FIELDS.find(field => errors[field]) || '' }
}

function payloadOf(value) {
  return {
    person: String(value.person || '').trim(),
    phone: String(value.phone || '').trim(),
    region: value.region.slice(0, 3),
    detail: String(value.detail || '').trim(),
    isDefault: !!value.isDefault,
  }
}

module.exports = { validateAddress, payloadOf }
