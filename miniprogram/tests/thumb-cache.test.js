const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createThumbCache, PLACEHOLDER } = require('../utils/thumb-cache')
const catalog = [{ id: 'a', mm: 8, c: ['#ffffff', '#aaaaaa'] }, { id: 'b', mm: 10, c: ['#ff0000', '#880000'] }]
function mock() {
  const stats = { canvases: 0, exports: 0, active: 0, peak: 0, types: [], fail: false }
  const ctx = Object.fromEntries(['clearRect', 'save', 'translate', 'rotate', 'scale', 'beginPath', 'arc', 'fill', 'restore'].map(k => [k, () => {}]))
  ctx.createRadialGradient = () => ({ addColorStop() {} })
  return { stats, api: {
    createOffscreenCanvas({ type }) { stats.canvases++; stats.types.push(type); return { getContext(type) { stats.types.push(type); return ctx } } },
    canvasToTempFilePath(options) {
      const n = ++stats.exports
      stats.peak = Math.max(stats.peak, ++stats.active)
      setTimeout(() => { stats.active--; stats.fail ? options.fail(new Error('failed')) : options.success({ tempFilePath: `wxfile://thumb-${n}.png` }) }, 1)
    }
  } }
}
test('same pending design and cached design reuse a single export', async () => {
  const { api, stats } = mock(); const cache = createThumbCache(api)
  const [a, b] = await Promise.all([cache.get(['a', 'b'], catalog, 128), cache.get(['a', 'b'], catalog, 128)])
  assert.equal(a.src, b.src); assert.equal((await cache.get(['a', 'b'], catalog, 128)).src, a.src)
  assert.equal(stats.exports, 1); assert.equal(a.fallback, false)
})
test('order, size and material colour changes invalidate image identity', async () => {
  const { api, stats } = mock(); const cache = createThumbCache(api)
  const results = await Promise.all([
    cache.get(['a', 'b'], catalog, 128), cache.get(['b', 'a'], catalog, 128),
    cache.get(['a', 'b'], catalog, 256), cache.get(['a', 'b'], [{ ...catalog[0], c: ['#000000'] }, catalog[1]], 128)
  ])
  assert.equal(new Set(results.map(x => x.src)).size, 4); assert.equal(stats.peak, 1)
})
test('50 designs share one 2D surface and export serially', async () => {
  const { api, stats } = mock(); const cache = createThumbCache(api)
  const results = await Promise.all(Array.from({ length: 50 }, (_, i) => cache.get(Array(i + 1).fill('a'), catalog, 128)))
  assert.equal(results.filter(x => !x.fallback).length, 50)
  assert.equal(stats.canvases, 1); assert.equal(stats.peak, 1); assert.deepEqual(stats.types, ['2d', '2d'])
})
test('unknown materials and empty designs use packaged placeholder without allocating canvas', async () => {
  const { api, stats } = mock(); const cache = createThumbCache(api)
  for (const beads of [[], ['unknown']]) assert.equal((await cache.get(beads, catalog)).src, PLACEHOLDER)
  assert.equal(stats.canvases, 0)
})
test('failed export is retryable and invalidating expired file regenerates image', async () => {
  const { api, stats } = mock(); const cache = createThumbCache(api)
  stats.fail = true; assert.equal((await cache.get(['a'], catalog)).fallback, true)
  stats.fail = false; const result = await cache.get(['a'], catalog)
  assert.equal(result.fallback, false); cache.invalidate(result.key)
  assert.notEqual((await cache.get(['a'], catalog)).src, result.src)
})
test('failed context initialization retries on subsequent request', async () => {
  const { api } = mock(); const create = api.createOffscreenCanvas; let first = true
  api.createOffscreenCanvas = args => first ? (first = false, { getContext() { throw Error('initialization') } }) : create(args)
  const cache = createThumbCache(api)
  assert.equal((await cache.get(['a'], catalog)).fallback, true)
  assert.equal((await cache.get(['a'], catalog)).fallback, false)
})
test('bounded cache evicts least recently used design', async () => {
  const { api, stats } = mock(); const cache = createThumbCache(api, { maxEntries: 2 })
  await cache.get(['a'], catalog); await cache.get(['b'], catalog); await cache.get(['a'], catalog)
  await cache.get(['a', 'b'], catalog); await cache.get(['a'], catalog)
  assert.equal(stats.exports, 3)
  await cache.get(['b'], catalog); assert.equal(stats.exports, 4)
})
test('export timeout returns placeholder and queue continues', async () => {
  const { api } = mock(); const exporting = api.canvasToTempFilePath; api.canvasToTempFilePath = () => {}
  const cache = createThumbCache(api, { timeoutMs: 5 })
  assert.equal((await cache.get(['a'], catalog)).fallback, true)
  api.canvasToTempFilePath = exporting
  assert.equal((await cache.get(['b'], catalog)).fallback, false)
})
test('recycled component ignores old result and detached component ignores pending result', async () => {
  const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path')
  let component; const requests = []
  const thumbs = { PLACEHOLDER, get: () => new Promise(resolve => requests.push(resolve)) }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../components/bracelet-thumb/index.js'), 'utf8'), { Component: c => { component = c }, require: () => thumbs })
  const instance = { thumbReady: true, properties: { beads: ['a'], catalog }, data: {}, setData(data) { this.data = data } }
  component.methods.render.call(instance); component.methods.render.call(instance)
  requests[1]({ key: 'new', src: 'new.png' }); await Promise.resolve()
  requests[0]({ key: 'old', src: 'old.png' }); await Promise.resolve()
  assert.equal(instance.data.src, 'new.png')
  component.methods.render.call(instance); component.lifetimes.detached.call(instance)
  requests[2]({ key: 'detached', src: 'detached.png' }); await Promise.resolve()
  assert.equal(instance.data.src, 'new.png')
})
