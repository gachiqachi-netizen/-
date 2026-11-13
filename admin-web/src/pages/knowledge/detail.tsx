import React from 'react';
import { fmtTime } from '../../api';
import { Button } from '../../ui/Button';
import { Drawer } from '../../ui/Drawer';
import { ErrorState } from '../../ui/ErrorState';

type Bead = {
  name?: string; std?: string; category?: string; aliases?: string[]; summary?: string;
  look?: string; identify?: string[]; confusables?: { name?: string; how?: string }[];
  meaning?: { tags?: string[]; text?: string }; care?: string; safety?: { note?: string };
  sources?: string[]; confidence?: Record<string, string>;
};
export type KbDetail = { data: Bead; version: number; products: { id: string; name: string; mm?: number }[];
  history: { version: number; savedBy?: string; savedAt?: string; note?: string }[] };
const confidence: Record<string, string> = { high: '高', mid: '中', low: '低' };
const muted: React.CSSProperties = { color: 'var(--text-aux)', fontSize: 12 };

function Section({ title, value, level, visible }: { title: string; value: React.ReactNode; level?: string; visible: boolean }) {
  return <section style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{title}</strong>
      <span style={muted}>把握 {confidence[level || ''] || '—'} · {visible ? '用户能看到' : '不给用户看'}</span></div>
    <div style={{ lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-wrap' }}>{value || '—'}</div>
  </section>;
}

export function KnowledgeDetail({ item, loading, error, canEdit, onClose, onRetry }: {
  item: KbDetail | null; loading: boolean; error: string; canEdit: boolean; onClose: () => void; onRetry: () => void;
}) {
  const data = item?.data;
  const low = data?.confidence?.meaning === 'low';
  return <Drawer title={data?.name || '品种资料'} subtitle={item ? `第 ${item.version} 版` : undefined}
    onClose={onClose} footer={canEdit ? <Button disabled reason="编辑功能由 KD2 接入">编辑</Button> : undefined}>
    {loading ? <div>正在读取资料…</div> : error ? <ErrorState reason={error} onRetry={onRetry} /> : data && item ?
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(180px, 1fr)', gap: 20 }}>
        <div>
          <Section title="一句话" value={data.summary} visible />
          <Section title="别名与商家叫法" value={(data.aliases || []).join('、')} visible />
          <Section title="外观" value={data.look} level={data.confidence?.look} visible />
          <Section title="怎么认" value={(data.identify || []).join('；')} level={data.confidence?.identify} visible />
          <Section title="容易混淆" value={(data.confusables || []).map(row => `${row.name || ''}：${row.how || ''}`).join('；')} level={data.confidence?.confusables} visible />
          <Section title="寓意" value={<>{(data.meaning?.tags || []).join('、')}<div>{data.meaning?.text}</div></>}
            level={data.confidence?.meaning} visible={!low} />
          <Section title="佩戴保养" value={data.care} visible />
          <Section title="安全提示" value={data.safety?.note} visible />
          <Section title="来源" value={(data.sources || []).join('；')} visible={false} />
        </div>
        <aside>
          <div className="zy-card" style={{ padding: 16, marginBottom: 16 }}><strong>关联的在售商品</strong>
            {item.products.length ? item.products.map(product => <div key={product.id} style={{ marginTop: 10 }}>
              {product.name} {product.mm ? `· ${product.mm}mm` : ''}</div>) : <div style={muted}>暂无关联在售商品</div>}
          </div>
          <div className="zy-card" style={{ padding: 16 }}><strong>改动记录</strong>
            {item.history.length ? item.history.map(entry => <div key={entry.version} style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              <strong>第 {entry.version} 版</strong><div style={muted}>{entry.savedBy || '后台'} · {fmtTime(entry.savedAt)}</div>
              {entry.note && <div>{entry.note}</div>}
            </div>) : <div style={muted}>暂无改动记录</div>}
          </div>
        </aside>
      </div> : null}
  </Drawer>;
}
