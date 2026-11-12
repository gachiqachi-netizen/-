/* 服务条款与规则适用范围（rule scope）管理 */
function termScopeSummary(t) {
  const s = t.scope || { mode: 'global' };
  if ((s.mode || 'global') === 'global') return '<span class="tag tag-ok">全局适用</span>';
  const parts = [];
  if (s.scenarios?.length) parts.push(`场景：${s.scenarios.map(k => TERM_SCENARIOS[k] || k).join(' / ')}`);
  if (s.productIds?.length) parts.push(`商品：${s.productIds.length}款`);
  if (s.templateIds?.length) parts.push(`模板：${s.templateIds.length}款`);
  return `<span class="tag tag-info">${esc(parts.join(' · ') || '指定范围')}</span>`;
}

function renderTerms() {
  const f = filters.terms;
  $('bar').innerHTML = `<h2 class="grow">服务条款（${data.terms.length}）</h2>
    <input id="termQ" type="search" placeholder="搜索标题/类型" value="${esc(f.q)}" style="max-width:180px">
    <select id="termFs"><option value="">状态：全部</option>${Object.entries(TERM_STATUS).map(([v, n]) => `<option value="${v}" ${f.status === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <button class="btn" id="termNew">新建条款</button>`;
  $('termQ').oninput = e => { f.q = e.target.value; renderTermList(); };
  $('termFs').onchange = e => { f.status = e.target.value; renderTermList(); };
  $('termNew').onclick = () => editTerm(null);
  renderTermList();
}

function renderTermList() {
  const f = filters.terms, q = f.q.trim().toLowerCase();
  const list = data.terms.filter(t => {
    if (f.status && (t.status || 'draft') !== f.status) return false;
    if (q && !([t.title, t.type].some(v => String(v || '').toLowerCase().includes(q)))) return false;
    return true;
  });
  $('list').innerHTML = `<div class="list">` + list.map(t => `
    <button class="row ${editing?.id === t.id ? 'on' : ''}" data-id="${esc(t.id)}" style="grid-template-columns:minmax(0,1fr)">
      <span><div class="nm">${esc(t.title)}${t.confirmed === false ? ' <span class="badge warn">待运营/法务确认</span>' : ''}</div>
      <div class="sub">${esc(t.type)} · v${esc(t.version)} · ${TERM_STATUS[t.status] || t.status}</div>
      <div style="margin:4px 0">${termScopeSummary(t)}</div>
      <div class="sub">${esc((t.body || '').slice(0, 40))}</div></span></button>`).join('') + `</div>`;
  $('list').onclick = e => { const r = e.target.closest('[data-id]'); if (r) editTerm(data.terms.find(t => t.id === r.dataset.id)); };
}

function editTerm(t) {
  editing = t ? JSON.parse(JSON.stringify(t)) : {
    title: '', type: '售前说明', version: '1.0.0', body: '', status: 'draft',
    confirmed: false, effectiveAt: null, order: (data.terms.length + 1) * 10,
    scope: { mode: 'global', productIds: [], templateIds: [], scenarios: [] },
  };
  if (!editing.scope || typeof editing.scope !== 'object') {
    editing.scope = { mode: 'global', productIds: [], templateIds: [], scenarios: [] };
  }
  editing.scope.productIds = editing.scope.productIds || [];
  editing.scope.templateIds = editing.scope.templateIds || [];
  editing.scope.scenarios = editing.scope.scenarios || [];
  renderTermList(); drawTermForm();
}

function drawTermForm() {
  const e = editing;
  const sc = e.scope || { mode: 'global', productIds: [], templateIds: [], scenarios: [] };
  const isScoped = sc.mode === 'scoped';
  const scenarioChecks = Object.entries(TERM_SCENARIOS).map(([k, label]) =>
    `<label class="check"><input type="checkbox" data-sc-scenario="${esc(k)}" ${(sc.scenarios || []).includes(k) ? 'checked' : ''}>${esc(label)}</label>`
  ).join('');
  const prodChecks = data.beads.slice(0, 30).map(b =>
    `<label class="check"><input type="checkbox" data-sc-prod="${esc(b.id)}" ${(sc.productIds || []).includes(b.id) ? 'checked' : ''}>${esc(b.name)} (${esc(b.id)})</label>`
  ).join('');
  const tplChecks = data.templates.map(t =>
    `<label class="check"><input type="checkbox" data-sc-tpl="${esc(t.id)}" ${(sc.templateIds || []).includes(t.id) ? 'checked' : ''}>${esc(t.name)} (${esc(t.id)})</label>`
  ).join('');

  $('panel').innerHTML = `
    <div class="bar" style="margin:0"><h2 class="grow">${e.id ? '编辑条款' : '新建条款'}</h2></div>
    ${e.confirmed === false ? '<div class="badge warn" style="justify-self:start">待运营/法务确认</div>' : ''}
    <div class="fields">
      <label class="f">标题<input type="text" id="tmTitle" value="${esc(e.title)}"></label>
      <label class="f">版本号<input type="text" id="tmVer" value="${esc(e.version)}" placeholder="1.0.0"></label>
      <label class="f">类型<select id="tmType">${TERM_TYPES.map(t => `<option ${e.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="f">状态<select id="tmStatus">${Object.entries(TERM_STATUS).map(([v, n]) => `<option value="${v}" ${(e.status || 'draft') === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="f">生效时间<input type="datetime-local" id="tmEff" value="${dtLocal(e.effectiveAt)}"></label>
      <label class="f">排序<input type="number" id="tmOrder" value="${e.order ?? ''}"></label>
      <label class="f wide">规则适用范围（rule scope）
        <select id="tmScopeMode">
          <option value="global" ${!isScoped ? 'selected' : ''}>全局适用（所有订单自动冻结）</option>
          <option value="scoped" ${isScoped ? 'selected' : ''}>按规则范围适用（指定订单场景 / 指定商品 / 指定模板）</option>
        </select>
      </label>
      ${isScoped ? `
        <div class="sgroup wide">
          <div class="slab"><b>适用订单场景</b>（命中任一场景即纳入条款快照）</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px">${scenarioChecks}</div>
          <div class="slab" style="margin-top:6px"><b>指定模板</b>（选中模板下单时自动纳入）</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px">${tplChecks || '<span class="muted sm">暂无模板</span>'}</div>
          <div class="slab" style="margin-top:6px"><b>指定商品 SKU</b>（包含该用料的订单自动纳入）</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;max-height:110px;overflow:auto">${prodChecks || '<span class="muted sm">暂无商品</span>'}</div>
        </div>
      ` : ''}
      <label class="check wide"><input type="checkbox" id="tmConf" ${e.confirmed !== false ? 'checked' : ''}>已由运营/法务确认</label>
      <label class="f wide">正文<textarea id="tmBody" style="height:160px">${esc(e.body)}</textarea></label>
    </div>
    <div class="err" id="tmErr"></div>
    <div class="bar" style="margin:0">${e.id ? '<button class="btn ghost" id="tmCopy">复制</button><button class="btn danger" id="tmDel">删除</button>' : ''}<span class="grow"></span><button class="btn" id="tmSave">保存</button></div>`;

  $('tmScopeMode').onchange = ev => {
    readTerm(e);
    e.scope.mode = ev.target.value;
    drawTermForm();
  };
  $('panel').onclick = async ev => {
    if (ev.target.id === 'tmSave') await saveTerm();
    if (ev.target.id === 'tmDel') await delTerm(e);
    if (ev.target.id === 'tmCopy') copyTerm(e);
  };
}

function readTerm(e) {
  e.title = $('tmTitle').value.trim();
  e.version = $('tmVer').value.trim();
  e.type = $('tmType').value;
  e.status = $('tmStatus').value;
  e.confirmed = $('tmConf').checked;
  e.order = +$('tmOrder').value || 0;
  e.body = $('tmBody').value.trim();
  const v = dtMs($('tmEff').value);
  e.effectiveAt = v === '' ? null : v;
  const mode = $('tmScopeMode') ? $('tmScopeMode').value : (e.scope?.mode || 'global');
  if (mode === 'global') {
    e.scope = { mode: 'global', productIds: [], templateIds: [], scenarios: [] };
  } else {
    const scenarios = [...document.querySelectorAll('[data-sc-scenario]:checked')].map(el => el.dataset.scScenario);
    const productIds = [...document.querySelectorAll('[data-sc-prod]:checked')].map(el => el.dataset.scProd);
    const templateIds = [...document.querySelectorAll('[data-sc-tpl]:checked')].map(el => el.dataset.scTpl);
    e.scope = { mode: 'scoped', productIds, templateIds, scenarios };
  }
}

async function saveTerm() {
  const e = editing; readTerm(e); $('tmErr').textContent = '';
  try {
    const saved = e.id ? await api('PUT', `/api/admin/terms/${e.id}`, e) : await api('POST', '/api/admin/terms', e);
    editing = saved; await load('terms'); toast('已保存'); renderTerms(); drawTermForm();
  } catch (err) { $('tmErr').textContent = err.message; }
}

async function delTerm(e) {
  if (!await confirmBox('确认删除', `确定删除条款「${esc(e.title)}」吗？此操作不可恢复。`)) return;
  try { await api('DELETE', `/api/admin/terms/${e.id}`); editing = null; await load('terms'); $('panel').innerHTML = '<div class="empty">已删除</div>'; renderTerms(); }
  catch (err) { toast(err.message); }
}

function copyTerm(e) {
  editing = {
    title: e.title + '（副本）', type: e.type, version: e.version, body: e.body,
    status: 'draft', confirmed: false, effectiveAt: e.effectiveAt,
    order: (data.terms.length + 1) * 10,
    scope: JSON.parse(JSON.stringify(e.scope || { mode: 'global', productIds: [], templateIds: [], scenarios: [] })),
  };
  renderTermList(); drawTermForm();
}

renderers.terms = renderTerms;
