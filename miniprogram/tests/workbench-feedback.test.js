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

let pageDefinition
const saved = []
global.Page = definition => { pageDefinition = definition }
global.getApp = () => ({ globalData: { apiBase: 'http://localhost' } })
global.wx = {
  getStorageSync: () => null,
  setStorageSync: () => {},
  navigateTo: ({url}) => saved.push(url),
}
require('../pages/diy/diy')
const api = require('../utils/api')
const { queue } = require('../utils/toast')
const catalog = [
  {id:'a',kb:'zhusha',name:'朱砂',mat:'stone',mm:8,price:5,safety:'产品安全提示'},
  {id:'b',name:'海蓝宝',mat:'crystal',mm:8,price:4},
  {id:'c',name:'缺货珠',mat:'crystal',mm:8,price:4,stock:'out_of_stock'},
]
function page(beads = []) {
  const p = { ...pageDefinition, data: { ...pageDefinition.data, design: {id:'test',wrist:15,beads}, catalog, catalogReady:true },
    setData(patch){Object.assign(this.data,patch)}, saveDraftSoon(){}, playSound(){}, vibrate(){} }
  p.update()
  return p
}
test('第一次安全珠先弹知识库原文，拒绝不加，确认后再加不弹', async () => {
  const p = page()
  const oldRequest = api.request
  api.request = async () => ({safety:{note:'知识库安全原文'},care:'知识库保养原文'})
  try {
    p.add({currentTarget:{dataset:{id:'a'}}})
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(p.data.safetyOpen,true)
    assert.equal(p.data.safetyNote,'知识库安全原文')
    assert.equal(p.data.safetyCare,'知识库保养原文')
    assert.deepEqual(p.data.design.beads,[])
    p.cancelSafety()
    assert.deepEqual(p.data.design.beads,[])
    p.add({currentTarget:{dataset:{id:'a'}}})
    await new Promise(resolve => setImmediate(resolve))
    p.confirmSafety()
    assert.deepEqual(p.data.design.beads,['a'])
    p.add({currentTarget:{dataset:{id:'a'}}})
    assert.deepEqual(p.data.design.beads,['a','a'])
    assert.equal(p.data.safetyOpen,false)
  } finally { api.request = oldRequest }
})
test('缺货珠不进入手串；删除后撤销恢复顺序', () => {
  const p = page(['b','a'])
  p.add({currentTarget:{dataset:{id:'c'}}})
  assert.deepEqual(p.data.design.beads,['b','a'])
  p.setData({selected:0})
  p.remove()
  assert.deepEqual(p.data.design.beads,['a'])
  p.undo()
  assert.deepEqual(p.data.design.beads,['b','a'])
})
test('文章 beadKbId 定位到目录珠子并选中格子', () => {
  const p = page()
  p.onLoad({beadKbId:'zhusha'})
  p.focusKbBead()
  assert.equal(p.data.focusedBeadId,'a')
  assert.equal(p.data.scrollBeadId,'bead-a')
})
test('20 颗 8mm 点串好了提示还差 5mm，不跳转', () => {
  const p = page(Array(20).fill('b'))
  const messages = []
  const oldShow = queue.show
  queue.show = value => messages.push(value.text)
  try {
    const before = saved.length
    p.finish()
    assert.equal(saved.length,before)
    assert.equal(messages.at(-1),'还差约 5mm，再加 1 颗就合适')
  } finally { queue.show = oldShow }
})
