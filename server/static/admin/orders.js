/* 订单中心：含设计快照（designSnapshot）、条款快照（termsSnapshot）、生产工单（workOrder）与质检关口（qualityGate） */
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
  $('bar').innerHTML = `<h2 class="grow">订单与生产工单（${data.orders.length}）</h2>
    <input id="oQ" type="search" placeholder="订单号/收件人/手机号" value="${esc(f.q)}" style="max-width:180px">
    <select id="oFs">${groupFilterOptions('orderStatus', f.orderStatus)}</select>
    <select id="oFp">${groupFilterOptions('paymentStatus', f.paymentStatus)}</select>
    <select id="oFf">${groupFilterOptions('fulfillmentStatus', f.fulfillmentStatus)}</select>
    <select id="oFa">${groupFilterOptions('afterSaleStatus', f.afterSaleStatus)}</select>
    <button class="btn ghost" id="oReload">刷新</button>${PAYMENT_NOT_INTEGRATED ? '<span class="tag tag-warn">未接真实支付</span>' : ''}`;
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
  $('list').innerHTML = `<div class="tblwrap"><table><thead><tr><th>订单</th><th>手串</th><th>金额</th><th>收货</th><th>订单状态</th><th>支付</th><th>履约 / 生产质检</th><th>物流</th><th>售后</th></tr></thead><tbody>
    ${list.map(o => orderRowHtml(o)).join('')}</tbody></table></div>`;
  $('list').onclick = e => { const tr = e.target.closest('tr[data-no]'); if (tr) toggleOrderDetail(tr.dataset.no, tr); };
}
function qcBadgeHtml(o) {
  const qg = o.qualityGate;
  if (!qg) return '';
  return qg.passed ? '<span class="tag tag-ok">质检通过</span>' : '<span class="tag tag-danger">质检不通过</span>';
}
function orderRowHtml(o) {
  const items = orderItems(o);
  const rows = items.map(it => `${esc(it.name || it.id)} ${it.mm != null ? it.mm + 'mm' : ''}${it.price != null ? ' · ¥' + it.price + '/颗' : ''}`).join('、');
  const wo = o.workOrder || {};
  return `<tr data-no="${esc(o.no)}" style="cursor:pointer">
    <td><div class="num">${esc(o.no)}</div><div class="sub">${ts(o.createdAt)}</div></td>
    <td><div style="display:flex;gap:8px;align-items:center">${thumbHtml(o)}<div style="max-width:230px"><b>${esc(o.name)}</b><div class="sub">${esc(rows)}</div></div></div></td>
    <td class="num">${fenYuan(moneyFen(o))}</td>
    <td>${esc(o.person)}<br><span class="sub">${esc(o.phone)}</span></td>
    <td>${stag('orderStatus', o.orderStatus)}</td>
    <td>${stag('paymentStatus', o.paymentStatus)}</td>
    <td>${stag('fulfillmentStatus', o.fulfillmentStatus)} ${qcBadgeHtml(o)}${wo.assignee ? `<div class="sub">工单：${esc(wo.assignee)} · ${wo.progress ?? 0}%</div>` : ''}</td>
    <td>${stag('logisticsStatus', o.logisticsStatus)}</td>
    <td>${stag('afterSaleStatus', o.afterSaleStatus)}</td></tr>`;
}
function dang(group, n) { return (group === 'orderStatus' && (n === 'cancelled' || n === 'closed')) || (group === 'fulfillmentStatus' && n === 'returned') || (group === 'logisticsStatus' && (n === 'returned' || n === 'exception')); }
function statusGroupHtml(d, group, nexts) {
  const cur = d[group] || '—';
  const readonly = group === 'paymentStatus' || group === 'afterSaleStatus';
  const payWarn = group === 'paymentStatus' && PAYMENT_NOT_INTEGRATED ? ' · 未接真实支付' : '';
  return `<div class="sgroup">
    <div class="shead"><span class="slab">${GROUP_LABELS[group]}</span>${stag(group, cur)}${readonly ? `<span class="muted sm">只读${payWarn}</span>` : ''}</div>
    ${readonly ? '' : `<div class="sbtns">${(nexts || []).map(n => `<button class="chip ${dang(group, n) ? 'chip-danger' : ''}" data-tran="${group}" data-to="${esc(n)}">${statusLabel(group, n)}</button>`).join('') || '<span class="muted sm">已到终态或受前置条件约束</span>'}</div>`}
  </div>`;
}
function logisticsHtml(lg) {
  const l = lg || {};
  if (!Object.keys(l).length) return '';
  return `<div class="drow"><b>物流：</b>${esc(l.carrierName || l.carrierCode || '—')} · ${esc(l.trackingNo || '—')}${l.shippedAt ? ` · 发货 ${ts(l.shippedAt)}` : ''}${l.signedAt ? ` · 签收 ${ts(l.signedAt)}` : ''}${l.note ? ` · ${esc(l.note)}` : ''}</div>`;
}
function designSnapshotHtml(d) {
  const snap = d.designSnapshot || {};
  const seq = snap.sequence || [];
  const mats = snap.materials || [];
  if (!seq.length && !mats.length) return '';
  return `<div class="sgroup">
    <div class="shead"><b>设计快照（下单冻结 · 严禁替换用料）</b><span class="sub">手围 ${esc(snap.wrist ?? d.wrist)}cm · 总长 ${esc(snap.lengthMm ?? d.length)}mm · 共 ${esc(snap.count ?? seq.length)} 颗${snap.tplId ? ` · 模板 ${esc(snap.tplId)}` : ''}</span></div>
    ${snap.customerNote ? `<div class="sm"><b>客户备注：</b>${esc(snap.customerNote)}</div>` : ''}
    <div class="sm"><b>物料清单（BOM）：</b>${mats.map(m => `${esc(m.name)} ${m.mm ? m.mm + 'mm' : ''} × ${m.count}颗（#${(m.positions || []).join(', #')} · ${fenYuan(m.subtotalFen)}）`).join('；')}</div>
    <div class="sub"><b>编号珠序：</b>${seq.map(s => `#${s.seq}:${esc(s.name)}(${s.mm}mm)`).join(' → ')}</div>
  </div>`;
}
function workOrderAndQcHtml(d) {
  const wo = d.workOrder || {};
  const qg = d.qualityGate || {};
  const woTag = WORK_ORDER_STATUS_LABELS[wo.status] || wo.status || '待排产';
  return `<div class="dgrid">
    <div class="sgroup">
      <div class="shead"><b>生产工单 ${esc(wo.workOrderNo || '')}</b><span class="tag tag-info">${esc(woTag)}</span><span class="tag tag-warn">锁定用料 · 禁止替换</span></div>
      <div class="fields">
        <label class="f">负责人<input type="text" data-wo="assignee" value="${esc(wo.assignee || '')}" placeholder="如：张师傅"></label>
        <label class="f">工序阶段<select data-wo="step">${WORK_ORDER_STEPS.map(s => `<option value="${esc(s)}" ${wo.step === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
        <label class="f">进度（0–100%）<input type="number" min="0" max="100" data-wo="progress" value="${wo.progress ?? 0}"></label>
        <label class="f">作业备注<input type="text" data-wo="operatorNote" value="${esc(wo.operatorNote || '')}" placeholder="串制备注"></label>
      </div>
      <div class="bar" style="margin:0;justify-content:flex-end"><button class="btn ghost" data-act="save-wo">保存工单进度</button></div>
    </div>
    <div class="sgroup">
      <div class="shead"><b>发货前质检关口（Quality Gate）</b>${qcBadgeHtml(d)}<span class="sub">质检不通过不得进入待发货</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <label class="check"><input type="checkbox" data-qg="sequenceOk" ${qg.sequenceOk !== false ? 'checked' : ''}>珠序核对一致</label>
        <label class="check"><input type="checkbox" data-qg="sizeOk" ${qg.sizeOk !== false ? 'checked' : ''}>尺寸/手围达标</label>
        <label class="check"><input type="checkbox" data-qg="materialOk" ${qg.materialOk !== false ? 'checked' : ''}>用料无替换</label>
        <label class="check"><input type="checkbox" data-qg="appearanceOk" ${qg.appearanceOk !== false ? 'checked' : ''}>外观无瑕疵</label>
      </div>
      <div class="fields">
        <label class="f">质检员<input type="text" data-qg-text="inspector" value="${esc(qg.inspector || '质检员')}" placeholder="质检员姓名"></label>
        <label class="f">质检说明（不通过时必填）<input type="text" data-qg-text="note" value="${esc(qg.note || '')}" placeholder="记录检查结果或返工原因"></label>
      </div>
      ${qg.checkedAt ? `<div class="sub">最近质检：${ts(qg.checkedAt)} · ${esc(qg.inspector || '')}${qg.note ? ' · ' + esc(qg.note) : ''}</div>` : ''}
      <div class="bar" style="margin:0;justify-content:flex-end"><button class="btn" data-act="save-qg">记录质检结果</button></div>
    </div>
  </div>`;
}
function termsSnapshotHtml(list) {
  if (!list || !list.length) return '';
  return `<div class="drow"><b>条款快照（下单时按适用范围筛选冻结）：</b><div style="display:grid;gap:4px">${list.map(t => {
    const matched = (t.matchedBy || []).join('/') || (t.scope?.mode === 'scoped' ? 'scoped' : 'global');
    return `<div class="sub"><span class="tag">${esc(matched)}</span><b>${esc(t.type)}「${esc(t.title)}」v${esc(t.version)}</b>：${esc(t.body || '')}</div>`;
  }).join('')}</div></div>`;
}
function orderDetailHtml(d) {
  const items = orderItems(d);
  const at = d.allowedTransitions || {};
  return `<div class="detail">
    <div class="dhead"><h2>订单 ${esc(d.no)}</h2><span class="sub">${ts(d.createdAt)} · 手围 ${esc(d.wrist)}cm${d.length != null ? ' · 总长 ' + esc(d.length) + 'mm' : ''} · ${d.cord ? '编织绳' : '弹力线'}${d.gift ? ' · 礼盒' : ''}</span></div>
    <div class="dgrid">
      ${statusGroupHtml(d, 'orderStatus', at.orderStatus ?? (ORDER_TRANSITIONS[d.orderStatus] || []))}
      ${statusGroupHtml(d, 'paymentStatus', [])}
      ${statusGroupHtml(d, 'fulfillmentStatus', at.fulfillmentStatus ?? (FULFILLMENT_TRANSITIONS[d.fulfillmentStatus] || []))}
      ${statusGroupHtml(d, 'logisticsStatus', at.logisticsStatus ?? (LOGISTICS_TRANSITIONS[d.logisticsStatus] || []))}
      ${statusGroupHtml(d, 'afterSaleStatus', [])}
    </div>
    ${designSnapshotHtml(d)}
    ${workOrderAndQcHtml(d)}
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
  tr.innerHTML = `<td colspan="9">${orderDetailHtml(d)}</td>`;
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
  const woBtn = container.querySelector('[data-act="save-wo"]');
  if (woBtn) {
    woBtn.onclick = async () => {
      const payload = {
        assignee: container.querySelector('[data-wo="assignee"]').value.trim(),
        step: container.querySelector('[data-wo="step"]').value,
        progress: Math.round(+container.querySelector('[data-wo="progress"]').value || 0),
        operatorNote: container.querySelector('[data-wo="operatorNote"]').value.trim(),
      };
      try {
        await api('PUT', `/api/admin/orders/${d.no}/work-order`, payload);
        toast('生产工单已更新');
        await load('orders'); renderOrders();
        const row = document.querySelector(`tr[data-no="${d.no}"]`);
        if (row) await toggleOrderDetail(d.no, row);
      } catch (e) { toast(e.message); }
    };
  }
  const qgBtn = container.querySelector('[data-act="save-qg"]');
  if (qgBtn) {
    qgBtn.onclick = async () => {
      const payload = {
        sequenceOk: container.querySelector('[data-qg="sequenceOk"]').checked,
        sizeOk: container.querySelector('[data-qg="sizeOk"]').checked,
        materialOk: container.querySelector('[data-qg="materialOk"]').checked,
        appearanceOk: container.querySelector('[data-qg="appearanceOk"]').checked,
        inspector: container.querySelector('[data-qg-text="inspector"]').value.trim(),
        note: container.querySelector('[data-qg-text="note"]').value.trim(),
      };
      try {
        await api('PUT', `/api/admin/orders/${d.no}/quality-gate`, payload);
        toast('质检结果已记录');
        await load('orders'); renderOrders();
        const row = document.querySelector(`tr[data-no="${d.no}"]`);
        if (row) await toggleOrderDetail(d.no, row);
      } catch (e) { toast(e.message); }
    };
  }
}
renderers.orders = renderOrders;
