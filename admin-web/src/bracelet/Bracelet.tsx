import React, { useId } from 'react';
import { layout } from './layout';
import { style } from './style';

export type VisualBead = {
  id?: string;
  name?: string;
  mm?: number;
  spacer?: boolean | null;
  mat?: string | null;
  material?: string | null;
  photo?: string | null;
  photoSm?: string | null;
  photoMd?: string | null;
  colors?: Array<string | null> | null;
  c?: Array<string | null> | null;
};
export type Tier = 's' | 'm' | 'l';
type Props = { sequence: VisualBead[]; tier: Tier; numbered?: boolean; label?: string };
const pixels = { s: 72, m: 160, l: 320 } as const;
const normalized = (bead: VisualBead) => ({
  mm: Number(bead.mm) > 0 ? Number(bead.mm) : 8,
  spacer: bead.spacer,
  photo: bead.photo || null,
  colors: [...(bead.colors || bead.c || style.fallbackColors)],
});

export function materialOf(bead: VisualBead): keyof typeof style.materials {
  const mat = String(bead.mat || bead.material || '').toLowerCase();
  const name = String(bead.name || '');
  if (bead.spacer || /metal|silver|gold|steel|金属|隔珠|隔片|转运珠|银|铜/.test(mat + name)) return 'metal';
  if (/crystal|glass|resin|amber|水晶|蜜蜡|琉璃|琥珀/.test(mat + name)) return 'translucent';
  return 'matte';
}

function BeadShape({ bead, x, y, r, rotate, prefix, index, tier, numbered = false }: {
  bead: VisualBead; x: number; y: number; r: number; rotate: number;
  prefix: string; index: number; tier: Tier; numbered?: boolean;
}) {
  const kind = materialOf(bead);
  const params = tier === 's' ? style.small : { ...style.regular, ...style.materials[kind] };
  const colors = bead.colors || bead.c || style.fallbackColors;
  const light = colors[0] || style.fallbackColors[0];
  const dark = colors[1] || style.fallbackColors[1];
  const body = `${prefix}-body-${index}`;
  const highlight = `${prefix}-highlight-${index}`;
  const glow = `${prefix}-glow-${index}`;
  const shade = `${prefix}-shade-${index}`;
  const shadow = `${prefix}-shadow-${index}`;
  const clip = `${prefix}-clip-${index}`;
  const photo = (tier === 's' ? bead.photoSm : bead.photoMd) || bead.photo;
  return <g>
    <defs>
      {kind === 'metal' && tier !== 's' ? <linearGradient id={body} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={dark} /><stop offset="31%" stopColor={light} />
        <stop offset="55%" stopColor={dark} /><stop offset="72%" stopColor={light} /><stop offset="100%" stopColor={dark} />
      </linearGradient> : <radialGradient id={body} cx="38%" cy="34%" r="100%">
        <stop offset="0%" stopColor={light} /><stop offset={`${params.colorStop}%`} stopColor={light} />
        <stop offset="100%" stopColor={dark} />
      </radialGradient>}
      <radialGradient id={highlight} cx={`${params.highlightX}%`} cy={`${params.highlightY}%`} r={`${params.highlightStop}%`}>
        <stop offset="0%" stopColor="#fff" stopOpacity={params.highlightAlpha} />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={glow} cx="58%" cy="64%" r={`${params.glowStop}%`}>
        <stop offset="0%" stopColor="#fff" stopOpacity={params.glowAlpha} />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={shade}><stop offset="65%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity={params.shadeAlpha} /></radialGradient>
      <filter id={shadow} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity={params.shadowAlpha} />
      </filter>
      <clipPath id={clip}><circle cx={x} cy={y} r={r} /></clipPath>
    </defs>
    <g filter={params.shadowAlpha ? `url(#${shadow})` : undefined}>
      <circle cx={x} cy={y} r={r} fill={`url(#${body})`} />
      <circle cx={x} cy={y} r={r} fill={`url(#${highlight})`} />
      <circle cx={x} cy={y} r={r} fill={`url(#${glow})`} />
      <circle cx={x} cy={y} r={r} fill={`url(#${shade})`} />
      {photo ? <g clipPath={`url(#${clip})`}><image href={photo} x={x-r} y={y-r} width={r*2} height={r*2}
        preserveAspectRatio="xMidYMid slice" transform={`rotate(${rotate} ${x} ${y})`} /></g> : null}
    </g>
    {numbered ? <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
      fill="white" stroke="black" strokeWidth={Math.max(1.5, r * .15)} paintOrder="stroke"
      fontSize={Math.max(7, Math.min(16, r * .9))} fontWeight="700">{index}</text> : null}
  </g>;
}

export function BeadGlyph({ bead, size = 32 }: { bead: VisualBead; size?: number }) {
  const prefix = useId().replace(/:/g, '');
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={bead.name || '珠子'}
    style={{ display: 'inline-block', verticalAlign: 'middle', flex: 'none' }}>
    <BeadShape bead={bead} x={size / 2} y={size / 2} r={size * .45} rotate={0} prefix={prefix} index={1} tier="m" />
  </svg>;
}

export default function Bracelet({ sequence, tier, numbered = false, label = '手串图' }: Props) {
  const prefix = useId().replace(/:/g, '');
  const beads = Array.isArray(sequence) ? sequence : [];
  if (!beads.length) return null;
  if (beads.length > 80) return <span role="note">超过 80 颗，暂不支持手串图预览</span>;
  const size = pixels[tier];
  const drawSize = size * style.fillRatio;
  const offset = (size - drawSize) / 2;
  const params = tier === 's' ? style.small : style.regular;
  const positions = layout(beads.map(normalized), drawSize);
  const background = tier === 'l' ? style.background.poster : style.background[tier];
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}
    style={{ display: 'block', maxWidth: '100%', height: 'auto', background }}>
    {positions.map((spot, i) => <BeadShape key={`${i}-${beads[i].id || ''}`} bead={beads[i]}
      x={spot.x + offset} y={spot.y + offset} r={spot.r * params.beadScale} rotate={spot.rotate}
      prefix={prefix} index={spot.index} tier={tier} numbered={numbered} />)}
  </svg>;
}
