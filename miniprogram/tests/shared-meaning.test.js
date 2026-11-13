const { test } = require('node:test')
const assert = require('node:assert/strict')
global.Page = () => {}
const { meaningFor } = require('../features/shared/shared')

const catalog = [
  { id: 'a', tags: ['纯净', '明澈'] },
  { id: 'b', tags: ['温柔', '纯净'] },
]

test('share meaning takes precedence', () => {
  assert.equal(meaningFor({ meaning: '像海风', beads: ['a'] }, catalog), '像海风')
})
test('catalog keywords provide up to three distinct fallback words', () => {
  assert.equal(meaningFor({ beads: ['a', 'b'] }, catalog), '纯净 · 明澈 · 温柔')
})
test('meaning line is empty without written meaning or catalog keywords', () => {
  assert.equal(meaningFor({ beads: ['missing'] }, catalog), '')
})
