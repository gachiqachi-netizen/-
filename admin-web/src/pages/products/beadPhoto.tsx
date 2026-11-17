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
      if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('只支持 PNG 或 JPG 图片');
      const source = await createImageBitmap(file);
      try {
        if (source.width !== source.height || source.width < 800) throw new Error('图片必须是至少 800×800 的正方形');
        const original = document.createElement('canvas');
        original.width = source.width; original.height = source.height;
        const context = original.getContext('2d');
        if (!context) throw new Error('浏览器无法检查图片');
        context.drawImage(source, 0, 0);
        const corners = [[0, 0], [source.width - 1, 0], [0, source.height - 1], [source.width - 1, source.height - 1]];
        for (const [x, y] of corners) {
          const [r, g, b, a] = context.getImageData(x, y, 1, 1).data;
          if (a >= 240 && (r < 240 || g < 240 || b < 240)) throw new Error('四角须透明或接近白色');
        }
        const images: Record<string, { filename: string; contentType: string; width: number; height: number; data: string }> = {};
        for (const [field, size] of [['photo', 480], ['photoMd', 240], ['photoSm', 96]] as const) {
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          canvas.getContext('2d')?.drawImage(source, 0, 0, size, size);
          images[field] = { filename: `${field}.png`, contentType: 'image/png', width: size, height: size,
            data: canvas.toDataURL('image/png').split(',')[1] };
        }
        const result = await apiRequest<{ photo: string }>(`/api/admin/beads/${encodeURIComponent(bead.id)}/photo`, {
          method: 'POST', body: { images },
        });
        setPhoto(`data:image/png;base64,${images.photo.data}`); onUploaded(result.photo);
      } finally { source.close(); }
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
      <div><div className="zy-field-label">这款照片 · 16 颗预览</div><Bracelet sequence={sequence} tier="m" /></div>
      {compare && <div><div className="zy-field-label">其他料照片 · 光线对比</div><Bracelet sequence={other} tier="m" /></div>}
    </div>}
  </div>;
}
