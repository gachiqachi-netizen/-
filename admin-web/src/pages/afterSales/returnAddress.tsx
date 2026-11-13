import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';

interface ReturnAddress {
  person: string;
  phone: string;
  address: string;
  note: string;
  updatedBy?: string;
  updatedAt?: string;
}
type Field = 'person' | 'phone' | 'address' | 'note';
const fields: { key: Field; label: string; required: boolean }[] = [
  { key: 'person', label: '收件人', required: true },
  { key: 'phone', label: '电话', required: true },
  { key: 'address', label: '地址', required: true },
  { key: 'note', label: '备注', required: false },
];
const empty: ReturnAddress = { person: '', phone: '', address: '', note: '' };
const fieldFromError = (message: string): Field | null => {
  if (/收件人/.test(message)) return 'person';
  if (/联系电话|电话|手机/.test(message)) return 'phone';
  if (/地址/.test(message)) return 'address';
  if (/备注/.test(message)) return 'note';
  return null;
};
const updatedTime = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('zh-CN', { hour12: false });
};

const ReturnAddressDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState<ReturnAddress>(empty);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = async () => {
    setLoading(true); setGeneralError('');
    try {
      const result = await apiRequest<ReturnAddress | null>('/api/admin/return-address');
      setForm(result ? { ...empty, ...result } : empty);
    } catch (error: any) { setGeneralError(error.message || '寄回地址读取失败'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const change = (field: Field, value: string) => {
    setForm(old => ({ ...old, [field]: value }));
    setErrors(old => ({ ...old, [field]: '' }));
    setGeneralError('');
    setSaved(false);
  };
  const save = async () => {
    if (saving) return;
    setSaving(true); setGeneralError(''); setErrors({});
    try {
      const result = await apiRequest<ReturnAddress>('/api/admin/return-address', {
        method: 'PUT', body: { person: form.person, phone: form.phone, address: form.address, note: form.note },
      });
      setForm(result); setSaved(true);
    } catch (error: any) {
      const message = error.message || '保存失败，请重试';
      const field = error.status === 400 ? fieldFromError(message) : null;
      if (field) setErrors({ [field]: message });
      else setGeneralError(message);
    } finally { setSaving(false); }
  };
  return <Drawer title="寄回地址" subtitle="售后寄回时向顾客展示此地址" onClose={onClose} footer={<><Button onClick={onClose}>关闭</Button><Button variant="primary" disabled={saving || loading} onClick={() => void save()}>{saving ? '保存中…' : '保存'}</Button></>}>
    {loading ? <div>正在读取寄回地址…</div> : <>
      {generalError && <div role="alert" className="zy-field-error">{generalError} <button type="button" onClick={() => void load()}>再试一次</button></div>}
      {fields.map(({ key, label, required }) => <label key={key} style={{ display: 'block', marginBottom: 20 }}>
        <span style={{ display: 'block', marginBottom: 8 }}>{label}{required ? ' *' : ''}</span>
        {key === 'note' ? <textarea className="zy-field-box" value={form[key]} maxLength={101} onChange={e => change(key, e.target.value)} style={{ width: '100%', minHeight: 88 }} /> : <input className="zy-field-box" value={form[key]} onChange={e => change(key, e.target.value)} style={{ width: '100%' }} />}
        {errors[key] && <div role="alert" className="zy-field-error">{errors[key]}</div>}
      </label>)}
      {(form.updatedBy || form.updatedAt) && <div style={{ color: '#6e6e6e', fontSize: 13 }}>上次修改：{form.updatedBy || '未知操作人'} · {updatedTime(form.updatedAt)}</div>}
      {saved && <div role="status" style={{ marginTop: 12 }}>已保存 · {form.updatedBy || '当前账号'} · {updatedTime(form.updatedAt)}</div>}
    </>}
  </Drawer>;
};
export default ReturnAddressDrawer;
