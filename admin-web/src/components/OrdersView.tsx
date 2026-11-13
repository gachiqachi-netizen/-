import React, { useState, useEffect, useMemo } from 'react';
import { Wrench, ShieldCheck, Lock, Clock, FileText, X } from 'lucide-react';
import { apiRequest, labelOf, fmtTime } from '../api';
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
      notify(`状态已更新为：${labelOf(group, to)}`);
      setShipPrompt(null);
      await loadOrderDetail(detail.no);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '状态流转被拦截', 'error');
    }
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

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl border-l border-zinc-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-bold text-zinc-900">{detail.no}</span>
                  <StatusBadge tone={statusTone(detail.orderStatus)}>
                    {labelOf('orderStatus', detail.orderStatus)}
                  </StatusBadge>
                  <StatusBadge tone={statusTone(detail.fulfillmentStatus)}>
                    {labelOf('fulfillmentStatus', detail.fulfillmentStatus)}
                  </StatusBadge>
                  <StatusBadge tone={statusTone(detail.qualityGate?.status || 'pending')}>
                    质检: {detail.qualityGate?.status === 'passed' ? '通过' : detail.qualityGate?.status === 'failed' ? '不通过' : '待检'}
                  </StatusBadge>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  下单时间：{fmtTime(detail.createdAt)} · 实付 ¥{Number(detail.total || detail.price || 0).toFixed(2)} · 收件信息：{detail.addr?.name || '-'} ({detail.addr?.phone || '-'}) {detail.addr?.detail || ''}
                </p>
              </div>
              <button
                onClick={() => setActiveOrderNo(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-3">
                <div className="text-xs font-semibold text-zinc-900 flex items-center justify-between">
                  <span>状态流转（受后端严格状态机与质检关口保护）</span>
                  <span className="text-[11px] font-normal text-zinc-500">
                    注：进入「质检通过待发」前必须完成下方 4 项质检核验
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['orderStatus', 'fulfillmentStatus', 'logisticsStatus'] as const).map((grp) => {
                    const allowed: string[] = detail.allowedTransitions?.[grp] || [];
                    return (
                      <div key={grp} className="bg-white rounded-lg p-3 border border-zinc-200/80">
                        <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                          <span>
                            {grp === 'orderStatus'
                              ? '订单状态'
                              : grp === 'fulfillmentStatus'
                              ? '生产履约状态'
                              : '物流状态'}
                          </span>
                          <strong className="text-zinc-900">{labelOf(grp, detail[grp])}</strong>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {allowed.length > 0 ? (
                            allowed.map((to) => (
                              <button
                                key={to}
                                type="button"
                                onClick={() => triggerTransition(grp, to)}
                                className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
                              >
                                流转 → {labelOf(grp, to)}
                              </button>
                            ))
                          ) : (
                            <span className="text-[11px] text-zinc-400">当前无可执行流转</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {shipPrompt && (
                  <div className="bg-white rounded-lg p-4 border-2 border-zinc-900 space-y-3">
                    <div className="text-xs font-semibold text-zinc-900">填写发货物流单号（必填）</div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={shipPrompt.carrierName}
                        onChange={(e) => setShipPrompt({ ...shipPrompt, carrierName: e.target.value })}
                        placeholder="承运快递（如：顺丰速运）"
                        className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg"
                      />
                      <input
                        value={shipPrompt.trackingNo}
                        onChange={(e) => setShipPrompt({ ...shipPrompt, trackingNo: e.target.value })}
                        placeholder="快递单号（如：SF123456789）"
                        className="px-3 py-1.5 text-xs font-mono border border-zinc-200 rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShipPrompt(null)}
                        className="px-3 py-1 rounded border border-zinc-200 text-xs"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerTransition('fulfillmentStatus', 'shipped', shipPrompt)}
                        className="px-3 py-1 rounded bg-zinc-900 text-white text-xs font-medium"
                      >
                        确认发货
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#c8302e]" />
                    <h4 className="text-sm font-semibold text-zinc-900">
                      下单冻结设计快照（严禁私自替换用料）
                    </h4>
                  </div>
                  <span className="text-xs text-zinc-500">
                    手围 <strong className="text-zinc-900">{snap.wrist || detail.wrist || 15} cm</strong> · 共{' '}
                    <strong className="text-zinc-900">{snap.count ?? snapBeads.length} 颗</strong> · 弦长{' '}
                    {snap.lengthMm ?? '-'} mm
                  </span>
                </div>

                {snap.customerNote && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3.5 py-2 text-xs">
                    <strong>买家定制备注：</strong> {snap.customerNote}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-5 flex justify-center bg-zinc-50 rounded-xl p-3 border border-zinc-200/60">
                    <BraceletRingPreview
                      beads={snapBeads}
                      wristCm={snap.wrist || detail.wrist || 15}
                      size={185}
                      subtitle="下单冻结快照"
                    />
                  </div>
                  <div className="md:col-span-7 space-y-3">
                    <div className="text-xs font-semibold text-zinc-800">生产领料清单：</div>
                    <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 text-xs max-h-36 overflow-y-auto">
                      {snapMaterials.map((m: any) => (
                        <div key={m.id} className="px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full inline-block border border-zinc-300"
                              style={{ background: m.color || '#64748b' }}
                            />
                            <span className="font-medium text-zinc-900">{m.name}</span>
                            <span className="font-mono text-zinc-400">
                              ({m.id} · {m.sizeMm}mm)
                            </span>
                          </div>
                          <span className="font-bold text-zinc-900">× {m.count} 颗</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs font-semibold text-zinc-800">逐颗穿珠顺序核对表 (#1 → #{snapBeads.length})：</div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                      {snapBeads.map((b: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-zinc-200 text-[11px]"
                        >
                          <strong className="font-mono text-zinc-400">#{b.index || idx + 1}</strong>
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ background: b.color || '#64748b' }}
                          />
                          <span>{b.name}</span>
                          <span className="text-zinc-400">({b.sizeMm || 8}mm)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    下单命中条款快照（共 {(detail.termsSnapshot || []).length} 份）
                  </h4>
                  <div className="divide-y divide-zinc-100 text-xs max-h-40 overflow-y-auto">
                    {(detail.termsSnapshot || []).map((t: any) => (
                      <div key={t.id} className="py-2">
                        <div className="flex items-center justify-between font-medium text-zinc-800">
                          <span>
                            {t.title} <span className="text-zinc-400 font-mono">v{t.version}</span>
                          </span>
                          <StatusBadge tone={t.scope?.mode === 'scoped' ? 'indigo' : 'zinc'}>
                            {t.scope?.mode === 'scoped' ? '指定范围生效' : '全局生效'}
                          </StatusBadge>
                        </div>
                        <div className="text-zinc-500 mt-0.5 line-clamp-2">{t.body}</div>
                      </div>
                    ))}
                    {(detail.termsSnapshot || []).length === 0 && (
                      <div className="py-4 text-center text-zinc-400">无关联条款快照</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    全链路状态时间轴
                  </h4>
                  <div className="divide-y divide-zinc-100 text-xs max-h-40 overflow-y-auto">
                    {(detail.timeline || [])
                      .slice()
                      .reverse()
                      .map((ev: any, idx: number) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                          <span className="text-zinc-800">
                            <strong>{ev.label || ev.group}</strong>
                            {ev.note ? ` · ${ev.note}` : ''}
                          </span>
                          <span className="text-[11px] text-zinc-400 shrink-0">{fmtTime(ev.at)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
