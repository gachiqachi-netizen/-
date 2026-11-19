// Coordinates are bead centers in pixels. Sequence position 1 starts at 12 o'clock.
function legacyLayout(sequence, size) {
  if (!Array.isArray(sequence)) throw new TypeError('sequence must be an array')
  if (!sequence.length) return []
  if (sequence.length > 80 || !Number.isFinite(size) || size <= 0) throw new RangeError('invalid bracelet size or bead count')

  const mm = sequence.map(bead => {
    const value = Number(bead.mm)
    if (!Number.isFinite(value) || value <= 0) throw new RangeError('bead mm must be positive')
    return value
  })
  const inset = Math.min(2, size * 0.04)
  const center = size / 2
  const maxRadius = Math.max(...mm) / 2
  let circleRadius
  let scale
  let angles
  if (mm.length <= 3) {
    // One to three beads cannot make a non-overlapping closed ring.
    const total = mm.reduce((sum, value) => sum + value, 0)
    scale = (size / 2 - inset) / (total / (2 * Math.PI) + maxRadius)
    circleRadius = scale * total / (2 * Math.PI)
    let walked = 0
    angles = mm.map((value) => {
      const angle = 2 * Math.PI * (walked + value / 2 - mm[0] / 2) / total
      walked += value
      return angle
    })
  } else {
    const radii = mm.map(value => value / 2)
    const chords = radii.map((radius, i) => radius + radii[(i + 1) % radii.length])
    const angleSum = radius => chords.reduce((sum, chord) => sum + 2 * Math.asin(Math.min(1, chord / (2 * radius))), 0)
    let low = Math.max(...chords) / 2
    let high = low * 2
    while (angleSum(high) > 2 * Math.PI) high *= 2
    for (let step = 0; step < 80; step++) {
      const mid = (low + high) / 2
      if (angleSum(mid) > 2 * Math.PI) low = mid
      else high = mid
    }
    const rawRadius = (low + high) / 2
    scale = (size / 2 - inset) / (rawRadius + maxRadius)
    circleRadius = rawRadius * scale
    let angle = 0
    angles = radii.map((_, i) => {
      const current = angle
      angle += 2 * Math.asin(chords[i] / (2 * rawRadius))
      return current
    })
  }

  return sequence.map((bead, position) => {
    const rotate = angles[position] * 180 / Math.PI
    const angle = -Math.PI / 2 + angles[position]
    return {
      index: position + 1,
      x: center + circleRadius * Math.cos(angle),
      y: center + circleRadius * Math.sin(angle),
      r: scale * mm[position] / 2,
      rotate,
      photo: bead.photo || null,
      colors: Array.isArray(bead.colors) ? bead.colors.slice(0, 2) : [null, null],
    }
  })
}

// Center the rendered bead bounds in a square preview without changing the ring layout.
function centerInFrame(points, size, radiusScale = 1) {
  if (!points.length) return []
  const left = Math.min(...points.map(point => point.x - point.r * radiusScale))
  const right = Math.max(...points.map(point => point.x + point.r * radiusScale))
  const top = Math.min(...points.map(point => point.y - point.r * radiusScale))
  const bottom = Math.max(...points.map(point => point.y + point.r * radiusScale))
  const scale = Math.min(1, size * 0.88 / Math.max(right - left, bottom - top))
  const midX = (left + right) / 2, midY = (top + bottom) / 2
  const center = size / 2
  return points.map(point => ({ ...point,
    x: center + (point.x - midX) * scale,
    y: center + (point.y - midY) * scale,
    r: point.r * scale,
  }))
}

// Angles are radians. Keep the shortest step when a finger crosses -π/π.
function angleDelta(previous, current) {
  let delta = current - previous
  if (delta > Math.PI) delta -= 2 * Math.PI
  if (delta < -Math.PI) delta += 2 * Math.PI
  return delta
}

function layout(sequence, size, circumferenceMm, rotation = 0) {
  if (circumferenceMm == null) return legacyLayout(sequence, size)
  if (!Array.isArray(sequence)) throw new TypeError('sequence must be an array')
  if (!sequence.length) return []
  if (sequence.length > 80 || !Number.isFinite(size) || size <= 0 || !Number.isFinite(circumferenceMm) || circumferenceMm <= 0) throw new RangeError('invalid bracelet size or circumference')
  const mm = sequence.map(bead => {
    const value = Number(bead.mm)
    if (!Number.isFinite(value) || value <= 0) throw new RangeError('bead mm must be positive')
    return value
  })
  const radii = mm.map(value => value / 2)
  const maxRadius = Math.max(...radii)
  const inset = Math.min(2, size * 0.04)
  // A fixed physical scale for a given viewport; count never enters it.
  const pixelsPerMm = (size / 2 - inset) / (160 / (2 * Math.PI) + 6)
  const baseRadius = circumferenceMm / (2 * Math.PI)
  const chords = radii.map((radius, i) => radius + radii[(i + 1) % radii.length])
  const angleSum = radius => chords.reduce((sum, chord) => sum + 2 * Math.asin(Math.min(1, chord / (2 * radius))), 0)
  let circleRadius = baseRadius
  if (mm.length > 2 && angleSum(circleRadius) > 2 * Math.PI) {
    let low = Math.max(circleRadius, Math.max(...chords) / 2), high = low * 2
    while (angleSum(high) > 2 * Math.PI) high *= 2
    for (let step = 0; step < 60; step++) {
      const mid = (low + high) / 2
      if (angleSum(mid) > 2 * Math.PI) low = mid
      else high = mid
    }
    circleRadius = high
  }
  const scale = Math.min(pixelsPerMm, (size / 2 - inset) / (circleRadius + maxRadius))
  const center = size / 2
  let walked = 0
  const angles = mm.map((_, i) => {
    const value = walked
    if (i + 1 < mm.length) walked += 2 * Math.asin(Math.min(1, chords[i] / (2 * circleRadius)))
    return value
  })
  const open = mm.length < 3 || angleSum(circleRadius) < 2 * Math.PI - 0.08
  return sequence.map((bead, position) => {
    const theta = angles[position] + rotation
    const angle = -Math.PI / 2 + theta
    return {
      index: position + 1,
      x: center + scale * circleRadius * Math.cos(angle),
      y: center + scale * circleRadius * Math.sin(angle),
      r: scale * radii[position],
      rotate: theta * 180 / Math.PI,
      circleRadius: scale * circleRadius,
      open,
      photo: bead.photo || null,
      colors: Array.isArray(bead.colors) ? bead.colors.slice(0, 2) : [null, null],
    }
  })
}

module.exports = { layout, angleDelta, centerInFrame }
