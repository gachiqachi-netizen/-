const test = require('node:test')
const assert = require('node:assert/strict')

test('AI 设计和评价使用 180 秒超时，普通请求仍为 10 秒', async () => {
  const seen = []
  global.getApp = () => ({globalData:{apiBase:'http://127.0.0.1:8801'}})
  global.wx = {
    getAccountInfoSync: () => ({miniProgram:{envVersion:'develop'}}),
    request(options) { seen.push(options); options.success({statusCode:200,data:{ok:true}}) }
  }
  delete require.cache[require.resolve('../utils/api')]
  const api = require('../utils/api')
  await api.request('/catalog')
  await api.request('/ai/design', {}, 'POST', {timeout:180000})
  await api.request('/ai/review', {}, 'POST', {timeout:180000})
  assert.deepEqual(seen.map(item => item.timeout), [10000, 180000, 180000])
})

test('AI 评价页明确传入 180 秒超时', () => {
  const fs = require('node:fs')
  const source = fs.readFileSync(require.resolve('../pages/finish/finish.js'), 'utf8')
  assert.match(source, /['"]\/ai\/review['"][\s\S]{0,180}timeout\s*:\s*180000/)
})
