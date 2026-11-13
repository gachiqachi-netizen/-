import React, { useState } from 'react';
import { Plus, Edit3, Save, X } from 'lucide-react';
import { apiRequest, labelOf, fmtTime, fenToYuan, yuanToFen } from '../api';
import { CONTRACT } from '../contract';
import { StatusBadge, statusTone } from './OverviewAndProducts';

export const AfterSalesView: React.FC<{
  afterSales: any[];
  orders: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ afterSales, orders, onRefresh, notify }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState<any | null>(null);
  const filtered = afterSales.filter((a) => !statusFilter || a.status === statusFilter);

  const handleTransition = async (no: string, action: string) => {
    const note = window.prompt(`确认执行售后动作「${action}」？可输入处理备注：`, '运营后台审核处理');
    if (note === null) return;
    try {
      await apiRequest(`/api/admin/after-sales/${encodeURIComponent(no)}/transition`, {
        method: 'PUT',
        body: { action, note },
      });
      notify('售后单状态已更新');
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '售后流转失败', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creating) return;
    try {
      await apiRequest('/api/admin/after-sales', {
        method: 'POST',
        body: {
          orderNo: creating.orderNo,
          type: creating.type,
          reason: creating.reason,
          refundFen: yuanToFen(creating.refundYuan),
          note: creating.note,
        },
      });
      notify('售后单已登记');
      setCreating(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '创建售后单失败', 'error');
    }
  };

  const actionLabels: Record<string, string> = {
    approve: '同意申请',
    reject: '驳回申请',
    receive: '确认收到退货',
    complete: '完成售后',
    close: '关闭售后单',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700"
          >
            <option value="">全部售后状态 ({afterSales.length})</option>
            <option value="applied">待审核</option>
            <option value="approved">已同意</option>
            <option value="returned">退货已收</option>
            <option value="completed">售后完成</option>
            <option value="rejected">已拒绝</option>
            <option value="closed">已关闭</option>
          </select>
          <span className="text-xs text-zinc-500">
            提示：退款资金完成态受支付网关流水保护，后台可执行同意、驳回、登记退货或关闭。
          </span>
        </div>
        <button
          onClick={() =>
            setCreating({
              orderNo: orders[0]?.no || '',
              type: '仅退款',
              reason: '尺寸不合手 / 拍错重拍',
              refundYuan: '0.00',
              note: '',
            })
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 新建售后工单
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="py-3 px-4">售后单号 / 关联订单</th>
              <th className="py-3 px-3">售后类型</th>
              <th className="py-3 px-3">申请原因 & 备注</th>
              <th className="py-3 px-3">申请退款金额</th>
              <th className="py-3 px-3">当前状态</th>
              <th className="py-3 px-4 text-right">可执行审批动作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-sm">
            {filtered.map((a) => (
              <tr key={a.no} className="hover:bg-zinc-50/70">
                <td className="py-3.5 px-4">
                  <div className="font-mono text-xs font-bold text-zinc-900">{a.no}</div>
                  <div className="font-mono text-[11px] text-zinc-500">订单: {a.orderNo}</div>
                </td>
                <td className="py-3.5 px-3 text-xs font-medium text-zinc-800">{a.type}</td>
                <td className="py-3.5 px-3 text-xs text-zinc-600">
                  <div>{a.reason || '-'}</div>
                  {a.note && <div className="text-zinc-400 mt-0.5">备注: {a.note}</div>}
                </td>
                <td className="py-3.5 px-3 font-semibold text-rose-600">¥{fenToYuan(a.refundFen)}</td>
                <td className="py-3.5 px-3">
                  <StatusBadge tone={statusTone(a.status)}>
                    {labelOf('afterSaleStatus', a.status)}
                  </StatusBadge>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-1.5">
                    {(a.allowedActions || []).map((act: string) => (
                      <button
                        key={act}
                        onClick={() => handleTransition(a.no, act)}
                        className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
                      >
                        {actionLabels[act] || act}
                      </button>
                    ))}
                    {(a.allowedActions || []).length === 0 && (
                      <span className="text-xs text-zinc-400">已归档</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-zinc-400">
                  暂无售后记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-semibold text-zinc-900">新建售后申请单</h3>
              <button type="button" onClick={() => setCreating(null)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">关联订单号 *</label>
              <input
                required
                value={creating.orderNo}
                onChange={(e) => setCreating({ ...creating, orderNo: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-zinc-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">售后类型</label>
                <select
                  value={creating.type}
                  onChange={(e) => setCreating({ ...creating, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg"
                >
                  <option value="仅退款">仅退款</option>
                  <option value="退货退款">退货退款</option>
                  <option value="换货/返修">换货/返修</option>
                  <option value="补发配件">补发配件</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">退款金额 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  value={creating.refundYuan}
                  onChange={(e) => setCreating({ ...creating, refundYuan: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">申请原因</label>
              <input
                value={creating.reason}
                onChange={(e) => setCreating({ ...creating, reason: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreating(null)}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-xs"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium"
              >
                提交售后单
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export const LogisticsView: React.FC<{
  orders: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ orders, onRefresh, notify }) => {
  const [drafts, setDrafts] = useState<Record<string, { carrierName: string; trackingNo: string; note: string }>>({});

  const getDraft = (o: any) =>
    drafts[o.no] || {
      carrierName: o.logistics?.carrierName || '顺丰速运',
      trackingNo: o.logistics?.trackingNo || '',
      note: o.logistics?.note || '',
    };

  const setRowField = (no: string, base: any, field: string, val: string) => {
    setDrafts((prev) => ({
      ...prev,
      [no]: { ...getDraft(base), [field]: val },
    }));
  };

  const saveLogistics = async (o: any) => {
    const d = getDraft(o);
    try {
      await apiRequest(`/api/admin/orders/${encodeURIComponent(o.no)}/logistics`, {
        method: 'PUT',
        body: d,
      });
      notify(`订单 ${o.no} 物流单号已保存`);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '保存物流失败', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-900">订单物流承运与运单核销中心</h3>
        <p className="text-xs text-zinc-500 mt-0.5">快速录入或修正快递公司、运单号及发货备注</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="py-3 px-4">订单号 / 收件人</th>
              <th className="py-3 px-3">履约 / 物流状态</th>
              <th className="py-3 px-3">承运快递公司</th>
              <th className="py-3 px-3">快递运单号</th>
              <th className="py-3 px-3">物流备注</th>
              <th className="py-3 px-4 text-right">保存</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-sm">
            {orders.map((o) => {
              const d = getDraft(o);
              return (
                <tr key={o.no} className="hover:bg-zinc-50/70">
                  <td className="py-3 px-4">
                    <div className="font-mono text-xs font-bold text-zinc-900">{o.no}</div>
                    <div className="text-xs text-zinc-500">
                      {o.addr?.name || '匿名'} · {o.addr?.phone || '-'}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge tone={statusTone(o.fulfillmentStatus)}>
                        {labelOf('fulfillmentStatus', o.fulfillmentStatus)}
                      </StatusBadge>
                      <StatusBadge tone={statusTone(o.logisticsStatus)}>
                        {labelOf('logisticsStatus', o.logisticsStatus)}
                      </StatusBadge>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <input
                      value={d.carrierName}
                      onChange={(e) => setRowField(o.no, o, 'carrierName', e.target.value)}
                      className="w-32 px-2.5 py-1 text-xs border border-zinc-200 rounded-md"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      value={d.trackingNo}
                      onChange={(e) => setRowField(o.no, o, 'trackingNo', e.target.value)}
                      placeholder="输入快递单号..."
                      className="w-40 px-2.5 py-1 text-xs font-mono border border-zinc-200 rounded-md"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      value={d.note}
                      onChange={(e) => setRowField(o.no, o, 'note', e.target.value)}
                      placeholder="保价/顺丰特快..."
                      className="w-40 px-2.5 py-1 text-xs border border-zinc-200 rounded-md"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => saveLogistics(o)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> 更新物流
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TermsAndScopeView: React.FC<{
  terms: any[];
  beads: any[];
  templates: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ terms, beads, templates, onRefresh, notify }) => {
  const [editing, setEditing] = useState<any | null>(null);

  const openEditor = (t?: any) => {
    if (!t) {
      setEditing({
        _isNew: true,
        id: '',
        title: '天然晶石矿缺与手工定制须知',
        type: '售前说明',
        version: '1.1.0',
        status: 'published',
        confirmed: true,
        body: '天然矿石存在冰裂、棉絮或色带属自然生长印记；一人一串手工排制启动后不支持无理由退换。',
        scopeMode: 'scoped',
        scenarios: [],
        templateIds: [],
        productIds: [],
      });
    } else {
      const sc = t.scope || { mode: 'global', scenarios: [], templateIds: [], productIds: [] };
      setEditing({
        ...t,
        _isNew: false,
        scopeMode: sc.mode === 'scoped' ? 'scoped' : 'global',
        scenarios: Array.isArray(sc.scenarios) ? [...sc.scenarios] : [],
        templateIds: Array.isArray(sc.templateIds) ? [...sc.templateIds] : [],
        productIds: Array.isArray(sc.productIds) ? [...sc.productIds] : [],
      });
    }
  };

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const saveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload: any = {
        title: editing.title,
        type: editing.type || '售前说明',
        version: editing.version || '1.0.0',
        status: editing.status || 'published',
        confirmed: Boolean(editing.confirmed),
        body: editing.body || '',
        scope: {
          mode: editing.scopeMode,
          scenarios: editing.scopeMode === 'scoped' ? editing.scenarios : [],
          templateIds: editing.scopeMode === 'scoped' ? editing.templateIds : [],
          productIds: editing.scopeMode === 'scoped' ? editing.productIds : [],
        },
      };
      if (editing._isNew) {
        if (editing.id) payload.id = editing.id;
        await apiRequest('/api/admin/terms', { method: 'POST', body: payload });
        notify('服务条款与适用范围已创建');
      } else {
        await apiRequest(`/api/admin/terms/${encodeURIComponent(editing.id)}`, {
          method: 'PUT',
          body: payload,
        });
        notify('服务条款与适用范围已更新');
      }
      setEditing(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '保存条款失败', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">服务条款、版本管理与规则适用范围 (`rule scope`)</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            支持「全局生效 (`global`)」与「按订单场景 / 模板 / 商品珠材精准匹配 (`scoped`)」，用户下单时自动冻结命中条款快照
          </p>
        </div>
        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 新建条款与范围规则
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {terms.map((t) => {
          const sc = t.scope || { mode: 'global' };
          return (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 text-sm">{t.title}</span>
                    <span className="font-mono text-xs text-zinc-400">v{t.version}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge tone={sc.mode === 'scoped' ? 'indigo' : 'zinc'}>
                      {sc.mode === 'scoped' ? '指定范围生效 (Scoped)' : '全局生效 (Global)'}
                    </StatusBadge>
                    <StatusBadge tone={statusTone(t.status)}>
                      {t.status === 'published' ? '已发布' : '草稿'}
                    </StatusBadge>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed whitespace-pre-wrap">{t.body}</p>
                {sc.mode === 'scoped' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                    <div>
                      <strong>适用场景：</strong>
                      {(sc.scenarios || []).map((s: string) => labelOf('termScenarios', s)).join('、') || '不限'}
                    </div>
                    {(sc.templateIds || []).length > 0 && (
                      <div>
                        <strong>限定模板：</strong> {(sc.templateIds || []).join(', ')}
                      </div>
                    )}
                    {(sc.productIds || []).length > 0 && (
                      <div>
                        <strong>限定珠材 SKU：</strong> {(sc.productIds || []).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  类型：{t.type} · {t.confirmed ? '✓ 法务/运营已确认' : '待确认'}
                </span>
                <button
                  onClick={() => openEditor(t)}
                  className="inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-900 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" /> 编辑规则与范围
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-zinc-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900">
                {editing._isNew ? '新建服务条款与适用范围' : `编辑条款 · ${editing.title}`}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveTerm} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">条款标题 *</label>
                  <input
                    required
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">版本号 *</label>
                  <input
                    required
                    value={editing.version}
                    onChange={(e) => setEditing({ ...editing, version: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">分类</label>
                  <select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  >
                    {CONTRACT.termTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">发布状态</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  >
                    <option value="published">已发布生效</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.confirmed)}
                      onChange={(e) => setEditing({ ...editing, confirmed: e.target.checked })}
                      className="w-4 h-4 rounded accent-zinc-900"
                    />
                    已由运营/法务确认
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">条款正文 *</label>
                <textarea
                  required
                  rows={4}
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                />
              </div>

              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900">规则适用范围 (`scope.mode`)</span>
                  <div className="inline-flex rounded-lg bg-white p-1 border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, scopeMode: 'global' })}
                      className={`px-3 py-1 rounded-md text-xs font-medium ${
                        editing.scopeMode === 'global' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                      }`}
                    >
                      全局适用 (global)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, scopeMode: 'scoped' })}
                      className={`px-3 py-1 rounded-md text-xs font-medium ${
                        editing.scopeMode === 'scoped' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                      }`}
                    >
                      指定范围 (scoped)
                    </button>
                  </div>
                </div>

                {editing.scopeMode === 'scoped' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-medium text-zinc-700 mb-1.5">1. 适用订单场景 (`scenarios`)：</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(CONTRACT.termScenarios).map(([key, label]) => (
                          <label
                            key={key}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-zinc-200 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editing.scenarios.includes(key)}
                              onChange={() =>
                                setEditing({
                                  ...editing,
                                  scenarios: toggleArr(editing.scenarios, key),
                                })
                              }
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-zinc-700 mb-1.5">2. 绑定指定模板 (`templateIds`)：</div>
                      <div className="flex flex-wrap gap-2">
                        {templates.map((tpl) => (
                          <label
                            key={tpl.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-zinc-200 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editing.templateIds.includes(tpl.id)}
                              onChange={() =>
                                setEditing({
                                  ...editing,
                                  templateIds: toggleArr(editing.templateIds, tpl.id),
                                })
                              }
                            />
                            <span>{tpl.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-zinc-700 mb-1.5">3. 绑定指定珠材商品 (`productIds`)：</div>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                        {beads.map((b) => (
                          <label
                            key={b.id}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-zinc-200 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editing.productIds.includes(b.id)}
                              onChange={() =>
                                setEditing({
                                  ...editing,
                                  productIds: toggleArr(editing.productIds, b.id),
                                })
                              }
                            />
                            <span>{b.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium"
                >
                  保存服务条款
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const BannersAndAuditView: React.FC<{
  banners: any[];
  auditLogs: any[];
}> = ({ banners, auditLogs }) => {
  const [subTab, setSubTab] = useState<'audit' | 'banners'>('audit');

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl bg-white p-1 border border-zinc-200 shadow-xs">
        <button
          onClick={() => setSubTab('audit')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            subTab === 'audit' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          安全操作审计日志 ({auditLogs.length})
        </button>
        <button
          onClick={() => setSubTab('banners')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            subTab === 'banners' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          小程序首页宣传位 ({banners.length})
        </button>
      </div>

      {subTab === 'audit' ? (
        <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">时间</th>
                <th className="py-3 px-3">动作类型</th>
                <th className="py-3 px-3">操作路径 / 摘要</th>
                <th className="py-3 px-3">鉴权方式</th>
                <th className="py-3 px-4 text-right">状态码</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {auditLogs.slice(0, 80).map((log, i) => (
                <tr key={i} className="hover:bg-zinc-50/70">
                  <td className="py-2.5 px-4 font-mono text-zinc-500">{fmtTime(log.ts || log.at)}</td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900">{log.action || log.method || '-'}</td>
                  <td className="py-2.5 px-3 font-mono text-zinc-700">
                    {log.path || log.targetId || '-'} {log.summary ? `· ${log.summary}` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-500">{log.auth || log.actor || 'admin'}</td>
                  <td className="py-2.5 px-4 text-right">
                    <StatusBadge tone={Number(log.status || 200) < 400 ? 'emerald' : 'rose'}>
                      {log.status || 200}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-400">
                    暂无审计日志记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-900">{b.title}</span>
                  <StatusBadge tone={statusTone(b.status || 'on_sale')}>
                    {b.status === 'on_sale' ? '展示中' : '已隐藏'}
                  </StatusBadge>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{b.subtitle || b.sub || '小程序首页灵感轮播位'}</p>
              </div>
              <span className="font-mono text-xs text-zinc-400">{b.id}</span>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="col-span-2 bg-white rounded-xl border border-zinc-200 p-10 text-center text-xs text-zinc-400">
              当前使用小程序默认视觉轮播位
            </div>
          )}
        </div>
      )}
    </div>
  );
};
