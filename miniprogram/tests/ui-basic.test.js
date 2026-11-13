// 任务卡 C0f：components.wxss 的静态检查。
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const css = fs.readFileSync(path.join(__dirname, '../styles/components.wxss'), 'utf8')

test('components.wxss 里没有 # 开头的颜色值（颜色只用变量）', () => {
  const hits = css.match(/#[0-9a-fA-F]{3,8}\b/g)
  assert.ok(!hits, `发现十六进制颜色字面量：${hits && hits.join(', ')}`)
})

test('步骤 1 列的每个类名都出现在 components.wxss', () => {
  const names = [
    'c-btn', 'c-btn--sec', 'c-btn--s', 'is-off',
    'c-link', 'c-row', 'c-row--tap',
    'c-tabs', 'c-chip', 'c-pk',
    'c-check', 'c-switch', 'c-stepper', 'c-skeleton', 'c-gap',
    'is-on', 'is-err',
  ]
  for (const n of names) {
    assert.ok(css.includes('.' + n), `components.wxss 缺少 .${n}`)
  }
})
