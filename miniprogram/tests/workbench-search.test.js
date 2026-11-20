const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
let definition
global.Page=page=>{definition=page}
global.getApp=()=>({globalData:{apiBase:'http://localhost'}})
global.wx={getStorageSync(){return true},setStorageSync(){},hideTabBar(){},showTabBar(){}}
require('../pages/diy/diy')
const beads=[{id:'a',name:'沉香',mat:'wood',mm:8,price:5},{id:'b',name:'紫水晶',mat:'crystal',mm:8,price:5},{id:'c',name:'银珠',mat:'metal',mm:8,price:5}]
function page(catalog=beads){const p={...definition,data:{...definition.data,design:{id:'test',name:'我的手串',beads:[],wrist:15},catalog,catalogReady:true},setData(patch){Object.assign(this.data,patch)}};p.update();return p}
test('竖排分类和尺寸筛选',()=>{const p=page();p.category({currentTarget:{dataset:{id:'wood'}}});assert.deepEqual(p.data.displayBeads.map(x=>x.id),['a']);p.category({currentTarget:{dataset:{id:'metal'}}});assert.deepEqual(p.data.displayBeads.map(x=>x.id),['c'])})
test('大量珠子每次加载 60 项',()=>{const p=page(Array.from({length:500},(_,i)=>({id:String(i),name:'珠子'+i,mat:'crystal',mm:8,price:5})));assert.equal(p.data.displayBeads.length,60);p.loadMoreBeads();assert.equal(p.data.displayBeads.length,120)})
test('工作台不显示搜索框，已选用分类列表',()=>{const markup=fs.readFileSync(path.join(__dirname,'../pages/diy/diy.wxml'),'utf8');assert.doesNotMatch(markup,/picker-search|picked-row|category-scroll/);assert.match(markup,/cat === 'picked'/)})
