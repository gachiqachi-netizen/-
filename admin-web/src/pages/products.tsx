import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, fenToYuan, yuanToFen } from '../api';
import { CONTRACT } from '../contract';
import PricingSettingsDrawer from './products/pricingSettings';

type Product = { id: string; name: string; type?: string; mm?: number; mat?: string; priceFen?: number; price?: number | string; status?: string; stock?: string; kb?: string; legal?: string; images?: string[]; tags?: string[]; spacer?: boolean };
type Group = { name: string; sizes: Product[] };
type KbRow = { id: string; name: string; meaningConfidence?: string; meaningTags?: string[] };
type Change = { id: string; name: string; oldFen: number; newFen: number };
type Props = { beads: Product[]; kbMaterials: unknown[]; onRefresh: () => Promise<void>; notify: (message: string, type?: 'success' | 'error') => void };
const types = Object.entries(CONTRACT.productTypes);
const statuses = Object.entries(CONTRACT.productStatuses);
const stocks: Record<string, string> = { in_stock: '有货', low_stock: '快没了', out_of_stock: '缺货', preorder: '预售' };
const materials: Record<string, string> = { wood: '木质', bodhi: '菩提', stone: '玉石', crystal: '水晶', metal: '金属配件', cord: '线材', textile: '织物', paper: '纸品', plastic: '塑料', glass: '玻璃', alloy: '合金' };
const priceFen = (p: Product) => p.priceFen ?? yuanToFen(p.price || 0);
const productType = (p: Product) => p.type || (p.spacer ? 'spacer' : 'bead');
const blank = (type: string): Product => ({ id: '', name: '', type, mm: type === 'bead' || type === 'spacer' ? 8 : undefined, mat: type === 'cord' ? 'cord' : type === 'packaging' ? 'paper' : 'crystal', priceFen: 0, status: 'draft', stock: 'in_stock', kb: '', legal: '', images: [], tags: [] });

export default function ProductsPage({ notify }: Props) {
  const [groups, setGroups] = useState<Group[]>([]), [kbRows, setKbRows] = useState<KbRow[]>([]);
  const [type, setType] = useState('bead'), [query, setQuery] = useState(''), [status, setStatus] = useState(''), [material, setMaterial] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({}), [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [editing, setEditing] = useState<Product | null>(null), [priceText, setPriceText] = useState(''), [kbText, setKbText] = useState(''), [formError, setFormError] = useState(''), [deleteBlocked, setDeleteBlocked] = useState(false), [saving, setSaving] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [batch, setBatch] = useState(false), [addText, setAddText] = useState(''), [preview, setPreview] = useState<Change[] | null>(null), [batchError, setBatchError] = useState(''), [batchBusy, setBatchBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [items, knowledge] = await Promise.all([apiRequest<Group[]>('/api/admin/beads?group=1'), apiRequest<{ items: KbRow[] }>('/api/admin/kb').catch(() => ({ items: [] }))]);
      setGroups(Array.isArray(items) ? items : []); setKbRows(knowledge.items || []);
    } catch (err: any) { setError(err.message || '商品没加载出来，请再试一次'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const counts = useMemo(() => Object.fromEntries(types.map(([key]) => [key, groups.reduce((n, g) => n + g.sizes.filter(p => productType(p) === key).length, 0)])), [groups]);
  const rows = useMemo(() => groups.map(g => ({ ...g, sizes: g.sizes.filter(p => productType(p) === type && (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.id.includes(query)) && (!status || p.status === status) && (!material || p.mat === material)) })).filter(g => g.sizes.length), [groups, type, query, status, material]);
  const currentKb = kbRows.find(k => k.id === editing?.kb);
  const fetchKb = async (id: string) => {
    setKbText(''); if (!id) return;
    try { const result = await apiRequest<{ data?: { meaning?: { text?: string } } }>(`/api/admin/kb/${encodeURIComponent(id)}`); setKbText(result.data?.meaning?.text || '知识库暂无寓意文字'); }
    catch { setKbText('知识库寓意暂不可用'); }
  };
  const open = (item?: Product) => { const next = item ? { ...item } : blank(type); setEditing(next); setPriceText(fenToYuan(priceFen(next))); setFormError(''); setDeleteBlocked(false); void fetchKb(next.kb || ''); };
  const patch = (part: Partial<Product>) => setEditing(old => old ? { ...old, ...part } : old);
  const save = async () => {
    if (!editing || saving) return;
    if (!editing.name.trim()) return setFormError('请填写商品名称');
    if (!/^\d+(\.\d{1,2})?$/.test(priceText)) return setFormError('单价请填写最多两位小数的元');
    setSaving(true); setFormError('');
    try {
      const body = { ...editing, priceFen: yuanToFen(priceText), price: Number(priceText) };
      await apiRequest(editing.id ? `/api/admin/beads/${encodeURIComponent(editing.id)}` : '/api/admin/beads', { method: editing.id ? 'PUT' : 'POST', body });
      setEditing(null); notify('商品已保存'); await load();
    } catch (err: any) { setFormError(err.message || '保存失败'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!editing?.id || saving || !window.confirm('确定删除这件商品？删除后不能恢复。')) return;
    setSaving(true); setFormError(''); setDeleteBlocked(false);
    try {
      await apiRequest(`/api/admin/beads/${encodeURIComponent(editing.id)}`, { method: 'DELETE' });
      setEditing(null); notify('商品已删除'); await load();
    } catch (err: any) {
      setFormError(err.message || '删除失败'); setDeleteBlocked(err.status === 400);
    } finally { setSaving(false); }
  };
  const takeOffSale = async () => {
    if (!editing || saving) return;
    setSaving(true); setFormError('');
    try {
      await apiRequest(`/api/admin/beads/${encodeURIComponent(editing.id)}`, {
        method: 'PUT', body: { ...editing, status: 'off_sale' },
      });
      setEditing(null); notify('已下架'); await load();
    } catch (err: any) { setFormError(err.message || '下架失败'); }
    finally { setSaving(false); }
  };
  const copy = async (p: Product) => { try { await apiRequest(`/api/admin/beads/${encodeURIComponent(p.id)}/copy`, { method: 'POST' }); notify('已复制为草稿'); await load(); } catch (err: any) { notify(err.message || '复制失败', 'error'); } };
  const sale = async (p: Product) => { const next = p.status === 'on_sale' ? 'off_sale' : 'on_sale'; try { await apiRequest(`/api/admin/beads/${encodeURIComponent(p.id)}`, { method: 'PUT', body: { ...p, status: next } }); notify(next === 'on_sale' ? '已上架' : '已下架'); await load(); } catch (err: any) { notify(err.message || '操作失败', 'error'); } };
  const toggle = (id: string) => { setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]); setPreview(null); };
  const payload = () => { if (!selected.length) throw new Error('请先勾选商品'); if (!/^-?\d+(\.\d{1,2})?$/.test(addText)) throw new Error('调价金额请填写最多两位小数的元'); return { mode: 'add', ids: selected, addFen: yuanToFen(addText), preview: true }; };
  const batchPreview = async () => { setBatchError(''); setBatchBusy(true); try { setPreview(await apiRequest<Change[]>('/api/admin/beads/reprice', { method: 'POST', body: payload() })); } catch (err: any) { setBatchError(err.message || '预览失败'); } finally { setBatchBusy(false); } };
  const execute = async () => { if (!preview || batchBusy) return; setBatchBusy(true); setBatchError(''); try { await apiRequest('/api/admin/beads/reprice', { method: 'POST', body: { ...payload(), preview: false } }); setBatch(false); setPreview(null); setSelected([]); setAddText(''); notify('批量调价已完成'); await load(); } catch (err: any) { setBatchError(err.message || '调价失败'); } finally { setBatchBusy(false); } };
  return <div style={{ padding: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20 }}>珠子与配件</h2><div style={{ display: 'flex', gap: 8 }}><button className="zy-btn zy-btn-secondary" onClick={() => setPricingOpen(true)}>手工费和运费</button><button className="zy-btn zy-btn-secondary" onClick={() => { setBatch(true); setPreview(null); }}>批量调价</button><button className="zy-btn zy-btn-primary" onClick={() => open()}>新建商品</button></div></div>
    <div className="zy-card" style={{ padding: 0 }}><div className="zy-tabs" role="tablist">{types.map(([key, title]) => <button key={key} role="tab" aria-selected={type === key} className={`zy-tab ${type === key ? 'zy-tab-on' : ''}`} onClick={() => setType(key)}>{title} <span className="zy-tab-count">{counts[key] || 0}</span></button>)}</div>
      <div style={{ display: 'flex', gap: 12, padding: 16 }}><input className="zy-field-box" style={{ maxWidth: 220 }} placeholder="搜名称" value={query} onChange={e => setQuery(e.target.value)} /><select className="zy-field-box" style={{ maxWidth: 150 }} value={status} onChange={e => setStatus(e.target.value)}><option value="">状态：全部</option>{statuses.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select><select className="zy-field-box" style={{ maxWidth: 150 }} value={material} onChange={e => setMaterial(e.target.value)}><option value="">材质：全部</option>{Object.entries(materials).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></div>
      {loading ? <div className="zy-empty">正在加载商品…</div> : error ? <div className="zy-empty">{error}<div><button className="zy-btn zy-btn-secondary" onClick={() => void load()}>再试一次</button></div></div> : !rows.length ? <div className="zy-empty">还没有符合条件的商品，试试其他筛选条件。</div> : <table className="zy-table" style={{ width: '100%' }}><thead><tr><th>品种 / 尺寸</th><th>单价</th><th>状态</th><th>库存</th><th>操作</th></tr></thead><tbody>{rows.map(g => <React.Fragment key={g.name}><tr className="zy-table-row" onClick={() => setExpanded(old => ({ ...old, [g.name]: !old[g.name] }))}><td><strong>{expanded[g.name] ? '⌄' : '›'} {g.name}</strong> <span className="zy-table-aux">{g.sizes.length} 种尺寸</span></td><td /><td /><td /><td /></tr>{expanded[g.name] && g.sizes.map(p => <tr key={p.id} className="zy-table-row"><td><label><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} /> {p.mm ? `${p.mm}mm` : p.name}</label></td><td>¥{fenToYuan(priceFen(p))}</td><td>{CONTRACT.productStatuses[p.status as keyof typeof CONTRACT.productStatuses] || '草稿'}</td><td className={p.stock === 'low_stock' || p.stock === 'out_of_stock' ? 'zy-danger-text' : ''}>{stocks[p.stock || 'in_stock']}</td><td><button className="zy-btn zy-btn-secondary" onClick={() => open(p)}>编辑</button> <button className="zy-btn zy-btn-secondary" onClick={() => void copy(p)}>复制</button> <button className="zy-btn zy-btn-secondary" onClick={() => void sale(p)}>{p.status === 'on_sale' ? '下架' : '上架'}</button></td></tr>)}</React.Fragment>)}</tbody></table>}
    </div>
    {pricingOpen && <PricingSettingsDrawer onClose={() => setPricingOpen(false)} notify={notify} />}
    {editing && <div className="zy-drawer-mask" onMouseDown={() => setEditing(null)}><section className="zy-drawer" onMouseDown={e => e.stopPropagation()} aria-label="编辑商品"><div className="zy-drawer-head"><div className="zy-drawer-title">{editing.id ? '编辑商品' : '新建商品'}</div><button className="zy-drawer-close" onClick={() => setEditing(null)}>关闭</button></div><div className="zy-drawer-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <label className="zy-field"><span className="zy-field-label">名称</span><input className="zy-field-box" value={editing.name} onChange={e => patch({ name: e.target.value })} /></label><label className="zy-field"><span className="zy-field-label">商品类型</span><select className="zy-field-box" value={editing.type || type} onChange={e => patch({ type: e.target.value })}>{types.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
      <label className="zy-field"><span className="zy-field-label">尺寸（mm）</span><input className="zy-field-box" type="number" min="0.1" step="0.1" value={editing.mm ?? ''} onChange={e => patch({ mm: e.target.value ? Number(e.target.value) : undefined })} /></label><label className="zy-field"><span className="zy-field-label">材质</span><select className="zy-field-box" value={editing.mat || ''} onChange={e => patch({ mat: e.target.value })}>{Object.entries(materials).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
      <label className="zy-field"><span className="zy-field-label">单价（元）</span><input className="zy-field-box" inputMode="decimal" value={priceText} onChange={e => setPriceText(e.target.value)} /><span className="zy-field-hint">存成整数分：{/^\d+(\.\d{1,2})?$/.test(priceText) ? yuanToFen(priceText) : '—'}</span></label><label className="zy-field"><span className="zy-field-label">状态</span><select className="zy-field-box" value={editing.status || 'draft'} onChange={e => patch({ status: e.target.value })}>{statuses.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
      <label className="zy-field"><span className="zy-field-label">库存</span><select className="zy-field-box" value={editing.stock || 'in_stock'} onChange={e => patch({ stock: e.target.value })}>{Object.entries(stocks).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label><label className="zy-field"><span className="zy-field-label">关联知识库</span><select className="zy-field-box" value={editing.kb || ''} onChange={e => { patch({ kb: e.target.value }); void fetchKb(e.target.value); }}><option value="">不关联</option>{kbRows.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>
      <div className="zy-field" style={{ gridColumn: '1 / -1' }}><span className="zy-field-label">寓意（来自知识库，只读）</span><div className="zy-field-box" style={{ minHeight: 48 }}>{currentKb?.meaningConfidence === 'low' ? '知识库里这条寓意的把握是‘低’，用户端暂不显示' : kbText || (currentKb?.meaningTags || []).join('、') || '关联知识库后显示寓意'}</div></div><label className="zy-field" style={{ gridColumn: '1 / -1' }}><span className="zy-field-label">合法来源证明（受保护材质需要）</span><input className="zy-field-box" value={editing.legal || ''} onChange={e => patch({ legal: e.target.value })} /></label>{formError && <div className="zy-field-error" style={{ gridColumn: '1 / -1' }}>{formError}{deleteBlocked && editing.status !== 'off_sale' && <button className="zy-btn zy-btn-secondary" style={{ marginLeft: 12 }} disabled={saving} onClick={() => void takeOffSale()}>改成下架</button>}</div>}
    </div><div className="zy-drawer-foot"><div className="zy-drawer-foot-left">{editing.id && <button className="zy-btn zy-btn-danger" disabled={saving} onClick={() => void remove()}>删除</button>}</div><button className="zy-btn zy-btn-primary" disabled={saving} onClick={() => void save()}>{saving ? '正在保存…' : '保存'}</button></div></section></div>}
    {batch && <div className="zy-drawer-mask" onMouseDown={() => setBatch(false)}><section className="zy-drawer" onMouseDown={e => e.stopPropagation()} aria-label="批量调价"><div className="zy-drawer-head"><div className="zy-drawer-title">批量调价</div><button className="zy-drawer-close" onClick={() => setBatch(false)}>关闭</button></div><div className="zy-drawer-body"><p>已选择 {selected.length} 件商品</p><label className="zy-field"><span className="zy-field-label">每件加减金额（元，降价填写负数）</span><input className="zy-field-box" value={addText} onChange={e => { setAddText(e.target.value); setPreview(null); }} inputMode="decimal" /></label>{batchError && <div className="zy-field-error">{batchError}</div>}{preview && <table className="zy-table" style={{ width: '100%', marginTop: 16 }}><thead><tr><th>商品</th><th>改前</th><th>改后</th></tr></thead><tbody>{preview.map(c => <tr key={c.id}><td>{c.name}</td><td>¥{fenToYuan(c.oldFen)}</td><td>¥{fenToYuan(c.newFen)}</td></tr>)}</tbody></table>}</div><div className="zy-drawer-foot"><button className="zy-btn zy-btn-secondary" disabled={batchBusy} onClick={() => void batchPreview()}>预览改前改后</button><button className="zy-btn zy-btn-primary" disabled={batchBusy || !preview} onClick={() => void execute()}>确认并执行</button></div></section></div>}
  </div>;
}
