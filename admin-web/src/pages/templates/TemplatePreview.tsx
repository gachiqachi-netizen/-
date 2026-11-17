import React, { useId } from 'react';
import { layout } from '../../bracelet/layout';
import style from '../../../../server/tests/fixtures/bracelet_style.json';

type Bead = { id?: string; mm?: number; photo?: string; photoMd?: string; c?: string[]; colors?: string[]; mat?: string };
const material = (mat = ''): keyof typeof style.materials =>
  /metal|金|银|铜/.test(mat) ? 'metal' : /crystal|glass|wax|水晶|蜜蜡|琉璃/.test(mat) ? 'translucent' : 'matte';

export default function TemplatePreview({ beads }: { beads: Bead[] }) {
  const prefix = useId().replace(/:/g, '');
  if (!beads.length) return null;
  const size = 320;
  const positions = layout(beads.map(bead => ({ ...bead, mm: Number(bead.mm) || 8 })), size);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="模板珠子排布预览">
    {style.background.l !== 'transparent' && <rect width={size} height={size} fill={style.background.poster} />}
    <defs>{positions.map((p, i) => {
      const bead = beads[i], colors = bead.colors || bead.c || style.fallbackColors;
      const params = style.materials[material(bead.mat)];
      return <React.Fragment key={i}>
        <radialGradient id={`${prefix}-g-${i}`} cx={`${style.regular.highlightX}%`} cy={`${style.regular.highlightY}%`} r="75%">
          <stop offset="0%" stopColor={colors[1] || colors[0]} stopOpacity={1 - params.highlightAlpha} />
          <stop offset={`${params.colorStop}%`} stopColor={colors[0] || style.fallbackColors[0]} />
          <stop offset="100%" stopColor={colors[0] || style.fallbackColors[1]} stopOpacity={1 - params.shadeAlpha} />
        </radialGradient>
        <clipPath id={`${prefix}-c-${i}`}><circle cx={p.x} cy={p.y} r={p.r * style.regular.beadScale} /></clipPath>
      </React.Fragment>;
    })}</defs>
    {positions.map((p, i) => {
      const bead = beads[i], photo = bead.photoMd || bead.photo;
      const radius = p.r * style.regular.beadScale;
      return <g key={i}>
        <circle cx={p.x} cy={p.y + 1} r={radius} fill="#000" opacity={style.materials[material(bead.mat)].shadowAlpha} />
        <circle cx={p.x} cy={p.y} r={radius} fill={`url(#${prefix}-g-${i})`} />
        {photo && <image href={photo} x={p.x - radius} y={p.y - radius} width={radius * 2} height={radius * 2}
          preserveAspectRatio="xMidYMid slice" clipPath={`url(#${prefix}-c-${i})`} />}
      </g>;
    })}
  </svg>;
}
