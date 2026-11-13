import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import { Button } from '../ui/Button';
import { Can } from '../permissions';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';

type Section = 'banners' | 'templates' | 'articles';
type Row = { id: string; title?: string; name?: string; cover?: string; on?: boolean; status?: string; order?: number; homeOrder?: number | null };
type Items = Record<Section, Row[]>;
const sections: Section[] = ['banners', 'templates', 'articles'];
const labels: Record<Section, string> = { banners: '轮播', templates: '热门款', articles: '珠子小知识' };
const active = (section: Section, row: Row) => section === 'banners' ? row.on !== false : row.homeOrder !== null && row.homeOrder !== undefined;
const available = (section: Section, row: Row) => section === 'banners' || (section === 'templates' ? row.status === 'on_sale' : row.status === 'published');
const ordered = (section: Section, rows: Row[]) => [...rows].sort((a, b) => Number(!active(section, a)) - Number(!active(section, b)) || (a.homeOrder ?? a.order ?? 9999) - (b.homeOrder ?? b.order ?? 9999) || a.id.localeCompare(b.id));
const muted: React.CSSProperties = { color: '#6e6e6e', fontSize: 13 };

const HomePage: React.FC = () => {
  const [items, setItems] = useState<Items>({ banners: [], templates: [], articles: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [drag, setDrag] = useState<{ section: Section; index: number } | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [banners, templates, articles] = await Promise.all([
        apiRequest<Row[]>('/api/admin/banners'),
        apiRequest<Row[]>('/api/admin/templates'),
        apiRequest<{ articles: Row[] }>('/api/admin/articles'),
      ]);
      setItems({ banners: ordered('banners', banners), templates: ordered('templates', templates), articles: ordered('articles', articles.articles || []) });
    } catch (e: any) { setError(e.message || '首页配置加载失败'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const shown = useMemo(() => Object.fromEntries(sections.map(section => [section, items[section].filter(row => active(section, row) && available(section, row))])) as Items, [items]);
  const toggle = (section: Section, id: string) => {
    setItems(old => ({ ...old, [section]: ordered(section, old[section].map(row => row.id !== id ? row : section === 'banners' ? { ...row, on: !active(section, row) } : { ...row, homeOrder: active(section, row) ? null : old[section].filter(item => active(section, item)).length })) }));
    setNotice('');
  };
  const drop = (section: Section, index: number) => {
    if (!drag || drag.section !== section || drag.index === index) return;
    setItems(old => {
      const rows = [...old[section]];
      const [row] = rows.splice(drag.index, 1);
      rows.splice(index, 0, row);
      return { ...old, [section]: rows.map((item, order) => section === 'banners' ? { ...item, order } : active(section, item) ? { ...item, homeOrder: order } : item) };
    });
    setDrag(null); setNotice('');
  };
  const publish = async () => {
    if (saving || error || !window.confirm('确定发布首页配置？三块内容的顺序和上下线会一起更新。')) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await apiRequest('/api/admin/home', { method: 'PUT', body: {
        banners: items.banners.map(row => ({ id: row.id, on: row.on !== false })),
        templates: items.templates.filter(row => active('templates', row) && available('templates', row)).map(row => row.id),
        articles: items.articles.filter(row => active('articles', row) && available('articles', row)).map(row => row.id),
      } });
      setNotice('首页配置已发布'); await load();
    } catch (e: any) { setError(e.message || '发布失败，请重试'); }
    finally { setSaving(false); }
  };
  if (loading) return <div style={{ padding: 24 }}>正在读取首页配置…</div>;
  if (error && sections.every(section => !items[section].length)) return <ErrorState reason={error} onRetry={() => void load()} />;
  return <div style={{ padding: 24, display: 'grid', gap: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><h1 style={{ margin: 0, fontSize: 24 }}>首页配置</h1><Button onClick={() => void load()}>刷新</Button></div>
    {error && <div role="alert" style={{ color: '#c2352b' }}>{error}</div>}{notice && <div role="status">{notice}</div>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
      {sections.map(section => <section key={section} style={{ background: '#fff', border: '1px solid #e8e8e8', padding: 20, minWidth: 0 }}>
        <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>{labels[section]}</h2><div style={muted}>拖动排序 · 点击上下线</div>
        {items[section].length ? items[section].map((row, index) => <div key={row.id} draggable onDragStart={() => setDrag({ section, index })} onDragOver={e => e.preventDefault()} onDrop={() => drop(section, index)} onDragEnd={() => setDrag(null)} style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #e8e8e8', padding: '14px 0' }}>
          <span aria-label="拖动排序" style={{ cursor: 'grab', color: '#6e6e6e' }}>⋮⋮</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title || row.name || row.id}</div><div style={muted}>{section === 'articles' ? (row.status === 'published' ? '文章 · 已发布' : '文章 · 草稿') : section === 'templates' ? (row.status === 'on_sale' ? '在售' : '未在售') : (row.on === false ? '未上线' : '上线')}</div></div>
          <Can perm="edit_content"><button type="button" aria-label={`${active(section, row) ? '下线' : '上线'}${row.title || row.name || row.id}`} disabled={!available(section, row)} onClick={() => toggle(section, row.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#111' }}>{active(section, row) ? '下线' : '上线'}</button></Can>
        </div>) : <EmptyState text="暂无可配置内容" />}
      </section>)}
    </div>
    <div style={muted}>四个能力入口和“继续上次那条”是固定的；手围由程序按用户设置计算。</div>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}><Button onClick={() => setPreview(true)}>预览首页</Button><Can perm="edit_content"><Button variant="primary" disabled={saving || !!error} onClick={() => void publish()}>{saving ? '发布中…' : '发布'}</Button></Can></div>
    {preview && <div role="dialog" aria-modal="true" aria-label="首页预览" style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={() => setPreview(false)}>
      <div style={{ width: 390, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#fff', padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>首页预览</strong><Button onClick={() => setPreview(false)}>关闭</Button></div>
        {sections.map(section => <div key={section} style={{ marginTop: 24 }}><h3>{labels[section]}</h3>{shown[section].length ? shown[section].map(row => <div key={row.id} style={{ padding: '12px 0', borderTop: '1px solid #e8e8e8' }}>{row.title || row.name || row.id}</div>) : <div style={muted}>暂无内容</div>}</div>)}
      </div>
    </div>}
  </div>;
};
export default HomePage;
