const test = require('node:test')
const assert = require('node:assert/strict')
let definition, toast, saved = {}
global.Page = page => { definition = page }
global.wx = {
  getStorageSync: key => saved[key], setStorageSync: (key, value) => { saved[key] = value },
  showToast: options => { toast = options.title }, navigateBack: options => options.success(), vibrateShort: () => {}
}
const store = require('../utils/design')
store.current = () => null
require('../pages/wrist/wrist')
function page() { return {...definition, data:{...definition.data}, setData(data) { Object.assign(this.data, data) }} }
test('未量过默认 15cm，8mm 珠约 21 颗', () => {
  saved = {}; const p = page(); p.onLoad({}); assert.equal(p.data.measured, false); assert.equal(p.data.display, '15.0'); assert.equal(p.data.count, 21)
})
test('加到 16cm 后约 22 颗，确认保存并反馈', () => {
  saved = {}; const p = page(); p.onLoad({}); p.step({currentTarget:{dataset:{step:0.5}}}); p.step({currentTarget:{dataset:{step:0.5}}})
  assert.equal(p.data.display, '16.0'); assert.equal(p.data.count, 22); p.confirm()
  assert.equal(saved.cgz_wrist, 16); assert.equal(saved.cgz_wrist_confirmed, true); assert.equal(toast, '已按 16cm 重新判断')
})
test('边界禁用，刻度拖动与量法切换', () => {
  const p = page(); p.setWrist(8); assert.equal(p.data.min, true); p.setWrist(30); assert.equal(p.data.max, true)
  p.setWrist(15); p.rulerStart({touches:[{clientX:0}]}); p.rulerMove({touches:[{clientX:36}]}); assert.equal(p.data.wrist, 16)
  p.tape({currentTarget:{dataset:{tape:'no'}}}); assert.equal(p.data.noTape, true)
})
