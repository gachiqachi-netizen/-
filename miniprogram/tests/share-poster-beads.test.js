const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
global.Page=()=>{}
const {drawBead}=require('../pages/share/share')
function context(){
 const calls=[]
 const ctx={save(){calls.push('save')},restore(){calls.push('restore')},beginPath(){},arc(){},clip(){calls.push('clip')},translate(){},rotate(){calls.push('rotate')},drawImage(){calls.push('photo')},setFillStyle(){},fillRect(){calls.push('fill')},createCircularGradient(){const stops=[];calls.push(stops);return {addColorStop(position,color){stops.push([position,color])}}}}
 return {ctx,calls}
}
test('海报无照片的珠子使用渐变、高光和边缘阴影',()=>{
 const {ctx,calls}=context()
 drawBead(ctx,{r:12,colors:['#ffe2a0','#9c6d22']},'',40,40)
 const gradients=calls.filter(Array.isArray)
 assert.equal(gradients.length,4)
 assert.deepEqual(gradients[0][0],[0,'#ffe2a0'])
 assert.deepEqual(gradients[0].at(-1),[1,'#9c6d22'])
 assert.ok(gradients[1].some(stop=>stop[1]==='rgba(255,255,255,0.9)'))
 assert.ok(gradients[3].some(stop=>stop[1]==='rgba(0,0,0,0.16)'))
 assert.equal(calls.filter(call=>call==='fill').length,4)
})
test('海报照片在圆形裁切后旋转绘制',()=>{
 const {ctx,calls}=context()
 drawBead(ctx,{r:12,colors:['#fff','#000'],rotate:23},'/local/photo.png',40,40)
 assert.ok(calls.indexOf('clip')<calls.indexOf('rotate'))
 assert.ok(calls.indexOf('rotate')<calls.indexOf('photo'))
 assert.equal(calls.filter(Array.isArray).length,0)
})
test('海报中央字标使用本地浅色图',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../pages/share/share.js'),'utf8')
 assert.match(source,/drawImage\('\/pages\/share\/wordmark-line\.png'/)
 assert.ok(fs.statSync(path.join(__dirname,'../pages/share/wordmark-line.png')).size>0)
})
