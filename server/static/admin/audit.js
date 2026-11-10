/* 操作审计 */
function renderAudit() {
  const f = filters.audit;
  const targets = [...new Set(data.audit.map(a => a.target))];
  $('bar').innerHTML = `<h2 class="grow">操作审计（${data.audit.length}）</h2>
    <input id="auQ" type="search" placeholder="搜索对象/详情/动作" value="${esc(f.q)}" style="max-width:180px">
    <select id="auT"><option value="">对象类型：全部</option>${targets.map(t => `<option value="${esc(t)}" ${f.target === t ? 'selected' : ''}>${esc(TARGETS[t] || t)}</option>`).join('')}</select>
    <button class="btn ghost" id="auReload">刷新</button>`;
  $('auQ').oninput = e => { f.q = e.target.value; renderAuditList(); };
  $('auT').onchange = e => { f.target = e.target.value; renderAuditList(); };
  $('auReload').onclick = async () => { try { await load('audit'); renderAuditList(); toast('已刷新'); } catch (err) { toast(err.message); } };
  renderAuditList();
}
function renderAuditList() {
  const f = filters.audit, q = f.q.trim().toLowerCase();
  const list = data.audit.filter(a => {
    if (f.target && a.target !== f.target) return false;
    if (q && !([a.targetId, a.detail, a.action].some(v => String(v || '').toLowerCase().includes(q)))) return false;
    return true;
  });
  if (!list.length) { $('list').innerHTML = `<div class="empty">暂无审计记录。</div>`; return; }
  $('list').innerHTML = `<div class="tblwrap"><table><thead><tr><th>时间</th><th>操作者</th><th>动作</th><th>对象</th><th>对象ID</th><th>详情</th></tr></thead><tbody>
    ${list.map(a => `<tr><td class="sub">${ts(a.at)}</td><td>${esc(a.actor)}</td><td><span class="tag">${esc(ACTIONS[a.action] || a.action)}</span></td><td>${esc(TARGETS[a.target] || a.target)}</td><td class="num">${esc(a.targetId)}</td><td>${esc(a.detail || '')}</td></tr>`).join('')}</tbody></table></div>`;
}
renderers.audit = renderAudit;
