const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

const FEATURE_PAGES = [
  'after-sale/apply',
  'after-sale/detail',
  'after-sale/return',
  'after-sale/type',
  'address-edit/address-edit',
  'address/address',
  'article/article',
  'doc/doc',
  'logistics/logistics',
  'order-detail/order-detail',
  'orders/orders',
  'review/review',
  'reviews/reviews',
  'settings/settings',
  'shared/shared',
  'tryon/tryon',
  'works/works'
]

test('大页面进入功能分包且不再占用主包', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
  const feature = app.subPackages.find(item => item.root === 'features')
  assert.ok(feature)
  assert.deepEqual(feature.pages.sort(), FEATURE_PAGES.slice().sort())
  for (const page of FEATURE_PAGES) {
    assert.equal(app.pages.includes('pages/' + page), false)
  }
})

test('功能分包每个页面都有四个文件', () => {
  for (const page of FEATURE_PAGES) {
    for (const ext of ['.js', '.json', '.wxml', '.wxss']) {
      const file = path.join(root, 'features', page + ext)
      assert.ok(fs.existsSync(file), file + ' 不存在')
      assert.ok(fs.readFileSync(file, 'utf8').trim().length > 0, file + ' 是空文件')
    }
  }
})

test('上传包启用压缩并排除测试目录', () => {
  const project = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'))
  assert.equal(project.setting.minified, true)
  assert.ok(project.packOptions.ignore.some(item => item.type === 'folder' && item.value === 'tests'))
})
