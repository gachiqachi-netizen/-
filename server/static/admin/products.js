/* 商品中心 */
function renderBeads() {
  const f = filters.beads;
  const types = Object.keys(TYPES).filter(t => data.beads.some(b => productType(b) === t));
  $('bar').innerHTML = `<h2 class="grow">商品（${data.beads.length}）</h2>
    <input id="bdQ" type="search" placeholder="搜索名称" value="${esc(f.q)}" style="max-width:160px">
    <select id="bdT"><option value="">类型：全部</option>${types.map(t => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${TYPES[t]}</option>`).join('')}</select>
    <select id="bdS"><option value="">状态：全部</option>${Object.entries(PROD_STATUS).map(([v, n]) => `<option value="${v}" ${f.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <button class="btn" id="bdNew">新建商品</button>`;
  $('bdQ').oninput = e => { f.q = e.target.value; renderBeadList(); };
  $('bdT').onchange = e => { f.type = e.target.value; renderBeadList(); };
  $('bdS').onchange = e => { f.status = e.target.value; renderBeadList(); };
  $('bdNew').onclick = () => editBead(null);
  renderBeadList();
}
function renderBeadList() {
  const f = filters.beads, q = f.q.trim().toLowerCase();
  const list = data.beads.filter(b => {
    if (f.type && productType(b) !== f.type) return false;
    if (f.status && productStatus(b) !== f.status) return false;
    if (q && !String(b.name || '').toLowerCase().includes(q)) return false;
    return true;
  });
  $('list').innerHTML = `<div class="list">` + list.map(b => {
    const img = b.images?.[0] || b.photo;
    return `<button class="row ${editing?.id === b.id ? 'on' : ''} ${productStatus(b) !== 'on_sale' ? 'off' : ''}" data-id="${esc(b.id)}">
      <span class="swatch">${img ? `<img src="${esc(img)}" alt="">` : `<span class="bead" style="width:44px;height:44px;background:${beadBg(b)}"></span>`}</span>
      <span><div class="nm">${esc(b.name)}${b.mm != null ? ` <span class="num">${b.mm}mm</span>` : ''}</div>
      <div class="sub">${TYPES[productType(b)]} · ${MATS[b.mat] || ''} · ${b.price != null ? '¥' + b.price : '—'} · ${STOCKS[b.stock] || '—'}</div>
      <div class="sub">${esc((b.tags || []).join('、'))}</div>
      <div>${prodTag(productStatus(b))}</div></span></button>`;
  }).join('') + `</div>`;
  $('list').onclick = e => { const r = e.target.closest('[data-id]'); if (r) editBead(data.beads.find(b => b.id === r.dataset.id)); };
}
function editBead(b) {
  editing = b ? JSON.parse(JSON.stringify(b)) : { name: '', type: 'bead', mat: 'stone', mm: null, price: null, status: 'draft', stock: 'in_stock', images: [], tags: [], kb: '', attrs: {}, grade: null, legal: '', c: ['#d8c3a5', '#6e5236'], order: (data.beads.length + 1) * 10 };
  if (b) {
    editing.type = productType(b); editing.status = productStatus(b);
    editing.stock = editing.stock || 'in_stock';
    editing.images = editing.images || (b.photo ? [b.photo] : []);
    editing.c = editing.c || ['#d8c3a5', '#6e5236'];
    editing.attrs = editing.attrs || {};
  }
  renderBeadList(); drawBeadForm();
}
function matOptions(type, cur) {
  const list = TYPE_MATS[type] || Object.keys(MATS);
  return list.map(m => `<option value="${m}" ${m === cur ? 'selected' : ''}>${MATS[m]}</option>`).join('');
}
function readBeadForm(e) {
  e.type = $('bType').value;
  if (e.type === 'spacer') e.spacer = true; else delete e.spacer;
  e.name = $('bName').value.trim();
  e.mat = $('bMat').value;
  if ($('bMm')) e.mm = $('bMm').value === '' ? null : +$('bMm').value;
  e.price = $('bPrice').value === '' ? null : +$('bPrice').value;
  e.stock = $('bStock').value;
  e.status = $('bStatus').value;
  e.tags = $('bTags').value.split(/[,，、\s]+/).filter(Boolean).slice(0, 6);
  e.order = +$('bOrder').value || 0;
  if ($('bC0')) e.c = [$('bC0').value, $('bC1').value];
  readKbBox(e);
}
function drawBeadForm() {
  const e = editing;
  const beadish = e.type === 'bead' || e.type === 'spacer';
  $('panel').innerHTML = `
    <div class="bar" style="margin:0"><h2 class="grow">${e.id ? '编辑商品' : '新建商品'}</h2></div>
    <div class="preview">
      ${e.images?.[0] ? `<img src="${esc(e.images[0])}" style="width:96px;height:96px;border-radius:12px;object-fit:cover">` : `<span class="bead" style="width:96px;height:${beadish && !e.spacer ? 96 : 32}px;background:${beadBg(e)};${e.spacer ? 'border-radius:30%' : ''}"></span>`}
      ${beadish && e.mm > 0 && e.type !== 'spacer' ? ringSame(e) : ''}
      <div class="meta" id="bMeta"></div></div>
    ${imagesGridHtml(e)}
    <div class="fields">
      <label class="f">类型<select id="bType">${Object.entries(TYPES).map(([v, n]) => `<option value="${v}" ${e.type === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="f">材质<select id="bMat">${matOptions(e.type, e.mat)}</select></label>
      ${beadish ? `<label class="f wide">品种（从知识库选，卖点和讲解会自动带出）<input type="text" id="bKb" list="kbList" value="${esc(kbLabel(e.kb))}" placeholder="输入名称或别名，如 南红、马粉、小叶紫檀"><datalist id="kbList">${KB.map(k => `<option value="${esc(k.name + (k.std && k.std !== k.name ? ' ' + k.std : ''))}">`).join('')}</datalist></label>` : ''}
      ${beadish ? '<div id="kbBox" class="wide"></div>' : ''}
      <label class="f wide">名称<input type="text" id="bName" maxlength="12" value="${esc(e.name)}" placeholder="例：小叶紫檀"></label>
      ${beadish ? `<label class="f ${e.mm > 0 ? '' : 'bad'}">${e.type === 'spacer' ? '厚度' : '直径'} mm（必填）<input type="number" id="bMm" min="1" max="60" step="0.5" value="${e.mm ?? ''}"></label>` : ''}
      <label class="f ${e.price === null ? 'bad' : ''}">单价（元，必填）<input type="number" id="bPrice" min="0" step="0.01" value="${e.price ?? ''}"></label>
      <label class="f">库存状态<select id="bStock">${Object.entries(STOCKS).map(([v, n]) => `<option value="${v}" ${e.stock === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="f">状态<select id="bStatus">${Object.entries(PROD_STATUS).map(([v, n]) => `<option value="${v}" ${e.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${beadish ? `<label class="f">亮色<input type="color" id="bC0" value="${e.c[0]}"></label><label class="f">暗色<input type="color" id="bC1" value="${e.c[1]}"></label>` : ''}
      <label class="f">排序（小的在前）<input type="number" id="bOrder" value="${e.order ?? ''}"></label>
      <label class="f wide">寓意（逗号隔开，只写寓意不写功效；选了品种会自动带出）<input type="text" id="bTags" value="${esc((e.tags || []).join('，'))}" placeholder="例：平安，温润"></label>
      ${beadish ? `<div class="photo wide"><span class="ph" style="width:48px;height:48px">${e.texture ? `<img src="${esc(e.texture)}" alt="">` : '纹理'}</span>
        <div class="tips">花纹特殊的珠子（南红柿子红、绿松石铁线）可上传纹理图（可选）。<br>
        <label class="btn text" style="padding:0">${e.texture ? '换纹理图' : '上传纹理图'}<input type="file" accept="image/*" id="bTex" hidden></label>${e.texture ? ' <button class="btn text" id="bNoTex">去掉</button>' : ''}</div></div>` : ''}
    </div>
    <div class="err" id="bErr"></div>
    <div class="bar" style="margin:0">${e.id ? `<button class="btn ghost" id="bCopy">复制</button><button class="btn ghost" id="bToggle">${e.status === 'on_sale' ? '下架' : '上架'}</button>${e.status !== 'archived' ? '<button class="btn ghost" id="bArchive">归档</button>' : ''}<button class="btn danger" id="bDel">删除</button>` : ''}<span class="grow"></span><button class="btn" id="bSave">保存</button></div>`;
  const total = (beadish && e.mm > 0) ? Math.round((15 * 10 + margin(e.mm)) / e.mm) : 0;
  $('bMeta').textContent = (beadish && e.mm > 0) ? (e.type === 'spacer' ? `隔片 ${e.mm}mm 厚` : `直径 ${e.mm}mm · 15cm 手围一圈约 ${total} 颗 · 整圈约 ¥${(total * (e.price || 0)).toFixed(2)}`) : (beadish ? '先填尺寸' : '');
  if (beadish && e.kb) drawKbBox(e);
  $('panel').onchange = async ev => {
    if (ev.target.id === 'imgUpload') { const files = [...ev.target.files]; if (!files.length) return; for (const f of files) { try { const img = await readImage(f); const url = await upload(img); (e.images = e.images || []).push(url); } catch (err) { toast('上传失败：' + err.message); } } drawBeadForm(); return; }
    if (ev.target.id === 'bKb') {
      readBeadForm(e); const k = kbFind(ev.target.value);
      if (!k) { e.kb = ''; toast('知识库里没找到，换个叫法试试'); return drawBeadForm(); }
      const rec = await kbRec(k.id); const first = e.kb !== k.id; e.kb = k.id; if (first) { e.attrs = {}; e.grade = null; }
      if (!e.name) e.name = k.name;
      if (!e.id) e.mat = k.mat;
      if (rec && rec.meaning && (rec.meaning.tags || []).length && (!e.tags || !e.tags.length)) e.tags = rec.meaning.tags.slice(0, 3);
      return drawBeadForm();
    }
    if (ev.target.id === 'bTex') { const f = ev.target.files[0]; if (!f) return; readBeadForm(e); try { const img = await readImage(f); e.texture = await upload(img); toast('纹理图已上传'); } catch (err) { toast('上传失败：' + err.message); } return drawBeadForm(); }
    if (ev.target.id === 'bType') { readBeadForm(e); const list = TYPE_MATS[e.type] || Object.keys(MATS); if (!list.includes(e.mat)) e.mat = list[0]; drawBeadForm(); return; }
    readBeadForm(e); drawBeadForm();
  };
  $('panel').onclick = async ev => {
    const op = ev.target.dataset.imgop;
    if (op) { readBeadForm(e); imgOpDo(e, op, +ev.target.dataset.i); drawBeadForm(); return; }
    if (ev.target.id === 'bNoTex') { readBeadForm(e); delete e.texture; drawBeadForm(); }
    if (ev.target.id === 'bSave') await saveBead();
    if (ev.target.id === 'bDel') await delBead(e);
    if (ev.target.id === 'bCopy') await copyBead(e);
    if (ev.target.id === 'bToggle') {
      readBeadForm(e); e.status = e.status === 'on_sale' ? 'off_sale' : 'on_sale';
      if (e.status === 'off_sale' && !await confirmBox('确认下架', `确定把「${esc(e.name)}」下架吗？用户将看不到它。`)) { drawBeadForm(); return; }
      await saveBead();
    }
    if (ev.target.id === 'bArchive') {
      readBeadForm(e); if (!await confirmBox('确认归档', `确定把「${esc(e.name)}」归档吗？归档后不再展示。`)) return;
      e.status = 'archived'; await saveBead();
    }
  };
}
async function drawKbBox(e) {
  const box = $('kbBox'); if (!box) return;
  if (!e.kb) { box.innerHTML = ''; return; }
  const rec = await kbRec(e.kb); if (!rec || editing !== e) return;
  const a = e.attrs || {}, dims = Object.keys(rec.dims || {}).filter(k => (rec.dims[k] || []).length);
  if (!dims.includes('treatment')) dims.push('treatment');
  const opts = k => { const own = rec.dims[k] || [], gen = ((KBA.dims.find(d => d.key === k) || {}).values || []).filter(v => !own.includes(v));
    return `<option value="">不填</option>` + own.map(v => `<option ${a[k] === v ? 'selected' : ''}>${esc(v)}</option>`).join('') +
      (gen.length ? `<optgroup label="通用">${gen.map(v => `<option ${a[k] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</optgroup>` : '') +
      (a[k] && !own.includes(a[k]) && !gen.includes(a[k]) ? `<option selected>${esc(a[k])}</option>` : ''); };
  const comp = (rec.compliance || {}).level;
  const pts = beadPoints(e, rec);
  box.innerHTML = `<div class="kbcard"><b>${esc(rec.name)}${rec.std && rec.std !== rec.name ? `<span class="muted">（规范名：${esc(rec.std)}）</span>` : ''}</b>
      ${rec.summary ? `<div>${esc(rec.summary)}</div>` : ''}
      ${comp === 'restricted' ? `<div class="warn">受保护或有来源要求：${esc((rec.compliance || {}).note || '')}</div>` : ''}
      ${comp === 'banned' ? `<div class="warn">禁售材质，不能上架</div>` : ''}
      ${(rec.safety || {}).note ? `<div class="warn">安全提示：${esc(rec.safety.note)}</div>` : ''}
      ${rec.status === 'draft' ? `<div class="warn">这个品种来源还没核实，寓意和讲解暂不展示</div>` : ''}
      ${(rec.confusables || []).length ? `<div class="muted">容易混：${rec.confusables.slice(0, 3).map(c => esc(c.name + '（' + c.how + '）')).join('；')}</div>` : ''}
      <div class="points">卖点预览：${pts.length ? pts.map(p => `<span>${esc(p)}</span>`).join('') : '<span class="muted" style="border:0;background:none">选下面的属性后自动生成</span>'}</div></div>
    <div class="dimgrid">${dims.map(k => `<label class="f">${esc(DIMN(k))}<select data-dim="${k}">${opts(k)}</select></label>`).join('')}
      ${(rec.grades || []).length ? `<label class="f">品级<select id="bGrade"><option value="">不填</option>${rec.grades.map(g => `<option value="${g.level}" ${e.grade === g.level ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}</select></label>` : ''}</div>
    ${comp === 'restricted' ? `<label class="f wide bad">合法来源证明（必填：证书编号、进口许可或供应商说明）<input type="text" id="bLegal" value="${esc(e.legal || '')}"></label>` : ''}`;
}
function readKbBox(e) {
  if (!$('kbBox')) return;
  e.attrs = e.attrs || {};
  document.querySelectorAll('#kbBox [data-dim]').forEach(s => { if (s.value) e.attrs[s.dataset.dim] = s.value; else delete e.attrs[s.dataset.dim]; });
  if ($('bGrade')) e.grade = $('bGrade').value ? +$('bGrade').value : null;
  if ($('bLegal')) e.legal = $('bLegal').value.trim();
}
async function saveBead() {
  const e = editing; readBeadForm(e); $('bErr').textContent = '';
  try {
    const saved = e.id ? await api('PUT', `/api/admin/beads/${e.id}`, e) : await api('POST', '/api/admin/beads', e);
    editing = saved; await load('beads'); await load('templates'); toast('已保存，前台刷新后生效'); render(); drawBeadForm();
  } catch (err) { $('bErr').textContent = err.message; }
}
async function copyBead(e) {
  try { const copied = await api('POST', `/api/admin/beads/${e.id}/copy`); await load('beads'); toast('已复制，可继续编辑'); render(); editBead(copied); }
  catch (err) { toast(err.message); }
}
async function delBead(e) {
  if (!await confirmBox('确认删除', `确定删除商品「${esc(e.name)}」吗？此操作不可恢复。`)) return;
  try { await api('DELETE', `/api/admin/beads/${e.id}`); editing = null; await load('beads'); await load('templates'); $('panel').innerHTML = '<div class="empty">已删除</div>'; render(); }
  catch (err) { toast(err.message); }
}

renderers.beads = renderBeads;
