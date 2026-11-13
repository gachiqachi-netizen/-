import React, { useMemo, useState } from 'react';
import { Tabs } from '../ui/Tabs';
import { Table } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import { fenToYuan, fmtTime } from '../api';
import { CONTRACT } from '../contract';
import AfterSaleDrawer from './afterSales/detail';
import ReturnAddressDrawer from './afterSales/returnAddress';
import { Can } from '../permissions';
import { Button } from '../ui/Button';

const STATUS_LABELS: Record<string, string> = { ...(CONTRACT.statusLabels.afterSaleStatus || {}) };

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'returning', label: '退货中' },
  { key: 'refunding', label: '退款中' },
  { key: 'completed', label: '已完成' },
];

const orderName = (orders: any[], orderNo: string) =>
  (orders.find((o) => o.no === orderNo) || {}).name || orderNo;

/** D5b 售后审核（稿 A09）：列表 + 处理抽屉 */
const AfterSalesPage: React.FC<{
  afterSales: any[];
  orders: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ afterSales, orders, onRefresh, notify }) => {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [active, setActive] = useState('');
  const [returnAddressOpen, setReturnAddressOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: afterSales.length, pending: 0, returning: 0, refunding: 0, completed: 0 };
    for (const a of afterSales) {
      if (a.status === 'requested' || a.status === 'reviewing') c.pending += 1;
      else if (a.status === 'returning') c.returning += 1;
      else if (a.status === 'refunding') c.refunding += 1;
      else if (a.status === 'completed') c.completed += 1;
    }
    return c;
  }, [afterSales]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return afterSales.filter((a) => {
      if (tab === 'pending') {
        if (!(a.status === 'requested' || a.status === 'reviewing')) return false;
      } else if (tab !== 'all' && a.status !== tab) {
        return false;
      }
      if (kw && !(`${a.no} ${a.orderNo}`.toLowerCase().includes(kw))) return false;
      return true;
    });
  }, [afterSales, tab, q]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, margin: '16px 0', alignItems: 'center' }}>
        <input
          className="wo-input"
          style={{ width: 240, height: 34, padding: '0 12px', border: '1px solid #d9d5d1', borderRadius: 8, fontSize: 13 }}
          placeholder="搜售后单号、订单号"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Can perm="process_after_sales"><Button onClick={() => setReturnAddressOpen(true)}>寄回地址</Button></Can>
      </div>
      <Tabs items={TABS.map((t) => ({ ...t, count: counts[t.key] }))} active={tab} onChange={setTab} />
      {filtered.length === 0 ? (
        <EmptyState text="没有符合条件的售后单" />
      ) : (
        <Table<any>
          rowKey={(a) => a.no}
          onRowClick={(a) => setActive(a.no)}
          columns={[
            { title: '售后单', width: 140, render: (a) => a.no },
            {
              title: '订单',
              render: (a) => (
                <div>
                  <div>{orderName(orders, a.orderNo)}</div>
                  <div style={{ fontSize: 12, color: '#8a8580' }}>{a.orderNo}</div>
                </div>
              ),
            },
            { title: '类型', width: 100, render: (a) => a.type },
            { title: '原因', render: (a) => a.reason || '—' },
            { title: '退款', width: 90, render: (a) => (a.refundFen != null ? fenToYuan(a.refundFen) : '—') },
            {
              title: '状态',
              width: 100,
              render: (a) =>
                a.status === 'rejected' ? <span style={{ color: '#c8302e' }}>{STATUS_LABELS[a.status]}</span> : STATUS_LABELS[a.status] || a.status,
            },
            { title: '申请时间', width: 130, render: (a) => fmtTime(a.createdAt) },
            { title: '', width: 70, render: () => <span style={{ fontSize: 12, color: '#8a8580' }}>处理 ›</span> },
          ]}
          rows={filtered}
        />
      )}
      {returnAddressOpen && <ReturnAddressDrawer onClose={() => setReturnAddressOpen(false)} />}
      {active ? (
        <AfterSaleDrawer
          afterSaleNo={active}
          onClose={() => setActive('')}
          onChanged={() => {
            onRefresh();
          }}
          notify={notify}
          onViewOrder={(orderNo) => {
            setActive('');
            notify(`订单 ${orderNo} 请从“订单”页打开`);
          }}
        />
      ) : null}
    </div>
  );
};

export default AfterSalesPage;
