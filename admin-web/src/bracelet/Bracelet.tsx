import React, { useId } from 'react';
import { layout } from './layout';

export type VisualBead = {
  id?: string;
  name?: string;
  mm?: number;
  spacer?: boolean | null;
  photo?: string | null;
  colors?: Array<string | null> | null;
  c?: Array<string | null> | null;
};

type Props = { sequence: VisualBead[]; size: number; numbered?: boolean; label?: string };

const fallback = ['#b8b8b8', '#e3e3e3'];
const normalized = (bead: VisualBead) => ({
  mm: Number(bead.mm) > 0 ? Number(bead.mm) : 8,
  spacer: bead.spacer,
  photo: bead.photo || null,
  colors: bead.colors || bead.c || fallback,
});

function BeadShape({ bead, x, y, r, rotate, prefix, index, numbered = false }: {
  bead: VisualBead; x: number; y: number; r: number; rotate: number;
  prefix: string; index: number; numbered?: boolean;
}) {
  const colors = bead.colors || bead.c || fallback;
  const base = colors[0] || fallback[0];
  const light = colors[1] || fallback[1];
  const gradient = `${prefix}-gradient-${index}`;
  const clip = `${prefix}-clip-${index}`;
  return <g>
    <defs>
      <radialGradient id={gradient} cx="32%" cy="28%" r="72%">
        <stop offset="0%" stopColor={light} />
        <stop offset="70%" stopColor={base} />
        <stop offset="100%" stopColor={base} />
      </radialGradient>
      <clipPath id={clip}><circle cx={x} cy={y} r={r} /></clipPath>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${gradient})`} stroke="rgba(0,0,0,.12)" strokeWidth={Math.max(.3, r * .04)} />
    {bead.photo ? <g clipPath={`url(#${clip})`}>
      <image href={bead.photo} x={x - r} y={y - r} width={r * 2} height={r * 2}
        preserveAspectRatio="xMidYMid slice" transform={`rotate(${rotate} ${x} ${y})`} />
    </g> : null}
    {numbered ? <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fill="white" stroke="black" strokeWidth={Math.max(1.5, r * .15)} paintOrder="stroke"
      fontSize={Math.max(7, Math.min(16, r * .9))} fontWeight="700">{index}</text> : null}
  </g>;
}

export function BeadGlyph({ bead, size = 32 }: { bead: VisualBead; size?: number }) {
  const prefix = useId().replace(/:/g, '');
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={bead.name || '珠子'}
    style={{ display: 'inline-block', verticalAlign: 'middle', flex: 'none' }}>
    <BeadShape bead={bead} x={size / 2} y={size / 2} r={size * .45} rotate={0} prefix={prefix} index={1} />
  </svg>;
}

export default function Bracelet({ sequence, size, numbered = false, label = '手串图' }: Props) {
  const prefix = useId().replace(/:/g, '');
  const beads = Array.isArray(sequence) ? sequence : [];
  if (!beads.length) return null;
  if (beads.length > 80) return <span role="note">超过 80 颗，暂不支持手串图预览</span>;
  const positions = layout(beads.map(normalized), size);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}
    style={{ display: 'block', maxWidth: '100%', height: 'auto' }}>
    {positions.map((spot, i) => <BeadShape key={`${i}-${beads[i].id || ''}`} bead={beads[i]}
      x={spot.x} y={spot.y} r={spot.r} rotate={spot.rotate}
      prefix={prefix} index={spot.index} numbered={numbered} />)}
  </svg>;
}
