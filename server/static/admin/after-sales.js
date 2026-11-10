/* 售后与逆向 */
function renderAfterSales() {
  const f = filters.afterSales;
  $('bar').innerHTML = `<h2 class="grow">售后（${data.afterSales.length}）</h2>
    <input id="asQ" type="search" placeholder="售后单号/订单号" value="${esc(f.q)}" style="max-width:180px">
    <select id="asS"><option value="">状态：全部</option>${AFTER_SALE_STATUSES.map(s => `<option value="${s}" ${f.status === s ? 'selected' : ''}>${statusLabel('afterSaleStatus', s)}</option>`).join('')}</select>
    <button class="btn" id="asNew">新建售后</button>
    <button class="btn ghost" id="asReload">刷新</button>`;
  $('asQ').oninput = e => { f.q = e.target.value; renderAfterSaleList(); };
  $('asS').onchange = e => { f.status = e.target.value; renderAfterSaleList(); };
  $('asNew').onclick = () => newAfterSale();
  $('asReload').onclick = async () => { try { await load('aftersales'); renderAfterSaleList(); toast('已刷新'); } catch (err) { toast(err.message); } };
  renderAfterSaleList();
}
function renderAfterSaleList() {
  const f = filters.afterSales, q = f.q.trim().toLowerCase();
  const list = data.afterSales.filter(a => {
    if (f.status && a.status !== f.status) return false;
    if (q && !([a.no, a.orderNo].some(v => String(v || '').toLowerCase().includes(q)))) return false;
    return true;
  });
  if (!list.length) { $('list').innerHTML = `<div class="empty">暂无售后单。</div>`; return; }
  $('list').innerHTML = `<div class="tblwrap"><table><thead><tr><th>售后单</th><th>订单</th><th>类型</th><th>状态</th><th>退款</th><th>原因</th><th>创建时间</th></tr></thead><tbody>
    ${list.map(a => `<tr data-asno="${esc(a.no)}" style="cursor:pointer">
      <td class="num">${esc(a.no)}</td><td class="num">${esc(a.orderNo)}</td><td>${esc(a.type)}</td><td>${stag('afterSaleStatus', a.status)}</td><td class="num">${fenYuan(a.refundFen)}</td><td>${esc(a.reason)}</td><td class="sub">${ts(a.createdAt)}</td></tr>`).join('')}</tbody></table></div>`;
  $('list').onclick = e => { const tr = e.target.closest('tr[data-asno]'); if (tr) toggleAfterSaleDetail(tr.dataset.asno, tr); };
}
function newAfterSale() {
  const orderOpts = data.orders.map(o => `<option value="${esc(o.no)}">${esc(o.no)} · ${esc(o.person)} · ${fenYuan(moneyFen(o))}</option>`).join('');
  if (!orderOpts) { toast('还没有订单，无法新建售后'); return; }
  $('modalBox').innerHTML = `<h2>新建售后</h2><div class="mbody fields">
    <label class="f wide">订单<select id="asOrder">${orderOpts}</select></label>
    <label class="f">类型<select id="asType">${AFTER_SALE_TYPES.map(t => `<option>${t}</option>`).join('')}</select></label>
    <label class="f">退款金额（分，整数）<input type="number" id="asRefund" min="0" step="1" value="0"></label>
    <label class="f wide">原因（必填）<input type="text" id="asReason" maxlength="200" placeholder="例：珠子尺寸不合适"></label>
    <label class="f wide">用户说明<textarea id="asNote" maxlength="500"></textarea></label>
    <div class="err" id="asErr"></div>
  </div>
  <div class="bar" style="margin:0;justify-content:flex-end"><button class="btn ghost" id="mCancel">取消</button><button class="btn" id="mOk">创建</button></div>`;
  $('modal').hidden = false;
  $('mCancel').onclick = () => { $('modal').hidden = true; };
  $('mOk').onclick = async () => {
    const body = { orderNo: $('asOrder').value, type: $('asType').value, reason: $('asReason').value.trim(), userNote: $('asNote').value.trim(), refundFen: parseInt($('asRefund').value || '0', 10) };
    try {
      await api('POST', '/api/admin/after-sales', body);
      $('modal').hidden = true; await load('aftersales'); toast('售后单已创建'); renderAfterSales();
    } catch (e) { $('asErr').textContent = e.message; }
  };
}
function afterSaleButtons(a) {
  const btns = [], s = a.status, t = a.type;
  if (s === 'requested') { btns.push(['approve', '进入审核', '']); btns.push(['reject', '拒绝', 'danger']); }
  else if (s === 'reviewing') { btns.push(['approve', '同意', '']); btns.push(['reject', '拒绝', 'danger']); }
  else if (s === 'approved') {
    if (t === '退货退款') { btns.push(['returning', '记录退货物流', '']); btns.push(['receive', '确认收到退货', '']); }
    else if (t === '仅退款') btns.push(['receive', '确认收到退货（退款）', '']);
    else if (t === '补发') btns.push(['complete', '完成售后', '']);
  } else if (s === 'returning') btns.push(['receive', '确认收到退货', '']);
  else if (s === 'refunding') btns.push(['complete', '完成售后', '']);
  if (s !== 'completed' && s !== 'closed') btns.push(['close', '关闭', 'danger']);
  return btns;
}
function afterSaleDetailHtml(a) {
  let btns = afterSaleButtons(a);
  if (Array.isArray(a.allowedActions)) { const allowed = new Set(a.allowedActions); btns = btns.filter(([act]) => allowed.has(act)); }
  return `<div class="detail">
    <div class="dhead"><h2>售后 ${esc(a.no)}</h2><span class="sub">${ts(a.createdAt)}</span></div>
    <div class="drow"><b>订单：</b>${esc(a.orderNo)}</div>
    <div class="drow"><b>类型：</b>${esc(a.type)} · <b>退款：</b>${fenYuan(a.refundFen)}</div>
    <div class="drow"><b>原因：</b>${esc(a.reason)}</div>
    ${a.userNote ? `<div class="drow"><b>用户说明：</b>${esc(a.userNote)}</div>` : ''}
    ${a.returnLogistics && Object.keys(a.returnLogistics || {}).length ? `<div class="drow"><b>退货物流：</b>${esc(a.returnLogistics.carrierName || '')} ${esc(a.returnLogistics.trackingNo || '')}</div>` : ''}
    ${a.result ? `<div class="drow"><b>处理结果：</b>${esc(a.result)}</div>` : ''}
    <div class="drow"><b>状态：</b>${stag('afterSaleStatus', a.status)}</div>
    ${btns.length ? `<div class="bar" style="margin:0">${btns.map(([act, label, cls]) => `<button class="btn ${cls === 'danger' ? 'danger' : 'ghost'}" data-as="${act}">${label}</button>`).join('')}</div>` : ''}
    ${timelineHtml(a.history)}
  </div>`;
}
async function toggleAfterSaleDetail(no, row) {
  const next = row.nextElementSibling;
  if (next && next.classList.contains('detail-row')) { next.remove(); return; }
  let a; try { a = await api('GET', `/api/admin/after-sales/${no}`); } catch (e) { toast(e.message); return; }
  const tr = document.createElement('tr'); tr.className = 'detail-row';
  tr.innerHTML = `<td colspan="7">${afterSaleDetailHtml(a)}</td>`;
  row.after(tr); bindAfterSaleDetail(tr, a);
}
function bindAfterSaleDetail(container, a) {
  container.querySelectorAll('[data-as]').forEach(btn => { btn.onclick = async () => doAfterSaleTransition(a.no, btn.dataset.as, a); });
}
async function doAfterSaleTransition(no, action, a) {
  const body = { action };
  if (action === 'returning') {
    const r = await promptBox('记录退货物流', [{ key: 'carrierName', label: '承运公司' }, { key: 'trackingNo', label: '运单号' }]);
    if (!r) return;
    if (!r.carrierName || !r.trackingNo) { toast('请填写承运公司和运单号'); return; }
    body.returnLogistics = { carrierName: r.carrierName, trackingNo: r.trackingNo };
  } else {
    const msg = { approve: '同意后将进入退款/退货流程，确定同意？', receive: '确认收到退货后将进入退款，确定？', complete: '确定完成该售后（涉及退款结算）？', reject: '确定拒绝该售后申请？', close: '确定关闭该售后单？' }[action];
    if (msg && !await confirmBox('确认操作', `售后单 ${esc(no)}：${msg}`)) return;
  }
  try {
    await api('PUT', `/api/admin/after-sales/${no}/transition`, body);
    toast('已处理');
    await load('aftersales'); await load('orders'); renderAfterSales();
    const row = document.querySelector(`tr[data-asno="${no}"]`);
    if (row) await toggleAfterSaleDetail(no, row);
  } catch (e) { toast(e.message); }
}
renderers.aftersales = renderAfterSales;
