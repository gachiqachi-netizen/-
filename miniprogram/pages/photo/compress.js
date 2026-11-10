const MAX_LONG_SIDE = 1024
const MAX_BYTES = 1024 * 1024

function scaledSize(width, height, maxSide = MAX_LONG_SIDE) {
  width = Number(width) || 0
  height = Number(height) || 0
  if (width <= 0 || height <= 0) return {width: 0, height: 0}
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))}
}

const call = executor => new Promise((resolve, reject) => executor(resolve, reject))

async function prepare(path, wxApi = wx) {
  const fs = wxApi.getFileSystemManager()
  const info = await call((resolve, reject) => wxApi.getImageInfo({src: path, success: resolve, fail: reject}))
  const target = scaledSize(info.width, info.height)
  let current = path
  let size = Number(info.size) || await call((resolve, reject) => fs.stat({path, success: r => resolve(r.stats.size), fail: reject}))
  const needsResize = target.width !== Number(info.width) || target.height !== Number(info.height)
  if (!needsResize && size <= MAX_BYTES) return {path, size, width: target.width, height: target.height}
  if (typeof wxApi.compressImage !== 'function') throw new Error('当前微信版本无法压缩大图，请先裁剪后重试。')
  for (const quality of [80, 60, 40, 25]) {
    current = await call((resolve, reject) => wxApi.compressImage({
      src: current,
      quality,
      compressedWidth: target.width,
      compressedHeight: target.height,
      success: r => resolve(r.tempFilePath || current),
      fail: reject,
    }))
    size = await call((resolve, reject) => fs.stat({path: current, success: r => resolve(r.stats.size), fail: reject}))
    if (size <= MAX_BYTES) return {path: current, size, width: target.width, height: target.height}
  }
  throw new Error('压缩后仍超过 1MB，请裁剪照片或换一张后重试。')
}

module.exports = {MAX_LONG_SIDE, MAX_BYTES, scaledSize, prepare}
