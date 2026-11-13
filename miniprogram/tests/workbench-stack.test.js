const test = require('node:test')
const assert = require('node:assert/strict')
let definition
const storage = {}
global.Page = page => { definition = page }
global.getApp = () => ({globalData:{apiBase:'http://localhost'}})
global.wx = {getStorageSync:key=>storage[key],setStorageSync:(key,value)=>{storage[key]=value},hideTabBar(){}}
require('../pages/diy/diy')
const store = require('../utils/design')
const {layout} = require('../components/bracelet/index')
const catalog = [{id:'a',name:'海蓝宝',mat:'crystal',mm:8,price:4,tags:['清澈']},{id:'b',name:'月光石',mat:'crystal',mm:8,price:6,tags:['平安']}]
function page(beads = ['a','b']) {
  const p = {...definition,data:{...definition.data,design:{id:'current',name:'当前',wrist:15,beads:beads.slice()},catalog,catalogReady:true},setData(patch){Object.assign(this.data,patch)},saveDraftSoon(){},playSound(){},vibrate(){}}
  p.update()
  return p
}
test('清空确认层保留原文案，取消不清空，确认后才清空', () => {
  const p = page(['a', 'b'])
  const markup = require('node:fs').readFileSync(require('node:path').join(__dirname, '../pages/diy/diy.wxml'), 'utf8')
  assert.match(markup, /title="清空手串？"/)
  assert.match(markup, /清空后可以撤销恢复。/)
  p.trash()
  assert.equal(p.data.clearOpen, true)
  assert.deepEqual(p.data.design.beads, ['a', 'b'])
  p.closeClear()
  assert.deepEqual(p.data.design.beads, ['a', 'b'])
  p.trash()
  p.confirmClear()
  assert.deepEqual(p.data.design.beads, [])
})
test('叠戴最多选两条，预览只改托盘，当前手串和价格仍随加珠更新', () => {
  const originals=[{id:'one',name:'素月',beads:['b','b']},{id:'two',name:'初恋粉',beads:['a','a']},{id:'three',name:'第三条',beads:['a']}]
  const oldList=store.list
  store.list=()=>originals
  try {
    const p=page()
    const before=p.data.design.beads.slice(),oldPrice=p.data.handPrice
    p.stack()
    assert.equal(p.data.stackOpen,true)
    for (const id of ['one','two'])p.chooseStack({currentTarget:{dataset:{id}}})
    p.chooseStack({currentTarget:{dataset:{id:'three'}}})
    assert.deepEqual(p.data.stackIds,['one','two'])
    p.applyStack()
    assert.equal(p.data.stackOpen,false)
    assert.equal(p.data.stackPreview,true)
    assert.equal(p.data.stackLabel,'素月、初恋粉')
    assert.deepEqual(p.data.stackBeads.map(group=>group.map(b=>b.id)),[['b','b'],['a','a']])
    assert.deepEqual(p.data.design.beads,before)
    assert.equal(p.data.handPrice,oldPrice)
    p.addBead(catalog[0])
    assert.deepEqual(p.data.design.beads,['a','b','a'])
    assert.notEqual(p.data.handPrice,oldPrice)
    assert.deepEqual(p.data.stackBeads.map(group=>group.map(b=>b.id)),[['b','b'],['a','a']])
    p.closeStackPreview()
    assert.equal(p.data.stackPreview,false)
  } finally {store.list=oldList}
})
test('20 颗 8mm 按手围重排成 21 颗，尺寸文案由原规则计算', () => {
  const p=page(Array(20).fill('a'))
  p.reflowWrist()
  assert.equal(p.data.design.beads.length,21)
  assert.equal(p.data.lengthMm,168)
  assert.equal(p.data.fit,'刚好合适')
})
test('托盘上拉放大、松手复位，长按拖动可换位', () => {
  const p=page(['a','b','a'])
  p.trayTouchStart({touches:[{clientX:100,clientY:200}]})
  p.trayTouchMove({touches:[{clientX:100,clientY:130}]})
  assert.equal(p.data.trayExpanded,true)
  p.trayTouchEnd()
  assert.equal(p.data.trayExpanded,false)
  const target=layout(p.data.items,470)[1]
  p.setData({selected:0})
  p.createSelectorQuery=()=>({select(){return this},boundingClientRect(callback){this.callback=callback;return this},exec(){this.callback({left:0,top:0,width:470,height:470})}})
  p.trayLongPress({})
  p.trayLastX=target.x+target.box/2;p.trayLastY=target.y+target.box/2
  p.trayTouchEnd()
  assert.deepEqual(p.data.design.beads,['b','a','a'])
  assert.equal(p.data.trayExpanded,false)
})
test('更多可切落珠声，按 108 颗进入多圈串', () => {
  const p=page(['a'])
  p.toggleMore()
  assert.equal(p.data.moreOpen,true)
  p.toggleSound()
  assert.equal(p.data.soundOn,false)
  p.openCount()
  assert.equal(p.data.countOpen,true)
  p.count({currentTarget:{dataset:{count:108}}})
  assert.equal(p.data.design.beads.length,108)
  assert.equal(p.data.fit,'多圈串')
  assert.equal(p.data.countOpen,false)
})
test('起名只从珠子 tags 推荐；禁用词不能保存，输入最多八字', () => {
  const p=page(Array(21).fill('a'))
  p.setData({tags:['清澈','招财','平安']})
  p.openName()
  assert.deepEqual(p.data.nameSuggestions,['清澈','清澈平安'])
  p.nameInput({detail:{value:'招财手串'}})
  assert.equal(p.data.nameError,'名字里不要写功效类的词')
  p.confirmName()
  assert.equal(p.data.design.name,'当前')
  p.nameInput({detail:{value:'清澈的海风天空啊呀'}})
  assert.equal(p.data.nameDraft,'清澈的海风天空啊')
  p.chooseName({currentTarget:{dataset:{name:'清澈平安'}}})
  p.confirmName()
  assert.equal(p.data.design.name,'清澈平安')
  assert.equal(p.data.nameOpen,false)
})
test('没起名就点串好了，用所选珠子的安全 tags 推荐首名', () => {
  const p=page(Array(21).fill('a'))
  p.data.design.name='我的手串'
  p.save=()=>{}
  let navigated=''
  wx.navigateTo=({url})=>{navigated=url}
  p.finish()
  assert.equal(p.data.design.name,'清澈')
  assert.equal(navigated,'/pages/finish/finish')
})
