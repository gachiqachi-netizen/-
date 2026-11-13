import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { CONTRACT } from '../contract';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { ErrorState } from '../ui/ErrorState';
import { Table } from '../ui/Table';

type Article = { id: string; title: string; cover?: string | null; body: string[]; beadKbIds?: string[]; button?: { text: string; target: string } | null; homeOrder?: number | null; status: 'draft' | 'published'; updatedAt?: string };
type Form = { title: string; cover: string; body: string; beadKbIds: string; buttonText: string; buttonTarget: string; homeOrder: string };
const empty: Form = { title: '', cover: '', body: '', beadKbIds: '', buttonText: '', buttonTarget: '', homeOrder: '' };
function fromArticle(article: Article): Form { return { title: article.title, cover: article.cover || '', body: (article.body || []).join('\n\n'), beadKbIds: (article.beadKbIds || []).join('、'), buttonText: article.button?.text || '', buttonTarget: article.button?.target || '', homeOrder: article.homeOrder == null ? '' : String(article.homeOrder) }; }
function statusLabel(status: Article['status']) { return CONTRACT.termStatuses[status] || status; }

export default function ArticlesPage() {
  const [rows, setRows] = useState<Article[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [editing, setEditing] = useState<Article | null | 'new'>(null), [form, setForm] = useState<Form>(empty), [formError, setFormError] = useState(''), [saving, setSaving] = useState(false);
  const load = async () => {
    setLoading(true); setError('');
    try { const result = await apiRequest<{ articles: Article[] }>('/api/admin/articles'); setRows(result.articles || []); }
    catch (err) { setError((err as Error).message || '文章没加载出来'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const start = (article?: Article) => { setEditing(article || 'new'); setForm(article ? fromArticle(article) : empty); setFormError(''); };
  const patch = (part: Partial<Form>) => { setForm(old => ({ ...old, ...part })); setFormError(''); };
  const payload = () => {
    const body = form.body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (!form.title.trim() || !body.length) throw new Error('请填写标题和正文');
    if (form.homeOrder && !/^\d+$/.test(form.homeOrder)) throw new Error('首页顺序只能填非负整数');
    if (!!form.buttonText.trim() !== !!form.buttonTarget.trim()) throw new Error('按钮文字和跳转目标要一起填');
    return { title: form.title.trim(), cover: form.cover.trim() || null, body,
      beadKbIds: form.beadKbIds.split(/[、,，\s]+/).map(x => x.trim()).filter(Boolean),
      button: form.buttonText.trim() ? { text: form.buttonText.trim(), target: form.buttonTarget.trim() } : null,
      homeOrder: form.homeOrder ? Number(form.homeOrder) : null,
      status: editing === 'new' ? 'draft' : (editing as Article).status };
  };
  const save = async () => {
    if (!editing || saving) return;
    let data;
    try { data = payload(); } catch (err) { setFormError((err as Error).message); return; }
    setSaving(true); setFormError('');
    try { await apiRequest(editing === 'new' ? '/api/admin/articles' : `/api/admin/articles/${encodeURIComponent(editing.id)}`, { method: editing === 'new' ? 'POST' : 'PUT', body: data }); setEditing(null); await load(); }
    catch (err) { setFormError((err as Error).message || '文章保存失败'); }
    finally { setSaving(false); }
  };
  const changeStatus = async (article: Article) => {
    const next = article.status === 'published' ? 'unpublish' : 'publish';
    if (next === 'publish' && !window.confirm(`发布“${article.title}”？发布后用户可立即看到。`)) return;
    try { await apiRequest(`/api/admin/articles/${encodeURIComponent(article.id)}/${next}`, { method: 'POST' }); await load(); }
    catch (err) { setError((err as Error).message || '状态修改失败'); }
  };
  const remove = async (article: Article) => {
    if (!window.confirm(`删除“${article.title}”？删除后不能恢复。`)) return;
    try { await apiRequest(`/api/admin/articles/${encodeURIComponent(article.id)}`, { method: 'DELETE' }); setEditing(null); await load(); }
    catch (err) { setFormError((err as Error).message || '删除失败'); }
  };
  return <div style={{ padding: 24, display: 'grid', gap: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h2 style={{ margin: 0 }}>文章</h2><p className="zy-table-aux">写好后再发布，可关联珠子小知识和首页顺序。</p></div><Button variant="primary" onClick={() => start()}>新建文章</Button></div>
    {loading ? <div className="zy-card" style={{ padding: 24 }}>正在读取文章…</div> : error ? <ErrorState reason={error} onRetry={load} /> : <Table rows={rows} rowKey={row => row.id} onRowClick={start} columns={[
      { title: '标题', render: row => row.title }, { title: '状态', render: row => statusLabel(row.status) },
      { title: '首页顺序', render: row => row.homeOrder == null ? '不在首页' : row.homeOrder },
      { title: '更新于', render: row => row.updatedAt ? new Date(row.updatedAt).toLocaleString('zh-CN') : '-' },
      { title: '操作', render: row => <button className="zy-btn zy-btn-secondary" onClick={e => { e.stopPropagation(); void changeStatus(row); }}>{row.status === 'published' ? '撤下' : '发布'}</button> },
    ]} />}
    {editing && <Drawer title={editing === 'new' ? '新建文章' : '编辑文章'} onClose={() => setEditing(null)} footer={<>
      {editing !== 'new' && <span className="zy-drawer-foot-left"><Button variant="danger" disabled={saving} onClick={() => void remove(editing)}>删除</Button></span>}
      <Button disabled={saving} onClick={() => setEditing(null)}>取消</Button><Button variant="primary" disabled={saving} onClick={() => void save()}>{saving ? '正在保存…' : '保存草稿'}</Button>
    </>}><div style={{ display: 'grid', gap: 14 }}>
      <label className="zy-field"><span className="zy-field-label">标题</span><input className="zy-field-box" value={form.title} onChange={e => patch({ title: e.target.value })} /></label>
      <label className="zy-field"><span className="zy-field-label">题图编号或地址</span><input className="zy-field-box" value={form.cover} onChange={e => patch({ cover: e.target.value })} /></label>
      <label className="zy-field"><span className="zy-field-label">正文（空行分段）</span><textarea className="zy-field-box" rows={9} value={form.body} onChange={e => patch({ body: e.target.value })} /></label>
      <label className="zy-field"><span className="zy-field-label">关联珠子编号（用顿号分开）</span><input className="zy-field-box" value={form.beadKbIds} onChange={e => patch({ beadKbIds: e.target.value })} /></label>
      <label className="zy-field"><span className="zy-field-label">首页顺序（不填则不在首页）</span><input className="zy-field-box" inputMode="numeric" value={form.homeOrder} onChange={e => patch({ homeOrder: e.target.value })} /></label>
      <label className="zy-field"><span className="zy-field-label">按钮文字</span><input className="zy-field-box" value={form.buttonText} onChange={e => patch({ buttonText: e.target.value })} /></label>
      <label className="zy-field"><span className="zy-field-label">按钮跳转目标</span><input className="zy-field-box" value={form.buttonTarget} onChange={e => patch({ buttonTarget: e.target.value })} /></label>
      {formError && <div className="zy-field-error" role="alert">{formError}</div>}
    </div></Drawer>}
  </div>;
}
