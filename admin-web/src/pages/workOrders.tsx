import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest, fmtTime } from '../api';
import { Tabs } from '../ui/Tabs';
import { Table } from '../ui/Table';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { CONTRACT } from '../contract';
import WorkOrderDetail from './workOrders/detail';
import './workOrders/workOrders.css';

const STEPS: string[] = [...CONTRACT.workOrderSteps];

interface WorkOrderRow {
  workOrderNo: string;
  orderNo: string;
  orderName: string;
  status: string;
  step: string;
  assignee: string;
  paymentStatus: string;
  mockPayment: boolean;
  customerNote: string;
  wrist?: number;
  count?: number;
  createdAt?: number;
}

/** D4 做单（稿 A03）：分栏是五道工序 + 质检不通过；只列已付款订单 */
const WorkOrdersPage: React.FC = () => {
  const [rows, setRows] = useState<WorkOrderRow[] | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [assignee, setAssignee] = useState('');
  const [current, setCurrent] = useState('');

  const load = () => {
    setError('');
    apiRequest<WorkOrderRow[]>('/api/admin/work-orders')
      .then((list) => setRows((list || []).filter((w) => w.paymentStatus === 'paid')))
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, qc_failed: 0 };
    for (const s of STEPS) c[s] = 0;
    for (const w of rows || []) {
      c.all += 1;
      if (w.status === 'qc_failed') c.qc_failed += 1;
      else if (c[w.step] !== undefined) c[w.step] += 1;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const as = assignee.trim().toLowerCase();
    return (rows || []).filter((w) => {
      if (tab === 'qc_failed') {
        if (w.status !== 'qc_failed') return false;
      } else if (tab !== 'all' && w.step !== tab) {
        return false;
      }
      if (as && !(w.assignee || '').toLowerCase().includes(as)) return false;
      if (kw && !(`${w.orderNo} ${w.workOrderNo} ${w.assignee || ''}`.toLowerCase().includes(kw))) return false;
      return true;
    });
  }, [rows, tab, q, assignee]);

  const ordered = useMemo(
    () => (rows || []).filter((w) => w.paymentStatus === 'paid'),
    [rows]
  );
  const nextNo = useMemo(() => {
    if (!current) return '';
    const i = ordered.findIndex((w) => w.orderNo === current);
    return i >= 0 && i + 1 < ordered.length ? ordered[i + 1].orderNo : '';
  }, [current, ordered]);

  if (current) {
    return (
      <WorkOrderDetail
        orderNo={current}
        nextNo={nextNo}
        onBack={() => setCurrent('')}
        onNext={(no) => setCurrent(no)}
      />
    );
  }

  return (
    <div>
      <div className="wo-toolbar no-print">
        <input
          className="wo-input"
          style={{ width: 240 }}
          placeholder="搜订单号、工单号、负责人"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="wo-input"
          style={{ width: 140 }}
          placeholder="负责人：全部"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        />
      </div>
      <Tabs
        items={[
          { key: 'all', label: '全部', count: counts.all },
          ...STEPS.map((s) => ({ key: s, label: s, count: counts[s] || 0 })),
          { key: 'qc_failed', label: '质检不通过', count: counts.qc_failed },
        ]}
        active={tab}
        onChange={setTab}
      />
      {error ? (
        <ErrorState reason={error} onRetry={load} />
      ) : rows === null ? (
        <Skeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState text="没有符合条件的工单" />
      ) : (
        <Table<WorkOrderRow>
          rowKey={(w) => w.workOrderNo}
          onRowClick={(w) => setCurrent(w.orderNo)}
          columns={[
            { title: '工单号', width: 150, render: (w) => w.workOrderNo },
            {
              title: '手串',
              render: (w) => (
                <div className="wo-bracelet">
                  <div className="wo-thumb">{w.count}颗</div>
                  <div>
                    <div>{w.orderName}</div>
                    <div className="wo-spec">
                      {w.count ?? '—'} 颗 · {w.wrist ?? '—'}cm{w.customerNote ? ' · 有备注' : ''}
                    </div>
                  </div>
                </div>
              ),
            },
            { title: '负责人', width: 110, render: (w) => w.assignee || '—' },
            {
              title: '工序',
              width: 120,
              render: (w) =>
                w.status === 'qc_failed' ? <span className="wo-red">质检不通过</span> : w.step,
            },
            { title: '下单时间', width: 130, render: (w) => fmtTime(w.createdAt) },
            { title: '', width: 70, render: () => <span className="wo-spec">打开 ›</span> },
          ]}
          rows={filtered}
        />
      )}
    </div>
  );
};

export default WorkOrdersPage;
