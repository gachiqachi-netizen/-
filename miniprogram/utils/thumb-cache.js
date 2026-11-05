// One 2D surface serves every list thumbnail. The queue includes export so a
// second drawing cannot overwrite the canvas before the first image is saved.
const PLACEHOLDER = '/components/bracelet-thumb/placeholder.svg'
const MAX_ENTRIES = 128
const EXPORT_TIMEOUT = 5000

function normalize(beads, catalog, requestedSize) {
  const size = Math.max(64, Math.min(512, Math.round(Number(requestedSize) || 256)))
  const map = new Map((Array.isArray(catalog) ? catalog : []).map(b => [b.id, b]))
  const list = (Array.isArray(beads) ? beads : []).map(value => {
    const id = typeof value === 'string' ? value : value && value.id
    const bead = map.get(id)
    const color = c => /^#[0-9a-f]{6}$/i.test(c || '') ? c.toLowerCase() : '#bdb8b3'
    return {
      id: String(id || ''),
      missing: !bead,
      mm: Math.max(1, Math.min(100, Number(bead && bead.mm) || 8)),
      colors: [color(bead && bead.c && bead.c[0]), color(bead && bead.c && (bead.c[1] || bead.c[0]))],
      spacer: !!(bead && bead.spacer)
    }
  })
  // Include render-relevant catalog values as well as ordered ids and size:
  // changing a material colour or diameter must invalidate an old image.
  return { size, list, key: JSON.stringify([size, list]) }
}

function draw(ctx, canvas, spec) {
  const { size, list } = spec
  canvas.width = size
  canvas.height = size
  ctx.clearRect(0, 0, size, size)
  const total = list.reduce((sum, bead) => sum + bead.mm, 0)
  const radius = total / (Math.PI * 2)
  const maxDiameter = Math.max(...list.map(bead => bead.mm))
  const scale = size * .42 / (radius + maxDiameter / 2)
  let angle = -Math.PI / 2
  list.forEach(bead => {
    const step = bead.mm / total * Math.PI * 2
    const mid = angle + step / 2
    angle += step
    const r = list.length === 1 ? size * .25 : Math.max(1, bead.mm / 2 * scale)
    const x = list.length === 1 ? size / 2 : size / 2 + Math.cos(mid) * radius * scale
    const y = list.length === 1 ? size / 2 : size / 2 + Math.sin(mid) * radius * scale * .82
    ctx.save()
    ctx.translate(x, y)
    if (bead.spacer) { ctx.rotate(mid + Math.PI / 2); ctx.scale(.65, 1) }
    const gradient = ctx.createRadialGradient(-r * .32, -r * .35, r * .05, 0, 0, r)
    gradient.addColorStop(0, bead.colors[0])
    gradient.addColorStop(.65, bead.colors[0])
    gradient.addColorStop(1, bead.colors[1])
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

function createThumbCache(wxApi, options = {}) {
  const maxEntries = Math.max(1, options.maxEntries || MAX_ENTRIES)
  const timeoutMs = options.timeoutMs || EXPORT_TIMEOUT
  const entries = new Map()
  const pending = new Map()
  let canvas, context, queue = Promise.resolve()
  const fallback = key => ({ key, src: PLACEHOLDER, fallback: true })

  function exportImage(size) {
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (error, path) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        error ? reject(error) : resolve(path)
      }
      const timer = setTimeout(() => finish(new Error('thumbnail export timeout')), timeoutMs)
      try {
        wxApi.canvasToTempFilePath({
          canvas, x: 0, y: 0, width: size, height: size,
          destWidth: size, destHeight: size, fileType: 'png',
          success: result => result && result.tempFilePath
            ? finish(null, result.tempFilePath) : finish(new Error('empty thumbnail path')),
          fail: error => finish(error || new Error('thumbnail export failed'))
        })
      } catch (error) { finish(error) }
    })
  }

  function get(beads, catalog, size) {
    const spec = normalize(beads, catalog, size)
    if (!spec.list.length || spec.list.some(bead => bead.missing)) return Promise.resolve(fallback(spec.key))
    if (entries.has(spec.key)) {
      const entry = entries.get(spec.key)
      entries.delete(spec.key)
      entries.set(spec.key, entry)
      return Promise.resolve(entry)
    }
    if (pending.has(spec.key)) return pending.get(spec.key)
    const task = queue.then(async () => {
      try {
        if (!canvas || !context) {
          canvas = wxApi.createOffscreenCanvas({ type: '2d', width: spec.size, height: spec.size })
          context = canvas.getContext('2d')
          if (!context) { canvas = null; throw new Error('2d canvas unavailable') }
        }
        draw(context, canvas, spec)
        const src = await exportImage(spec.size)
        const entry = { key: spec.key, src, fallback: false }
        entries.set(spec.key, entry)
        while (entries.size > maxEntries) entries.delete(entries.keys().next().value)
        return entry
      } catch (_) {
        // Unsupported offscreen/export APIs leave a packaged image, never a
        // black canvas. Do not cache failures so re-entry can retry.
        return fallback(spec.key)
      }
    })
    pending.set(spec.key, task)
    task.then(() => pending.delete(spec.key), () => pending.delete(spec.key))
    // Yield between exports to let list scrolling and image updates proceed.
    queue = task.then(() => new Promise(resolve => setTimeout(resolve, 0)))
    return task
  }

  return { get, invalidate(key) { entries.delete(key) } }
}

let shared
function getShared() {
  if (!shared) shared = createThumbCache(wx)
  return shared
}
module.exports = {
  PLACEHOLDER, createThumbCache,
  get: (beads, catalog, size) => getShared().get(beads, catalog, size),
  invalidate: key => getShared().invalidate(key)
}
