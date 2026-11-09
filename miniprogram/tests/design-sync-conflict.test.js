// 409 自愈：云端内容未变只是本机版本号落后时刷新重试；真被别的设备改过才报冲突
const assert = require('node:assert/strict')
const test = require('node:test')
const memory = new Map()
global.wx = { getStorageSync: k => structuredClone(memory.get(k)), setStorageSync: (k,v) => memory.set(k, structuredClone(v)) }

function setup(remoteRow, acceptExpected) {
  const calls = []
  const authPath = require.resolve('../utils/auth')
  delete require.cache[require.resolve('../utils/design')]
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: { authorized: async (path, body, method) => {
    calls.push({ path, body, method })
    if (method === 'PUT' && body.expectedUpdatedAt !== acceptExpected) { const e = new Error('设计已在其他设备修改'); e.code = 'design_conflict'; throw e }
    if (path === '/designs') return [remoteRow]
    return { id: remoteRow.id, updatedAt: acceptExpected + 1 }
  } } }
  return { store: require('../utils/design'), calls }
}

test('stale local version self-heals when cloud content unchanged', async () => {
  const remote = { id: 'c1', name: '手串', wrist: 15, beads: ['a'], updatedAt: 500 }
  const { store, calls } = setup(remote, 500)
  store.save({ id: 'l1', name: '手串', wrist: 15, beads: ['a'], cloudId: 'c1', cloudUpdatedAt: 300, syncedSnapshot: JSON.stringify({ name: '手串', beads: ['a'], wrist: 15 }) })
  const result = await store.sync(store.list()[0])
  assert.equal(result.updatedAt, 501)
  assert.deepEqual(calls.map(c => c.method || 'GET'), ['PUT', 'GET', 'PUT'])
  assert.equal(calls[2].body.expectedUpdatedAt, 500)
  assert.equal(store.list()[0].cloudUpdatedAt, 501)
})

test('legacy entry without snapshot also self-heals once', async () => {
  const remote = { id: 'c2', name: '手串', wrist: 15, beads: ['a'], updatedAt: 500 }
  const { store, calls } = setup(remote, 500)
  store.save({ id: 'l2', name: '手串', wrist: 15, beads: ['a'], cloudId: 'c2', cloudUpdatedAt: 300 })
  await store.sync(store.list()[0])
  assert.deepEqual(calls.map(c => c.method || 'GET'), ['PUT', 'GET', 'PUT'])
})

test('genuine conflict with diverged cloud content still rejects', async () => {
  const remote = { id: 'c3', name: '手串', wrist: 15, beads: ['b', 'b'], updatedAt: 500 }
  const { store, calls } = setup(remote, 500)
  store.save({ id: 'l3', name: '手串', wrist: 15, beads: ['a'], cloudId: 'c3', cloudUpdatedAt: 300, syncedSnapshot: JSON.stringify({ name: '手串', beads: ['a'], wrist: 15 }) })
  await assert.rejects(store.sync(store.list()[0]), /其他设备/)
  assert.deepEqual(calls.map(c => c.method || 'GET'), ['PUT', 'GET'])
})
