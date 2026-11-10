const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

test('大页面进入功能分包且不再占用主包', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
  const feature = app.subPackages.find(item => item.root === 'features')
  assert.ok(feature)
  assert.deepEqual(feature.pages.sort(), [
    'order-detail/order-detail',
    'shared/shared',
    'tryon/tryon'
  ])
  for (const page of ['pages/tryon/tryon', 'pages/shared/shared', 'pages/order-detail/order-detail']) {
    assert.equal(app.pages.includes(page), false)
  }
})

test('上传包启用压缩并排除测试目录', () => {
  const project = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'))
  assert.equal(project.setting.minified, true)
  assert.ok(project.packOptions.ignore.some(item => item.type === 'folder' && item.value === 'tests'))
})
