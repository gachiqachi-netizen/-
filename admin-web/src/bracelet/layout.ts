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
  const total = mm.reduce((sum, value) => sum + value, 0)
  const inset = Math.min(2, size * 0.04)
  const scale = (size / 2 - inset) / (total / (2 * Math.PI) + Math.max(...mm) / 2)
  const circleRadius = scale * total / (2 * Math.PI)
  const center = size / 2
  let walked = 0

  return sequence.map((bead, position) => {
    const rotate = 360 * (walked + mm[position] / 2 - mm[0] / 2) / total
    const angle = -Math.PI / 2 + rotate * Math.PI / 180
    walked += mm[position]
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
