const test = require('node:test')
const assert = require('node:assert/strict')
let definition
global.Page = value => { definition=value }
const {photoPattern} = require('../pages/photo/photo')
const catalog = [
  {id:'main',name:'主珠',mm:8}, {id:'accent',name:'配珠',mm:8},
  {id:'metal',name:'金属',mm:4}, {id:'center',name:'佛头',mm:10},
]
const selected = {main:'main',accent:'accent',metal:'metal',center:'center'}
test('sequence cycles in 12 o’clock order to a 15 cm wrist', () => {
  const ids=photoPattern({main:'main',layout:{sequence:['main','accent','metal']}},selected,catalog,15)
  assert.ok(ids.length>=12)
  assert.deepEqual(ids.slice(0,6),['main','accent','metal','main','accent','metal'])
})
test('symmetric places center and mirrors both sides', () => {
  const ids=photoPattern({main:'main',layout:{symmetric:true,sequence:['main','accent']}},selected,catalog,15)
  assert.equal(ids[0],'center')
  assert.deepEqual(ids.slice(1),ids.slice(1).reverse())
  assert.ok(ids.length>=12)
})
test('every fallback repeats accent at requested interval', () => {
  const ids=photoPattern({main:'main',every:3}, {main:'main',accent:'accent'},catalog,15)
  assert.deepEqual(ids.slice(0,6),['main','main','accent','main','main','accent'])
})
test('switching a candidate changes the preview bead', () => {
  const page={...definition,data:{...definition.data,catalog,matchedKinds:[{role:'accent',options:[{id:'accent'},{id:'metal'}]}],
    chosenKinds:{main:'main',accent:'accent'},result:{main:'main',every:2},wrist:15},
    setData(values,done){Object.assign(this.data,values);if(done)done()}}
  page.renderResult()
  assert.ok(page.data.previewIds.includes('accent'))
  page.chooseCandidate({currentTarget:{dataset:{role:'accent',id:'metal'}}})
  assert.ok(page.data.previewIds.includes('metal'))
})
