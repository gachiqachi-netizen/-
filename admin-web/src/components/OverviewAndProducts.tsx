import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
} from 'lucide-react';
import { apiRequest, labelOf, uploadImageFile } from '../api';

export const StatusBadge: React.FC<{
  tone?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'zinc' | 'crimson';
  children: React.ReactNode;
}> = ({ tone = 'zinc', children }) => {
  const styles: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    crimson: 'bg-[#c8302e]/10 text-[#c8302e] border-[#c8302e]/25',
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
        styles[tone] || styles.zinc
      }`}
    >
      {children}
    </span>
  );
};

export function statusTone(status?: string): 'emerald' | 'amber' | 'rose' | 'indigo' | 'zinc' | 'crimson' {
  if (!status) return 'zinc';
  if (['on_sale', 'confirmed', 'paid', 'ready_to_ship', 'shipped', 'completed', 'delivered', 'published', 'passed', 'approved'].includes(status)) {
    return 'emerald';
  }
  if (['pending_confirmation', 'unpaid', 'unfulfilled', 'producing', 'in_transit', 'requested', 'reviewing', 'paying', 'pending'].includes(status)) {
    return 'amber';
  }
  if (['cancelled', 'rejected', 'failed', 'off_sale'].includes(status)) {
    return 'rose';
  }
  return 'zinc';
}

interface ProductsViewProps {
  beads: any[];
  kbMaterials: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  beads,
  kbMaterials,
  onRefresh,
  notify,
}) => {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return beads.filter((b) => {
      if (typeFilter && (b.type || 'bead') !== typeFilter) return false;
      if (statusFilter && (b.status || 'on_sale') !== statusFilter) return false;
      if (q.trim()) {
        const kw = q.trim().toLowerCase();
        const hay = `${b.id || ''} ${b.name || ''} ${b.sub || ''} ${b.meaning || ''} ${(b.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [beads, q, typeFilter, statusFilter]);

  const openEditor = (item?: any) => {
    if (!item) {
      setEditing({
        _isNew: true,
        id: '',
        name: '',
        type: 'bead',
        status: 'on_sale',
        mat: kbMaterials[0]?.id || 'amethyst',
        sizeMm: 8,
        price: 12,
        stock: 99,
        sortOrder: 0,
        color: '#7c5295',
        hi: '#d7bde2',
        sub: '',
        meaning: '',
        tip: '',
        tagsText: '天然矿石, 手工严选',
        images: [],
      });
    } else {
      setEditing({
        ...item,
        _isNew: false,
        type: item.type || 'bead',
        status: item.status || 'on_sale',
        sizeMm: item.sizeMm ?? 8,
        price: item.price ?? 0,
        stock: item.stock ?? 99,
        sortOrder: item.sortOrder ?? 0,
        color: item.color || '#7c5295',
        hi: item.hi || '#d7bde2',
        tagsText: (item.tags || []).join(', '),
        images: Array.isArray(item.images) ? [...item.images] : item.imageUrl ? [item.imageUrl] : [],
      });
    }
  };

  const selectedKb = useMemo(() => {
    if (!editing?.mat) return null;
    return kbMaterials.find((m) => m.id === editing.mat) || null;
  }, [editing?.mat, kbMaterials]);

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        sizeMm: Number(editing.sizeMm || 8),
        price: Number(editing.price || 0),
        stock: Number(editing.stock ?? 0),
        sortOrder: Number(editing.sortOrder ?? 0),
        tags: String(editing.tagsText || '')
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean),
        imageUrl: editing.images?.[0] || editing.imageUrl || '',
      };
      delete payload._isNew;
      delete payload.tagsText;

      if (editing._isNew) {
        if (!payload.id) delete payload.id;
        await apiRequest('/api/admin/beads', { method: 'POST', body: payload });
        notify('商品/珠材已创建');
      } else {
        await apiRequest(`/api/admin/beads/${encodeURIComponent(editing.id)}`, {
          method: 'PUT',
          body: payload,
        });
        notify('商品/珠材已保存更新');
      }
      setEditing(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (id: string) => {
    try {
      await apiRequest(`/api/admin/beads/${encodeURIComponent(id)}/copy`, { method: 'POST' });
      notify('已复制为草稿副本');
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '复制失败', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确认删除或归档「${name} (${id})」吗？若已被订单引用将自动安全归档。`)) return;
    try {
      const res = await apiRequest(`/api/admin/beads/${encodeURIComponent(id)}`, { method: 'DELETE' });
      notify(res.archived ? '该商品存在历史引用，已安全归档' : '商品已删除');
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '操作失败', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-zinc-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索商品名称、ID、寓意或标签..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700"
          >
            <option value="">全部品类 ({beads.length})</option>
            <option value="bead">珠子 (Bead)</option>
            <option value="spacer">隔片 (Spacer)</option>
            <option value="pendant">吊坠 (Charm)</option>
            <option value="cord">线材 (Cord)</option>
            <option value="packaging">包装 (Pack)</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700"
          >
            <option value="">全部状态</option>
            <option value="on_sale">上架中</option>
            <option value="draft">草稿</option>
            <option value="off_sale">已下架</option>
            <option value="archived">已归档</option>
          </select>
        </div>

        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 新建商品 / 珠材
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">珠材预览 / 名称</th>
                <th className="py-3 px-3">品类</th>
                <th className="py-3 px-3">KB 材质库关联</th>
                <th className="py-3 px-3">规格 (mm)</th>
                <th className="py-3 px-3">单颗售价</th>
                <th className="py-3 px-3">库存</th>
                <th className="py-3 px-3">状态</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {filtered.map((b) => {
                const stock = Number(b.stock ?? 99);
                return (
                  <tr key={b.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-full shrink-0 border border-white shadow-sm inline-block"
                          style={{
                            background: `radial-gradient(circle at 32% 30%, ${b.hi || '#fff'}, ${
                              b.color || '#64748b'
                            } 68%, #09090b 100%)`,
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900 flex items-center gap-1.5">
                            <span>{b.name}</span>
                            <span className="font-mono text-[11px] text-zinc-400">{b.id}</span>
                          </div>
                          <div className="text-xs text-zinc-500 truncate max-w-xs">
                            {b.sub || b.meaning || '暂无描述'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-zinc-600">
                      {labelOf('productTypes', b.type || 'bead')}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-zinc-600">{b.mat || '-'}</td>
                    <td className="py-3 px-3 text-xs font-medium text-zinc-700">{b.sizeMm || 8} mm</td>
                    <td className="py-3 px-3 font-semibold text-zinc-900">¥{Number(b.price || 0).toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-medium ${
                          stock <= 10 ? 'text-rose-600 font-semibold' : 'text-zinc-700'
                        }`}
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge tone={statusTone(b.status || 'on_sale')}>
                        {labelOf('productStatuses', b.status || 'on_sale')}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditor(b)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(b.id)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                          title="复制副本"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.name)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          title="删除/归档"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-zinc-400">
                    未找到符合筛选条件的商品/珠材
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Editor Drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-zinc-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {editing._isNew ? '新建商品 / 珠材 SKU' : `编辑商品 · ${editing.name}`}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  配置珠材规格、3D 渲染光泽色值与知识库（KB）合规关联
                </p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveProduct} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">商品名称 *</label>
                  <input
                    required
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                    placeholder="如：乌拉圭紫水晶"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    商品 ID {editing._isNew && '(可留空自动生成)'}
                  </label>
                  <input
                    disabled={!editing._isNew}
                    value={editing.id}
                    onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-lg disabled:bg-zinc-100"
                    placeholder="如：zishuijing_8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">品类类型</label>
                  <select
                    value={editing.type}
                    onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  >
                    <option value="bead">珠子 (Bead)</option>
                    <option value="spacer">隔片 (Spacer)</option>
                    <option value="pendant">吊坠 (Charm)</option>
                    <option value="cord">线材 (Cord)</option>
                    <option value="packaging">包装 (Pack)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">销售状态</label>
                  <select
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  >
                    <option value="on_sale">上架中</option>
                    <option value="draft">草稿</option>
                    <option value="off_sale">已下架</option>
                    <option value="archived">已归档</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">关联 KB 材质</label>
                  <select
                    value={editing.mat}
                    onChange={(e) => setEditing({ ...editing, mat: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  >
                    <option value="">-- 请选择材质 --</option>
                    {kbMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedKb && (
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 text-xs space-y-1">
                  <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    KB 知识库材质档案：{selectedKb.name}（莫氏硬度 {selectedKb.mohs || '-'}）
                  </div>
                  <div className="text-zinc-600">保养贴士：{selectedKb.care || '避免磕碰与强酸强碱接触'}</div>
                  {selectedKb.safety && (
                    <div className="text-rose-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 安全红线提示：{selectedKb.safety}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">珠径 (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editing.sizeMm}
                    onChange={(e) => setEditing({ ...editing, sizeMm: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">单价 (¥)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">库存数量</label>
                  <input
                    type="number"
                    value={editing.stock}
                    onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">排序权重</label>
                  <input
                    type="number"
                    value={editing.sortOrder}
                    onChange={(e) => setEditing({ ...editing, sortOrder: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">珠体主色 (Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editing.color || '#7c5295'}
                      onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                      className="w-9 h-9 rounded border border-zinc-200 cursor-pointer"
                    />
                    <input
                      value={editing.color || ''}
                      onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-zinc-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">高光反射色 (Highlight)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editing.hi || '#d7bde2'}
                      onChange={(e) => setEditing({ ...editing, hi: e.target.value })}
                      className="w-9 h-9 rounded border border-zinc-200 cursor-pointer"
                    />
                    <input
                      value={editing.hi || ''}
                      onChange={(e) => setEditing({ ...editing, hi: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-zinc-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">副标题 / 简述</label>
                <input
                  value={editing.sub || ''}
                  onChange={(e) => setEditing({ ...editing, sub: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  placeholder="如：晶体通透 · 温润紫光"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">文化寓意说明 (禁止医疗功效用语)</label>
                <textarea
                  rows={2}
                  value={editing.meaning || ''}
                  onChange={(e) => setEditing({ ...editing, meaning: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  placeholder="输入传统吉祥文化寓意或审美佩戴建议"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">标签 (逗号分隔)</label>
                <input
                  value={editing.tagsText || ''}
                  onChange={(e) => setEditing({ ...editing, tagsText: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                />
              </div>

              {/* Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-700">商品实拍图集</label>
                  <label className="inline-flex items-center gap-1 text-xs font-medium text-[#c8302e] cursor-pointer hover:underline">
                    <Upload className="w-3.5 h-3.5" /> 上传本地图片
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImageFile(file);
                          setEditing((prev: any) => ({
                            ...prev,
                            images: [...(prev.images || []), url],
                          }));
                          notify('图片上传成功');
                        } catch (err: any) {
                          notify(err.message || '上传失败', 'error');
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editing.images || []).map((url: string, idx: number) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg border border-zinc-200 overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            images: editing.images.filter((_: any, i: number) => i !== idx),
                          })
                        }
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存商品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
