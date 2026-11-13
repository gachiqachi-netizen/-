const test = require('node:test')
const assert = require('node:assert/strict')
const { message } = require('../pages/diy/feedback')

const rows = [
  ['add', {name:'白水晶'}, '+1 白水晶'],
  ['firstAdd', {name:'海蓝宝'}, '+1 海蓝宝　长按珠子可以看详情'],
  ['fit', {name:'白水晶'}, '+1 白水晶 · 刚好合适'],
  ['over', {}, null],
  ['removeLast', {name:'海蓝宝'}, '已去掉 1 颗海蓝宝'],
  ['finishShort', {mm:5}, '还差约 5mm，再加 1 颗就合适'],
  ['finishFew', {count:3}, '至少 6 颗才能串成一条，还差 3 颗'],
  ['finishOK', {}, null],
  ['select', {}, null], ['move', {}, null],
  ['replace', {name:'粉晶'}, '已换成粉晶'],
  ['delete', {name:'月光石'}, '已删除 1 颗月光石'],
  ['undo', {}, '已撤销'], ['selectKind', {}, null], ['inspect', {}, null],
  ['safety', {}, null],
  ['outOfStock', {}, '这颗暂时缺货，看看相似的'],
  ['multi', {}, '已经是多圈串了，长度以实际佩戴为准'],
  ['stackEmpty', {}, '先串好一条，才能叠着看'],
  ['shareFew', {}, '至少 6 颗才能分享'],
  ['rename', {}, '已改名'],
  ['unnamedFinish', {name:'海风'}, '先叫它“海风”，随时能改'],
  ['more', {}, null], ['autoSave', {}, '已存到我的作品'],
  ['wrist', {wrist:16}, '已按 16cm 重新判断'], ['catalogError', {}, null],
]
for (const [type, state, expected] of rows) {
  test(`反馈表 ${type}`, () => assert.equal(message(type, state), expected))
}
