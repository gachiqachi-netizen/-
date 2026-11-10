/* 订单中心 */
function orderItems(o) {
  if (Array.isArray(o.items) && o.items.length) return o.items;
  return (Array.isArray(o.beads) ? o.beads : []).map(id => ({ id, name: BEAD(id)?.name || id, mm: BEAD(id)?.mm, price: BEAD(id)?.price }));
}
function thumbHtml(o) {
  const ids = Array.isArray(o.beads) ? o.beads : [];
  if (ids.length && ids.every(id => BEAD(id))) return ringHtml(ids, 48);
  const p = (o.items || [])[0]?.photo;
  return p ? `<img src="${esc(p)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">` : '<span class="swatch" style="width:48px;height:48px"></span>';
}
function groupFilterOptions(group, cur) {
  return `<option value="">${GROUP_LABELS[group]}</option>` + GROUP_VALUES[group].map(v => `<option value="${v}" ${v === cur ? 'selected' : ''}>${statusLabel(group, v)}</option>`).join('');
}
function renderOrders() {
  const f = filters.orders;
  $('bar').innerHTML = `<h2 class="grow">订单（${data.orders.length}）</h2>
    <input id="oQ" type="search" placeholder="订单号/收件人/手机号" value="${esc(f.q)}" style="max-width:180px">
    <select id="oFs">${groupFilterOptions('orderStatus', f.orderStatus)}</select>
    <select id="oFp">${groupFilterOptions('paymentStatus', f.paymentStatus)}</select>
    <select id="oFf">${groupFilterOptions('fulfillmentStatus', f.fulfillmentStatus)}</select>
    <select id="oFa">${groupFilterOptions('afterSaleStatus', f.afterSaleStatus)}</select>
    <button class="btn ghost" id="oReload">刷新</button>`;
  $('oQ').oninput = e => { f.q = e.target.value; renderOrderList(); };
  $('oFs').onchange = e => { f.orderStatus = e.target.value; renderOrderList(); };
  $('oFp').onchange = e => { f.paymentStatus = e.target.value; renderOrderList(); };
  $('oFf').onchange = e => { f.fulfillmentStatus = e.target.value; renderOrderList(); };
  $('oFa').onchange = e => { f.afterSaleStatus = e.target.value; renderOrderList(); };
  $('oReload').onclick = async () => { try { await load('orders'); renderOrderList(); toast('已刷新'); } catch (err) { toast(err.message); } };
  renderOrderList();
}
function renderOrderList() {
  const f = filters.orders, q = f.q.trim().toLowerCase();
  const list = data.orders.filter(o => {
    if (f.orderStatus && o.orderStatus !== f.orderStatus) return false;
    if (f.paymentStatus && o.paymentStatus !== f.paymentStatus) return false;
    if (f.fulfillmentStatus && o.fulfillmentStatus !== f.fulfillmentStatus) return false;
    if (f.afterSaleStatus && o.afterSaleStatus !== f.afterSaleStatus) return false;
    if (q && !([o.no, o.person, o.phone].some(v => String(v || '').toLowerCase().includes(q)))) return false;
    return true;
  });
  if (!list.length) { $('list').innerHTML = `<div class="empty">${data.orders.length ? '没有找到匹配的订单。' : '还没有订单。用户在前台下单后会出现在这里。'}</div>`; return; }
  $('list').innerHTML = `<div class="tblwrap"><table><thead><tr><th>订单</th><th>手串</th><th>金额</th><th>收货</th><th>订单状态</th><th>支付</th><th>履约</th><th>售后</th></tr></thead><tbody>
    ${list.map(o => orderRowHtml(o)).join('')}</tbody></table></div>`;
  $('list').onclick = e => { const tr = e.target.closest('tr[data-no]'); if (tr) toggleOrderDetail(tr.dataset.no, tr); };
}
function orderRowHtml(o) {
  const items = orderItems(o);
  const rows = items.map(it => `${esc(it.name || it.id)} ${it.mm != null ? it.mm + 'mm' : ''}${it.price != null ? ' · ¥' + it.price + '/颗' : ''}`).join('、');
  return `<tr data-no="${esc(o.no)}" style="cursor:pointer">
    <td><div class="num">${esc(o.no)}</div><div class="sub">${ts(o.createdAt)}</div></td>
    <td><div style="display:flex;gap:8px;align-items:center">${thumbHtml(o)}<div style="max-width:230px"><b>${esc(o.name)}</b><div class="sub">${esc(rows)}</div></div></div></td>
    <td class="num">${fenYuan(moneyFen(o))}</td>
    <td>${esc(o.person)}<br><span class="sub">${esc(o.phone)}</span></td>
    <td>${stag('orderStatus', o.orderStatus)}</td>
    <td>${stag('paymentStatus', o.paymentStatus)}</td>
    <td>${stag('fulfillmentStatus', o.fulfillmentStatus)}</td>
    <td>${stag('afterSaleStatus', o.afterSaleStatus)}</td></tr>`;
}
function dang(group, n) { return (group === 'orderStatus' && (n === 'cancelled' || n === 'closed')) || (group === 'fulfillmentStatus' && n === 'returned'); }
function statusGroupHtml(d, group, transitions) {
  const cur = d[group] || '—';
  const readonly = group === 'paymentStatus' || group === 'afterSaleStatus';
  const nexts = transitions[cur] || [];
  return `<div class="sgroup">
    <div class="shead"><span class="slab">${GROUP_LABELS[group]}</span>${stag(group, cur)}${readonly ? '<span class="muted sm">只读</span>' : ''}</div>
    ${readonly ? '' : `<div class="sbtns">${nexts.map(n => `<button class="chip ${dang(group, n) ? 'chip-danger' : ''}" data-tran="${group}" data-to="${esc(n)}">${statusLabel(group, n)}</button>`).join('') || '<span class="muted sm">已到终态</span>'}</div>`}
  </div>`;
}
function logisticsHtml(lg) {
  const l = lg || {};
  if (!Object.keys(l).length) return '';
  return `<div class="drow"><b>物流：</b>${esc(l.carrierName || l.carrierCode || '—')} · ${esc(l.trackingNo || '—')}${l.shippedAt ? ` · 发货 ${ts(l.shippedAt)}` : ''}${l.signedAt ? ` · 签收 ${ts(l.signedAt)}` : ''}${l.note ? ` · ${esc(l.note)}` : ''}</div>`;
}
function termsSnapshotHtml(list) {
  if (!list || !list.length) return '';
  return `<div class="drow"><b>条款快照：</b><div>${list.map(t => `<div class="sub">${esc(t.type)}「${esc(t.title)}」v${esc(t.version)}</div>`).join('')}</div></div>`;
}
function orderDetailHtml(d) {
  const items = orderItems(d);
  return `<div class="detail">
    <div class="dhead"><h2>订单 ${esc(d.no)}</h2><span class="sub">${ts(d.createdAt)} · 手围 ${esc(d.wrist)}cm${d.length != null ? ' · 总长 ' + esc(d.length) + 'mm' : ''} · ${d.cord ? '编织绳' : '弹力线'}${d.gift ? ' · 礼盒' : ''}</span></div>
    <div class="dgrid">
      ${statusGroupHtml(d, 'orderStatus', ORDER_TRANSITIONS)}
      ${statusGroupHtml(d, 'paymentStatus', {})}
      ${statusGroupHtml(d, 'fulfillmentStatus', FULFILLMENT_TRANSITIONS)}
      ${statusGroupHtml(d, 'afterSaleStatus', {})}
    </div>
    <div class="drow"><b>收货：</b>${esc(d.person)} ${esc(d.phone)} · ${esc(d.addr)}</div>
    <div class="drow"><b>商品：</b>${items.map(it => `${esc(it.name || it.id)} ${it.mm != null ? it.mm + 'mm' : ''}${it.price != null ? ' · ¥' + it.price + '/颗' : ''}`).join('、')}</div>
    <div class="drow"><b>金额：</b>${fenYuan(moneyFen(d))}${d.goods != null ? `（珠子 ¥${Number(d.goods).toFixed(2)}${d.ship != null ? ' · 运费 ¥' + Number(d.ship).toFixed(2) : ''}${d.promo ? ' · 立减 ¥' + Number(d.promo).toFixed(2) : ''}）` : ''}</div>
    ${logisticsHtml(d.logistics)}
    ${timelineHtml(d.statusHistory)}
    ${termsSnapshotHtml(d.termsSnapshot)}
    ${d.afterSales && d.afterSales.length ? `<div class="drow"><b>关联售后：</b>${d.afterSales.map(a => `<span class="tag">${esc(a.no)} · ${esc(a.type)} · ${statusLabel('afterSaleStatus', a.status)}</span>`).join('')}</div>` : ''}
  </div>`;
}
async function toggleOrderDetail(no, row) {
  const next = row.nextElementSibling;
  if (next && next.classList.contains('detail-row')) { next.remove(); return; }
  let d; try { d = await api('GET', '/api/admin/orders/' + no); } catch (e) { toast(e.message); return; }
  const tr = document.createElement('tr'); tr.className = 'detail-row';
  tr.innerHTML = `<td colspan="8">${orderDetailHtml(d)}</td>`;
  row.after(tr); bindOrderDetail(tr, d);
}
async function doOrderTransition(no, group, to, logistics) {
  try {
    await api('PUT', `/api/admin/orders/${no}/status`, { group, to, logistics });
    toast('状态已更新');
    await load('orders'); renderOrders();
    const row = document.querySelector(`tr[data-no="${no}"]`);
    if (row) await toggleOrderDetail(no, row);
  } catch (e) { toast(e.message); }
}
function bindOrderDetail(container, d) {
  container.querySelectorAll('[data-tran]').forEach(btn => {
    btn.onclick = async () => {
      const group = btn.dataset.tran, to = btn.dataset.to;
      if (dang(group, to) && !await confirmBox('确认变更', `确定把${GROUP_LABELS[group]}改为「${statusLabel(group, to)}」吗？`)) return;
      let logistics;
      if (group === 'fulfillmentStatus' && to === 'shipped') {
        const lg = d.logistics || {};
        if (!lg.carrierName || !lg.trackingNo) {
          const r = await promptBox('发货需要物流信息', [{ key: 'carrierName', label: '承运公司' }, { key: 'trackingNo', label: '运单号' }]);
          if (!r) return;
          if (!r.carrierName || !r.trackingNo) { toast('请填写承运公司和运单号'); return; }
          logistics = { carrierCode: lg.carrierCode || '', carrierName: r.carrierName, trackingNo: r.trackingNo };
        } else logistics = { carrierCode: lg.carrierCode || '', carrierName: lg.carrierName, trackingNo: lg.trackingNo };
      }
      await doOrderTransition(d.no, group, to, logistics);
    };
  });
}
renderers.orders = renderOrders;
