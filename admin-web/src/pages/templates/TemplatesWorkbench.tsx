import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Copy, Trash2, GripVertical } from 'lucide-react';
import { apiRequest, fenToYuan } from '../../api';
import { Button } from '../../ui/Button';
import { Skeleton } from '../../ui/Skeleton';
import { ErrorState } from '../../ui/ErrorState';
import { EmptyState } from '../../ui/EmptyState';
import './templates.css';

interface TemplatesWorkbenchProps {
  templates: any[];
  beads: any[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

interface RecipeForm {
  _isNew: boolean;
  id: string;
  name: string;
  sub: string;
  desc: string;
  wrist: number;
  price: number;
  status: string;
  fixed: string;
  special: string[];
  pattern: string[];
  tail: string[];
  tagsText: string;
  meaningKeywords: string[];
  meaningLegacy: string;
}

const PREVIEW_WRISTS: number[] = [13, 14, 15, 16, 17, 18, 19];
const ROW_META: Array<{ key: 'special' | 'pattern' | 'tail'; label: string; hint: string }> = [
  { key: 'special', label: '开头主珠', hint: 'special：顶珠、佛头，只穿一轮' },
  { key: 'pattern', label: '循环花型', hint: 'pattern：按手围反复循环的主体' },
  { key: 'tail', label: '收尾珠', hint: 'tail：收尾隔珠、隔片，只穿一轮' },
];

const emptyForm = (defaults: Partial<RecipeForm> = {}): RecipeForm => ({
  _isNew: true,
  id: '',
  name: '',
  sub: '',
  desc: '',
  wrist: 15,
  price: 0,
  status: 'on_sale',
  fixed: '',
  special: [],
  pattern: [],
  tail: [],
  tagsText: '',
  meaningKeywords: [],
  meaningLegacy: '',
  ...defaults,
});

const splitMeaning = (text: string): string[] =>
  String(text || '')
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export const TemplatesWorkbench: React.FC<TemplatesWorkbenchProps> = ({ templates, beads, onRefresh, notify }) => {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id || '');
  const [form, setForm] = useState<RecipeForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [previews, setPreviews] = useState<Array<{ wrist: number; data?: any; error?: string; loading?: boolean }>>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [dragLoc, setDragLoc] = useState<{ key: 'special' | 'pattern' | 'tail'; index: number } | null>(null);
  const expandSeq = useRef(0);
  const kbCache = useRef<Map<string, Promise<any>>>(new Map());

  const beadById = useMemo(() => {
    const m = new Map<string, any>();
    beads.forEach((b) => m.set(b.id, b));
    return m;
  }, [beads]);
  const beadOptions = useMemo(() => beads.filter((b) => (b.type || 'bead') !== 'packaging'), [beads]);

  const recipeOf = (f: RecipeForm) => ({
    special: f.special,
    pattern: f.pattern,
    tail: f.tail,
    fixed: f.fixed ? Number(f.fixed) : undefined,
  });

  // 选中模板 → 填表单
  useEffect(() => {
    if (!selectedId || selectedId === '__new__') return;
    const found = templates.find((t) => t.id === selectedId);
    if (!found) return;
    const recipe = found.recipe || {};
    setForm({
      _isNew: false,
      id: found.id,
      name: found.name || '',
      sub: found.sub || '',
      desc: found.desc || '',
      wrist: Number(found.wrist || 15),
      price: Number(found.price || 0),
      status: found.status || 'on_sale',
      fixed: recipe.fixed ? String(recipe.fixed) : '',
      special: Array.isArray(recipe.special) ? [...recipe.special] : [],
      pattern: Array.isArray(recipe.pattern)
        ? [...recipe.pattern]
        : (found.beads || []).map((b: any) => b.id || b),
      tail: Array.isArray(recipe.tail) ? [...recipe.tail] : [],
      tagsText: (found.tags || []).join(', '),
      // 老的手写寓意句子按词拆开，只在它本来就是知识库关键词时才预勾选
      meaningKeywords: splitMeaning(found.meaning),
      meaningLegacy: String(found.meaning || ''),
    });
  }, [selectedId, templates]);

  // 配方变化 → 13–19cm 分段预览（防抖，全部来自 POST /api/admin/templates/expand）
  const recipeSig = form ? JSON.stringify(recipeOf(form)) : '';
  useEffect(() => {
    if (!form) return;
    const seq = ++expandSeq.current;
    const recipe = recipeOf(form);
    setPreviews(PREVIEW_WRISTS.map((wrist) => ({ wrist, loading: true })));
    const timer = setTimeout(() => {
      if (!recipe.pattern.length) {
        setPreviews(PREVIEW_WRISTS.map((wrist) => ({ wrist, error: '循环花型至少要有一颗珠子' })));
        return;
      }
      Promise.all(
        PREVIEW_WRISTS.map((wrist) =>
          apiRequest<any>('/api/admin/templates/expand', { method: 'POST', body: { recipe, wrist } })
            .then((data) => ({ wrist, data }))
            .catch((err: any) => ({ wrist, error: err.message || '展开失败' }))
        )
      ).then((rows) => {
        if (expandSeq.current === seq) setPreviews(rows);
      });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeSig]);

  // 配方珠子的知识库寓意关键词（只列把握"中"以上的——kb.public 会把把握低整条清空）
  const recipeBeadIds = useMemo(() => {
    if (!form) return [] as string[];
    return [...new Set([...form.special, ...form.pattern, ...form.tail])];
  }, [form]);
  useEffect(() => {
    let alive = true;
    const kbIds = [...new Set(recipeBeadIds.map((id) => beadById.get(id)?.kb).filter(Boolean))] as string[];
    Promise.all(
      kbIds.map((kid) => {
        if (!kbCache.current.has(kid)) {
          kbCache.current.set(
            kid,
            apiRequest<any>(`/api/kb/bead/${kid}`).catch(() => null)
          );
        }
        return kbCache.current.get(kid)!;
      })
    ).then((entries) => {
      if (!alive) return;
      const tags: string[] = [];
      entries.forEach((b) => {
        ((b && b.meaning && b.meaning.tags) || []).forEach((t: string) => {
          if (t && !tags.includes(t)) tags.push(t);
        });
      });
      setKeywords(tags);
    });
    return () => {
      alive = false;
    };
  }, [recipeBeadIds, beadById]);

  const offSaleBeads = useMemo(() => {
    if (!form) return [] as Array<{ id: string; name: string }>;
    return recipeBeadIds
      .filter((id) => beadById.has(id) && beadById.get(id).onSale === false)
      .map((id) => ({ id, name: beadById.get(id).name || id }));
  }, [recipeBeadIds, beadById, form]);

  const updateRow = (key: 'special' | 'pattern' | 'tail', ids: string[]) => {
    if (!form) return;
    setForm({ ...form, [key]: ids });
  };

  const addBead = (key: 'special' | 'pattern' | 'tail', beadId: string) => {
    if (!form || !beadId) return;
    setForm({ ...form, [key]: [...form[key], beadId] });
  };

  const removeBead = (key: 'special' | 'pattern' | 'tail', index: number) => {
    if (!form) return;
    setForm({ ...form, [key]: form[key].filter((_, i) => i !== index) });
  };

  const moveBead = (key: 'special' | 'pattern' | 'tail', from: number, to: number) => {
    if (!form || from === to) return;
    const ids = [...form[key]];
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setForm({ ...form, [key]: ids });
  };

  // 只数真正勾在知识库关键词上的；老句子里拆出来的非关键词不占名额
  const effectivePicks = useMemo(
    () => (form ? form.meaningKeywords.filter((k) => keywords.includes(k)) : []),
    [form, keywords]
  );
  const legacyPicks = useMemo(
    () => (form ? form.meaningKeywords.filter((k) => !keywords.includes(k)) : []),
    [form, keywords]
  );

  const toggleKeyword = (tag: string) => {
    if (!form) return;
    if (form.meaningKeywords.includes(tag)) {
      setForm({ ...form, meaningKeywords: form.meaningKeywords.filter((k) => k !== tag) });
    } else if (effectivePicks.length >= 3) {
      notify('寓意关键词最多选 3 个', 'error');
    } else {
      setForm({ ...form, meaningKeywords: [...form.meaningKeywords, tag] });
    }
  };

  const handleCreateNew = () => {
    setSelectedId('__new__');
    setForm(emptyForm());
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.pattern.length) {
      notify('循环花型至少要有一颗珠子', 'error');
      return;
    }
    setSaving(true);
    try {
      const picked = form.meaningKeywords.filter((k) => keywords.includes(k));
      const payload: any = {
        name: form.name.trim(),
        sub: form.sub || '',
        desc: form.desc || '',
        // 勾了关键词就存勾选的；知识库关键词取不到时不乱清原来的寓意
        meaning: picked.length ? picked.join('、') : keywords.length ? '' : form.meaningLegacy,
        wrist: Number(form.wrist || 15),
        price: Number(form.price || 0),
        status: form.status || 'on_sale',
        tags: form.tagsText
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean),
        recipe: recipeOf(form),
      };
      if (form._isNew) {
        const created = await apiRequest<any>('/api/admin/templates', { method: 'POST', body: payload });
        notify('模板已创建', 'success');
        await onRefresh();
        if (created && created.id) setSelectedId(created.id);
      } else {
        await apiRequest<any>(`/api/admin/templates/${form.id}`, { method: 'PUT', body: payload });
        notify('模板已保存', 'success');
        await onRefresh();
      }
    } catch (err: any) {
      notify(err.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!form || form._isNew) return;
    try {
      await apiRequest<any>(`/api/admin/templates/${form.id}/copy`, { method: 'POST' });
      notify('已复制副本', 'success');
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '复制失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!form || form._isNew) return;
    if (!window.confirm(`确定删除模板「${form.name}」吗？`)) return;
    try {
      await apiRequest<any>(`/api/admin/templates/${form.id}`, { method: 'DELETE' });
      notify('模板已删除', 'success');
      setSelectedId('');
      setForm(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || '删除失败', 'error');
    }
  };

  const renderRecipeRow = (key: 'special' | 'pattern' | 'tail', label: string, hint: string) => {
    if (!form) return null;
    const ids = form[key];
    return (
      <div className="tpl-recipe-row" key={key}>
        <div className="tpl-recipe-head">
          <span className="tpl-recipe-label">{label}</span>
          <span className="tpl-recipe-hint">{hint}</span>
        </div>
        <div
          className="tpl-chip-lane"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragLoc && dragLoc.key === key) moveBead(key, dragLoc.index, ids.length);
            setDragLoc(null);
          }}
        >
          {ids.length === 0 && <span className="tpl-chip-empty">空（可添加珠子）</span>}
          {ids.map((bid, idx) => {
            const bead = beadById.get(bid);
            const offSale = bead && bead.onSale === false;
            return (
              <span
                key={`${bid}-${idx}`}
                className={`tpl-chip${offSale ? ' tpl-chip-off' : ''}`}
                draggable
                onDragStart={() => setDragLoc({ key, index: idx })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragLoc && dragLoc.key === key) moveBead(key, dragLoc.index, idx);
                  setDragLoc(null);
                }}
                title={offSale ? `${bid} 已下架` : bid}
              >
                <GripVertical className="tpl-grip" size={12} />
                <span
                  className="tpl-dot"
                  style={{ background: bead?.color || '#94a3b8' }}
                />
                {bead?.name || bid}
                {offSale && <em className="tpl-off-tag">下架</em>}
                <button
                  type="button"
                  className="tpl-chip-x"
                  aria-label="移除"
                  onClick={() => removeBead(key, idx)}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        <div className="tpl-add-row">
          <select
            className="tpl-add-select"
            value=""
            onChange={(e) => {
              addBead(key, e.target.value);
              e.target.value = '';
            }}
          >
            <option value="" disabled>
              添加珠子…
            </option>
            {beadOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}（{b.id}）
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const allLoading = previews.some((p) => p.loading);
  const warnings = (previews.find((p) => p.data && p.data.warnings && p.data.warnings.length) || {}).data?.warnings;

  return (
    <div className="tpl-page">
      <aside className="tpl-side zy-card">
        <div className="tpl-side-head">
          <h2 className="tpl-title">模板</h2>
          <Button variant="primary" onClick={handleCreateNew}>
            <Plus size={14} /> 新建模板
          </Button>
        </div>
        {templates.length === 0 && <EmptyState text="还没有模板，点右上角新建" />}
        <ul className="tpl-list">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`tpl-item${selectedId === t.id ? ' active' : ''}`}
                onClick={() => setSelectedId(t.id)}
              >
                <span className="tpl-item-name">{t.name}</span>
                <span className="tpl-item-meta">
                  {t.status === 'on_sale' ? '上架中' : t.status === 'draft' ? '草稿' : '已下架'} · 基准{' '}
                  {t.wrist || 15}cm
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="tpl-main">
        {!form ? (
          <div className="zy-card tpl-pick">
            <EmptyState text="从左侧选一个模板，或新建一个" />
          </div>
        ) : (
          <>
            {offSaleBeads.length > 0 && (
              <div className="tpl-banner">
                配方里有已下架的珠子：{offSaleBeads.map((b) => `${b.name}（${b.id}）`).join('、')}
                ，保存不影响，但展开预览和用户端下单都会被拦，请换珠或先上架。
              </div>
            )}

            <section className="zy-card tpl-section">
              <div className="tpl-sec-head">
                <h3>{form._isNew ? '新建模板' : `编辑模板 · ${form.name}`}</h3>
                <div className="tpl-sec-actions">
                  {!form._isNew && (
                    <>
                      <Button variant="secondary" onClick={handleCopy}>
                        <Copy size={13} /> 复制副本
                      </Button>
                      <Button variant="danger" onClick={handleDelete}>
                        <Trash2 size={13} /> 删除
                      </Button>
                    </>
                  )}
                  <Button variant="primary" disabled={saving} onClick={handleSave}>
                    {saving ? '保存中…' : '保存'}
                  </Button>
                </div>
              </div>
              <div className="tpl-grid">
                <label className="tpl-field tpl-span2">
                  <span>模板名称 *</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label className="tpl-field">
                  <span>基准手围（cm）</span>
                  <input
                    type="number"
                    value={form.wrist}
                    onChange={(e) => setForm({ ...form, wrist: Number(e.target.value) })}
                  />
                </label>
                <label className="tpl-field">
                  <span>一口价 / 指导价（¥）</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </label>
                <label className="tpl-field">
                  <span>状态</span>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="on_sale">上架中</option>
                    <option value="draft">草稿</option>
                    <option value="off_sale">已下架</option>
                  </select>
                </label>
                <label className="tpl-field">
                  <span>固定总颗数（如 108；留空按手围伸缩）</span>
                  <input
                    type="number"
                    placeholder="动态按手围计算"
                    value={form.fixed}
                    onChange={(e) => setForm({ ...form, fixed: e.target.value })}
                  />
                </label>
                <label className="tpl-field tpl-span2">
                  <span>副标题 / 亮点</span>
                  <input value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} />
                </label>
                <label className="tpl-field">
                  <span>标签（逗号分隔）</span>
                  <input value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
                </label>
              </div>
            </section>

            <section className="zy-card tpl-section">
              <div className="tpl-sec-head">
                <h3>配方（拖动珠子排序）</h3>
              </div>
              {ROW_META.map((row) => renderRecipeRow(row.key, row.label, row.hint))}
            </section>

            <section className="zy-card tpl-section">
              <div className="tpl-sec-head">
                <h3>13–19cm 分段预览</h3>
                <span className="tpl-sec-note">颗数、长度、价格全部来自 expand 接口实时计算</span>
              </div>
              {allLoading ? (
                <Skeleton rows={7} />
              ) : previews.some((p) => p.error) && previews.every((p) => p.error) ? (
                <ErrorState reason={previews[0].error || '展开失败'} onRetry={() => setForm({ ...form })} />
              ) : (
                <table className="zy-table tpl-preview-table">
                  <thead>
                    <tr>
                      <th>手围</th>
                      <th>颗数</th>
                      <th>长度 / 目标（mm）</th>
                      <th>到手价</th>
                      <th>贴合</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previews.map((p) => (
                      <tr key={p.wrist} className={Number(form.wrist) === p.wrist ? 'tpl-wrist-active' : undefined}>
                        <td>
                          {p.wrist}cm{Number(form.wrist) === p.wrist ? '（基准）' : ''}
                        </td>
                        <td>{p.data ? p.data.count : '-'}</td>
                        <td>
                          {p.data ? `${p.data.lengthMm} / ${p.data.targetMm}` : p.error || '-'}
                        </td>
                        <td>{p.data ? `¥${fenToYuan(p.data.totalFen)}` : '-'}</td>
                        <td>
                          {p.data ? (
                            p.data.fitOk ? (
                              <span className="tpl-fit-ok">合适</span>
                            ) : (
                              <span className="tpl-fit-bad">差 {p.data.fitDeltaMm}mm</span>
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {warnings && warnings.length > 0 && (
                <div className="tpl-banner tpl-banner-warn">{warnings.join('；')}</div>
              )}
            </section>

            <section className="zy-card tpl-section">
              <div className="tpl-sec-head">
                <h3>寓意关键词</h3>
                <span className="tpl-sec-note">来自配方珠子的知识库，只列把握“中”以上的；最多选 3 个，保存进模板的寓意</span>
              </div>
              {keywords.length === 0 ? (
                <EmptyState text="配方里的珠子还没有可用的知识库寓意关键词" />
              ) : (
                <div className="tpl-kw-list">
                  {keywords.map((tag) => {
                    const checked = form.meaningKeywords.includes(tag);
                    const disabled = !checked && effectivePicks.length >= 3;
                    return (
                      <label key={tag} className={`tpl-kw${checked ? ' on' : ''}${disabled ? ' off' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleKeyword(tag)}
                        />
                        {tag}
                      </label>
                    );
                  })}
                </div>
              )}
              {effectivePicks.length > 0 && (
                <div className="tpl-kw-saved">已选（保存为寓意）：{effectivePicks.join('、')}</div>
              )}
              {legacyPicks.length > 0 && (
                <div className="tpl-kw-legacy">
                  原来的寓意「{legacyPicks.join('、')}」不全是知识库关键词，保存后会换成上面勾选的词。
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};
