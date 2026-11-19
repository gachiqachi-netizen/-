const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
let definition
global.Page = page => { definition = page }
global.getApp = () => ({ globalData: { apiBase: 'http://localhost' } })
global.wx = { getStorageSync(){return true}, setStorageSync(){}, hideTabBar(){}, showTabBar(){} }
require('../pages/diy/diy')

const beads = [
  {id:'a',name:'达拉千 沉香方片',kbName:'沉香',mat:'wood',mm:8,price:5},
  {id:'b',name:'紫水晶',kbName:'Moon Stone 乌拉圭 紫',mat:'crystal',mm:8,price:5},
  {id:'c',name:'普通沉香',mat:'wood',mm:10,price:5},
  {id:'d',name:'银珠',mat:'metal',mm:8,price:5}
]
function page(catalog=beads) {
  const p={...definition,data:{...definition.data,design:{id:'test',name:'我的手串',beads:[],wrist:15},catalog,catalogReady:true},setData(patch){Object.assign(this.data,patch)}}
  p.update()
  return p
}
function search(p,text){p.setData({searchText:text,searchQuery:text});p.update()}

test('名称和 kbName 忽略空格及大小写命中',()=>{
  const p=page()
  search(p,' 达拉千 沉香 ')
  assert.deepEqual(p.data.displayBeads.map(x=>x.id),['a'])
  search(p,' 乌拉圭 紫 ')
  assert.deepEqual(p.data.displayBeads.map(x=>x.id),['b'])
  assert.equal(p.data.searchCount,1)
  search(p,' moonstone ')
  assert.deepEqual(p.data.displayBeads.map(x=>x.id),['b'])
})
test('搜索与材质、尺寸同时生效，清除恢复',()=>{
  const p=page()
  p.category({currentTarget:{dataset:{id:'wood'}}})
  p.sizeFilter({currentTarget:{dataset:{size:8}}})
  search(p,'沉香')
  assert.deepEqual(p.data.displayBeads.map(x=>x.id),['a'])
  p.clearSearch()
  assert.equal(p.data.searchQuery,'')
  assert.deepEqual(p.data.displayBeads.map(x=>x.id),['a'])
  p.sizeFilter({currentTarget:{dataset:{size:'all'}}})
  assert.deepEqual(p.data.displayBeads.map(x=>x.id),['a','c'])
})
test('无结果提供固定文案，离开页面清空搜索且不存入草稿',()=>{
  const p=page()
  search(p,'不存在')
  assert.equal(p.data.searchCount,0)
  assert.deepEqual(p.data.displayBeads,[])
  const markup=fs.readFileSync(path.join(__dirname,'../pages/diy/diy.wxml'),'utf8')
  assert.match(markup,/没找到，换个词或清除筛选/)
  const store=require('../utils/design'), oldSave=store.save
  store.save=()=>{}
  try { p.onHide() } finally { store.save=oldSave }
  assert.equal(p.data.searchQuery,'')
  assert.equal(p.data.searchText,'')
  assert.equal('searchQuery' in p.data.design,false)
})
test('500 件先显示 60 件，滚到底每次追加 60 件',()=>{
  const catalog=Array.from({length:500},(_,i)=>({id:String(i),name:`珠子${i}`,mat:'crystal',mm:8,price:5}))
  const p=page(catalog)
  assert.equal(p.data.searchCount,500)
  assert.equal(p.data.displayBeads.length,60)
  p.loadMoreBeads()
  assert.equal(p.data.displayBeads.length,120)
  search(p,'珠子49')
  assert.equal(p.data.displayBeads.length,11)
  assert.equal(p.data.searchCount,11)
})
test('输入等待 300ms 才更新结果，清除会取消未执行的筛选',async()=>{
  const p=page()
  p.searchInput({detail:{value:'沉香'}})
  assert.equal(p.data.searchQuery,'')
  await new Promise(resolve=>setTimeout(resolve,320))
  assert.equal(p.data.searchQuery,'沉香')
  assert.equal(p.data.searchCount,2)
  p.searchInput({detail:{value:'紫水晶'}})
  p.clearSearch()
  await new Promise(resolve=>setTimeout(resolve,320))
  assert.equal(p.data.searchQuery,'')
  assert.equal(p.data.searchCount,3)
})
test('搜索聚焦收起珠盘，失焦恢复',()=>{
  const p=page()
  p.searchFocus()
  assert.equal(p.data.searchFocused,true)
  assert.equal(p.data.trayExpanded,false)
  p.searchBlur()
  assert.equal(p.data.searchFocused,false)
  const markup=fs.readFileSync(path.join(__dirname,'../pages/diy/diy.wxml'),'utf8')
  assert.match(markup,/focus="\{\{searchFocused\}\}"/)
  assert.match(markup,/wx:if="\{\{!searchFocused && !searchQuery && !error\}\}"/)
})
