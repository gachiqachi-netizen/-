const test = require('node:test')
const assert = require('node:assert/strict')
const logic = require('../pages/diy/logic')

test('picked chip tap removes one occurrence and long press removes its whole group', () => {
  const ids = ['a', 'b', 'a', 'a']
  assert.deepEqual(logic.removeOne(ids, 'a'), ['a', 'b', 'a'])
  assert.deepEqual(logic.removeGroup(ids, 'a'), ['b'])
  assert.deepEqual(ids, ['a', 'b', 'a', 'a'])
})

test('wrist change recalculates remaining length', () => {
  const beads = [{ id: 'a', mm: 8, price: 1 }]
  assert.equal(logic.stats(['a'], beads, 15).fit, '还差约 157mm')
  assert.equal(logic.stats(['a'], beads, 16).fit, '还差约 167mm')
})

test('return button is conditional on a consumed source', () => {
  const wxml = require('node:fs').readFileSync(require('node:path').join(__dirname, '../pages/diy/diy.wxml'), 'utf8')
  assert.match(wxml, /wx:if="\{\{returnSource\}\}" class="tray-back" bindtap="back"/)
})
