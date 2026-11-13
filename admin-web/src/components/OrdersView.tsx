import React, { useState, useEffect, useMemo } from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';
import { apiRequest, labelOf, fmtTime, fenToYuan } from '../api';
import { CONTRACT } from '../contract';
import { BraceletRingPreview } from './BraceletRingPreview';
import { StatusBadge, statusTone } from './OverviewAndProducts';
import { Tabs } from '../ui/Tabs';
import { Table } from '../ui/Table';
import { StatusText } from '../ui/StatusText';

interface OrdersViewProps {
  orders: any[];
  initialQuery?: string;
  initialTab?: string;
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

// 分栏和状态用同一套词，状态词只从契约取（docs/design/12-admin.md 第 4、5 节）
const ORDER_TABS = ['all', 'unpaid', 'to_make', 'producing', 'ready_to_ship', 'shipped', 'completed', 'after_sale'];

// “下一步能做的事”的按钮文字（D1b 对照表，见 docs/design/tasks/admin-wave1.md D1b）
const TRANSITION_ACTION_LABELS: Record<string, string> = {
  'orderStatus.cancelled': '取消订单',
  'fulfillmentStatus.producing': '开始制作',
  'fulfillmentStatus.ready_to_ship': '改成待发货',
  'fulfillmentStatus.shipped': '发货',
  'logisticsStatus.in_transit': '改成运输中',
  'logisticsStatus.delivered': '标记已签收',
  'logisticsStatus.exception': '标记物流异常',
};

const actionLabelFor = (group: string, to: string): string =>
  TRANSITION_ACTION_LABELS[`${group}.${to}`] || `改成${labelOf(group, to)}`;

const ORDER_SOURCE_LABELS: Record<string, string> = {
  custom_diy: '自己串的',
  template: '按模板下单',
  ai: 'AI 配的',
};

const yuan = (v?: number | string | null): string => `¥${Number(v || 0).toFixed(2)}`;

const pad2 = (n: number) => String(n).padStart(2, '0');

const fmtShort = (ts?: number | string | null): string => {
  if (!ts) return '-';
  const num = Number(ts);
  const d = new Date(num > 1e12 ? num : num * 1000);
  if (Number.isNaN(d.getTime())) return String(ts);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const OrdersAndWorkOrdersView: React.FC<OrdersViewProps> = ({
  orders,
  initialQuery,
  initialTab,
  onRefresh,
  notify,
}) => {
  const [q, setQ] = useState(initialQuery || '');
  const [tab, setTab] = useState(initialTab || 'all');
  const [activeOrderNo, setActiveOrderNo] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [workForm, setWorkForm] = useState<any>({
    assignee: '',
    step: CONTRACT.workOrderSteps[0],
    progress: 0,
    operatorNote: '',
  });
  const [qcForm, setQcForm] = useState<any>({
    sequenceOk: false,
    sizeOk: false,
    materialOk: false,
    appearanceOk: false,
    inspector: '',
    note: '',
  });
  const [shipPrompt, setShipPrompt] = useState<{ carrierName: string; trackingNo: string } | null>(null);
  const [transError, setTransError] = useState<{ group: string; to: string; msg: string } | null>(null);

  useEffect(() => {
    if (initialQuery !== undefined) setQ(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const loadOrderDetail = async (no: string) => {
    try {
      const d = await apiRequest(`/api/admin/orders/${encodeURIComponent(no)}`);
      setDetail(d);
      const wo = d.workOrder || {};
      setWorkForm({
        assignee: wo.assignee || '',
        step: wo.step || CONTRACT.workOrderSteps[0],
        progress: Number(wo.progress ?? 0),
        operatorNote: wo.operatorNote || '',
      });
      const qg = d.qualityGate || {};
      const checks = qg.checks || {};
      setQcForm({
        sequenceOk: Boolean(checks.sequenceOk),
        sizeOk: Boolean(checks.sizeOk),
        materialOk: Boolean(checks.materialOk),
        appearanceOk: Boolean(checks.appearanceOk),
        inspector: qg.inspector || '',
        note: qg.note || '',
      });
    } catch (err: any) {
      notify(err.message || '加载订单详情失败', 'error');
    }
  };

  useEffect(() => {
    if (activeOrderNo) {
      loadOrderDetail(activeOrderNo);
    } else {
      setDetail(null);
    }
  }, [activeOrderNo]);

  const matchSearch = (o: any, kw: string) => {
    const hay = `${o.no || ''} ${o.name || ''} ${o.addr?.name || ''} ${o.addr?.phone || ''}`.toLowerCase();
    return hay.includes(kw);
  };

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== 'all' && o.opsStatus?.code !== tab) return false;
      if (kw && !matchSearch(o, kw)) return false;
      return true;
    });
  }, [orders, q, tab]);

  const tabItems = ORDER_TABS.map((key) => ({
    key,
    label: key === 'all' ? '全部' : CONTRACT.opsStatus[key as keyof typeof CONTRACT.opsStatus].label,
    count:
      key === 'all'
        ? orders.length
        : orders.filter((o) => o.opsStatus?.code === key).length,
  }));

  const saveWorkOrder = async () => {
    if (!detail) return;
    try {
      await apiRequest(`/api/admin/orders/${encodeURIComponent(detail.no)}/work-order`, {
        method: 'PUT',
        body: {
          ...workForm,
          progress: Number(workForm.progress || 0),
        },
      });
      notify('生产做单进度已更新');
      await loadOrderDetail(detail.no);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '保存工单失败', 'error');
    }
  };

  const saveQualityGate = async () => {
    if (!detail) return;
    try {
      const res = await apiRequest(`/api/admin/orders/${encodeURIComponent(detail.no)}/quality-gate`, {
        method: 'PUT',
        body: qcForm,
      });
      const passed = res.qualityGate?.passed;
      notify(passed ? '质检 4 项全部核验通过，已放行待发！' : '质检记录已保存（未全通过，禁止流转待发货）');
      await loadOrderDetail(detail.no);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '提交质检失败', 'error');
    }
  };

  const triggerTransition = async (group: string, to: string, extraLogistics?: any) => {
    if (!detail) return;
    if (group === 'fulfillmentStatus' && to === 'shipped' && !extraLogistics) {
      setShipPrompt({
        carrierName: detail.logistics?.carrierName || '顺丰速运',
        trackingNo: detail.logistics?.trackingNo || '',
      });
      return;
    }
    try {
      const body: any = { group, to };
      if (extraLogistics) body.logistics = extraLogistics;
      await apiRequest(`/api/admin/orders/${encodeURIComponent(detail.no)}/status`, {
        method: 'PUT',
        body,
      });
      setTransError(null);
      setShipPrompt(null);
      notify(`已${actionLabelFor(group, to)}`);
      await loadOrderDetail(detail.no);
      await onRefresh();
    } catch (err: any) {
      setTransError({ group, to, msg: err.message || '操作失败' });
    }
  };

  const cancelOrder = async () => {
    if (!detail) return;
    if (!window.confirm('确认取消这笔订单吗？取消后不能撤回。')) return;
    try {
      await apiRequest(`/api/admin/orders/${encodeURIComponent(detail.no)}/status`, {
        method: 'PUT',
        body: { group: 'orderStatus', to: 'cancelled' },
      });
      setTransError(null);
      notify('订单已取消');
      await loadOrderDetail(detail.no);
      await onRefresh();
    } catch (err: any) {
      setTransError({ group: 'orderStatus', to: 'cancelled', msg: err.message || '取消失败' });
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('已复制');
    } catch {
      notify('复制失败', 'error');
    }
  };

  const scrollToWork = () => {
    document.getElementById('d1b-work-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const snap = detail?.designSnapshot || {};
  const snapBeads = snap.beads || detail?.beads || [];
  const snapMaterials = snap.materials || [];

  return (
    <div className="space-y-4">
      <Tabs items={tabItems} active={tab} onChange={setTab} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜订单号、收货人、手机号后 4 位"
          className="zy-field-box"
          style={{ width: 280 }}
        />
        <span className="zy-table-aux">共 {filtered.length} 笔订单 · 点一行打开详情</span>
      </div>

      <Table
        rows={filtered}
        rowKey={(o) => o.no}
        onRowClick={(o) => setActiveOrderNo(o.no)}
        empty="没有符合这个分栏的订单"
        columns={[
          { title: '订单号', width: 150, render: (o) => o.no || '-' },
          {
            title: '手串',
            render: (o) => {
              const beads = o.designSnapshot?.beads || o.beads || [];
              const count = o.designSnapshot?.count ?? beads.length;
              const wrist = o.designSnapshot?.wrist || o.wrist || 15;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BraceletRingPreview beads={beads} wristCm={wrist} size={36} />
                  <div>
                    <div>{o.name || '定制手串'}</div>
                    <div className="zy-table-aux">
                      {count} 颗 · {wrist}cm
                    </div>
                  </div>
                </div>
              );
            },
          },
          {
            title: '收货人',
            width: 130,
            render: (o) => {
              const phone = String(o.addr?.phone || '');
              return (
                <div>
                  <div>{o.addr?.name || '-'}</div>
                  <div className="zy-table-aux">{phone ? phone.slice(-4) : '-'}</div>
                </div>
              );
            },
          },
          {
            title: '实付',
            width: 100,
            render: (o) => (
              <div>
                <div>¥{Number(o.total || o.price || 0).toFixed(2)}</div>
                {o.paymentChannel === 'mock' && (
                  <div className="zy-danger-text" style={{ fontSize: 'var(--font-aux)' }}>
                    模拟付款
                  </div>
                )}
              </div>
            ),
          },
          {
            title: '状态',
            width: 100,
            render: (o) => <StatusText code={o.opsStatus?.code} text={o.opsStatus?.code ? undefined : '—'} />,
          },
          { title: '下单时间', width: 120, render: (o) => fmtShort(o.createdAt) },
          { title: '', width: 60, render: () => <span className="zy-table-aux">详情 ›</span> },
        ]}
      />


      {detail && (() => {
        const ops = detail.opsStatus || {};
        const opsMeta = ops.code ? (CONTRACT.opsStatus as Record<string, { label: string; danger: boolean }>)[ops.code] : null;
        const wo = detail.workOrder || {};
        const snap = detail.designSnapshot || {};
        const snapBeads = snap.beads || snap.sequence || [];
        const snapMaterials = snap.materials || [];
        const transitions = detail.allowedTransitions || {};
        const allActions = (['orderStatus', 'fulfillmentStatus', 'logisticsStatus'] as const).flatMap((g) =>
          (transitions[g] || []).map((to: string) => ({ g, to }))
        );
        let drawerActions = allActions.filter((a) => !(a.g === 'orderStatus' && a.to === 'cancelled'));
        // 制作中总是给“改成待发货”：没通过质检时后端会拒绝，原因原样显示在按钮下面（D1b 验收）
        if (
          detail.fulfillmentStatus === 'producing' &&
          !drawerActions.some((a) => a.g === 'fulfillmentStatus' && a.to === 'ready_to_ship')
        ) {
          drawerActions = [...drawerActions, { g: 'fulfillmentStatus', to: 'ready_to_ship' }];
        }
        const canCancel = allActions.some((a) => a.g === 'orderStatus' && a.to === 'cancelled');
        const historyRows = [
          { at: detail.createdAt, text: '用户下单' },
          ...(detail.statusHistory || []).map((h: any) => ({
            at: h.at,
            text: [h.actor, labelOf(h.group, h.to), h.note].filter(Boolean).join(' '),
          })),
        ].sort((a, b) => Number(b.at || 0) - Number(a.at || 0));
        const sourceLabel = ORDER_SOURCE_LABELS[snap.source] || '';
        const metaLine = [
          `${snap.count ?? snapBeads.length} 颗`,
          snap.lengthMm ? `${snap.lengthMm}mm` : '',
          snap.wrist ? `手围 ${snap.wrist}cm` : '',
          sourceLabel,
        ].filter(Boolean).join(' · ');
        const materialsLine = snapMaterials.map((m: any) => `${m.name} ×${m.count}`).join('、');
        const receiverName = detail.addr?.name || detail.person || '-';
        const receiverPhone = detail.addr?.phone || detail.phone || '';
        const receiverAddr = detail.addr?.detail || detail.addr || '';
        const workLine = [wo.step, wo.assignee ? `（${wo.assignee}）` : ''].filter(Boolean).join('');

        return (
          <>
            <div className="zy-drawer-mask" onClick={() => setActiveOrderNo(null)} />
            <div className="zy-drawer">
              <div className="zy-drawer-head">
                <div>
                  <div className="zy-drawer-title" style={{ fontFamily: 'monospace' }}>{detail.no}</div>
                  <div className="zy-drawer-sub">
                    {fmtShort(detail.createdAt)} 下单 ·{' '}
                    <span style={{ cursor: 'pointer' }} onClick={() => copyText(detail.no)}>
                      订单号可复制
                    </span>
                  </div>
                </div>
                <button type="button" className="zy-drawer-close" onClick={() => setActiveOrderNo(null)} aria-label="关闭">
                  ✕
                </button>
              </div>

              <div className="zy-drawer-body">
                {/* 状态 */}
                <div className="zy-card" style={{ marginBottom: 16 }}>
                  <div className="zy-card-title">状态</div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 600,
                          color: opsMeta?.danger ? 'var(--danger)' : 'var(--text)',
                        }}
                      >
                        {opsMeta?.label || '—'}
                      </span>
                      <span className="zy-table-aux">
                        {labelOf('paymentStatus', detail.paymentStatus)} ·{' '}
                        {labelOf('logisticsStatus', detail.logisticsStatus)} ·{' '}
                        {labelOf('afterSaleStatus', detail.afterSaleStatus || 'none')}
                      </span>
                    </div>
                    {workLine && (
                      <div className="zy-table-aux" style={{ marginTop: 6 }}>
                        工序：{workLine}
                        {typeof wo.progress === 'number' ? ` · ${wo.progress}%` : ''}
                      </div>
                    )}
                    {drawerActions.length > 0 && (
                      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        {drawerActions.map(({ g, to }) => (
                          <button
                            key={`${g}.${to}`}
                            type="button"
                            className="zy-btn zy-btn-secondary"
                            onClick={() => triggerTransition(g, to)}
                          >
                            {actionLabelFor(g, to)}
                          </button>
                        ))}
                      </div>
                    )}
                    {shipPrompt && (
                      <div style={{ marginTop: 12, padding: 12, border: '1px solid var(--line)', borderRadius: 8 }}>
                        <div style={{ fontSize: 'var(--font-body)', marginBottom: 8 }}>填写发货物流单号</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <input
                            value={shipPrompt.carrierName}
                            onChange={(e) => setShipPrompt({ ...shipPrompt, carrierName: e.target.value })}
                            placeholder="承运快递（如：顺丰速运）"
                            className="zy-field-box"
                          />
                          <input
                            value={shipPrompt.trackingNo}
                            onChange={(e) => setShipPrompt({ ...shipPrompt, trackingNo: e.target.value })}
                            placeholder="快递单号（如：SF123456789）"
                            className="zy-field-box"
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                          <button type="button" className="zy-btn zy-btn-secondary" onClick={() => setShipPrompt(null)}>
                            取消
                          </button>
                          <button
                            type="button"
                            className="zy-btn zy-btn-primary"
                            onClick={() => triggerTransition('fulfillmentStatus', 'shipped', shipPrompt)}
                          >
                            确认发货
                          </button>
                        </div>
                      </div>
                    )}
                    {transError && (
                      <div className="zy-table-aux" style={{ marginTop: 8 }}>
                        {transError.msg}
                      </div>
                    )}
                  </div>
                </div>

                {/* 手串 */}
                <div className="zy-card" style={{ marginBottom: 16 }}>
                  <div className="zy-card-title">手串</div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <BraceletRingPreview beads={snapBeads} wristCm={snap.wrist || detail.wrist || 15} size={56} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{detail.name || '定制手串'}</div>
                        {metaLine && <div className="zy-table-aux">{metaLine}</div>}
                        {materialsLine && <div className="zy-table-aux">{materialsLine}</div>}
                      </div>
                    </div>
                    {snap.customerNote && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: '8px 12px',
                          background: 'var(--face)',
                          borderRadius: 8,
                          fontSize: 'var(--font-body)',
                        }}
                      >
                        客户备注：{snap.customerNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* 金额 */}
                <div className="zy-card" style={{ marginBottom: 16 }}>
                  <div className="zy-card-title">金额</div>
                  <div style={{ padding: '14px 16px', display: 'grid', rowGap: 8 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>珠子</span>
                      <span>{yuan(fenToYuan(detail.goodsFen))}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>运费</span>
                      <span>{Number(detail.shipFen) > 0 ? yuan(fenToYuan(detail.shipFen)) : '包邮'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>实付</span>
                      <span>
                        <strong>{yuan(fenToYuan(detail.totalFen))}</strong>
                        {detail.paymentChannel === 'mock' && (
                          <span className="zy-danger-text" style={{ marginLeft: 8, fontSize: 'var(--font-aux)' }}>
                            模拟付款
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 收货 */}
                <div className="zy-card" style={{ marginBottom: 16 }}>
                  <div className="zy-card-title">收货</div>
                  <div style={{ padding: '14px 16px', display: 'grid', rowGap: 8 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>收货人</span>
                      <span>{receiverName}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>手机号</span>
                      <span>
                        {receiverPhone || '-'}{' '}
                        {receiverPhone && (
                          <span
                            className="zy-table-aux"
                            style={{ cursor: 'pointer', marginLeft: 4 }}
                            onClick={() => copyText(receiverPhone)}
                          >
                            复制
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>地址</span>
                      <span>
                        {receiverAddr || '-'}{' '}
                        {receiverAddr && (
                          <span
                            className="zy-table-aux"
                            style={{ cursor: 'pointer', marginLeft: 4 }}
                            onClick={() => copyText(receiverAddr)}
                          >
                            复制
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 记录（只给后台看） */}
                <div className="zy-card" style={{ marginBottom: 16 }}>
                  <div className="zy-card-title">
                    记录<span style={{ fontWeight: 400, marginLeft: 8, color: 'var(--text-aux)', fontSize: 'var(--font-aux)' }}>只给后台看</span>
                  </div>
                  <div>
                    {historyRows.map((row, i) => (
                      <div key={i} className="zy-rr">
                        <span className="zy-rr-time">{fmtShort(row.at)}</span>
                        <span>{row.text}</span>
                      </div>
                    ))}
                    {historyRows.length === 0 && <div className="zy-empty">还没有记录</div>}
                  </div>
                </div>

                {/* 生产做单工单与发货前质检（D2 原有功能，未改动） */}
                <div id="d1b-work-section" style={{ scrollMarginTop: 12 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-sm font-semibold text-zinc-900">生产做单工单</h4>
                        </div>
                        <StatusBadge tone="crimson">用料锁定：禁止替换</StatusBadge>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 mb-1">制珠师 / 负责人</label>
                          <input
                            value={workForm.assignee}
                            onChange={(e) => setWorkForm({ ...workForm, assignee: e.target.value })}
                            placeholder="如：林师傅"
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 mb-1">当前工序阶段</label>
                          <select
                            value={workForm.step}
                            onChange={(e) => setWorkForm({ ...workForm, step: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
                          >
                            {CONTRACT.workOrderSteps.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium text-zinc-700 mb-1">
                          <span>制作完成度</span>
                          <span className="font-bold text-indigo-600">{workForm.progress}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={workForm.progress}
                          onChange={(e) => setWorkForm({ ...workForm, progress: Number(e.target.value) })}
                          className="w-full accent-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">车间作业备注</label>
                        <textarea
                          rows={2}
                          value={workForm.operatorNote}
                          onChange={(e) => setWorkForm({ ...workForm, operatorNote: e.target.value })}
                          placeholder="记录弹力线股数、打结隐藏位置或客户特殊交代..."
                          className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={saveWorkOrder}
                        className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
                      >
                        保存工单进度
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-sm font-semibold text-zinc-900">发货前质检关口</h4>
                        </div>
                        <StatusBadge tone={statusTone(detail.qualityGate?.status || 'pending')}>
                          {detail.qualityGate?.passed ? '✓ 已放行' : '未放行'}
                        </StatusBadge>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200/80 text-xs">
                        {[
                          { key: 'sequenceOk', label: '1. 穿珠顺序与快照一致' },
                          { key: 'sizeOk', label: '2. 手围尺寸与公差达标' },
                          { key: 'materialOk', label: '3. 珠材用料零私自替换' },
                          { key: 'appearanceOk', label: '4. 珠体无裂纹/绳结牢固' },
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800">
                            <input
                              type="checkbox"
                              checked={Boolean(qcForm[item.key])}
                              onChange={(e) => setQcForm({ ...qcForm, [item.key]: e.target.checked })}
                              className="w-4 h-4 rounded accent-emerald-600"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 mb-1">质检员姓名</label>
                          <input
                            value={qcForm.inspector}
                            onChange={(e) => setQcForm({ ...qcForm, inspector: e.target.value })}
                            placeholder="如：陈质检"
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 mb-1">质检意见 / 拦截原因</label>
                          <input
                            value={qcForm.note}
                            onChange={(e) => setQcForm({ ...qcForm, note: e.target.value })}
                            placeholder="如：四项全检合格，准予包装"
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={saveQualityGate}
                        className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium cursor-pointer"
                      >
                        提交质检核验结果
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="zy-drawer-foot">
                {canCancel && (
                  <button type="button" className="zy-btn zy-btn-danger zy-drawer-foot-left" onClick={cancelOrder}>
                    取消订单
                  </button>
                )}
                <span style={{ flex: 1 }} />
                <button type="button" className="zy-btn zy-btn-primary" onClick={scrollToWork}>
                  去工单
                </button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};
