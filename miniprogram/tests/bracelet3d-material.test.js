const assert = require('node:assert/strict')
let definition
global.Component = d => { definition = d }
global.getApp = () => ({ globalData: { apiBase: 'http://127.0.0.1:8801' } })
require('../components/bracelet3d/index.js')
const values = {}, draws = []
const gl = {
 viewport(){},clearColor(){},clear(){},uniformMatrix3fv(){},uniform2f(){},bindBuffer(){},getAttribLocation(){return 0},enableVertexAttribArray(){},vertexAttribPointer(){},
 getUniformLocation(_program, name){ return name },
 uniform3f(){},uniform3fv(key, val){ values[key] = Array.from(val) },
 uniform1f(key, val){ values[key] = val },
 drawElements(){ draws.push({...values}) }, COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2, TRIANGLES:4, UNSIGNED_SHORT:5123
}
const component = {gl,program:{},canvas:{width:300,height:200},width:300,height:200,rx:-0.45,ry:0,meshes:{sphere:{count:3},spacer:{count:6},cord:{count:9}},
 properties:{beads:['wood','ice','metal'],selected:-1,catalog:[
 {id:'wood',mat:'wood',mm:8,c:['#a3442f','#3d110b']},
 {id:'ice',mat:'crystal',mm:8,c:['#ffe0e7','#e08aa0']},
 {id:'metal',mat:'metal',spacer:true,mm:4,c:['#fff1b8','#a87a1c']} ]}}
for (const [name,fn] of Object.entries(definition.methods)) component[name]=fn.bind(component)
component.render()
assert.deepEqual(draws.map(x => x.kind), [5,0,3,4])
assert.equal(draws.length,4)
assert.notDeepEqual(draws[1].color, draws[1].darkColor)
assert.equal(draws[1].hasMap,0)
assert.equal(draws[0].ringMode,1)
assert.equal(draws[3].ringMode,0)
assert.equal(component.points.length,3)
console.log('珠串材质与无纹理回退检查通过')
