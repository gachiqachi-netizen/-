const test = require('node:test')
const assert = require('node:assert/strict')
const { keywords, beadLine, tagline } = require('../utils/meaning')

// 3 颗带 tags 和 meaning 的珠子；b 出现 5 颗最多，a 3 颗，c 1 颗
const A = { id: 'a', name: '南红', tags: ['平安', '喜乐'], meaning: '南红寓意平安喜乐。又称赤玉。' }
const B = { id: 'b', name: '松石', tags: ['平安', '顺遂'], meaning: '松石传统上寓意顺遂。' }
const C = { id: 'c', name: '琥珀', tags: ['温润'], meaning: '' }
const items = [A, B, B, A, B, C, A, B, B]

test('keywords 按颗数从多到少取 tags 并去重，默认最多 3 个，每个词都来自珠子的 tags', () => {
  const out = keywords(items)
  assert.deepEqual(out, ['平安', '顺遂', '喜乐'])
  const tagPool = [A, B, C].reduce((acc, b) => acc.concat(b.tags), [])
  out.forEach(w => assert.ok(tagPool.includes(w), `${w} 不在 tags 里`))
})

test('keywords 详情页传 Infinity 取全部', () => {
  const out = keywords(items, Infinity)
  assert.deepEqual(out, ['平安', '顺遂', '喜乐', '温润'])
})

test('beadLine 只返回第一句，meaning 为空返回空串', () => {
  assert.equal(beadLine(A), '南红寓意平安喜乐。')
  assert.equal(beadLine(B), '松石传统上寓意顺遂。')
  assert.equal(beadLine(C), '')
  assert.equal(beadLine(null), '')
})

test('tagline：design.line 有值就用它，否则关键词拼接', () => {
  assert.equal(tagline({ line: '运营给的一句话' }, items), '运营给的一句话')
  assert.equal(tagline({}, items), '平安 · 顺遂 · 喜乐')
  assert.equal(tagline(null, items), '平安 · 顺遂 · 喜乐')
})
