// 长度显示函数（C0d）
// 只看 stats.length - stats.target 和颗数；stats 由 pages/editor/logic.js 的 stats() 算出。

// 差值合适区间 -4..+6mm；多圈串只看颗数（>= 54）。
function fitText(stats, count) {
  if (count >= 54) return { word: '多圈串', state: 'multi' }
  const diff = stats.length - stats.target
  if (diff < -4) return { word: `还差约 ${Math.round(-diff)}mm`, state: 'short', mm: Math.round(-diff) }
  if (diff > 6) return { word: `超出约 ${Math.round(diff)}mm`, state: 'long', mm: Math.round(diff) }
  return { word: '刚好合适', state: 'ok', short: '合适' }
}

// 量尺位置 0–100：合适区间 -4..+6mm 映射到 43%–60%，两端夹在 2%–98%。
// 算法与 mockups-final.html 的 wb() 一致：43 + (length - (target - 4)) / 10 * 17。
function meterPos(stats) {
  const pos = 43 + (stats.length - (stats.target - 4)) / 10 * 17
  return Math.min(98, Math.max(2, pos))
}

module.exports = { fitText, meterPos }
