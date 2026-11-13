import React, { useMemo } from 'react';
import { labelOf } from '../api';
import { actorLabel } from '../components/OrdersView';

interface TodayPageProps {
  orders: any[];
  afterSales: any[];
  beads: any[];
  auditLogs: any[];
  onNavigate: (page: string, payload?: { tab?: string }) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

// 最近操作只写中文：谁、做了什么、哪一单（订单号缩成 CGZ…后 4 位），不显示英文代码和原始说明
const ACTION_TEXT: Record<string, string> = {
  start_payment: '发起付款', payment_callback: '付款成功', auto_complete: '签收 7 天自动确认收货',
  create: '新建', internal_note: '写了内部备注', refund: '退款', change_address: '改了收货地址',
  archive: '下架', copy: '复制', delete: '删除', update: '修改', update_logistics: '更新了物流',
  cancel_order: '取消订单', confirm_receipt: '确认收货', approve: '同意售后', reject: '拒绝售后',
  returning: '记录了退货物流', close: '关闭售后', complete: '完成售后',
};
const TARGET_TEXT: Record<string, string> = { order: '订单', after_sale: '售后', product: '商品', template: '模板', term: '条款' };
const shortId = (id?: string) => (id && id.length > 10 ? `${id.slice(0, 3)}…${id.slice(-4)}` : id || '');
const describe = (log: any): string => {
  let what = ACTION_TEXT[log.action] || '';
  if (log.action === 'transition') {
    const m = /^(\w+): (\w+) → (\w+)/.exec(String(log.detail || ''));
    what = m ? `改成${labelOf(m[1], m[3])}` : '改了状态';
  }
  return [actorLabel(log.actor), what || '操作了', TARGET_TEXT[log.target] || '', shortId(log.targetId)].filter(Boolean).join(' ');
};

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
            const text = describe(log);
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
