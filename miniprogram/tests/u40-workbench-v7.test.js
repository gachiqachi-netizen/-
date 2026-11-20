const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { beadScale } = require('../utils/bracelet-layout')
const logic = require('../pages/diy/logic')
let definition
global.Page = page => { definition = page }
global.getApp = () => ({ globalData: { apiBase: 'http://localhost' } })
global.wx = { getStorageSync(){ return true }, setStorageSync(){}, hideTabBar(){}, showTabBar(){} }
require('../pages/diy/diy')
const bead = {id:'a',name:'粉草莓晶',mat:'crystal',mm:8,price:6}
function page(ids=[]){const p={...definition,data:{...definition.data,design:{id:'v7',name:'我的手串',beads:ids,wrist:15},catalog:[bead],catalogReady:true},setData(patch){Object.assign(this.data,patch)},saveDraftSoon(){}};p.update();return p}

test('比例尺遵守 375/414、15/17cm、8/10mm 与上限',()=>{
  for(const screenW of [375,414]) for(const wristCm of [15,17]) for(const maxMm of [8,10]){
    const scale=beadScale({screenW,trayH:304,wristCm,maxMm})
    const target=logic.scaleTarget(wristCm,maxMm)
    assert.ok(Math.abs(scale-Math.min(6.3,Math.min(screenW-40,252)/(target/Math.PI+maxMm)))<1e-10)
  }
  assert.ok(Math.abs(beadScale({screenW:375,trayH:304,wristCm:15,maxMm:8})-4.17)<.02)
  assert.equal(beadScale({screenW:500,trayH:500,wristCm:15,maxMm:8}),6.3)
})
test('返回有来源才显示，导航与图标使用现有资产',()=>{
  const markup=fs.readFileSync(path.join(__dirname,'../pages/diy/diy.wxml'),'utf8')
  assert.match(markup,/wx:if="{{returnSource}}" class="nav-back"/)
  assert.match(markup,/assets\/icons\/back.svg/)
  assert.match(markup,/assets\/icons\/undo.svg/)
  assert.match(markup,/assets\/brand\/wordmark.svg/)
})
test('已选减到零删除，撤销恢复',()=>{
  const p=page(['a'])
  p.removePickedOne({currentTarget:{dataset:{id:'a'}}})
  assert.deepEqual(p.data.design.beads,[])
  p.undo()
  assert.deepEqual(p.data.design.beads,['a'])
})
test('状态行短、合适、超出三态且比例尺稳定',()=>{
  const short=page(Array(5).fill('a'))
  const okay=page(Array(21).fill('a'))
  const over=page(Array(24).fill('a'))
  assert.equal(short.data.fitState,'short')
  assert.equal(okay.data.statusWord,'合适')
  assert.equal(over.data.fitState,'long')
  assert.equal(short.data.scaleRpx,okay.data.scaleRpx)
  assert.equal(okay.data.scaleRpx,over.data.scaleRpx)
})
test('目录和已选珠图固定尺寸，比例尺只用于托盘',()=>{
  const markup=fs.readFileSync(path.join(__dirname,'../pages/diy/diy.wxml'),'utf8')
  const styles=fs.readFileSync(path.join(__dirname,'../pages/diy/diy.wxss'),'utf8')
  assert.match(styles,/\.picker-bead\{width:80rpx;height:80rpx\}/)
  assert.match(styles,/\.picked-bead\{width:64rpx;height:64rpx\}/)
  assert.doesNotMatch(markup,/item(?:\.bead)?\.mm\s*\*\s*scaleRpx/)
  assert.match(markup,/pixelsPerMm="{{scaleRpx}}"/)
})
