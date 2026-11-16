import React, { useState } from 'react';
import { apiRequest } from '../../api';
import Bracelet from '../../bracelet/Bracelet';

type Bead = { id: string; name: string; mm?: number; photo?: string | null; c?: Array<string | null> | null };

export default function BeadPhoto({ bead, compare, onUploaded }: {
  bead: Bead; compare?: Bead; onUploaded: (photo: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(bead.photo || '');
  const upload = async (file?: File) => {
    if (!file || !bead.id) return;
    setBusy(true); setError('');
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
        reader.onerror = () => reject(new Error('读取图片失败'));
        reader.readAsDataURL(file);
      });
      const result = await apiRequest<{ photo: string }>(`/api/admin/beads/${encodeURIComponent(bead.id)}/photo`, {
        method: 'POST', body: { filename: file.name, contentType: file.type, data },
      });
      setPhoto(result.photo); onUploaded(result.photo);
    } catch (err: any) { setError(err.message || '上传失败'); }
    finally { setBusy(false); }
  };
  const primary = { ...bead, photo };
  const sequence = Array.from({ length: 16 }, () => primary);
  const other = compare ? Array.from({ length: 16 }, () => compare) : [];
  return <div style={{ gridColumn: '1 / -1' }}>
    <div className="zy-field-label">珠子照片 · 同名所有尺寸共用</div>
    <p className="zy-field-hint">挑一颗品相有代表性的珠子俯拍；白色或单色背景。用 AI 去杂物、居中，让珠子占满画面，光从左上方来，统一亮度；导出白底或透明底正方形 PNG/JPG，至少 800×800。</p>
    {bead.id ? <label className="zy-btn zy-btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
      {busy ? '上传中…' : '上传照片'}<input type="file" accept="image/png,image/jpeg" disabled={busy} hidden onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
    </label> : <p className="zy-field-hint">先保存商品，再上传照片。</p>}
    {error && <p className="zy-field-error">{error}</p>}
    {photo && <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16 }}>
      <div><div className="zy-field-label">这款照片 · 16 颗预览</div><Bracelet sequence={sequence} size={210} /></div>
      {compare && <div><div className="zy-field-label">其他料照片 · 光线对比</div><Bracelet sequence={other} size={210} /></div>}
    </div>}
  </div>;
}
