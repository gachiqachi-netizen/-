import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import { ErrorState } from '../ui/ErrorState';
import { KnowledgeList, type KbFilter, type KbList, type KbRow } from './knowledge/list';
import { KnowledgeDetail, type KbDetail } from './knowledge/detail';

const empty: KbList = { items: [], totalKinds: 0, lowConfidence: 0, spacer: 0, recent7d: 0 };
export default function KnowledgePage() {
  const [data, setData] = useState<KbList>(empty), [query, setQuery] = useState('');
  const [category, setCategory] = useState(''), [meaningConfidence, setMeaningConfidence] = useState('');
  const [remoteRows, setRemoteRows] = useState<KbRow[] | null>(null);
  const [quick, setQuick] = useState<KbFilter>('all'), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [selected, setSelected] = useState<KbRow | null>(null), [detail, setDetail] = useState<KbDetail | null>(null);
  const [detailError, setDetailError] = useState(''), [detailLoading, setDetailLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  async function load() {
    setLoading(true); setError('');
    try {
      const result = await apiRequest<KbList>('/api/admin/kb');
      setData(result); setRemoteRows(null);
    } catch (cause) { setError((cause as Error).message || '知识库读取失败'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void load();
    void apiRequest<{ permissions: string[] }>('/api/admin/me')
      .then(me => setCanEdit((me.permissions || []).includes('edit_kb')))
      .catch(() => setCanEdit(false));
  }, []);
  const rows = useMemo(() => {
    return (remoteRows || data.items).filter(row => (quick !== 'hidden' || row.meaningConfidence === 'low' || row.category === 'fitting')
      && (quick !== 'recent' || !!row.updatedAt && Date.parse(row.updatedAt) >= Date.now() - 7 * 86400000));
  }, [data, remoteRows, quick]);
  useEffect(() => {
    if (!query && !category && !meaningConfidence) { setRemoteRows(null); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim(), category, meaningConfidence });
        const result = await apiRequest<KbList>('/api/admin/kb?' + params.toString());
        if (active) setRemoteRows(result.items);
      } catch (cause) { if (active) setError((cause as Error).message || '筛选失败'); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, category, meaningConfidence]);
  async function open(row: KbRow) {
    setSelected(row); setDetail(null); setDetailError(''); setDetailLoading(true);
    try { setDetail(await apiRequest<KbDetail>('/api/admin/kb/' + encodeURIComponent(row.id))); }
    catch (cause) { setDetailError((cause as Error).message || '资料读取失败'); }
    finally { setDetailLoading(false); }
  }
  function resetQuick(value: KbFilter) { setQuick(value); setQuery(''); setCategory(''); setMeaningConfidence(''); void load(); }
  return <>
    {loading ? <div className="zy-card" style={{ padding: 24 }}>正在读取知识库…</div> : error ? <ErrorState reason={error} onRetry={load} /> :
      <KnowledgeList data={data} rows={rows} query={query} category={category} meaningConfidence={meaningConfidence}
        quick={quick} onQuery={setQuery} onCategory={setCategory} onConfidence={setMeaningConfidence}
        onQuick={resetQuick} onOpen={open} />}
    {selected && <KnowledgeDetail item={detail} loading={detailLoading} error={detailError} canEdit={canEdit}
      onClose={() => setSelected(null)} onRetry={() => void open(selected)} />}
  </>;
}
