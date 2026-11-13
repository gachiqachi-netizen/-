const test = require('node:test')
const assert = require('node:assert/strict')
const pendingAiPhoto = require('../pages/photo/pending-ai-photo')

test('照片交接对象字段齐全并保留成功识别描述', () => {
  assert.deepEqual(pendingAiPhoto('/tmp/beads.jpg', {ok:true, seen:'粉色主珠配银隔片', main:'bead-1'}), {path:'/tmp/beads.jpg', seen:'粉色主珠配银隔片', main:'bead-1'})
})

test('没有识别结果时描述和主珠都是空串', () => {
  assert.deepEqual(pendingAiPhoto('/tmp/beads.jpg', null), {path:'/tmp/beads.jpg', seen:'', main:''})
})

test('识别失败的原因不会写进交接对象', () => {
  assert.deepEqual(pendingAiPhoto('/tmp/beads.jpg', {ok:false, seen:'照片太暗', main:'wrong', reason:'dark'}), {path:'/tmp/beads.jpg', seen:'', main:''})
})
