import React, { useMemo, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { fmtTime } from '../api';
import { Table } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import './audit.css';

interface AuditPageProps {
  banners: any[];
  auditLogs: any[];
}

interface AuditRow {
  actor: string;
  action: string;
  target: string;
  targetId: string;
  detail: string;
  at: number;
}

/** 对象 → 后台导航按钮文案（卡片只允许改 audit.tsx，跳转靠点击侧边导航实现） */
const TARGET_META: Record<string, { label: string; nav: string }> = {
  product: { label: '商品', nav: '珠子与配件' },
  template: { label: '模板', nav: '模板' },
  order: { label: '订单', nav: '订单' },
  after_sale: { label: '售后', nav: '售后' },
  term: { label: '条款', nav: '条款' },
};

const ACTION_LABELS: Record<string, string> = {
  create: '新建',
  update: '修改',
  delete: '删除',
  copy: '复制',
  archive: '归档',
  transition: '状态流转',
  refund: '退款',
  update_logistics: '改物流',
  internal_note: '内部备注',
  start_payment: '发起支付',
  payment_callback: '支付回调',
  auto_complete: '自动完成',
};

const TARGET_FILTERS: Array<{ key: string; label: string }> = [
  { key: '', label: '全部' },
  { key: 'order', label: '订单' },
  { key: 'after_sale', label: '售后' },
  { key: 'product', label: '商品' },
  { key: 'template', label: '模板' },
  { key: 'term', label: '条款' },
  { key: 'payment', label: '支付' },
  { key: 'system', label: '系统' },
];

/** 卡片范围内唯一的跳转方式：点侧边导航里同名的按钮（App.tsx 不给 audit 页传 onNavigate） */
const jumpToNav = (navLabel: string): boolean => {
  const scopes = Array.from(document.querySelectorAll('nav button, aside button'));
  const btn = scopes.find((el) => el.textContent && el.textContent.trim() === navLabel);
  if (btn instanceof HTMLButtonElement) {
    btn.click();
    return true;
  }
  return false;
};

const AuditPage: React.FC<AuditPageProps> = ({ auditLogs }) => {
  const [q, setQ] = useState('');
  const [target, setTarget] = useState('');

  const rows = useMemo(() => {
    const list = [...(auditLogs || [])] as AuditRow[];
    list.sort((a, b) => Number(b.at || 0) - Number(a.at || 0));
    const needle = q.trim().toLowerCase();
    return list.filter((r) => {
      if (target && r.target !== target) return false;
      if (!needle) return true;
      return [r.targetId, r.detail, r.action, TARGET_META[r.target]?.label || r.target]
        .some((v) => String(v || '').toLowerCase().includes(needle));
    });
  }, [auditLogs, q, target]);

  return (
    <div className="audit-page">
      <div className="zy-card audit-toolbar">
        <div className="audit-search">
          <Search size={14} className="audit-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜单号、详情、动作…"
            className="audit-search-input"
          />
        </div>
        <div className="audit-filters">
          {TARGET_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`audit-filter${target === f.key ? ' on' : ''}`}
              onClick={() => setTarget(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="audit-count">
          <RefreshCw size={12} /> 共 {rows.length} 条
        </span>
      </div>

      <Table<AuditRow>
        columns={[
          { title: '时间', width: 150, render: (r) => <span className="audit-time">{fmtTime(r.at)}</span> },
          { title: '操作人', width: 100, render: (r) => r.actor || '—' },
          { title: '动作', width: 90, render: (r) => ACTION_LABELS[r.action] || r.action || '—' },
          {
            title: '对象',
            render: (r) => {
              const meta = TARGET_META[r.target];
              if (!meta) return <span>{r.target || '—'} {r.targetId}</span>;
              return (
                <button
                  type="button"
                  className="audit-link"
                  title={`跳到${meta.label}页`}
                  onClick={() => jumpToNav(meta.nav)}
                >
                  {meta.label} {r.targetId} ›
                </button>
              );
            },
          },
          { title: '详情', render: (r) => <span className="audit-detail">{r.detail || '—'}</span> },
        ]}
        rows={rows}
        rowKey={(r) => `${r.at}-${r.target}-${r.targetId}-${r.action}-${r.detail}`}
        empty={<EmptyState text={q || target ? '没有匹配的操作记录' : '还没有操作记录'} />}
      />
    </div>
  );
};

export default AuditPage;
