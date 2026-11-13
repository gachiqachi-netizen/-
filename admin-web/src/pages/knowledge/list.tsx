import React from 'react';
import { fmtTime } from '../../api';
import { Table } from '../../ui/Table';

export type KbRow = {
  id: string; name: string; category?: string; meaningTags?: string[];
  meaningConfidence?: string; onSaleCount?: number; updatedAt?: string;
};
export type KbList = { items: KbRow[]; totalKinds: number; lowConfidence: number; spacer: number; recent7d: number };
export type KbFilter = 'all' | 'hidden' | 'recent';

const confidence: Record<string, string> = { high: '高', mid: '中', low: '低' };
const categoryName: Record<string, string> = {
  agate: '玛瑙', banned: '禁用品种', bodhi: '菩提', colored: '彩色宝石', combo: '复合材料',
  crystal: '水晶', feldspar: '长石', fitting: '配件', gem: '宝石', incense: '香材',
  jade: '玉石', kernel: '果核', manmade: '人造材料', organic: '有机宝石', wood: '木材',
};
const muted: React.CSSProperties = { color: 'var(--text-aux)', fontSize: 12 };

export function KnowledgeList({ data, rows, query, category, meaningConfidence, quick, onQuery, onCategory,
  onConfidence, onQuick, onOpen }: {
  data: KbList; rows: KbRow[]; query: string; category: string; meaningConfidence: string;
  quick: KbFilter; onQuery: (value: string) => void; onCategory: (value: string) => void;
  onConfidence: (value: string) => void; onQuick: (value: KbFilter) => void;
  onOpen: (row: KbRow) => void;
}) {
  const categories = Array.from(new Set(data.items.map(item => item.category).filter((value): value is string => !!value))).sort();
  const numberStyle: React.CSSProperties = { fontSize: 30, fontWeight: 700, display: 'block', marginTop: 8 };
  const summary = [
    { key: 'all' as const, label: '知识库品种', count: data.totalKinds, sub: '查看全部品种' },
    { key: 'hidden' as const, label: '在售商品里用户端不显示寓意的', count: data.lowConfidence + data.spacer,
      sub: `${data.lowConfidence} 个把握低 · ${data.spacer} 个隔珠隔片` },
    { key: 'recent' as const, label: '最近 7 天改过的', count: data.recent7d, sub: '查看最近修改' },
  ];
  return <div style={{ padding: 20, display: 'grid', gap: 16 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
      {summary.map(item => <button type="button" key={item.key} className="zy-card" aria-pressed={quick === item.key}
        onClick={() => onQuick(item.key)} style={{ textAlign: 'left', padding: 18, cursor: 'pointer',
          outline: quick === item.key ? '2px solid var(--text)' : undefined }}>
        <span style={muted}>{item.label}</span><strong style={{ ...numberStyle, color: item.key === 'hidden' ? 'var(--danger)' : undefined }}>{item.count}</strong>
        <span style={muted}>{item.sub}</span>
      </button>)}
    </div>
    <div className="zy-card" style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <input className="zy-field-box" aria-label="搜索品种" placeholder="搜名字、别名、商家叫法" value={query}
        onChange={event => onQuery(event.target.value)} style={{ width: 250 }} />
      <select className="zy-field-box" aria-label="大类" value={category} onChange={event => onCategory(event.target.value)}>
        <option value="">大类：全部</option>{categories.map(value => <option key={value} value={value}>{categoryName[value] || value}</option>)}
      </select>
      <select className="zy-field-box" aria-label="寓意把握" value={meaningConfidence} onChange={event => onConfidence(event.target.value)}>
        <option value="">寓意把握：全部</option><option value="high">高</option><option value="mid">中</option><option value="low">低</option>
      </select>
    </div>
    <Table rows={rows} rowKey={row => row.id} onRowClick={onOpen} empty="没有符合条件的品种，试试其他关键词"
      columns={[
        { title: '品种', render: row => <><strong>{row.name}</strong><div style={muted}>{row.id}</div></> },
        { title: '大类', render: row => categoryName[row.category || ''] || '—' },
        { title: '寓意', render: row => (row.meaningTags || []).join('、') || '—' },
        { title: '寓意把握', render: row => <span style={row.meaningConfidence === 'low' ? { color: 'var(--danger)' } : undefined}>{confidence[row.meaningConfidence || ''] || '—'}</span> },
        { title: '关联在售商品', render: row => <span style={row.meaningConfidence === 'low' ? { color: 'var(--danger)' } : undefined}>
          {row.onSaleCount || 0} 个{row.meaningConfidence === 'low' && row.onSaleCount ? ' · 用户端不显示寓意' : ''}</span> },
        { title: '最后修改', render: row => fmtTime(row.updatedAt) },
      ]} />
  </div>;
}
