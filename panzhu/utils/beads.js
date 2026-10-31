// 珠子材质：light/dark 是新珠颜色，aged 是盘久后趋向的颜色，k 是包浆变色程度
const MATERIALS = [
  { id: 'zitan', name: '小叶紫檀', light: '#a3442f', dark: '#3d110b', aged: '#1f0606', k: 1 },
  { id: 'huali', name: '黄花梨', light: '#e0ad66', dark: '#8a5424', aged: '#5e2c0e', k: 1 },
  { id: 'xingyue', name: '星月菩提', light: '#f6eed8', dark: '#c9b48a', aged: '#a5703a', k: 1 },
  { id: 'jingang', name: '金刚菩提', light: '#bf7442', dark: '#5e2a12', aged: '#2e1206', k: 1 },
  { id: 'miela', name: '蜜蜡', light: '#ffd35c', dark: '#d4870b', aged: '#a94a08', k: 0.8 },
  { id: 'nanhong', name: '南红', light: '#ec5a3f', dark: '#8e1a10', aged: '#6e0f08', k: 0.4 },
  { id: 'lvsong', name: '绿松石', light: '#5fd0c4', dark: '#1e7f78', aged: '#2f7a55', k: 0.6 },
  { id: 'qingjin', name: '青金石', light: '#3f63d6', dark: '#14236b', aged: '#0e1850', k: 0.3 },
  { id: 'shuijing', name: '白水晶', light: '#ffffff', dark: '#bfcadb', aged: '#e4ebf5', k: 0.2 },
  { id: 'heiyao', name: '黑曜石', light: '#55556a', dark: '#0b0b10', aged: '#030305', k: 0.5 }
]
const MAP = {}
MATERIALS.forEach(m => { MAP[m.id] = m })

const LEVELS = [
  { at: 0, name: '新珠' },
  { at: 100, name: '初盘' },
  { at: 500, name: '泛光' },
  { at: 1500, name: '温润' },
  { at: 4000, name: '包浆' },
  { at: 10000, name: '老珠' }
]

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function mix(a, b, t) {
  const x = hexToRgb(a), y = hexToRgb(b)
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

// 盘的次数 -> 包浆程度 0~1
function patinaOf(count) {
  return 1 - Math.exp(-count / 3000)
}

function levelOf(count) {
  let i = 0
  while (i + 1 < LEVELS.length && count >= LEVELS[i + 1].at) i++
  const cur = LEVELS[i], next = LEVELS[i + 1]
  const progress = next ? (count - cur.at) / (next.at - cur.at) : 1
  return { index: i, name: cur.name, next: next ? next.name : '', need: next ? next.at - count : 0, progress }
}

// 一颗珠子的背景
function beadBg(id, p) {
  const m = MAP[id] || MATERIALS[0]
  const light = mix(m.light, m.aged, p * m.k * 0.7)
  const dark = mix(m.dark, m.aged, p * m.k)
  const hl = (0.3 + 0.55 * p).toFixed(2)
  return `radial-gradient(circle at 32% 28%, rgba(255,255,255,${hl}) 0%, rgba(255,255,255,0) 30%), ` +
    `radial-gradient(circle at 40% 35%, ${light} 0%, ${dark} 100%)`
}

// 计算每颗珠子在容器里的位置（单位 rpx）
function layout(beads, size, box, maxScale) {
  const n = beads.length
  if (!n) return { items: [], r: 0, s: size }
  let r = Math.max(size * 1.1, (n * size * 1.04) / (2 * Math.PI))
  const scale = Math.min(maxScale || 1, (box - 12) / (2 * r + size))
  r *= scale
  const s = size * scale
  const c = box / 2
  const items = beads.map((id, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    return { id, x: +(c + r * Math.cos(a) - s / 2).toFixed(1), y: +(c + r * Math.sin(a) - s / 2).toFixed(1) }
  })
  return { items, r: +r.toFixed(1), s: +s.toFixed(1) }
}

module.exports = { MATERIALS, MAP, LEVELS, mix, patinaOf, levelOf, beadBg, layout }
