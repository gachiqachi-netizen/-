import React, { useState } from 'react';
import { apiRequest, fenToYuan, labelOf } from '../../api';
import { Can } from '../../permissions';
import { Button } from '../../ui/Button';
import { Drawer } from '../../ui/Drawer';
import { Table } from '../../ui/Table';
import { Tabs } from '../../ui/Tabs';

type User = { userId: string; phoneMasked: string; orders: { no: string; status?: string; totalFen?: number }[]; afterSaleCount: number; designCount: number };
type Share = { id: string; name?: string; takenDownAt?: string | null; takeDownReason?: string | null; createdAt?: string };

export default function ContentTools() {
  const [tab, setTab] = useState('users'), [query, setQuery] = useState(''), [users, setUsers] = useState<User[]>([]), [shares, setShares] = useState<Share[]>([]);
  const [searched, setSearched] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [takingDown, setTakingDown] = useState<Share | null>(null), [reason, setReason] = useState(''), [busy, setBusy] = useState(false);
  const changeTab = (next: string) => { setTab(next); setQuery(''); setSearched(false); setError(''); };
  const search = async () => {
    const q = query.trim();
    if (tab === 'users' && !q) { setError('请输入手机号后四位或订单号'); return; }
    setLoading(true); setError(''); setSearched(true);
    try {
      if (tab === 'users') {
        const result = await apiRequest<{ users: User[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`);
        setUsers(result.users || []);
      } else {
        const result = await apiRequest<{ shares: Share[] }>(`/api/admin/shares?q=${encodeURIComponent(q)}`);
        setShares(result.shares || []);
      }
    } catch (err) { setError((err as Error).message || '查询失败'); }
    finally { setLoading(false); }
  };
  const takeDown = async () => {
    if (!takingDown || busy) return;
    if (!reason.trim()) { setError('请填写下架原因'); return; }
    setBusy(true); setError('');
    try {
      await apiRequest(`/api/admin/shares/${encodeURIComponent(takingDown.id)}/take-down`, { method: 'POST', body: { reason: reason.trim() } });
      setTakingDown(null); setReason(''); await search();
    } catch (err) { setError((err as Error).message || '下架失败'); }
    finally { setBusy(false); }
  };
  return <div className="zy-card" style={{ padding: 16, marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}><div><strong>用户查询与分享管理</strong><div className="zy-table-aux">查询结果仅显示后端允许查看的信息。</div></div><Tabs items={[{ key: 'users', label: '查用户' }, { key: 'shares', label: '分享管理' }]} active={tab} onChange={changeTab} /></div>
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><input className="zy-field-box" style={{ maxWidth: 340 }} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void search(); }} placeholder={tab === 'users' ? '手机号后四位或订单号' : '作品名或分享编号'} />{tab === 'users' ? <Can perm="lookup_users"><Button variant="primary" disabled={loading} onClick={() => void search()}>{loading ? '正在查询…' : '查询'}</Button></Can> : <Button variant="primary" disabled={loading} onClick={() => void search()}>{loading ? '正在查询…' : '查询'}</Button>}</div>
    {error && <div className="zy-field-error" role="alert" style={{ marginTop: 8 }}>{error}</div>}
    {searched && !loading && !error && tab === 'users' && (users.length ? <div style={{ marginTop: 12 }}><Table rows={users} rowKey={row => row.userId} columns={[
      { title: '手机号', render: row => row.phoneMasked || '未绑定' },
      { title: '订单', render: row => row.orders.length ? row.orders.map(order => `${order.no} · ${labelOf('orderStatus', order.status)} · ¥${fenToYuan(order.totalFen)}`).join('；') : '暂无订单' },
      { title: '售后', render: row => row.afterSaleCount }, { title: '作品', render: row => row.designCount },
    ]} /></div> : <div className="zy-empty">没有找到用户</div>)}
    {searched && !loading && !error && tab === 'shares' && (shares.length ? <div style={{ marginTop: 12 }}><Table rows={shares} rowKey={row => row.id} columns={[
      { title: '作品', render: row => row.name || '未命名作品' }, { title: '分享编号', render: row => row.id },
      { title: '状态', render: row => row.takenDownAt ? '已下架' : '公开中' },
      { title: '操作', render: row => row.takenDownAt ? row.takeDownReason || '已下架' : <Can perm="edit_content"><Button variant="danger" onClick={() => { setTakingDown(row); setReason(''); setError(''); }}>下架</Button></Can> },
    ]} /></div> : <div className="zy-empty">没有找到分享</div>)}
    {takingDown && <Drawer title="下架分享" subtitle={takingDown.name || '未命名作品'} onClose={() => setTakingDown(null)} footer={<><Button disabled={busy} onClick={() => setTakingDown(null)}>取消</Button><Can perm="edit_content"><Button variant="danger" disabled={busy || !reason.trim()} onClick={() => void takeDown()}>确认下架</Button></Can></>}>
      <p>下架后，这条分享将不再公开。请写明原因。</p><label className="zy-field"><span className="zy-field-label">下架原因</span><textarea className="zy-field-box" rows={4} value={reason} onChange={e => setReason(e.target.value)} /></label>
      {error && <div className="zy-field-error" role="alert">{error}</div>}
    </Drawer>}
  </div>;
}
