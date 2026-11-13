import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Copy, Trash2, Save, Sparkles, RefreshCw } from 'lucide-react';
import { apiRequest, fenToYuan } from '../api';
import { BraceletRingPreview } from './BraceletRingPreview';

interface TemplatesWorkbenchProps {
  templates: any[];
  beads: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const TemplatesWorkbenchView: React.FC<TemplatesWorkbenchProps> = ({
  templates,
  beads,
  onRefresh,
  notify,
}) => {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id || '');
  const [form, setForm] = useState<any | null>(null);
  const [previewWrist, setPreviewWrist] = useState<number>(15);
  const [previewExpanded, setPreviewExpanded] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const beadOptions = useMemo(() => beads.filter((b) => (b.type || 'bead') !== 'packaging'), [beads]);

  useEffect(() => {
    if (!selectedId && templates.length > 0 && !form?._isNew) {
      setSelectedId(templates[0].id);
    }
  }, [templates, selectedId, form]);

  useEffect(() => {
    if (!selectedId || selectedId === '__new__') return;
    const found = templates.find((t) => t.id === selectedId);
    if (found) {
      const recipe = found.recipe || {};
      setForm({
        ...found,
        _isNew: false,
        status: found.status || 'on_sale',
        wrist: Number(found.wrist || 15),
        price: Number(found.price || 0),
        fixedCount: recipe.fixed ? Number(recipe.fixed) : '',
        specialText: Array.isArray(recipe.special) ? recipe.special.join(', ') : '',
        patternText: Array.isArray(recipe.pattern)
          ? recipe.pattern.join(', ')
          : (found.beads || []).map((b: any) => b.id).join(', '),
        tailText: Array.isArray(recipe.tail) ? recipe.tail.join(', ') : '',
        tagsText: (found.tags || []).join(', '),
      });
      setPreviewWrist(Number(found.wrist || 15));
      setPreviewExpanded(found.expandedPreview || null);
    }
  }, [selectedId, templates]);

  const parseCsv = (str: string) =>
    String(str || '')
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const buildRecipeObject = (f: any) => {
    const rec: any = {
      special: parseCsv(f.specialText),
      pattern: parseCsv(f.patternText),
      tail: parseCsv(f.tailText),
    };
    const fixedNum = Number(f.fixedCount || 0);
    if (fixedNum > 0) rec.fixed = fixedNum;
    return rec;
  };

  const triggerExpandPreview = async (wristVal: number, currentForm = form) => {
    if (!currentForm) return;
    setPreviewWrist(wristVal);
    try {
      const recipe = buildRecipeObject(currentForm);
      const res = await apiRequest('/api/admin/templates/expand', {
        method: 'POST',
        body: { id: currentForm.id || 'preview', wrist: wristVal, recipe },
      });
      setPreviewExpanded(res);
    } catch (err: any) {
      notify(err.message || '展开预览计算失败', 'error');
    }
  };

  const handleCreateNew = () => {
    const defaultBeadId = beadOptions[0]?.id || 'zishuijing_8';
    const nextForm = {
      _isNew: true,
      id: '',
      name: '新东方美学手串模板',
      sub: '多手围动态配方 · 自然温润',
      desc: '支持 13cm–19cm 手围自动按循环花型排珠并计算 BOM 物料清单',
      meaning: '温润平和，日常百搭',
      wrist: 15,
      price: 199,
      status: 'on_sale',
      fixedCount: '',
      specialText: '',
      patternText: `${defaultBeadId}, ${defaultBeadId}`,
      tailText: '',
      tagsText: '精选同款, 动态手围',
    };
    setSelectedId('__new__');
    setForm(nextForm);
    triggerExpandPreview(15, nextForm);
  };

  const appendBeadToField = (field: 'specialText' | 'patternText' | 'tailText', beadId: string) => {
    if (!form || !beadId) return;
    const current = parseCsv(form[field]);
    const updated = { ...form, [field]: [...current, beadId].join(', ') };
    setForm(updated);
    triggerExpandPreview(previewWrist, updated);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const recipe = buildRecipeObject(form);
      const payload: any = {
        name: form.name,
        sub: form.sub || '',
        desc: form.desc || '',
        meaning: form.meaning || '',
        wrist: Number(form.wrist || 15),
        price: Number(form.price || 0),
        status: form.status || 'on_sale',
        tags: String(form.tagsText || '')
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean),
        recipe,
      };
      if (form._isNew) {
        if (form.id) payload.id = form.id;
        const created = await apiRequest('/api/admin/templates', { method: 'POST', body: payload });
        notify('新模板已创建并展开校验通过');
        await onRefresh();
        setSelectedId(created.id);
      } else {
        await apiRequest(`/api/admin/templates/${encodeURIComponent(form.id)}`, {
          method: 'PUT',
          body: payload,
        });
        notify('模板配方已保存');
        await onRefresh();
      }
    } catch (err: any) {
      notify(err.message || '保存模板失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!form || form._isNew) return;
    try {
      const copied = await apiRequest(`/api/admin/templates/${encodeURIComponent(form.id)}/copy`, {
        method: 'POST',
      });
      notify('已复制模板草稿');
      await onRefresh();
      setSelectedId(copied.id);
    } catch (err: any) {
      notify(err.message || '复制失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!form || form._isNew) return;
    if (!window.confirm(`确认删除模板「${form.name}」吗？`)) return;
    try {
      await apiRequest(`/api/admin/templates/${encodeURIComponent(form.id)}`, { method: 'DELETE' });
      notify('模板已删除');
      setSelectedId('');
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '删除失败', 'error');
    }
  };

  const exp = previewExpanded || form?.expandedPreview || {};
  const expBeads = exp.beads || form?.beads || [];
  const expMaterials = exp.materials || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">手串模板列表 ({templates.length})</h3>
            <p className="text-xs text-zinc-500">点击切换配方或新建同款模板</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> 新建模板
          </button>
        </div>

        <div className="divide-y divide-zinc-100 max-h-[680px] overflow-y-auto">
          {templates.map((t) => {
            const active = selectedId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 transition-colors flex items-center justify-between gap-3 ${
                  active ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-900'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{t.name}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                        active ? 'bg-white/15 text-zinc-200' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {t.id}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 truncate ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {t.sub || t.desc || '支持动态手围展开'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${active ? 'text-white' : 'text-[#c8302e]'}`}>
                    ¥{t.expandedPreview ? fenToYuan(t.expandedPreview.totalFen) : t.price || 0}
                  </div>
                  <div className={`text-[11px] ${active ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    {t.wrist || 15}cm · {(t.beads || []).length}颗
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {form ? (
          <>
            <div className="bg-white rounded-xl border border-zinc-200/90 p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c8302e]" />
                    <h3 className="text-base font-semibold text-zinc-900">
                      动态配方与多手围展开仿真器 ({previewWrist} cm)
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    切换 13cm–19cm 手围实时预览实际排珠顺序、弦长公差与 BOM 用料汇总
                  </p>
                </div>

                <div className="inline-flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                  {[13, 14, 15, 16, 17, 18, 19].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => triggerExpandPreview(w)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        previewWrist === w
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {w}cm
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 items-center">
                <div className="md:col-span-5 flex flex-col items-center justify-center bg-zinc-50/70 rounded-xl p-4 border border-zinc-200/60">
                  <BraceletRingPreview
                    beads={expBeads}
                    wristCm={previewWrist}
                    size={210}
                    subtitle={`${form.name || '模板预览'}`}
                  />
                </div>

                <div className="md:col-span-7 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200/80">
                      <div className="text-[11px] text-zinc-500">展开总颗数</div>
                      <div className="text-lg font-bold text-zinc-900">{exp.count ?? expBeads.length} 颗</div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200/80">
                      <div className="text-[11px] text-zinc-500">累计弦长</div>
                      <div className="text-lg font-bold text-zinc-900">{exp.lengthMm ?? '-'} mm</div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200/80">
                      <div className="text-[11px] text-zinc-500">目标内周长</div>
                      <div className="text-lg font-bold text-zinc-900">{exp.targetMm ?? previewWrist * 10} mm</div>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200/80">
                      <div className="text-[11px] text-zinc-500">合手公差状态</div>
                      <div className="text-sm font-bold text-emerald-700 mt-1">
                        {exp.fitOk === undefined ? '-' : exp.fitOk ? '合适' : '不合适'}
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-200 text-xs font-semibold text-zinc-700 flex items-center justify-between">
                      <span>BOM 物料清单 (按 {previewWrist}cm 展开)</span>
                      <span className="text-zinc-500 font-normal">共 {expMaterials.length} 种珠材</span>
                    </div>
                    <div className="divide-y divide-zinc-100 max-h-36 overflow-y-auto text-xs">
                      {expMaterials.map((m: any) => (
                        <div key={m.id} className="px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-zinc-300 inline-block"
                              style={{ background: m.color || '#64748b' }}
                            />
                            <span className="font-medium text-zinc-900">{m.name}</span>
                            <span className="text-zinc-400 font-mono">({m.sizeMm}mm)</span>
                          </div>
                          <div className="font-semibold text-zinc-800">
                            × {m.count} 颗 <span className="text-zinc-400 font-normal ml-1">¥{fenToYuan(m.subtotalFen)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-zinc-600 mb-1.5">
                      穿珠序号队列 (#1 → #{expBeads.length})：
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-zinc-50 rounded-lg border border-zinc-200/80">
                      {expBeads.map((b: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-zinc-200 text-[11px] text-zinc-700"
                        >
                          <span className="font-mono text-zinc-400">#{b.index || idx + 1}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ background: b.color || '#64748b' }}
                          />
                          <span>{b.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSaveTemplate}
              className="bg-white rounded-xl border border-zinc-200/90 p-6 shadow-xs space-y-5"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {form._isNew ? '新建模板配置' : `编辑模板 · ${form.name}`}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    配置主珠（special）、循环花型（pattern）、收尾隔珠（tail）或固定颗数（fixed）
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!form._isNew && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <Copy className="w-3.5 h-3.5" /> 复制副本
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 删除
                      </button>
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? '保存中...' : '保存模板配方'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">模板名称 *</label>
                  <input
                    required
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">基准手围 (cm)</label>
                  <input
                    type="number"
                    value={form.wrist || 15}
                    onChange={(e) => setForm({ ...form, wrist: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">一口价 / 指导价 (¥)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.price || 0}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">状态</label>
                  <select
                    value={form.status || 'on_sale'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  >
                    <option value="on_sale">上架中</option>
                    <option value="draft">草稿</option>
                    <option value="off_sale">已下架</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    固定总颗数 (fixed，如 108 颗；留空按手围动态伸缩)
                  </label>
                  <input
                    type="number"
                    placeholder="动态按手围计算"
                    value={form.fixedCount ?? ''}
                    onChange={(e) => {
                      const next = { ...form, fixedCount: e.target.value };
                      setForm(next);
                      triggerExpandPreview(previewWrist, next);
                    }}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">标签 (逗号分隔)</label>
                  <input
                    value={form.tagsText || ''}
                    onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900">
                    结构化排珠配方 (`recipe`: `special` 开头主珠 + `pattern` 循环花型 + `tail` 收尾珠)
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerExpandPreview(previewWrist, form)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#c8302e] hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 重新计算展开预览
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500">快捷追加珠材至循环花型：</span>
                  {beadOptions.slice(0, 8).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => appendBeadToField('patternText', b.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-700 cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ background: b.color || '#64748b' }}
                      />
                      <span>{b.name}</span>
                      <span className="font-mono text-[10px] text-zinc-400">+{b.id}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      1. 开头主珠 / 顶珠 (`special`)
                    </label>
                    <input
                      value={form.specialText || ''}
                      onChange={(e) => setForm({ ...form, specialText: e.target.value })}
                      onBlur={() => triggerExpandPreview(previewWrist, form)}
                      placeholder="如: jinbo_10, jin_spacer"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      2. 循环主体花型 (`pattern` *)
                    </label>
                    <input
                      required
                      value={form.patternText || ''}
                      onChange={(e) => setForm({ ...form, patternText: e.target.value })}
                      onBlur={() => triggerExpandPreview(previewWrist, form)}
                      placeholder="如: zishuijing_8, bai_8"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      3. 收尾珠 / 隔片 (`tail`)
                    </label>
                    <input
                      value={form.tailText || ''}
                      onChange={(e) => setForm({ ...form, tailText: e.target.value })}
                      onBlur={() => triggerExpandPreview(previewWrist, form)}
                      placeholder="如: jin_spacer"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-zinc-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">副标题 / 亮点</label>
                  <input
                    value={form.sub || ''}
                    onChange={(e) => setForm({ ...form, sub: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">设计寓意说明</label>
                  <input
                    value={form.meaning || ''}
                    onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-sm text-zinc-400">
            请从左侧选择一个手串模板或点击「新建模板」
          </div>
        )}
      </div>
    </div>
  );
};
