// Run with node; exercises client-side sequencing without a WeChat account.
const assert = require('node:assert/strict')
const memory = new Map()
global.wx = { getStorageSync: k => structuredClone(memory.get(k)), setStorageSync: (k,v) => memory.set(k, structuredClone(v)) }
const authPath = require.resolve('../utils/auth')
const calls = []
require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: { authorized: async (path, body, method) => {
  calls.push({path, body: structuredClone(body), method})
  return {id:'cloud-1', updatedAt:calls.length * 100}
} } }
const store = require('../utils/design')
async function main() {
  const d = {id:'local-1', name:'手串', wrist:15, beads:['a'], pattern:['a','b'], special:['c'], tail:[], fixed:18, source:'tpl', tplId:'t1', meaning:'祝福', edited:false}
  store.save(d); store.selected(d)
  const first = store.sync(d)
  const changed = {...d, beads:['a','b']}; store.save(changed); store.selected(changed)
  await Promise.all([first, store.sync(changed)])
  assert.deepEqual(calls.map(c => c.method), ['POST','PUT'])
  assert.equal(calls[1].body.expectedUpdatedAt, 100)
  assert.deepEqual(calls[1].body.beads, ['a','b'])
  assert.deepEqual(calls[1].body.pattern, ['a','b'])
  assert.deepEqual(calls[1].body.special, ['c'])
  assert.equal(calls[1].body.fixed, 18)
  assert.equal(calls[1].body.tplId, 't1')
  assert.equal(store.list()[0].cloudUpdatedAt, 200)
  assert.deepEqual(store.current().beads, ['a','b'])
  // 旧内存对象写回存储不得回滚云端版本号（409 根因）
  const stale={id:'local-1',name:'手串',wrist:15,beads:['a','b'],cloudId:'cloud-1',cloudUpdatedAt:100}
  store.save(stale); store.selected(stale)
  assert.equal(store.list()[0].cloudUpdatedAt, 200)
  assert.equal(store.current().cloudUpdatedAt, 200)
  await store.sync(stale)
  assert.equal(calls[2].body.expectedUpdatedAt, 200)
  console.log('设计同步队列与版本传递通过')
}
main().catch(err => { console.error(err); process.exitCode = 1 })
