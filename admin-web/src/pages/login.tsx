import React, { useEffect, useState } from 'react';
import { apiRequest, setSavedToken } from '../api';

type SessionResult = { ok: boolean; mustChangePassword: boolean; bootstrap: boolean; user: { name: string; roleId: string } | null };
type Props = { onAuthenticated: (roleId?: string) => void | Promise<void> };
const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: 44 };
const label: React.CSSProperties = { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 };

export default function LoginPage({ onAuthenticated }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loginRoleId, setLoginRoleId] = useState<string>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [bootstrap, setBootstrap] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setSavedToken(''); }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiRequest<SessionResult>('/api/admin/session', {
        method: 'POST', body: { username: username.trim(), password },
      });
      setLoginRoleId(result.user?.roleId);
      if (result.bootstrap) setBootstrap(true);
      else if (result.mustChangePassword) setChanging(true);
      else await onAuthenticated(result.user?.roleId);
    } catch (err: any) {
      setError(err.status === 429 ? '连续输错 5 次，10 分钟内不能再试' : '账号或密码不对');
    } finally { setBusy(false); }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (newPassword.length < 8) return setError('新密码至少 8 位');
    if (newPassword !== confirmPassword) return setError('两次输入的新密码不一致');
    setBusy(true); setError('');
    try {
      await apiRequest('/api/admin/accounts/me/password', {
        method: 'PUT', body: { oldPassword: password, newPassword },
      });
      setPassword(''); setNewPassword(''); setConfirmPassword('');
      await onAuthenticated(loginRoleId);
    } catch (err: any) {
      setError(err.message || '改密码没成功，请再试一次');
    } finally { setBusy(false); }
  };

  const createOwner = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!username.trim() || !name.trim()) return setError('请填写账号和名字');
    if (newPassword.length < 8) return setError('密码至少 8 位');
    if (newPassword !== confirmPassword) return setError('两次输入的密码不一致');
    setBusy(true); setError('');
    try {
      await apiRequest('/api/admin/accounts/bootstrap', {
        method: 'POST', body: { username: username.trim(), name: name.trim(), password: newPassword },
      });
      await apiRequest('/api/admin/session', { method: 'DELETE' });
      setBootstrap(false);
      setUsername(''); setName(''); setPassword(''); setNewPassword(''); setConfirmPassword('');
      setNotice('负责人账号已创建，请用新账号登录');
    } catch (err: any) {
      setError(err.message || '创建账号没成功，请再试一次');
    } finally { setBusy(false); }
  };

  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6' }}>
    <div className="zy-card" style={{ width: 380, padding: '40px 36px', background: '#fff' }}>
      <div style={{ textAlign: 'center', fontFamily: 'Songti SC, STSong, serif', fontSize: 26, letterSpacing: 8 }}>珠养养</div>
      <div style={{ textAlign: 'center', fontSize: 8, letterSpacing: 1.6, color: 'var(--text-aux)' }}>ZHU YANG YANG</div>
      <div style={{ textAlign: 'center', marginTop: 10, color: 'var(--text-aux)' }}>{bootstrap ? '创建第一个负责人' : changing ? '改密码' : '后台'}</div>
      {bootstrap ? <form onSubmit={createOwner} style={{ marginTop: 32 }}>
        <label style={label} htmlFor="bootstrap-username">账号</label>
        <input id="bootstrap-username" className="zy-field-box" style={field} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required />
        <label style={{ ...label, marginTop: 14 }} htmlFor="bootstrap-name">名字</label>
        <input id="bootstrap-name" className="zy-field-box" style={field} value={name} onChange={e => setName(e.target.value)} required />
        <label style={{ ...label, marginTop: 14 }} htmlFor="bootstrap-password">密码</label>
        <input id="bootstrap-password" className="zy-field-box" style={field} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required />
        <label style={{ ...label, marginTop: 14 }} htmlFor="bootstrap-confirm">再输一次密码</label>
        <input id="bootstrap-confirm" className="zy-field-box" style={field} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required />
        {error && <div className="zy-field-error" role="alert" style={{ marginTop: 8 }}>{error}</div>}
        <button className="zy-btn zy-btn-primary" type="submit" disabled={busy} style={{ width: '100%', marginTop: 20 }}>{busy ? '正在创建…' : '创建负责人账号'}</button>
      </form> : changing ? <form onSubmit={changePassword} style={{ marginTop: 32 }}>
        <label style={label} htmlFor="new-password">新密码</label>
        <input id="new-password" className="zy-field-box" style={field} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required />
        <label style={{ ...label, marginTop: 14 }} htmlFor="confirm-password">再输一次新密码</label>
        <input id="confirm-password" className="zy-field-box" style={field} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required />
        {error && <div className="zy-field-error" role="alert" style={{ marginTop: 8 }}>{error}</div>}
        <button className="zy-btn zy-btn-primary" type="submit" disabled={busy} style={{ width: '100%', marginTop: 20 }}>{busy ? '正在保存…' : '保存新密码'}</button>
      </form> : <form onSubmit={login} style={{ marginTop: 32 }}>
        <label style={label} htmlFor="username">账号</label>
        <input id="username" className="zy-field-box" style={field} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} />
        <label style={{ ...label, marginTop: 14 }} htmlFor="password">密码</label>
        <input id="password" className="zy-field-box" style={field} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="zy-field-error" role="alert" style={{ marginTop: 8 }}>{error}</div>}
        {notice && <div role="status" style={{ marginTop: 8 }}>{notice}</div>}
        <button className="zy-btn zy-btn-primary" type="submit" disabled={busy} style={{ width: '100%', marginTop: 20 }}>{busy ? '正在进入…' : '进入后台'}</button>
        <div style={{ fontSize: 12, color: 'var(--text-aux)', textAlign: 'center', marginTop: 14 }}>连续输错 5 次，10 分钟内不能再试</div>
      </form>}
    </div>
  </div>;
}
