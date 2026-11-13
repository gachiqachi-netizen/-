import React, { useMemo } from 'react';

interface TodayPageProps {
  orders: any[];
  afterSales: any[];
  beads: any[];
  auditLogs: any[];
  onNavigate: (page: string, payload?: { tab?: string }) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 今天（稿 A02）：一行一件事 + 最近操作 */
const TodayPage: React.FC<TodayPageProps> = ({ orders, afterSales, beads, auditLogs, onNavigate }) => {
  const stats = useMemo(() => {
    const byOps = (code: string) => orders.filter((o) => o.opsStatus?.code === code).length;
    const producing = orders.filter((o) => o.opsStatus?.code === 'producing');
    return {
      toMake: byOps('to_make'),
      producing: producing.filter((o) => o.workOrder?.step !== '待质检').length,
      pendingQc: producing.filter((o) => o.workOrder?.step === '待质检').length,
      readyToShip: byOps('ready_to_ship'),
      afterSale: afterSales.filter((a) => a.status === 'requested' || a.status === 'reviewing').length,
      stockOut: beads.filter((b) => b.stock === 'out_of_stock' || b.stock === 'low_stock').length,
    };
  }, [orders, afterSales, beads]);

  const rows = [
    {
      name: '待制作',
      count: stats.toMake,
      unit: '单',
      note: '已付款，还没开始做',
      go: () => onNavigate('orders', { tab: 'to_make' }),
    },
    {
      name: '制作中',
      count: stats.producing,
      unit: '单',
      note: '正在配珠或穿制',
      go: () => onNavigate('orders', { tab: 'producing' }),
    },
    {
      name: '待质检',
      count: stats.pendingQc,
      unit: '单',
      note: '做完了，等质检',
      go: () => onNavigate('workOrders'),
    },
    {
      name: '待发货',
      count: stats.readyToShip,
      unit: '单',
      note: '质检通过，填运单就能发',
      go: () => onNavigate('orders', { tab: 'ready_to_ship' }),
    },
    {
      name: '售后待处理',
      count: stats.afterSale,
      unit: '单',
      note: '申请中或审核中的售后',
      go: () => onNavigate('afterSales'),
    },
    {
      name: '缺货和快没了',
      count: stats.stockOut,
      unit: '种',
      note: '按商品的库存状态统计',
      danger: stats.stockOut > 0,
      go: () => onNavigate('products'),
    },
  ];

  const recent = auditLogs.slice(0, 4);

  return (
    <div className="zy-today-grid">
      <div className="zy-card">
        <div className="zy-card-title">今天要处理</div>
        <div>
          {rows.map((row) => (
            <div key={row.name} className="zy-trow" onClick={row.go}>
              <span className="zy-trow-name">{row.name}</span>
              <span className={`zy-trow-count ${row.danger ? 'zy-danger-text' : ''}`}>
                {row.count} {row.unit}
              </span>
              <span className="zy-trow-note">{row.note}</span>
              <span className="zy-trow-go">去处理 ›</span>
            </div>
          ))}
        </div>
      </div>
      <div className="zy-card">
        <div className="zy-card-title">最近操作</div>
        <div>
          {recent.map((log, i) => {
            const d = new Date(Number(log.at) || 0);
            const time = Number(log.at) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '-';
            const text = [log.actor, log.detail || log.action, log.targetId].filter(Boolean).join(' ');
            return (
              <div key={i} className="zy-rr">
                <span className="zy-rr-time">{time}</span>
                <span>{text || '-'}</span>
              </div>
            );
          })}
          {recent.length === 0 && <div className="zy-empty">还没有操作记录</div>}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
          <button
            type="button"
            className="zy-btn zy-btn-secondary"
            onClick={() => onNavigate('audit')}
          >
            全部操作记录 ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodayPage;
