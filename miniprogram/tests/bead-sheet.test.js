const test=require('node:test'), assert=require('node:assert/strict')
const {variants,fitHint,unitPrice}=require('../components/bead-sheet/model')
const catalog=[{id:'moon6',name:'月光石',mm:6,price:6,stock:'out_of_stock'},{id:'moon8',name:'月光石',mm:8,price:8},{id:'moon10',name:'月光石',mm:10,price:10},{id:'other',name:'白水晶',mm:8,price:5}]

test('选规格只列同名珠子并标出缺货尺寸',()=>{
  assert.deepEqual(variants(catalog[1],catalog).map(b=>[b.id,b.available]),[['moon6',false],['moon8',true],['moon10',true]])
})
test('提示用现有尺寸统计计算，换尺寸后重算',()=>{
  const design={beads:Array(18).fill('moon8'),wrist:15}
  assert.equal(fitHint(design,catalog,catalog[1],3),'加 3 颗刚好合适')
  assert.notEqual(fitHint(design,catalog,catalog[2],3),'加 3 颗刚好合适')
})
test('已经合适时不显示补珠提示',()=>{
  const design={beads:Array(21).fill('moon8'),wrist:15}
  assert.equal(fitHint(design,catalog,catalog[1],1),'')
})
test('单价从目录换算为元展示',()=>assert.equal(unitPrice(catalog[1]),'8'))

test('弹层切尺寸会改价并重算数量提示，缺货尺寸不可选',()=>{
  let spec
  global.Component=value=>{spec=value}
  require('../components/bead-sheet/index')
  const design={beads:Array(18).fill('moon8'),wrist:15}
  const component={data:{catalog,design},setData(patch){Object.assign(this.data,patch)},triggerEvent(){}}
  Object.assign(component,spec.methods)
  spec.observers['bead,catalog,design,show'].call(component,catalog[1],catalog,design,true)
  assert.equal(component.data.price,'8')
  component.selectSize({currentTarget:{dataset:{id:'moon6'}}})
  assert.equal(component.data.selected.id,'moon8')
  component.selectSize({currentTarget:{dataset:{id:'moon10'}}})
  assert.equal(component.data.price,'10')
  assert.equal(component.data.hint,fitHint(design,catalog,catalog[2],1))
  component.step({currentTarget:{dataset:{delta:-1}}})
  assert.equal(component.data.quantity,1)
  delete global.Component
})
test('同款所有尺寸缺货时禁用主动作并给相似珠入口',()=>{
 let spec;global.Component=value=>{spec=value}
 delete require.cache[require.resolve('../components/bead-sheet/index')]
 require('../components/bead-sheet/index')
 const allOut=[{...catalog[0]},{id:'quartz',name:'白水晶',mat:catalog[0].mat,mm:8,price:5}]
 const component={data:{catalog:allOut,design:{beads:[],wrist:15}},setData(patch){Object.assign(this.data,patch)},triggerEvent(){}}
 Object.assign(component,spec.methods)
 spec.observers['bead,catalog,design,show'].call(component,allOut[0],allOut,component.data.design,true)
 assert.equal(component.data.selected,null)
 assert.equal(component.data.similar.id,'quartz')
 delete global.Component
})
