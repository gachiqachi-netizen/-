const test=require('node:test'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm')
const source=fs.readFileSync(path.join(__dirname,'../features/tryon/tryon.js'),'utf8')
function pageWith(request,modelBase='http://127.0.0.1:8801/models'){
  let methods
  const scope={Page:definition=>{methods=definition},getApp:()=>({globalData:{modelBase}}),
    wx:{request},require:name=>name==='../../utils/wrist-ring'?require('../utils/wrist-ring'):name==='./my-hand'?{}:{}}
  vm.runInNewContext(source,scope)
  const page={data:{...methods.data},setData(value){Object.assign(this.data,value)}}
  return {page,loadHands:methods.loadHands}
}
test('real model hands open first hand and preserve five labels',()=>{
  const handData=require('../../tools/hand-tracker/tryon-hands.v1.json')
  const {page,loadHands}=pageWith(({success})=>success({statusCode:200,data:handData}))
  loadHands.call(page)
  assert.equal(page.data.mode,'hand')
  assert.equal(page.data.selectedHand.id,'hand-018')
  assert.equal(page.data.hands.length,5)
  assert.deepEqual(Array.from(page.data.hands,x=>x.label),handData.hands.map(x=>x.label))
})
test('missing or invalid hands manifest falls back to my hand without error',()=>{
  for(const request of [({fail})=>fail({}),({success})=>success({statusCode:404,data:{}}),({success})=>success({statusCode:200,data:{hands:[]}})]){
    const {page,loadHands}=pageWith(request)
    loadHands.call(page)
    assert.equal(page.data.mode,'photo')
    assert.equal(page.data.selectedHand,null)
    assert.equal(page.data.handError,'')
  }
  const {page,loadHands}=pageWith(()=>{throw Error('should not request')},'')
  loadHands.call(page)
  assert.equal(page.data.mode,'photo')
})
