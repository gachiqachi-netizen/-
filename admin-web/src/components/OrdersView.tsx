import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest, labelOf, fmtTime } from '../api';
import { CONTRACT } from '../contract';
import { Tabs } from '../ui/Tabs';
import { Table } from '../ui/Table';
import { StatusText } from '../ui/StatusText';
import OrdersOpsPanel from '../pages/orders/orderOps';
import { Can } from '../permissions';

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

const actionLabelFor = (group: string, to: string): string => TRANSITION_ACTION_LABELS[`${group}.${to}`] || '';

const ORDER_SOURCE_LABELS: Record<string, string> = {
  custom_diy: '自己串的',
  template: '按模板下单',
  ai: 'AI 配的',
};

// 金额一律从整数分算：整元不带小数（¥83），有角分才带两位（¥83.50）
const fenText = (fen?: number | string | null): string => {
  const n = Math.round(Number(fen || 0));
  const abs = Math.abs(n);
  const s = abs % 100 === 0 ? String(abs / 100) : (abs / 100).toFixed(2);
  return `${n < 0 ? '-' : ''}¥${s}`;
};

// 记录里的操作人一律写中文，不出现英文代码
export const ACTOR_LABELS: Record<string, string> = {
  customer: '用户',
  admin: '后台',
  payment: '系统',
  system: '系统',
};
export const actorLabel = (actor?: string): string => (actor ? ACTOR_LABELS[actor] || actor : '');

// 实付：已付款读 paidFen，没付款读应付
const paidText = (o: any): string =>
  fenText(o.paymentStatus === 'unpaid' ? o.payableFen ?? o.totalFen : o.paidFen || o.payableFen || o.totalFen);

const pad2 = (n: number) => String(n).padStart(2, '0');

// D5a：手机号默认打码（A8c 合并前没有“显示全号”按钮，打码后也不提供明文查看）
const maskPhone = (phone: string): string => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 7) return phone ? `${phone.slice(0, 1)}****` : '';
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
};

/** 完整联系方式只留在当前订单抽屉，60 秒后清除；复制每次重新走有审计的 reveal。 */
const ReceiverContact: React.FC<{
  orderNo: string; person: string; phone: string; addr: string;
  notify: OrdersViewProps['notify'];
}> = ({ orderNo, person, phone, addr, notify }) => {
  const [full, setFull] = useState<{ phone: string; addr: string } | null>(null);
  useEffect(() => {
    if (!full) return;
    const timer = window.setTimeout(() => setFull(null), 60_000);
    return () => window.clearTimeout(timer);
  }, [full]);
  const reveal = async () => {
    const result = await apiRequest<{ phone?: string; addr?: string }>(`/api/admin/orders/${encodeURIComponent(orderNo)}/reveal`, { method: 'POST' });
    const contact = { phone: String(result.phone || ''), addr: String(result.addr || '') };
    setFull(contact);
    return contact;
  };
  const show = async () => {
    try { await reveal(); }
    catch (error: any) { notify(error.message || '显示全号失败', 'error'); }
  };
  const copy = async (field: 'phone' | 'addr') => {
    try {
      const contact = await reveal();
      if (!contact[field]) throw new Error('没有可复制的联系方式');
      await navigator.clipboard.writeText(contact[field]);
      notify('已复制');
    } catch (error: any) { notify(error.message || '复制失败', 'error'); }
  };
  return <div style={{ padding: '14px 16px', display: 'grid', rowGap: 8 }}>
    <div style={{ display: 'flex', gap: 12 }}><span className="zy-table-aux" style={{ width: 48 }}>收货人</span><span>{person || '-'}</span></div>
    <div style={{ display: 'flex', gap: 12 }}><span className="zy-table-aux" style={{ width: 48 }}>手机号</span><span>
      {full?.phone || (phone ? maskPhone(phone) : '-')}{' '}
      <Can perm="view_full_contact"><>
        {phone && <button type="button" className="zy-table-aux" onClick={() => void show()}>显示全号</button>}
        {phone && <button type="button" className="zy-table-aux" onClick={() => void copy('phone')}>复制</button>}
      </></Can>
    </span></div>
    <div style={{ display: 'flex', gap: 12 }}><span className="zy-table-aux" style={{ width: 48 }}>地址</span><span>
      {full?.addr || addr || '-'}{' '}
      <Can perm="view_full_contact">{addr && <button type="button" className="zy-table-aux" onClick={() => void copy('addr')}>复制</button>}</Can>
    </span></div>
  </div>;
};

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
  const [showWork, setShowWork] = useState(false);

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
    setShowWork(true);
    setTimeout(() => document.getElementById('d1b-work-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
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
        onRowClick={(o) => { setShowWork(false); setActiveOrderNo(o.no); }}
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
                <div>
                  <div style={{ fontWeight: 600 }}>{o.name || '定制手串'}</div>
                  <div className="zy-table-aux">
                    {count} 颗 · {wrist}cm
                  </div>
                </div>
              );
            },
          },
          {
            title: '收货人',
            width: 130,
            render: (o) => {
              const phone = String(o.phone || '');
              return (
                <div>
                  <div>{o.person || '-'}</div>
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
                <div>{paidText(o)}</div>
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
        // 只显示对照表里的动作；后端给了但对照表没有的（比如已关闭、已退回）不显示按钮
        let drawerActions = allActions.filter(
          (a) => !(a.g === 'orderStatus' && a.to === 'cancelled') && Boolean(actionLabelFor(a.g, a.to))
        );
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
            text: [actorLabel(h.actor), labelOf(h.group, h.to), h.note].filter(Boolean).join(' '),
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
        const receiverName = detail.person || '-';
        const receiverPhone = String(detail.phone || '');
        const receiverAddr = typeof detail.addr === 'string' ? detail.addr : '';
        const goodsFen = Number(detail.goodsFen || 0);
        const shipFen = Number(detail.shipFen || 0);
        const totalFen = Number(detail.totalFen || 0);
        // 订单上没有单独存手工费：应付减去珠子和运费，剩下的就是手工费等（A3 去掉手工费后这一行自然消失）
        const otherFen = totalFen - goodsFen - shipFen;
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
                    <div>
                      <div style={{ fontWeight: 600 }}>{detail.name || '定制手串'}</div>
                      {metaLine && <div className="zy-table-aux">{metaLine}</div>}
                      {materialsLine && <div className="zy-table-aux">{materialsLine}</div>}
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
                      <span>{fenText(goodsFen)}</span>
                    </div>
                    {otherFen > 0 && (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span className="zy-table-aux" style={{ width: 48 }}>{otherFen === 1500 ? '手工费' : '其他'}</span>
                        <span>{fenText(otherFen)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>运费</span>
                      <span>{shipFen > 0 ? fenText(shipFen) : '包邮'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span className="zy-table-aux" style={{ width: 48 }}>实付</span>
                      <span>
                        <strong>{paidText(detail)}</strong>
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
                  <ReceiverContact key={detail.no} orderNo={detail.no} person={receiverName} phone={receiverPhone} addr={receiverAddr} notify={notify} />
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

                {/* D5a：内部备注 / 发货前改地址 / 改运单号（D2f 工单卡片前面） */}
                {detail && (
                  <OrdersOpsPanel
                    orderNo={detail.no}
                    internalNotes={detail.internalNotes || []}
                    shipped={['shipped', 'in_transit', 'delivered', 'exception', 'returned'].includes(
                      String(detail.logisticsStatus || '')
                    )}
                    logistics={detail.logistics}
                    onChanged={() => {
                      loadOrderDetail(detail.no);
                      onRefresh();
                    }}
                    notify={notify}
                  />
                )}

                {/* 工单和质检：稿 A07 只有底栏“去工单”。做单页（D4）上线前，点“去工单”在这里展开，做完 D4 后改成跳转 */}
                {showWork && (
                  <div id="d1b-work-section" className="zy-card" style={{ marginBottom: 16, scrollMarginTop: 12 }}>
                    <div className="zy-card-title">工单</div>
                    <div style={{ padding: '14px 16px', display: 'grid', rowGap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input
                          value={workForm.assignee}
                          onChange={(e) => setWorkForm({ ...workForm, assignee: e.target.value })}
                          placeholder="做单师傅，如：林师傅"
                          className="zy-field-box"
                        />
                        <select
                          value={workForm.step}
                          onChange={(e) => setWorkForm({ ...workForm, step: e.target.value })}
                          className="zy-field-box"
                        >
                          {CONTRACT.workOrderSteps.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={workForm.operatorNote}
                        onChange={(e) => setWorkForm({ ...workForm, operatorNote: e.target.value })}
                        placeholder="做单备注，比如弹力线股数、打结位置"
                        className="zy-field-box"
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="button" className="zy-btn zy-btn-secondary" onClick={saveWorkOrder}>
                          保存工单
                        </button>
                      </div>
                    </div>
                    <div className="zy-card-title" style={{ borderTop: '1px solid var(--line)' }}>
                      质检<span className="zy-table-aux" style={{ marginLeft: 8, fontWeight: 400 }}>
                        {detail.qualityGate?.passed ? '已通过' : '还没通过'}
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'grid', rowGap: 10 }}>
                      {Object.entries(CONTRACT.qualityGateItems as Record<string, string>).map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(qcForm[key])}
                            onChange={(e) => setQcForm({ ...qcForm, [key]: e.target.checked })}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input
                          value={qcForm.inspector}
                          onChange={(e) => setQcForm({ ...qcForm, inspector: e.target.value })}
                          placeholder="质检人"
                          className="zy-field-box"
                        />
                        <input
                          value={qcForm.note}
                          onChange={(e) => setQcForm({ ...qcForm, note: e.target.value })}
                          placeholder="没通过时写原因"
                          className="zy-field-box"
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="button" className="zy-btn zy-btn-secondary" onClick={saveQualityGate}>
                          保存质检
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
