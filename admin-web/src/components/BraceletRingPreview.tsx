import React from 'react';

export interface RingBeadItem {
  id?: string;
  name?: string;
  sizeMm?: number;
  color?: string;
  hi?: string;
  role?: string;
  index?: number;
}

interface BraceletRingPreviewProps {
  beads: RingBeadItem[];
  wristCm?: number;
  size?: number;
  subtitle?: string;
}

export const BraceletRingPreview: React.FC<BraceletRingPreviewProps> = ({
  beads,
  wristCm = 15,
  size = 220,
  subtitle,
}) => {
  const items = Array.isArray(beads) && beads.length > 0 ? beads : [];
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const n = items.length;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id="beadShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#0f172a" floodOpacity="0.22" />
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={radius + 18} fill="url(#ringGlow)" />
        {/* Elastic silk cord */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="3 3"
        />

        {items.map((bead, idx) => {
          const angle = -Math.PI / 2 + (idx / Math.max(1, n)) * Math.PI * 2;
          const bx = cx + Math.cos(angle) * radius;
          const by = cy + Math.sin(angle) * radius;
          const mm = Number(bead.sizeMm || 8);
          const r = Math.max(6, Math.min(16, (mm * (size / 220)) * 0.95));
          const fill = bead.color || '#64748b';
          const hi = bead.hi || '#ffffff';
          const isSpecial = bead.role === 'special';

          return (
            <g key={`${bead.id || 'b'}-${idx}`} filter="url(#beadShadow)">
              <title>{`#${bead.index || idx + 1} ${bead.name || bead.id || '珠材'} (${mm}mm)`}</title>
              {isSpecial && (
                <circle
                  cx={bx}
                  cy={by}
                  r={r + 3}
                  fill="none"
                  stroke="#c8302e"
                  strokeWidth="1.5"
                  strokeOpacity="0.65"
                />
              )}
              <circle cx={bx} cy={by} r={r} fill={fill} stroke="#ffffff" strokeWidth="0.8" />
              <circle
                cx={bx - r * 0.3}
                cy={by - r * 0.3}
                r={Math.max(1.8, r * 0.28)}
                fill={hi}
                fillOpacity="0.65"
              />
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {subtitle || '手围预览'}
        </span>
        <span className="text-lg font-bold text-zinc-900 mt-0.5">{wristCm} cm</span>
        <span className="text-[11px] text-zinc-500">{n} 颗珠材</span>
      </div>
    </div>
  );
};
