// 寓意显示函数（C0d）
// 事实来源：/api/catalog 每颗珠子 tags 是寓意关键词数组（≤3），meaning 是寓意那句话；
// 知识库把握低时 meaning 为 ''，这时不显示寓意。不在前端编句子。

// 手串里出现过的珠子，按颗数从多到少取各自 tags，去重，最多 limit 个。
function keywords(items, limit = 3) {
  const counts = new Map()
  ;(items || []).forEach(b => {
    if (!b) return
    const key = b.id != null ? String(b.id) : String(b.name)
    counts.set(key, { bead: b, n: (counts.get(key) ? counts.get(key).n : 0) + 1 })
  })
  const ordered = [...counts.values()].sort((a, b) => b.n - a.n)
  const out = []
  for (const { bead } of ordered) {
    ;(bead.tags || []).forEach(t => {
      if (out.length < limit && t && !out.includes(t)) out.push(t)
    })
    if (out.length >= limit) break
  }
  return out
}

// 一颗珠子的寓意只显示第一句；没有寓意返回 ''。
function beadLine(bead) {
  const text = (bead && bead.meaning || '').trim()
  if (!text) return ''
  return text.split('。')[0] + '。'
}

// 详情页/分享卡的一句话：后端或运营给了 design.line 就用它，否则用关键词拼。
function tagline(design, items) {
  const line = design && design.line
  if (line) return line
  return keywords(items).join(' · ')
}

module.exports = { keywords, beadLine, tagline }
