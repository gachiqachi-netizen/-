import React, { useEffect, useState } from 'react';
import { apiRequest, fmtTime } from '../api';
import { Button } from '../ui/Button';
import { Can } from '../permissions';
import { Drawer } from '../ui/Drawer';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Field } from '../ui/Field';
import { Table } from '../ui/Table';
import { Tabs } from '../ui/Tabs';

type Permission = { key: string; label: string; sensitive?: boolean };
type Group = { name: string; items: Permission[] };
type Role = { id: string; name: string; permissions: string[]; builtin?: boolean; dataScope?: string };
type Account = { id: string; username: string; name: string; roleId: string; status: string; lastLoginAt?: number | null; mustChangePassword?: boolean };
type ListResponse = { users: Account[]; roles: Role[] };
type SecretResponse = { temporaryPassword: string; user?: Account };

// 与 14 第 2.2 节、后端 accounts.PERMISSIONS 的 21 项逐一对应。
const GROUPS: Group[] = [
  { name: '生产', items: [{ key: 'view_work_orders', label: '看工单' }, { key: 'work_orders', label: '做单' }, { key: 'quality_gate', label: '质检' }] },
  { name: '订单', items: [{ key: 'view_orders', label: '看订单' }, { key: 'process_orders', label: '处理订单' }, { key: 'edit_order_address', label: '改地址和备注' }, { key: 'cancel_orders', label: '取消订单' }] },
  { name: '售后', items: [{ key: 'process_after_sales', label: '处理售后' }, { key: 'refund', label: '退款' }] },
  { name: '内容', items: [{ key: 'moderate_reviews', label: '审核评价' }, { key: 'edit_content', label: '编辑首页和文章' }, { key: 'publish_terms', label: '编辑和发布条款' }] },
  { name: '商品', items: [{ key: 'edit_products', label: '编辑商品' }, { key: 'edit_prices', label: '改价格' }, { key: 'edit_templates', label: '编辑模板' }] },
  { name: '用户', items: [{ key: 'lookup_users', label: '查用户' }] },
  { name: '敏感信息', items: [{ key: 'view_full_contact', label: '看完整手机号和地址', sensitive: true }, { key: 'view_cost', label: '看成本价和毛利', sensitive: true }, { key: 'export_data', label: '导出表格', sensitive: true }] },
  { name: '知识库', items: [{ key: 'edit_kb', label: '编辑知识库' }] },
  { name: '系统', items: [{ key: 'manage_accounts', label: '管理账号和权限' }] },
];
const PERMISSIONS = GROUPS.flatMap(group => group.items);
const surface: React.CSSProperties = { padding: 20, display: 'grid', gap: 16 };
const muted: React.CSSProperties = { color: 'var(--text-aux)', fontSize: 'var(--font-aux)' };
const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: '9px 12px', background: 'var(--card-bg)', color: 'var(--text)' };

function roleName(roles: Role[], id: string): string { return roles.find(role => role.id === id)?.name || id; }
function description(role?: Role): { can: string[]; cannot: string[] } {
  const allowed = new Set(role?.permissions || []);
  return { can: PERMISSIONS.filter(item => allowed.has(item.key)).map(item => item.label), cannot: PERMISSIONS.filter(item => !allowed.has(item.key)).map(item => item.label) };
}

export default function AccountsPage() {
  const [tab, setTab] = useState('accounts');
  const [users, setUsers] = useState<Account[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [drawer, setDrawer] = useState<'new' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [busy, setBusy] = useState(false);
  const [temporary, setTemporary] = useState('');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string[]>>({});
  const [roleEditor, setRoleEditor] = useState<Role | 'new' | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', dataScope: 'all', permissions: [] as string[] });
  const [roleError, setRoleError] = useState('');
  const [roleBusy, setRoleBusy] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try { const result = await apiRequest<ListResponse>('/api/admin/accounts'); setUsers(result.users || []); setRoles(result.roles || []); setRoleDrafts(Object.fromEntries((result.roles || []).map(item => [item.id, item.permissions || []]))); }
    catch (e) { setError((e as Error).message || '账号读取失败'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const role = roles.find(item => item.id === roleId);
  const detail = description(role);
  function openNew() { setSelected(null); setUsername(''); setName(''); setRoleId(roles.find(item => item.id !== 'owner')?.id || roles[0]?.id || ''); setActionError(''); setDrawer('new'); }
  function openEdit(user: Account) { setSelected(user); setUsername(user.username); setName(user.name); setRoleId(user.roleId); setActionError(''); setDrawer('edit'); }
  function closeDrawer() { setDrawer(null); setActionError(''); }
  async function save() {
    if (!name.trim() || (drawer === 'new' && !username.trim()) || !roleId) { setActionError('请填写账号、名字并选择角色'); return; }
    setBusy(true); setActionError('');
    try {
      if (drawer === 'new') {
        const result = await apiRequest<SecretResponse>('/api/admin/accounts', { method: 'POST', body: { username: username.trim(), name: name.trim(), roleId } });
        setActionError(''); setTemporary(result.temporaryPassword || '');
      } else if (selected) {
        await apiRequest(`/api/admin/accounts/${selected.id}`, { method: 'PUT', body: { name: name.trim(), roleId } });
      }
      closeDrawer(); await load();
    } catch (e) { setActionError((e as Error).message || '保存失败'); }
    finally { setBusy(false); }
  }
  async function resetPassword() {
    if (!selected || !window.confirm(`重置“${selected.name}”的密码？旧密码将不能再用。`)) return;
    setBusy(true); setActionError('');
    try {
      const result = await apiRequest<SecretResponse>(`/api/admin/accounts/${selected.id}/reset-password`, { method: 'POST' });
      setActionError(''); setTemporary(result.temporaryPassword || ''); closeDrawer(); await load();
    } catch (e) { setActionError((e as Error).message || '重置失败'); }
    finally { setBusy(false); }
  }
  async function disable() {
    if (!selected || !window.confirm(`停用“${selected.name}”？其已登录的会话会立即失效。`)) return;
    setBusy(true); setActionError('');
    try { await apiRequest(`/api/admin/accounts/${selected.id}/disable`, { method: 'POST' }); closeDrawer(); await load(); }
    catch (e) { setActionError((e as Error).message || '停用失败'); }
    finally { setBusy(false); }
  }
  async function copyTemporary() {
    try { await navigator.clipboard.writeText(temporary); setTemporary(''); }
    catch { setActionError('复制失败，请手动复制临时密码'); }
  }
  function toggleRolePermission(id: string, key: string) {
    setRoleDrafts(current => {
      const selected = new Set(current[id] || []);
      if (selected.has(key)) selected.delete(key); else selected.add(key);
      return { ...current, [id]: PERMISSIONS.map(item => item.key).filter(item => selected.has(item)) };
    });
  }
  const changedRoles = roles.filter(item => item.id !== 'owner' &&
    PERMISSIONS.some(permission => (roleDrafts[item.id] || []).includes(permission.key) !== (item.permissions || []).includes(permission.key)));
  function permissionChanges(before: string[], after: string[]) {
    const old = new Set(before), next = new Set(after);
    return {
      added: PERMISSIONS.filter(item => next.has(item.key) && !old.has(item.key)).map(item => item.label),
      removed: PERMISSIONS.filter(item => old.has(item.key) && !next.has(item.key)).map(item => item.label),
    };
  }
  function changeSummary(item: Role, next: string[]) {
    const { added, removed } = permissionChanges(item.permissions || [], next);
    return `${item.name}\n增加：${added.join('、') || '无'}\n减少：${removed.join('、') || '无'}`;
  }
  async function saveRoleChanges() {
    if (!changedRoles.length || roleBusy) return;
    const summary = changedRoles.map(item => changeSummary(item, roleDrafts[item.id] || [])).join('\n\n');
    if (!window.confirm(`保存后立刻对这些角色的账号生效：\n\n${summary}\n\n确认保存？`)) return;
    setRoleBusy(true); setRoleError('');
    try {
      for (const item of changedRoles) await apiRequest(`/api/admin/roles/${encodeURIComponent(item.id)}`, { method: 'PUT', body: { permissions: roleDrafts[item.id] || [] } });
      await load();
    } catch (e) { setRoleError((e as Error).message || '保存失败'); }
    finally { setRoleBusy(false); }
  }
  function openRoleEditor(item: Role | 'new') {
    setRoleEditor(item); setRoleError('');
    setRoleForm(item === 'new'
      ? { name: '', dataScope: 'all', permissions: [] }
      : { name: item.name, dataScope: item.dataScope || 'all', permissions: (roleDrafts[item.id] || item.permissions || []).slice() });
  }
  function toggleFormPermission(key: string) {
    setRoleForm(current => ({ ...current, permissions: current.permissions.includes(key)
      ? current.permissions.filter(item => item !== key) : [...current.permissions, key] }));
  }
  async function saveRoleForm() {
    if (!roleEditor || roleBusy) return;
    if (!roleForm.name.trim()) { setRoleError('请填角色名字'); return; }
    if (roleEditor !== 'new' && roleEditor.id === 'owner') return;
    if (roleEditor !== 'new' && !window.confirm(`保存后立刻对“${roleEditor.name}”的账号生效：\n\n${changeSummary(roleEditor, roleForm.permissions)}\n\n确认保存？`)) return;
    setRoleBusy(true); setRoleError('');
    try {
      const body = { name: roleForm.name.trim(), dataScope: roleForm.dataScope, permissions: roleForm.permissions };
      await apiRequest(roleEditor === 'new' ? '/api/admin/roles' : `/api/admin/roles/${encodeURIComponent(roleEditor.id)}`, { method: roleEditor === 'new' ? 'POST' : 'PUT', body });
      setRoleEditor(null); await load();
    } catch (e) { setRoleError((e as Error).message || '保存失败'); }
    finally { setRoleBusy(false); }
  }
  async function deleteRole(item: Role) {
    if (item.builtin || item.id === 'owner' || roleBusy || !window.confirm(`删除“${item.name}”？`)) return;
    setRoleBusy(true); setRoleError('');
    try { await apiRequest(`/api/admin/roles/${encodeURIComponent(item.id)}`, { method: 'DELETE' }); await load(); }
    catch (e) { setRoleError((e as Error).message || '删除失败'); }
    finally { setRoleBusy(false); }
  }
  return <div style={surface}>
    <Tabs items={[{ key: 'accounts', label: '账号', count: users.length }, { key: 'roles', label: '角色', count: roles.length }]} active={tab} onChange={setTab} />
    {loading ? <div className="zy-card" style={{ padding: 24 }}>正在读取账号…</div> : error ? <ErrorState reason={error} onRetry={load} /> : null}
    {!loading && !error && tab === 'accounts' && <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={muted}>每人一个账号，停用后立即不能再进入后台。</span><Can perm="manage_accounts"><Button variant="primary" onClick={openNew}>新建账号</Button></Can></div>
      <Table<Account> rows={users} rowKey={user => user.id} onRowClick={openEdit} columns={[
        { title: '账号', render: user => user.username }, { title: '名字', render: user => user.name },
        { title: '角色', render: user => roleName(roles, user.roleId) },
        { title: '状态', render: user => user.status === 'disabled' ? '停用' : user.mustChangePassword ? '待首次改密码' : '在用' },
        { title: '上次登录', render: user => fmtTime(user.lastLoginAt) }, { title: '', render: () => '编辑 ›' },
      ]} empty={<EmptyState text="还没有账号" />} />
    </>}
    {!loading && !error && tab === 'roles' && <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><span style={muted}>勾选后点保存，立刻对这个角色的所有账号生效。敏感信息单独授权。</span><div style={{ display: 'flex', gap: 8 }}><Can perm="manage_accounts"><Button onClick={() => openRoleEditor('new')}>新建角色</Button></Can><Can perm="manage_accounts"><Button variant="primary" disabled={roleBusy || !changedRoles.length} onClick={saveRoleChanges}>保存</Button></Can></div></div>
      {roleError && !roleEditor && <div role="alert" style={{ color: 'var(--danger)' }}>{roleError}</div>}
      <div className="zy-card" style={{ overflowX: 'auto' }}><table className="zy-table"><thead><tr><th>分组</th><th>权限点</th>{roles.map(item => <th key={item.id} style={{ minWidth: 130 }}><div>{item.name}</div>{item.id === 'owner' ? <span style={muted}>不能改</span> : <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}><Can perm="manage_accounts"><button type="button" style={{ background: 'none', border: 0, color: 'var(--text)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openRoleEditor(item)}>编辑</button></Can>{!item.builtin && <Can perm="manage_accounts"><button type="button" style={{ background: 'none', border: 0, color: 'var(--danger)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => deleteRole(item)}>删除</button></Can>}</div>}</th>)}</tr></thead><tbody>{GROUPS.flatMap(group => group.items.map((item, index) => <tr key={item.key}>
        {index === 0 && <td rowSpan={group.items.length}>{group.name}</td>}
        <td>{item.label}{item.sensitive && <span style={{ ...muted, marginLeft: 8 }}>敏感信息</span>}</td>
        {roles.map(role => <td key={role.id} style={{ textAlign: 'center' }}><input type="checkbox" aria-label={`${role.name}：${item.label}`} checked={role.id === 'owner' || (roleDrafts[role.id] || []).includes(item.key)} disabled={role.id === 'owner' || roleBusy} onChange={() => toggleRolePermission(role.id, item.key)} /></td>)}
      </tr>))}</tbody></table></div>
    </>}
    {roleEditor && <Drawer title={roleEditor === 'new' ? '新建角色' : '编辑角色'} subtitle={roleEditor === 'new' ? undefined : roleEditor.name} onClose={() => setRoleEditor(null)} footer={<><Button disabled={roleBusy} onClick={() => setRoleEditor(null)}>取消</Button><Can perm="manage_accounts"><Button variant="primary" disabled={roleBusy} onClick={saveRoleForm}>保存</Button></Can></>}>
      <div style={{ display: 'grid', gap: 18 }}>
        <Field label="角色名字"><input style={inputStyle} value={roleForm.name} disabled={roleEditor !== 'new' && roleEditor.builtin} onChange={e => setRoleForm(current => ({ ...current, name: e.target.value }))} /></Field>
        <Field label="数据范围"><select style={inputStyle} value={roleForm.dataScope} onChange={e => setRoleForm(current => ({ ...current, dataScope: e.target.value }))}><option value="all">全部</option><option value="own">只看分给我的</option></select></Field>
        <div className="zy-card" style={{ padding: 16 }}><div className="zy-card-title">权限</div>{GROUPS.map(group => <div key={group.name} style={{ paddingTop: 12 }}><strong>{group.name}</strong><div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 8 }}>{group.items.map(item => <label key={item.key} style={{ minWidth: 140 }}><input type="checkbox" checked={roleForm.permissions.includes(item.key)} onChange={() => toggleFormPermission(item.key)} /> {item.label}{item.sensitive && <span style={{ ...muted, marginLeft: 4 }}>敏感信息</span>}</label>)}</div></div>)}</div>
        {roleError && <div role="alert" style={{ color: 'var(--danger)' }}>{roleError}</div>}
      </div>
    </Drawer>}
    {drawer && <Drawer title={drawer === 'new' ? '新建账号' : '编辑账号'} subtitle={drawer === 'edit' ? selected?.username : undefined} onClose={closeDrawer} footer={<>
      {drawer === 'edit' && selected?.status !== 'disabled' && <span className="zy-drawer-foot-left"><Can perm="manage_accounts"><Button variant="danger" disabled={busy} onClick={disable}>停用账号</Button></Can></span>}
      <Button disabled={busy} onClick={closeDrawer}>取消</Button><Can perm="manage_accounts"><Button variant="primary" disabled={busy} onClick={save}>保存</Button></Can>
    </>}>
      <div style={{ display: 'grid', gap: 18 }}>
        <Field label="账号"><input style={inputStyle} value={username} disabled={drawer === 'edit'} onChange={e => setUsername(e.target.value)} autoComplete="off" /></Field>
        <Field label="名字"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} autoComplete="off" /></Field>
        <Field label="角色"><select style={inputStyle} value={roleId} onChange={e => setRoleId(e.target.value)}>{roles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <div className="zy-card"><div className="zy-card-title">这个角色能做什么</div><div style={{ padding: 16, display: 'grid', gap: 12 }}><div><strong>能做</strong><div>{detail.can.join('、') || '暂无'}</div></div><div><strong>不能做</strong><div style={muted}>{detail.cannot.join('、') || '暂无'}</div></div></div></div>
        {drawer === 'edit' && <Can perm="manage_accounts"><Button disabled={busy} onClick={resetPassword}>重置密码</Button></Can>}
        {actionError && <div role="alert" style={{ color: 'var(--danger)' }}>{actionError}</div>}
      </div>
    </Drawer>}
    {temporary && <div className="zy-drawer-mask" onClick={() => setTemporary('')}><div className="zy-card" onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: '35%', left: '50%', transform: 'translateX(-50%)', padding: 24, width: 420, zIndex: 20 }}>
      <h3 style={{ marginTop: 0 }}>临时密码</h3><p>只显示这一次。请现在交给账号本人，首次登录后必须修改。</p><code style={{ display: 'block', padding: 12, background: 'var(--face)', userSelect: 'all', overflowWrap: 'anywhere' }}>{temporary}</code>
      {actionError && <div role="alert" style={{ color: 'var(--danger)', marginTop: 8 }}>{actionError}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}><Button onClick={() => setTemporary('')}>已记下</Button><Button variant="primary" onClick={copyTemporary}>复制</Button></div>
    </div></div>}
  </div>;
}
