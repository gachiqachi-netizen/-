const test = require('node:test')
const assert = require('node:assert/strict')
const { createQueue } = require('../utils/toast')

// 注入假定时器：setTimer 记录回调和时长，手动 run 触发
function makeQueue() {
  let nextId = 1
  const timers = new Map()
  const setTimer = (fn, ms) => { const id = nextId++; timers.set(id, { fn, ms }); return id }
  const clearTimer = id => { timers.delete(id) }
  const run = id => { const t = timers.get(id); timers.delete(id); if (t) t.fn() }
  const q = createQueue({ now: () => 0, setTimer, clearTimer })
  const states = []
  q.subscribe(current => states.push(current))
  return { q, timers, run, states }
}

test('新的顶掉旧的：只剩一个待触发定时器', () => {
  const { q, timers } = makeQueue()
  q.show({ text: '第一条' })
  q.show({ text: '第二条' })
  assert.equal(timers.size, 1)
  const only = [...timers.values()][0]
  assert.equal(only.ms, 1000)
})

test('到时消失：定时器触发后队列清空', () => {
  const { q, timers, run, states } = makeQueue()
  q.show({ text: '已存到我的作品' })
  assert.equal(timers.size, 1)
  run([...timers.keys()][0])
  assert.equal(timers.size, 0)
  assert.deepEqual(states[states.length - 1], null)
})

test('点操作后立即消失且回调被调用', () => {
  const { q, timers, states } = makeQueue()
  let count = 0
  q.show({ text: '已删除 1 颗月光石', action: '撤销', onAction: () => { count += 1 } })
  assert.equal(timers.size, 1)
  q.action()
  assert.equal(count, 1)
  assert.equal(timers.size, 0)
  assert.deepEqual(states[states.length - 1], null)
})

test('带操作 3 秒，纯提示 1 秒，duration 可覆盖', () => {
  const { q, timers } = makeQueue()
  q.show({ text: '已删除 1 颗月光石', action: '撤销' })
  let only = [...timers.values()][0]
  assert.equal(only.ms, 3000)
  q.show({ text: '已存到我的作品' })
  only = [...timers.values()][0]
  assert.equal(only.ms, 1000)
  q.show({ text: '自定义', duration: 500 })
  only = [...timers.values()][0]
  assert.equal(only.ms, 500)
})
