const test = require('node:test')
const assert = require('node:assert/strict')

function createPage() {
  let definition
  global.Page = value => { definition = value }
  global.wx = {switchTab: () => {}, vibrateShort: () => {}}
  delete require.cache[require.resolve('../pages/photo/photo')]
  require('../pages/photo/photo')
  const page = {...definition, data:{...definition.data}, setData(values, callback) {Object.assign(this.data, values); if (callback) callback()}}
  return page
}

test('拍照后先询问用法，不立刻识别', () => {
  const page = createPage()
  page.recognize = () => {throw new Error('识别不应立即开始')}
  page.selectedPhoto('/tmp/photo.jpg')
  assert.equal(page.data.photo, '/tmp/photo.jpg')
  assert.equal(page.data.usageOpen, true)
})

test('照着感觉配时把照片和识别信息交给 AI 页', () => {
  const page = createPage()
  const app = {globalData:{}}
  let route = ''
  global.getApp = () => app
  global.wx.switchTab = ({url}) => {route = url}
  page.data.photo = '/tmp/photo.jpg'
  page.data.result = {ok:true, seen:'粉色珠子', main:'bead-1'}
  page.useFeeling()
  assert.deepEqual(app.globalData.pendingAiPhoto, {path:'/tmp/photo.jpg', seen:'粉色珠子', main:'bead-1'})
  assert.equal(route, '/pages/ai/ai')
  delete global.getApp
})

test('拒绝相机权限时进入权限页', () => {
  const page = createPage()
  page.cameraError()
  assert.equal(page.data.permissionDenied, true)
})
