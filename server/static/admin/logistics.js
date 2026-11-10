/* 物流 */
function renderLogistics() {
  $('bar').innerHTML = `<h2 class="grow">物流（${data.orders.length} 单）</h2><button class="btn ghost" id="lgReload">刷新</button>`;
  $('lgReload').onclick = async () => { try { await load('logistics'); renderLogistics(); toast('已刷新'); } catch (err) { toast(err.message); } };
  $('list').innerHTML = `<div class="tblwrap"><table><thead><tr><th>订单</th><th>收货人</th><th>履约状态</th><th>物流状态</th><th>承运公司</th><th>运单号</th><th>发货时间</th><th>签收时间</th><th>备注</th><th>操作</th></tr></thead><tbody>
    ${data.orders.map(o => { const l = o.logistics || {}; return `<tr data-lg="${esc(o.no)}">
      <td class="num">${esc(o.no)}</td><td>${esc(o.person)}</td><td>${stag('fulfillmentStatus', o.fulfillmentStatus)}</td><td>${stag('logisticsStatus', o.logisticsStatus)}</td>
      <td>${esc(l.carrierName || '—')}</td><td>${esc(l.trackingNo || '—')}</td><td>${l.shippedAt ? ts(l.shippedAt) : '—'}</td><td>${l.signedAt ? ts(l.signedAt) : '—'}</td><td>${esc(l.note || '—')}</td>
      <td style="white-space:nowrap"><button class="btn text" data-lgbtn="edit">编辑</button>${logisticsOps(o).map(op => `<button class="btn text" data-lgbtn="${esc(op.key)}">${esc(op.label)}</button>`).join('')}<button class="btn text" data-lgbtn="hist">历史</button></td>
    </tr>`; }).join('')}</tbody></table></div>`;
  $('list').onclick = e => {
    const b = e.target.dataset.lgbtn; if (!b) return;
    const tr = e.target.closest('tr[data-lg]'); const no = tr.dataset.lg;
    const o = data.orders.find(x => x.no === no);
    if (b === 'edit') toggleLogisticsEdit(no, tr, o);
    else if (b === 'ship') shipOrder(o);
    else if (b === 'hist') toggleLogisticsHist(no, tr, o);
    else if (b.startsWith('lg:')) doLogisticsTransition(o, b.slice(3));
  };
}
function logisticsOps(o) {
  const at = o.allowedTransitions || {};
  const ops = [];
  if ((at.fulfillmentStatus || []).includes('shipped')) ops.push({ key: 'ship', label: '发货' });
  for (const s of ['in_transit', 'delivered', 'exception', 'returned']) {
    if ((at.logisticsStatus || []).includes(s)) ops.push({ key: 'lg:' + s, label: statusLabel('logisticsStatus', s) });
  }
  return ops;
}
async function doLogisticsTransition(o, to) {
  if (!await confirmBox('确认变更', `确定把物流状态改为「${statusLabel('logisticsStatus', to)}」吗？`)) return;
  try { await api('PUT', `/api/admin/orders/${o.no}/status`, { group: 'logisticsStatus', to }); toast('已更新'); await refreshLogistics(); }
  catch (e) { toast(e.message); }
}
function toggleLogisticsEdit(no, tr, o) {
  const next = tr.nextElementSibling;
  if (next && next.classList.contains('detail-row')) { next.remove(); return; }
  const l = o.logistics || {};
  const r = document.createElement('tr'); r.className = 'detail-row';
  r.innerHTML = `<td colspan="10"><div class="detail">
    <div class="fields">
      <label class="f">承运公司编码<input type="text" id="lgCode" value="${esc(l.carrierCode || '')}" placeholder="如 SF"></label>
      <label class="f">承运公司名称<input type="text" id="lgName" value="${esc(l.carrierName || '')}" placeholder="如 顺丰速运"></label>
      <label class="f">运单号<input type="text" id="lgTrack" value="${esc(l.trackingNo || '')}"></label>
      <label class="f">发货时间<input type="datetime-local" id="lgShip" value="${dtLocal(l.shippedAt)}"></label>
      <label class="f">签收时间<input type="datetime-local" id="lgSign" value="${dtLocal(l.signedAt)}"></label>
      <label class="f wide">备注<input type="text" id="lgNote" value="${esc(l.note || '')}"></label>
    </div>
    <div class="err" id="lgErr"></div>
    <div class="bar" style="margin:0"><button class="btn" id="lgSave">保存物流</button></div>
  </div></td>`;
  tr.after(r);
  $('lgSave').onclick = async () => {
    const body = { carrierCode: $('lgCode').value.trim(), carrierName: $('lgName').value.trim(), trackingNo: $('lgTrack').value.trim(), note: $('lgNote').value.trim(), shippedAt: dtMs($('lgShip').value), signedAt: dtMs($('lgSign').value) };
    try { await api('PUT', `/api/admin/orders/${no}/logistics`, body); toast('物流已保存'); await refreshLogistics(); }
    catch (e) { $('lgErr').textContent = e.message; }
  };
}
async function shipOrder(o) {
  const l = o.logistics || {};
  let carrierName = l.carrierName || '', trackingNo = l.trackingNo || '', carrierCode = l.carrierCode || '';
  if (!carrierName || !trackingNo) {
    const r = await promptBox('填写物流后发货', [{ key: 'carrierName', label: '承运公司', value: carrierName }, { key: 'trackingNo', label: '运单号', value: trackingNo }]);
    if (!r) return;
    if (!r.carrierName || !r.trackingNo) { toast('请填写承运公司和运单号'); return; }
    carrierName = r.carrierName; trackingNo = r.trackingNo;
  }
  if (!await confirmBox('确认发货', `确定把订单 ${esc(o.no)} 标记为已发货吗？`)) return;
  try { await api('PUT', `/api/admin/orders/${o.no}/status`, { group: 'fulfillmentStatus', to: 'shipped', logistics: { carrierCode, carrierName, trackingNo } }); toast('已发货'); await refreshLogistics(); }
  catch (e) { toast(e.message); }
}
function logisticsHistHtml(h) {
  if (!h || !h.length) return '';
  return `<div class="timeline">${h.slice().reverse().map(x => `<div class="tl"><span class="tl-dot"></span><div><span class="sub">${ts(x.at)} · ${esc(x.actor)}</span><div>${esc(x.action)}：${esc(x.detail || '')}</div></div></div>`).join('')}</div>`;
}
function toggleLogisticsHist(no, tr, o) {
  const next = tr.nextElementSibling;
  if (next && next.classList.contains('detail-row')) { next.remove(); return; }
  const h = o.logisticsHistory || [];
  const r = document.createElement('tr'); r.className = 'detail-row';
  r.innerHTML = `<td colspan="10"><div class="detail">${logisticsHistHtml(h) || '<div class="empty">暂无物流修改记录</div>'}</div></td>`;
  tr.after(r);
}
async function refreshLogistics() { await load('logistics'); renderLogistics(); }
renderers.logistics = renderLogistics;
