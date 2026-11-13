const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const pagePath = path.resolve(__dirname, '../features/review/review.js')
const apiPath = path.resolve(__dirname, '../utils/api.js')
const flush = () => new Promise(resolve => setImmediate(resolve))

function makePage(reply = {}) {
  const calls = []
  const toasts = []
  let backs = 0
  const originalApi = require.cache[apiPath]
  const originalPage = global.Page
  const originalWx = global.wx
  let definition
  require.cache[apiPath] = { id: apiPath, filename: apiPath, loaded: true, exports: {
    request: (url, data, method) => {
      calls.push({ url, data, method })
      if (url.endsWith('/review') && method === 'GET') return reply.existing ? Promise.resolve(reply.existing) : Promise.reject(new Error('评价不存在'))
      if (url.endsWith('/review') && method === 'POST') return Promise.resolve(reply.submit || { status: 'pending' })
      if (url === '/my/uploads') return Promise.resolve({ id: 'upload-1', url: '/uploads/user/photo.jpg' })
      return Promise.resolve({ items: [{ name: '一点红', beadCount: 21, wristCm: 15 }] })
    }
  } }
  global.Page = value => { definition = value }
  global.wx = {
    showToast: options => toasts.push(options.title),
    navigateBack: options => { backs++; if (options && options.success) options.success() },
    getFileSystemManager: () => ({ readFile: options => options.success({ data: 'aW1hZ2U=' }) })
  }
  delete require.cache[pagePath]
  require(pagePath)
  const page = { ...definition, data: { ...definition.data }, setData(update) { Object.assign(this.data, update) } }
  page.onLoad({ orderId: 'ORDER-1' })
  const restore = () => {
    delete require.cache[pagePath]
    if (originalApi) require.cache[apiPath] = originalApi
    else delete require.cache[apiPath]
    global.Page = originalPage
    global.wx = originalWx
  }
  return { page, calls, toasts, backs: () => backs, restore }
}

test('只打星且不写文字、不加照片也能提交', async () => {
  const h = makePage()
  try {
    await flush()
    h.page.rate({ currentTarget: { dataset: { rating: 4 } } })
    h.page.publish()
    await flush()
    const post = h.calls.find(call => call.method === 'POST' && call.url.endsWith('/review'))
    assert.deepEqual(post.data, { stars: 4, text: '', photoIds: [], anonymous: true })
    assert.equal(h.backs(), 1)
    assert.ok(h.toasts.includes('已发布，谢谢你'))
  } finally { h.restore() }
})

test('文字超过 300 字不能提交，并保留输入', async () => {
  const h = makePage()
  try {
    await flush()
    h.page.input({ detail: { value: '好'.repeat(301) } })
    h.page.publish()
    assert.equal(h.calls.filter(call => call.method === 'POST').length, 0)
    assert.equal(h.page.data.content.length, 301)
    assert.equal(h.page.data.error, '评价文字不能超过 300 字')
  } finally { h.restore() }
})

test('machine_failed 显示原因，修改后可以再次提交', async () => {
  const h = makePage({ existing: { id: 'review-1', status: 'machine_failed', stars: 3,
    text: '旧文字', photoIds: [], anonymous: false, rejectReason: '内容没有通过审核，改一下再发' },
    submit: { status: 'machine_failed', rejectReason: '照片没有通过审核，改一下再发' } })
  try {
    await flush()
    assert.equal(h.page.data.readOnly, false)
    assert.equal(h.page.data.error, '内容没有通过审核，改一下再发')
    h.page.input({ detail: { value: '改过的文字' } })
    assert.equal(h.page.data.error, '')
    h.page.publish()
    await flush()
    assert.equal(h.calls.find(call => call.method === 'POST').data.text, '改过的文字')
    assert.equal(h.page.data.error, '照片没有通过审核，改一下再发')
    assert.equal(h.backs(), 0)
    assert.equal(h.page.data.submitting, false)
    h.page.input({ detail: { value: '再改一次' } })
    h.page.publish()
    await flush()
    assert.deepEqual(h.calls.filter(call => call.method === 'POST').map(call => call.data.text), ['改过的文字', '再改一次'])
  } finally { h.restore() }
})

test('照片上传使用 B-1 字段，评价提交使用返回的照片 id', async () => {
  const h = makePage()
  try {
    await flush()
    h.page.uploadPhoto('/tmp/photo.jpg')
    await flush()
    const upload = h.calls.find(call => call.url === '/my/uploads')
    assert.deepEqual(upload.data, { filename: 'photo.jpg', contentType: 'image/jpeg', data: 'aW1hZ2U=' })
    assert.equal(h.page.data.photos[0].id, 'upload-1')
    h.page.publish()
    await flush()
    assert.deepEqual(h.calls.find(call => call.method === 'POST' && call.url.endsWith('/review')).data.photoIds, ['upload-1'])
  } finally { h.restore() }
})
