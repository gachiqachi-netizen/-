import React, { useState } from 'react';
import { apiRequest } from '../../api';

export type Cover = { lg: string; md: string; sm: string };
const sizes = { lg: 1080, md: 540, sm: 240 } as const;

export default function TemplateCover({ cover, onChange }: { cover?: Cover | ''; onChange: (cover: Cover | '') => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file?: File) => {
    if (!file) return;
    setError(''); setBusy(true);
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('只支持 PNG 或 JPG 图片');
      const source = await createImageBitmap(file);
      try {
        if (Math.min(source.width, source.height) < 240) throw new Error('图片短边至少 240 像素');
        const side = Math.min(source.width, source.height);
        const images: Record<string, { filename: string; contentType: string; width: number; height: number; data: string }> = {};
        for (const [key, size] of Object.entries(sizes)) {
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('浏览器无法处理图片');
          context.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, size, size);
          images[key] = { filename: `${key}.jpg`, contentType: 'image/jpeg', width: size, height: size,
            data: canvas.toDataURL('image/jpeg', 0.82).split(',')[1] };
        }
        const result = await apiRequest<{ cover: Cover }>('/api/admin/templates/cover', { method: 'POST', body: { images } });
        onChange(result.cover);
      } finally { source.close(); }
    } catch (err: any) { setError(err.message || '上传失败'); }
    finally { setBusy(false); }
  };
  return <div className="zy-card tpl-section">
    <div className="tpl-sec-head"><h3>封面图</h3></div>
    <p>建议 1:1，主体居中；非正方形会居中裁切。只放你们自己拍或有授权的图，不要用明星、他人照片或品牌标志。</p>
    {cover && <img src={cover.md} alt="模板封面预览" style={{ width: 240, height: 240, objectFit: 'cover', display: 'block', margin: '12px 0' }} />}
    <label className="zy-btn zy-btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
      {busy ? '上传中…' : cover ? '替换封面' : '上传封面'}
      <input hidden type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
    </label>
    {cover && <button type="button" className="zy-btn zy-btn-secondary" onClick={() => onChange('')}>删除封面</button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
