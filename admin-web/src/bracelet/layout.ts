export type Bead = {
  mm: number
  spacer?: boolean | null
  colors?: Array<string | null> | null
  photo?: string | null
}

export type Position = {
  index: number
  x: number
  y: number
  r: number
  rotate: number
  photo: string | null
  colors: Array<string | null>
}

// Coordinates are bead centers in pixels. Sequence position 1 starts at 12 o'clock.
export function layout(sequence: Bead[], size: number): Position[] {
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
    const angleSum = (radius: number) => chords.reduce((sum, chord) => sum + 2 * Math.asin(Math.min(1, chord / (2 * radius))), 0)
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
