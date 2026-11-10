const test = require('node:test')
const assert = require('node:assert/strict')

test('本机颜色识别不回调时不阻塞 AI，页面会退出识别状态', async () => {
  let definition
  global.Page = value => { definition = value }
  global.getApp = () => ({ globalData: { apiBase: 'http://localhost:8801' } })
  global.wx = {
    getFileSystemManager: () => ({ readFile: o => o.success({ data: '/9j/dGVzdA==' }) })
  }
  const apiPath = require.resolve('../utils/api')
  const oldApi = require.cache[apiPath]
  require.cache[apiPath] = { id: apiPath, filename: apiPath, loaded: true, exports: {
    request: async (_path, _data, _method, options) => {
      assert.equal(options.timeout, 30000)
      return { ok: true, seen: '识别到棕色手串', main: 'wood', accent: '', metal: '', every: 4 }
    },
    catalog: async () => ({ beads: [] })
  } }
  delete require.cache[require.resolve('../pages/photo/photo')]
  require('../pages/photo/photo')
  const page = {
    ...definition,
    data: { ...definition.data, photo: '/tmp/photo.jpg', catalog: [{ id: 'wood', name: '木珠', mat: 'wood', mm: 8, price: 1, c: ['#654321'] }], options: [{ id: '', name: '不使用' }, { id: 'wood', name: '木珠' }] },
    localTimeoutMs: 5,
    localRecognize: () => new Promise(() => {}),
    renderResult() {},
    setData(values, callback) { Object.assign(this.data, values); if (callback) callback() }
  }

  await Promise.race([
    page.recognize(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('识别页面仍在无限等待')), 100))
  ])
  assert.equal(page.data.busy, false)
  assert.equal(page.data.result.source, 'ai')

  if (oldApi) require.cache[apiPath] = oldApi
  else delete require.cache[apiPath]
  delete global.Page
  delete global.getApp
  delete global.wx
})

test('手机图片读取不回调时显示阶段错误并退出加载', async () => {
  let definition
  global.Page = value => { definition = value }
  global.getApp = () => ({ globalData: { apiBase: 'http://localhost:8801' } })
  global.wx = { getFileSystemManager: () => ({ readFile() {} }) }
  delete require.cache[require.resolve('../pages/photo/photo')]
  require('../pages/photo/photo')
  const page = {
    ...definition,
    data: { ...definition.data, photo: '/tmp/photo.jpg' },
    readTimeoutMs: 5,
    recognitionHardTimeoutMs: 50,
    setData(values) { Object.assign(this.data, values) }
  }
  await page.recognize()
  assert.equal(page.data.busy, false)
  assert.equal(page.data.error, '图片读取超时')
  assert.equal(page.data.stage, '')
  delete global.Page
  delete global.getApp
  delete global.wx
})
