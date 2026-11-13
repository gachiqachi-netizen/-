import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, fmtTime } from '../api';
import { CONTRACT } from '../contract';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { Table } from '../ui/Table';
import { Tabs } from '../ui/Tabs';

type Status = 'pending' | 'published' | 'rejected' | 'taken_down';
type Action = 'approve' | 'reject' | 'take-down';
type Review = {
  id: string; orderNo: string; templateId?: string | null; stars: number; text: string;
  photoIds: string[]; anonymous: boolean; status: string; createdAt?: number;
  rejectReason?: string | null; machine?: { textOk?: boolean; textReason?: string | null; photos?: { id: string; status: string }[] };
};
const TABS: { key: Status; label: string }[] = [
  { key: 'pending', label: '待人审' }, { key: 'published', label: '已公开' },
  { key: 'rejected', label: '已驳回' }, { key: 'taken_down', label: '已下架' },
];
const statusName = (value: string) => (CONTRACT.reviewStatuses as Record<string, string>)[value] || value;
const issue = (r: Review) => {
  if (r.machine?.textOk === false) return r.machine.textReason || '文字未通过';
  if (r.machine?.photos?.some(p => p.status === 'rejected')) return '图片未通过';
  if (r.machine?.photos?.some(p => p.status === 'pending')) return '图片检查中';
  return '';
};
const danger = { color: 'var(--c-danger, #c2352b)' };

const ReviewsPage: React.FC = () => {
  const [rows, setRows] = useState<Record<Status, Review[]>>({ pending: [], published: [], rejected: [], taken_down: [] });
  const [tab, setTab] = useState<Status>('pending');
  const [query, setQuery] = useState('');
  const [machine, setMachine] = useState('all');
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const entries = await Promise.all(TABS.map(async item => {
        const data = await apiRequest<{ reviews: Review[] }>(`/api/admin/reviews?status=${item.key}`);
        return [item.key, data.reviews || []] as const;
      }));
      setRows(Object.fromEntries(entries) as Record<Status, Review[]>);
    } catch (err) { setError(err instanceof Error ? err.message : '评价加载失败'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const active = Object.values(rows).flat().find(r => r.id === selected);
  const visible = useMemo(() => rows[tab].filter(r => {
    const word = query.trim().toLowerCase();
    if (word && !`${r.orderNo} ${r.templateId || ''} ${r.text}`.toLowerCase().includes(word)) return false;
    const finding = issue(r);
    return machine === 'all' || (machine === 'issue' && finding && finding !== '图片检查中') ||
      (machine === 'pending' && finding === '图片检查中') || (machine === 'passed' && !finding);
  }), [rows, tab, query, machine]);
  const act = async (action: Action) => {
    if (!active || busy) return;
    if (action !== 'approve' && !reason.trim()) { setError(action === 'reject' ? '请填写给用户看的驳回原因' : '请填写下架原因'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/api/admin/reviews/${encodeURIComponent(active.id)}/${action}`, {
        method: 'POST', body: action === 'approve' ? {} : { reason: reason.trim() },
      });
      setSelected(''); setReason('');
      setNotice(action === 'approve' ? '已通过并公开' : action === 'reject' ? '已驳回评价' : '已下架评价');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : '处理失败'); }
    finally { setBusy(false); }
  };
  return <div style={{ padding: '16px 0' }}>
    <Tabs items={TABS.map(item => ({ ...item, count: rows[item.key].length }))} active={tab} onChange={key => setTab(key as Status)} />
    <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
      <input aria-label="搜索评价" placeholder="搜款式、订单号" value={query} onChange={e => setQuery(e.target.value)} style={{ width: 220, padding: 8 }} />
      <select aria-label="机审筛选" value={machine} onChange={e => setMachine(e.target.value)}>
        <option value="all">机审：全部</option><option value="issue">机审未通过</option><option value="pending">图片检查中</option><option value="passed">机审通过</option>
      </select>
      <button type="button" disabled={loading} onClick={() => void load()}>刷新</button>
    </div>
    {notice && <div role="status">{notice}</div>}
    {error && !active && <div role="alert" style={danger}>{error}</div>}
    {loading ? <EmptyState text="正在加载评价…" /> : <Table<Review> rows={visible} rowKey={r => r.id} onRowClick={r => { setSelected(r.id); setReason(''); setError(''); }} empty="暂无符合条件的评价" columns={[
      { title: '评价', width: 220, render: r => <div><strong>{r.templateId || '手串评价'}</strong><div>{r.orderNo} · {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div></div> },
      { title: '内容', render: r => <span style={r.machine?.textOk === false ? danger : undefined}>{r.text || '只打了星'}</span> },
      { title: '晒图', width: 70, render: r => r.photoIds?.length ? `${r.photoIds.length} 张` : '—' },
      { title: '机审', width: 130, render: r => <span style={issue(r) && issue(r) !== '图片检查中' ? danger : undefined}>{issue(r) || '通过'}</span> },
      { title: '状态', width: 100, render: r => statusName(r.status) },
      { title: '提交时间', width: 140, render: r => fmtTime(r.createdAt) },
      { title: '', width: 70, render: () => '审核 ›' },
    ]} />}
    {active && <Drawer title="审核评价" subtitle={`${statusName(active.status)} · ${fmtTime(active.createdAt)} 提交`} onClose={() => { if (!busy) setSelected(''); }} footer={<>
      {active.status === 'pending' && <><button type="button" className="zy-drawer-foot-left" disabled={busy} onClick={() => void act('reject')}>驳回</button><button type="button" disabled={busy} onClick={() => void act('approve')}>通过并公开</button></>}
      {active.status === 'published' && <button type="button" disabled={busy} onClick={() => void act('take-down')}>下架</button>}
    </>}>
      <section><h3>评价</h3><div>{active.orderNo} · {'★'.repeat(active.stars)}{'☆'.repeat(5 - active.stars)}</div><p style={active.machine?.textOk === false ? danger : undefined}>{active.text || '只打了星'}</p><div>晒图：{active.photoIds?.length || 0} 张 · {active.anonymous ? '匿名' : '非匿名'}</div></section>
      <section><h3>机审</h3><div style={active.machine?.textOk === false ? danger : undefined}>文字：{active.machine?.textOk === false ? active.machine.textReason || '未通过' : '通过'}</div><div style={active.machine?.photos?.some(p => p.status === 'rejected') ? danger : undefined}>图片：{active.machine?.photos?.length ? active.machine.photos.map(p => p.status === 'passed' ? '通过' : p.status === 'pending' ? '检查中' : '未通过').join('、') : '无'}</div></section>
      {active.rejectReason && <section><h3>处理原因</h3><p>{active.rejectReason}</p></section>}
      {(active.status === 'pending' || active.status === 'published') && <section><label htmlFor="review-reason">{active.status === 'pending' ? '不通过的原因（发给用户）' : '下架原因'}</label><textarea id="review-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={300} placeholder="提交时必填" style={{ display: 'block', width: '100%', minHeight: 90, boxSizing: 'border-box' }} /></section>}
      {error && <div role="alert" style={danger}>{error}</div>}
    </Drawer>}
  </div>;
};
export default ReviewsPage;
