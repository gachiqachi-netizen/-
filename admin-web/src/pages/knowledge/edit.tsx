import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { Button } from '../../ui/Button';
import { Drawer } from '../../ui/Drawer';
import attributes from '../../../../kb/data/attributes.json';
import type { KbDetail } from './detail';

type Data = KbDetail['data'];
type Issue = { field: string; message: string };
const red: React.CSSProperties = { color: '#b42318', fontSize: 12 };
const clone = (data: Data): Data => JSON.parse(JSON.stringify(data)) as Data;
const lines = (value: string) => value.split('\n').map(row => row.trim()).filter(Boolean);

export function KnowledgeEdit({ item, onCancel, onSaved, onRefresh }: { item: KbDetail; onCancel: () => void; onSaved: () => void; onRefresh: () => void }) {
  const [draft, setDraft] = useState<Data>(() => clone(item.data));
  const [version, setVersion] = useState(item.version);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Issue[]>([]);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [requestError, setRequestError] = useState('');
  const route = item.data.id ? `/api/admin/kb/${encodeURIComponent(item.data.id)}` : '';
  const update = (change: Partial<Data>) => setDraft(previous => ({ ...previous, ...change }));
  const fieldErrors = (field: string) => errors.filter(row => row.field === field || row.field.startsWith(`${field}.`)).map(row => row.message);
  useEffect(() => {
    if (!route) { setChecking(false); return; }
    let active = true;
    setChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await apiRequest<{ errors?: Issue[] }>(`${route}/check`, { method: 'POST', body: { data: draft } });
        if (active) { setErrors(result.errors || []); setRequestError(''); }
      } catch (failure) { if (active) { setErrors([]); setRequestError((failure as Error).message || '检查失败'); } }
      finally { if (active) setChecking(false); }
    }, 500);
    return () => { active = false; window.clearTimeout(timer); };
  }, [draft, route]);
  async function refresh() {
    try { const latest = await apiRequest<KbDetail>(route); setDraft(clone(latest.data)); setVersion(latest.version); setConflict(false); setRequestError(''); onRefresh(); }
    catch (failure) { setRequestError((failure as Error).message || '刷新失败'); }
  }
  async function save() {
    if (!route || checking || errors.length || requestError || saving || conflict) return;
    if (!window.confirm('保存后用户端立即生效，确定保存吗？')) return;
    setSaving(true);
    try { await apiRequest(route, { method: 'PUT', body: { data: draft, version, note } }); onSaved(); }
    catch (failure) {
      const error = failure as { status?: number; message?: string; data?: { errors?: Issue[] } };
      if (error.status === 400 && error.data?.errors) setErrors(error.data.errors);
      else if (error.status === 409) { setConflict(true); setRequestError('别人刚改过，请刷新后再编辑。'); }
      else setRequestError(error.message || '保存失败');
    } finally { setSaving(false); }
  }
  function block(field: string, title: string, value: string, change: (value: string) => void, confidence?: string, hint?: string) {
    return <section key={field} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><label htmlFor={`kb-${field}`}><strong>{title}</strong></label>
        {confidence && <label>把握 <select aria-label={`${title}把握`} value={draft.confidence?.[confidence] || 'low'} onChange={event => update({ confidence: { ...draft.confidence, [confidence]: event.target.value } })}>
          <option value="high">高</option><option value="mid">中</option><option value="low">低</option></select></label>}</div>
      <textarea id={`kb-${field}`} value={value} onChange={event => change(event.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box' }} />
      {hint && <small>{hint}</small>}{fieldErrors(field).map((message, index) => <div key={index} style={red}>{message}</div>)}
    </section>;
  }
  const tags = draft.meaning?.tags || [];
  const reason = conflict ? '别人刚改过，请刷新' : checking ? '正在检查内容' : requestError || errors.map(row => row.message).join('；') || (route ? '' : '缺少资料编号');
  return <Drawer title={`编辑 · ${draft.name || '品种资料'}`} subtitle={`基于第 ${version} 版`} onClose={onCancel}
    footer={<><Button onClick={onCancel}>取消</Button><Button variant="primary" disabled={Boolean(reason) || saving} reason={reason || (saving ? '正在保存' : undefined)} onClick={() => void save()}>保存</Button></>}>
    {conflict && <div role="alert" style={red}>别人刚改过。<Button onClick={() => void refresh()}>刷新</Button></div>}
    {requestError && !conflict && <div role="alert" style={red}>{requestError}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(180px, 1fr)', gap: 20 }}>
      <div>
        {block('summary', '一句话', draft.summary || '', value => update({ summary: value }))}
        {block('aliases', '别名与商家叫法', (draft.aliases || []).join('\n'), value => update({ aliases: lines(value) }), undefined, '每行一个')}
        {block('look', '外观', draft.look || '', value => update({ look: value }), 'look')}
        {block('identify', '怎么认', (draft.identify || []).join('\n'), value => update({ identify: lines(value) }), 'identify', '每行一条')}
        {block('confusables', '容易混淆', (draft.confusables || []).map(row => `${row.name || ''}：${row.how || ''}`).join('\n'), value => update({ confusables: lines(value).map(line => { const at = line.indexOf('：'); return { name: at < 0 ? line : line.slice(0, at), how: at < 0 ? '' : line.slice(at + 1) }; }) }), 'confusables', '每行一条：名称：区别')}
        <section style={{ padding: '12px 0' }}><strong>寓意关键词（最多 3 个）</strong>
          <div>{tags.map(tag => <button type="button" key={tag} onClick={() => update({ meaning: { ...draft.meaning, tags: tags.filter(row => row !== tag) } })}>{tag} ×</button>)}</div>
          <select aria-label="添加寓意关键词" value="" disabled={tags.length >= 3} onChange={event => { const tag = event.target.value; if (tag && !tags.includes(tag)) update({ meaning: { ...draft.meaning, tags: [...tags, tag] } }); }}>
            <option value="">从寓意词典选择</option>{attributes.meaning_tags.filter(tag => !tags.includes(tag)).map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>{fieldErrors('meaning.tags').map((message, index) => <div key={index} style={red}>{message}</div>)}
        </section>
        {block('meaning.text', '寓意说明', draft.meaning?.text || '', value => update({ meaning: { ...draft.meaning, text: value } }), 'meaning')}
        {block('care', '佩戴保养', draft.care || '', value => update({ care: value }))}
        {block('safety.note', '安全提示', draft.safety?.note || '', value => update({ safety: { ...draft.safety, note: value } }))}
        {block('sources', '来源', (draft.sources || []).join('\n'), value => update({ sources: lines(value) }), undefined, '每行一个；把握高或中需要至少一个非“常识”来源')}
        <section style={{ padding: '12px 0' }}><label htmlFor="kb-note"><strong>改动说明</strong></label><input id="kb-note" value={note} onChange={event => setNote(event.target.value)} style={{ width: '100%' }} /></section>
      </div>
      <aside style={{ position: 'sticky', top: 0, alignSelf: 'start' }}>
        <div className="zy-card" style={{ padding: 14, marginBottom: 12 }}><strong>用户端实时预览</strong><h3>{draft.name}</h3><p>{draft.summary}</p><p>{draft.look}</p>
          {draft.confidence?.meaning !== 'low' ? <p>{tags.join(' · ')}<br />{draft.meaning?.text}</p> : <p>寓意把握低，用户端不显示寓意</p>}
          <p>{draft.care}</p><p>{draft.safety?.note}</p></div>
        <div className="zy-card" style={{ padding: 14 }}><strong>影响 {item.products.length} 个在售商品：</strong>
          {item.products.length ? item.products.map(product => <div key={product.id}>{product.name}{product.mm ? ` · ${product.mm}mm` : ''}</div>) : <div>暂无</div>}</div>
      </aside>
    </div>
  </Drawer>;
}
