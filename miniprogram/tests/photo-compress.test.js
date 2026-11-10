const test = require('node:test')
const assert = require('node:assert/strict')
const image = require('../pages/photo/compress')

test('long side is limited to 1024 without changing aspect ratio', () => {
  assert.deepEqual(image.scaledSize(4032, 3024), {width: 1024, height: 768})
  assert.deepEqual(image.scaledSize(800, 1200), {width: 683, height: 1024})
  assert.deepEqual(image.scaledSize(640, 480), {width: 640, height: 480})
})

test('5MB original is resized and repeatedly compressed until at most 1MB', async () => {
  const sizes = {'/original.jpg': 5 * 1024 * 1024, '/q80.jpg': 1400000, '/q60.jpg': 900000}
  const calls = []
  const fake = {
    getImageInfo: o => o.success({width: 4032, height: 3024, size: sizes[o.src]}),
    compressImage: o => { calls.push(o); o.success({tempFilePath: `/q${o.quality}.jpg`}) },
    getFileSystemManager: () => ({stat: o => o.success({stats: {size: sizes[o.path]}})}),
  }
  const result = await image.prepare('/original.jpg', fake)
  assert.equal(result.size, 900000)
  assert.equal(result.path, '/q60.jpg')
  assert.deepEqual(calls.map(x => [x.quality, x.compressedWidth, x.compressedHeight]), [[80, 1024, 768], [60, 1024, 768]])
})

test('oversized result gives an actionable error', async () => {
  const fake = {
    getImageInfo: o => o.success({width: 2000, height: 1000, size: 5000000}),
    compressImage: o => o.success({tempFilePath: `/q${o.quality}.jpg`}),
    getFileSystemManager: () => ({stat: o => o.success({stats: {size: 1100000}})}),
  }
  await assert.rejects(image.prepare('/original.jpg', fake), /超过 1MB/)
})
