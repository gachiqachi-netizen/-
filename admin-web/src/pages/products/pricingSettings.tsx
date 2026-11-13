import React, { useEffect, useState } from 'react';
import { apiRequest, fenToYuan, yuanToFen } from '../../api';
import { Drawer } from '../../ui/Drawer';
import { Can } from '../../permissions';

type Section = { enabled: boolean; fen: number };
type Settings = { handwork: Section; shipping: Section & { freeThresholdFen: number | null }; updatedBy?: string; updatedAt?: string };
type Form = { handworkEnabled: boolean; handworkYuan: string; shippingEnabled: boolean; shippingYuan: string; freeShipping: boolean; thresholdYuan: string };
type Props = { onClose: () => void; notify: (message: string, type?: 'success' | 'error') => void };
const amount = /^\d+(?:\.\d{1,2})?$/;
function toForm(value: Settings): Form {
  return {
    handworkEnabled: value.handwork.enabled, handworkYuan: fenToYuan(value.handwork.fen),
    shippingEnabled: value.shipping.enabled, shippingYuan: fenToYuan(value.shipping.fen),
    freeShipping: value.shipping.freeThresholdFen !== null,
    thresholdYuan: value.shipping.freeThresholdFen === null ? '' : fenToYuan(value.shipping.freeThresholdFen),
  };
}
function describe(value: Settings): string[] {
  return [
    value.handwork.enabled ? `手工费：收 ¥${fenToYuan(value.handwork.fen)}` : '手工费：不收',
    value.shipping.enabled ? `运费：收 ¥${fenToYuan(value.shipping.fen)}` : '运费：不收',
    ...(value.shipping.enabled ? [value.shipping.freeThresholdFen === null ? '包邮：不包邮' : `包邮：满 ¥${fenToYuan(value.shipping.freeThresholdFen)}`] : []),
  ];
}
function parseForm(form: Form): Settings {
  const required = [form.handworkEnabled ? form.handworkYuan : '0', form.shippingEnabled ? form.shippingYuan : '0', ...(form.shippingEnabled && form.freeShipping ? [form.thresholdYuan] : [])];
  if (required.some(text => !amount.test(text))) throw new Error('金额只能填非负数，最多两位小数');
  const handworkFen = yuanToFen(form.handworkEnabled ? form.handworkYuan : '0'), shippingFen = yuanToFen(form.shippingEnabled ? form.shippingYuan : '0');
  const thresholdFen = form.shippingEnabled && form.freeShipping ? yuanToFen(form.thresholdYuan) : null;
  if ([handworkFen, shippingFen, thresholdFen].some(value => value !== null && value > 100000)) throw new Error('金额最多为 ¥1000.00');
  return { handwork: { enabled: form.handworkEnabled, fen: handworkFen }, shipping: { enabled: form.shippingEnabled, fen: shippingFen, freeThresholdFen: thresholdFen } };
}

export default function PricingSettingsDrawer({ onClose, notify }: Props) {
  const [original, setOriginal] = useState<Settings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [preview, setPreview] = useState<Settings | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    apiRequest<Settings>('/api/admin/pricing-settings').then(value => { if (live) { setOriginal(value); setForm(toForm(value)); } }).catch(e => { if (live) setError(e.message || '设置没加载出来'); });
    return () => { live = false; };
  }, []);
  const patch = (change: Partial<Form>) => { setForm(old => old ? { ...old, ...change } : old); setPreview(null); setError(''); };
  const prepare = () => {
    if (!form) return;
    try { setPreview(parseForm(form)); setError(''); }
    catch (e) { setError((e as Error).message); }
  };
  const save = async () => {
    if (!preview || busy) return;
    setBusy(true); setError('');
    try {
      const saved = await apiRequest<Settings>('/api/admin/pricing-settings', { method: 'PUT', body: preview });
      setOriginal(saved); setForm(toForm(saved)); setPreview(null);
      notify('手工费和运费已更新');
    } catch (e) { setError((e as Error).message || '保存失败'); }
    finally { setBusy(false); }
  };
  return <Drawer title="手工费和运费" subtitle="只影响之后的下单，已经下的订单不变" onClose={onClose} footer={<>
    <button className="zy-btn zy-btn-secondary" disabled={busy} onClick={onClose}>关闭</button>
    <Can perm="edit_prices">{preview ? <button className="zy-btn zy-btn-primary" disabled={busy} onClick={() => void save()}>{busy ? '正在保存…' : '确认并保存'}</button> : <button className="zy-btn zy-btn-primary" disabled={!form || busy} onClick={prepare}>核对改前改后</button>}</Can>
  </>}>
    {!form ? <div className="zy-empty">{error || '正在读取设置…'}</div> : <div style={{ display: 'grid', gap: 24 }}>
      <section className="zy-card" style={{ padding: 16 }}><h3 style={{ marginTop: 0 }}>手工费</h3>
        <label className="zy-field"><span className="zy-field-label">是否收手工费</span><select className="zy-field-box" value={form.handworkEnabled ? 'yes' : 'no'} onChange={e => patch({ handworkEnabled: e.target.value === 'yes' })}><option value="yes">收</option><option value="no">不收</option></select></label>
        {form.handworkEnabled && <label className="zy-field"><span className="zy-field-label">手工费（元）</span><input className="zy-field-box" inputMode="decimal" value={form.handworkYuan} onChange={e => patch({ handworkYuan: e.target.value })} /></label>}
      </section>
      <section className="zy-card" style={{ padding: 16 }}><h3 style={{ marginTop: 0 }}>运费</h3>
        <label className="zy-field"><span className="zy-field-label">是否收运费</span><select className="zy-field-box" value={form.shippingEnabled ? 'yes' : 'no'} onChange={e => patch({ shippingEnabled: e.target.value === 'yes' })}><option value="yes">收</option><option value="no">不收</option></select></label>
        {form.shippingEnabled && <label className="zy-field"><span className="zy-field-label">运费金额（元）</span><input className="zy-field-box" inputMode="decimal" value={form.shippingYuan} onChange={e => patch({ shippingYuan: e.target.value })} /></label>}
        {form.shippingEnabled && <label className="zy-field"><span className="zy-field-label">满多少包邮</span><select className="zy-field-box" value={form.freeShipping ? 'yes' : 'no'} onChange={e => patch({ freeShipping: e.target.value === 'yes' })}><option value="yes">设置包邮门槛</option><option value="no">不包邮</option></select></label>}
        {form.shippingEnabled && form.freeShipping && <label className="zy-field"><span className="zy-field-label">包邮门槛（元）</span><input className="zy-field-box" inputMode="decimal" value={form.thresholdYuan} onChange={e => patch({ thresholdYuan: e.target.value })} /></label>}
      </section>
      {preview && original && <div className="zy-card" style={{ padding: 16 }}><h3 style={{ marginTop: 0 }}>请确认改动</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><strong>改前</strong>{describe(original).map(text => <div key={text}>{text}</div>)}</div><div><strong>改后</strong>{describe(preview).map(text => <div key={text}>{text}</div>)}</div></div></div>}
      {original?.updatedBy && <div className="zy-table-aux">上次修改：{original.updatedBy} · {original.updatedAt ? new Date(original.updatedAt).toLocaleString('zh-CN') : ''}</div>}
      <div className="zy-table-aux">只影响之后的下单，已经下的订单不变。</div>
      {error && <div className="zy-field-error" role="alert">{error}</div>}
    </div>}
  </Drawer>;
}
