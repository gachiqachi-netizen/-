const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('AR 帧不再 slice 多份并复用单一输入缓冲', () => {
  const source = fs.readFileSync(path.join(__dirname, '../ar-hand/index.js'), 'utf8')
  assert.equal(source.includes('frame.data.slice('), false)
  assert.match(source, /this\._frameBytes\.set\(new Uint8ClampedArray\(frame\.data\)\)/)
  assert.match(source, /data:this\._frameBytes/)
})

test('编辑器材料筛选只在筛选条件变化时重算', () => {
  const source = fs.readFileSync(path.join(__dirname, '../pages/diy/diy.js'), 'utf8')
  assert.match(source, /if\(filterKey!==this\.filterKey\)/)
  assert.match(source, /this\.setData\(\{\.\.\.filterPatch,items/)
})

test('3D 编辑只替换变化珠子，不再整圈 clear 重建', () => {
  const source = fs.readFileSync(path.join(__dirname, '../components/bracelet3d/three-renderer.js'), 'utf8')
  assert.match(source, /m\.userData\.key!==key/)
  assert.match(source, /while\(beadMeshes\.length>list\.length\)/)
  assert.doesNotMatch(source, /lastKey=stateKey;clear\(\)/)
})
