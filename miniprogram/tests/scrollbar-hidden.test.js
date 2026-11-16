const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const miniprogram = path.resolve(__dirname, '..')

function wxmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? wxmlFiles(file) : entry.name.endsWith('.wxml') ? [file] : []
  })
}

test('每个 scroll-view 都启用 enhanced 并关闭滚动条', () => {
  let count = 0
  for (const file of wxmlFiles(miniprogram)) {
    const markup = fs.readFileSync(file, 'utf8')
    for (const match of markup.matchAll(/<scroll-view\b[^>]*>/g)) {
      count++
      const tag = match[0]
      const where = `${path.relative(miniprogram, file)}:${markup.slice(0, match.index).split('\n').length}`
      assert.match(tag, /\benhanced(?:\s|=|>)/, `${where} 缺少 enhanced`)
      assert.match(tag, /\bshow-scrollbar\s*=\s*"{{false}}"/, `${where} 未关闭滚动条`)
    }
  }
  assert.ok(count > 0, '没有找到 scroll-view，检查扫描路径')
})

test('全局样式隐藏页面滚动条', () => {
  const styles = fs.readFileSync(path.join(miniprogram, 'app.wxss'), 'utf8')
  assert.match(styles, /::-webkit-scrollbar\s*\{[^}]*display:\s*none\s*;/)
})
