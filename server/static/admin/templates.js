/* 模板中心 */
function tplWarnings(t) {
  const ids = [...(t.special || []), ...(t.pattern || []), ...(t.tail || [])];
  const out = [];
  for (const id of new Set(ids)) {
    const b = BEAD(id);
    if (!b) out.push(`商品 ${id} 已删除`);
    else if (productStatus(b) !== 'on_sale') out.push(`「${b.name}」已下架/归档`);
  }
  return out;
}
function tplPriceFen(t) { const ids = fill(t.special || [], t.pattern || [], t.tail || []); return ids.reduce((s, id) => s + Math.round((BEAD(id)?.price || 0) * 100), 0) + 1500; }
function renderTemplates() {
  const f = filters.templates;
  $('bar').innerHTML = `<h2 class="grow">模板（${data.templates.length}）</h2>
    <input id="tpQ" type="search" placeholder="搜索名称" value="${esc(f.q)}" style="max-width:160px">
    <select id="tpS"><option value="">状态：全部</option>${Object.entries(PROD_STATUS).map(([v, n]) => `<option value="${v}" ${f.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <button class="btn" id="tpNew">新建模板</button>`;
  $('tpQ').oninput = e => { f.q = e.target.value; renderTemplateList(); };
  $('tpS').onchange = e => { f.status = e.target.value; renderTemplateList(); };
  $('tpNew').onclick = () => editTemplate(null);
  renderTemplateList();
}
function renderTemplateList() {
  const f = filters.templates, q = f.q.trim().toLowerCase();
  const list = data.templates.filter(t => {
    if (f.status && productStatus(t) !== f.status) return false;
    if (q && !String(t.name || '').toLowerCase().includes(q)) return false;
    return true;
  });
  $('list').innerHTML = `<div class="list">` + list.map(t => {
    const ids = fill(t.special || [], t.pattern || [], t.tail || []);
    const warns = tplWarnings(t);
    const img = t.images?.[0] || t.cover;
    return `<button class="row ${editing?.id === t.id ? 'on' : ''} ${productStatus(t) !== 'on_sale' ? 'off' : ''}" data-id="${esc(t.id)}">
      <span class="swatch" style="border-radius:12px">${img ? `<img src="${esc(img)}" alt="">` : ringHtml(ids, 56)}</span>
      <span><div class="nm">${esc(t.name)}${warns.length ? ' <span class="warn-inline">⚠</span>' : ''}</div>
      <div class="sub">${ids.length} 颗 · 参考 ${fenYuan(tplPriceFen(t))}</div>
      <div class="sub">${esc((t.meaning || '').slice(0, 24))}</div>
      ${warns.length ? `<div class="warn-inline">${esc(warns.join('；'))}</div>` : ''}
      <div>${prodTag(productStatus(t))}</div></span></button>`;
  }).join('') + `</div>`;
  $('list').onclick = e => { const r = e.target.closest('[data-id]'); if (r) editTemplate(data.templates.find(t => t.id === r.dataset.id)); };
}
function editTemplate(t) {
  editing = t ? JSON.parse(JSON.stringify(t)) : { name: '', meaning: '', special: [], pattern: [], tail: [], status: 'draft', images: [], order: (data.templates.length + 1) * 10 };
  if (t) { editing.status = productStatus(t); editing.images = editing.images || (t.cover ? [t.cover] : []); }
  renderTemplateList(); drawTemplateForm();
}
function drawTemplateForm() {
  const e = editing, ids = fill(e.special, e.pattern, e.tail), warns = tplWarnings(e);
  const opts = Object.entries(MATS).map(([m, n]) => { const bs = data.beads.filter(b => (productType(b) === 'bead' || productType(b) === 'spacer') && b.mat === m); return bs.length ? `<optgroup label="${n}">` + bs.map(b => `<option value="${b.id}">${esc(b.name)} ${b.mm != null ? b.mm + 'mm' : ''} · ${b.price != null ? '¥' + b.price : ''}${productStatus(b) !== 'on_sale' ? '（已下架）' : ''}</option>`).join('') + `</optgroup>` : ''; }).join('');
  const seq = (key, label, hint) => `<div class="seq"><div class="lab"><span>${label}</span><span>${hint}</span></div>
    <div class="items">${e[key].map((id, i) => { const b = BEAD(id); const off = b && productStatus(b) !== 'on_sale'; return `<span class="it"><i class="bead" style="background:${beadBg(b)}"></i><span class="${off ? 'warn-inline' : ''}">${esc(b ? b.name + ' ' + b.mm + 'mm' : id + '（已删除）')}</span><button data-rm="${key}.${i}" title="去掉">×</button></span>`; }).join('')}
      <select data-add="${key}"><option value="">+ 加一颗</option>${opts}</select></div></div>`;
  $('panel').innerHTML = `
    <div class="bar" style="margin:0"><h2 class="grow">${e.id ? '编辑模板' : '新建模板'}</h2></div>
    ${warns.length ? `<div class="warn-inline">⚠ ${esc(warns.join('；'))}</div>` : ''}
    <div class="preview">${ringHtml(ids)}<div class="meta">按 15cm 手围：${ids.length} 颗 · ${lengthOf(ids)}mm · ${fenYuan(tplPriceFen(e))}（含手工费）</div></div>
    ${imagesGridHtml(e)}
    <div class="fields">
      <label class="f wide">名称<input type="text" id="tName" maxlength="10" value="${esc(e.name)}" placeholder="例：桃花朵朵"></label>
      <label class="f">状态<select id="tStatus">${Object.entries(PROD_STATUS).map(([v, n]) => `<option value="${v}" ${e.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="f">排序（小的在前）<input type="number" id="tOrder" value="${e.order ?? ''}"></label>
      <label class="f wide">寓意说明（用户在卡片和编辑页看到）<textarea id="tMeaning" maxlength="80">${esc(e.meaning)}</textarea></label>
      <div class="wide">${seq('special', '开头珠', '只出现一次，比如佛头、主题珠，可不填')}</div>
      <div class="wide">${seq('pattern', '循环花型（必填）', '按顺序循环，铺满整圈')}</div>
      <div class="wide">${seq('tail', '结尾珠', '只出现一次，可不填')}</div>
    </div>
    <div class="err" id="tErr"></div>
    <div class="bar" style="margin:0">${e.id ? `<button class="btn ghost" id="tCopy">复制</button><button class="btn ghost" id="tToggle">${e.status === 'on_sale' ? '下架' : '上架'}</button>${e.status !== 'archived' ? '<button class="btn ghost" id="tArchive">归档</button>' : ''}<button class="btn danger" id="tDel">删除</button>` : ''}<span class="grow"></span><button class="btn" id="tSave">保存</button></div>`;
  const sync = () => { e.name = $('tName').value.trim(); e.meaning = $('tMeaning').value.trim(); e.order = +$('tOrder').value || 0; e.status = $('tStatus').value; };
  $('panel').onchange = async ev => {
    const add = ev.target.dataset.add;
    if (add && ev.target.value) { sync(); e[add].push(ev.target.value); return drawTemplateForm(); }
    if (ev.target.id === 'imgUpload') { const files = [...ev.target.files]; if (!files.length) return; for (const f of files) { try { const img = await readImage(f); const url = await upload(img); (e.images = e.images || []).push(url); } catch (err) { toast('上传失败：' + err.message); } } drawTemplateForm(); return; }
    sync(); drawTemplateForm();
  };
  $('panel').onclick = async ev => {
    const rm = ev.target.dataset.rm; if (rm) { sync(); const [k, i] = rm.split('.'); e[k].splice(+i, 1); return drawTemplateForm(); }
    const op = ev.target.dataset.imgop; if (op) { sync(); imgOpDo(e, op, +ev.target.dataset.i); return drawTemplateForm(); }
    if (ev.target.id === 'tSave') await saveTemplate();
    if (ev.target.id === 'tDel') await delTemplate(e);
    if (ev.target.id === 'tCopy') await copyTemplateItem(e);
    if (ev.target.id === 'tToggle') { sync(); e.status = e.status === 'on_sale' ? 'off_sale' : 'on_sale'; if (e.status === 'off_sale' && !await confirmBox('确认下架', `确定把「${esc(e.name)}」下架吗？`)) { drawTemplateForm(); return; } await saveTemplate(); }
    if (ev.target.id === 'tArchive') { sync(); if (!await confirmBox('确认归档', `确定把「${esc(e.name)}」归档吗？`)) return; e.status = 'archived'; await saveTemplate(); }
  };
}
async function saveTemplate() {
  const e = editing; $('tErr').textContent = '';
  try {
    const saved = e.id ? await api('PUT', `/api/admin/templates/${e.id}`, e) : await api('POST', '/api/admin/templates', e);
    editing = saved; await load('templates'); toast('已保存，前台刷新后生效'); render(); drawTemplateForm();
  } catch (err) { $('tErr').textContent = err.message; }
}
async function copyTemplateItem(e) {
  try { const copied = await api('POST', `/api/admin/templates/${e.id}/copy`); await load('templates'); toast('已复制，可继续编辑'); render(); editTemplate(copied); }
  catch (err) { toast(err.message); }
}
async function delTemplate(e) {
  if (!await confirmBox('确认删除', `确定删除模板「${esc(e.name)}」吗？此操作不可恢复。`)) return;
  try { await api('DELETE', `/api/admin/templates/${e.id}`); editing = null; await load('templates'); $('panel').innerHTML = '<div class="empty">已删除</div>'; render(); }
  catch (err) { toast(err.message); }
}

renderers.templates = renderTemplates;
