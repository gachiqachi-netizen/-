import React from 'react';
import { apiRequest } from '../api';
import { Button } from '../ui/Button';

type ProviderInfo = { configured: boolean; keyLast4: string };
type Settings = {
  designEnabled: boolean; photoEnabled: boolean; provider: string;
  model: string; visionModel: string; providers: Record<string, ProviderInfo>;
};
type Usage = { calls: number; failures: number; avgElapsedMs: number };
type UsageDay = { day: string; design: Usage; photo: Usage };
type TestResult = { success: boolean; elapsedMs: number; model: string; error?: string };

const providerNames: Record<string, string> = { zerone: '零一万物', claude: '克劳德', openai: '开放人工智能' };
const surface: React.CSSProperties = { padding: '16px 20px', display: 'grid', gap: 12 };
const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 6, minWidth: 220 };
const label = (name: string) => providerNames[name] || '其他服务商';
const count = (usage: Usage) => `${usage.calls} 次 / 失败 ${usage.failures} 次 / 平均 ${usage.avgElapsedMs} 毫秒`;

export default function AiSettingsPage() {
  const [saved, setSaved] = React.useState<Settings | null>(null);
  const [draft, setDraft] = React.useState<Settings | null>(null);
  const [days, setDays] = React.useState<UsageDay[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [testResult, setTestResult] = React.useState<TestResult | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [settings, usage] = await Promise.all([
        apiRequest<Settings>('/api/admin/ai-settings'),
        apiRequest<{ days: UsageDay[] }>('/api/admin/ai-settings/usage?days=7'),
      ]);
      setSaved(settings); setDraft(settings); setDays(usage.days || []);
    } catch (e) { setError((e as Error).message || '设置读取失败'); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const change = (patch: Partial<Settings>) => setDraft(current => current ? { ...current, ...patch } : current);
  const configured = Object.entries(saved?.providers || {}).filter(([, value]) => value.configured);
  const selected = draft?.provider || '';

  async function save() {
    if (!draft || busy) return;
    setBusy('save'); setError(''); setMessage('');
    try {
      const result = await apiRequest<Settings>('/api/admin/ai-settings', {
        method: 'PUT', body: {
          designEnabled: draft.designEnabled, photoEnabled: draft.photoEnabled,
          provider: draft.provider, model: draft.model.trim(), visionModel: draft.visionModel.trim(),
        },
      });
      setSaved(result); setDraft(result); setMessage('设置已保存');
    } catch (e) { setError((e as Error).message || '保存失败'); }
    finally { setBusy(''); }
  }

  async function test() {
    if (busy) return;
    setBusy('test'); setError(''); setTestResult(null);
    try { setTestResult(await apiRequest<TestResult>('/api/admin/ai-settings/test', { method: 'POST', body: {} })); }
    catch (e) { setError((e as Error).message || '测试请求失败'); }
    finally { setBusy(''); }
  }

  if (loading) return <div className="zy-card zy-empty">正在读取设置…</div>;
  if (!saved || !draft) return <div className="zy-card zy-empty" role="alert">{error || '设置暂时无法读取'} <Button onClick={() => void load()}>重试</Button></div>;
  return <div style={{ display: 'grid', gap: 16 }}>
    <div className="zy-card" style={surface}>
      <div className="zy-card-title">当前状态</div>
      <div>服务商：{saved.provider ? label(saved.provider) : '使用服务器默认配置'}</div>
      <div>配串模型：{saved.model || '使用服务器默认配置'}</div>
      <div>看图模型：{saved.visionModel || '使用服务器默认配置'}</div>
      <div>密钥：{saved.provider ? (saved.providers[saved.provider]?.configured ? `已配置（尾号 ${saved.providers[saved.provider].keyLast4}）` : '未配置') : '由服务器配置'}</div>
      <div>密钥在服务器上配置，这里看不到也改不了。</div>
    </div>

    <div className="zy-card" style={surface}>
      <div className="zy-card-title">功能开关</div>
      <label><input type="checkbox" checked={draft.designEnabled} onChange={e => change({ designEnabled: e.target.checked })} /> AI 配</label>
      <label><input type="checkbox" checked={draft.photoEnabled} onChange={e => change({ photoEnabled: e.target.checked })} /> 拍照做同款</label>
    </div>

    <div className="zy-card" style={surface}>
      <div className="zy-card-title">服务商和模型</div>
      <label>服务商　<select style={input} value={selected} onChange={e => change({ provider: e.target.value })}>
        <option value="">使用服务器默认配置</option>
        {configured.map(([name]) => <option key={name} value={name}>{label(name)}</option>)}
      </select></label>
      {configured.length === 0 ? <div>暂无已配置的服务商，请先在服务器上配置密钥。</div> : null}
      <label>配串模型　<input style={input} value={draft.model} onChange={e => change({ model: e.target.value })} disabled={!selected} placeholder="留空使用默认模型" maxLength={100} /></label>
      <label>看图模型　<input style={input} value={draft.visionModel} onChange={e => change({ visionModel: e.target.value })} disabled={!selected} placeholder="留空使用默认模型" maxLength={100} /></label>
      <div><Button variant="primary" disabled={busy !== ''} onClick={() => void save()}>{busy === 'save' ? '保存中…' : '保存设置'}</Button></div>
      {message ? <div role="status">{message}</div> : null}
    </div>

    <div className="zy-card" style={surface}>
      <div className="zy-card-title">连接测试</div>
      <div>测试使用已保存的设置。</div>
      <div><Button disabled={busy !== ''} onClick={() => void test()}>{busy === 'test' ? '测试中…' : '测试一下'}</Button></div>
      {testResult ? <div role="status">{testResult.success ? '测试成功' : `测试失败：${testResult.error || '请检查服务配置'}`} · 耗时 {testResult.elapsedMs} 毫秒 · 模型 {testResult.model || '未返回'}</div> : null}
      {error ? <div role="alert">{error}</div> : null}
    </div>

    <div className="zy-card" style={surface}>
      <div className="zy-card-title">最近 7 天用量</div>
      <table className="zy-table"><thead><tr><th>日期</th><th>配串调用 / 失败 / 平均耗时</th><th>拍照调用 / 失败 / 平均耗时</th></tr></thead>
        <tbody>{days.map(day => <tr key={day.day}><td>{day.day}</td><td>{count(day.design)}</td><td>{count(day.photo)}</td></tr>)}</tbody></table>
    </div>
  </div>;
}
