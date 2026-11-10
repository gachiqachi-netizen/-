/* 串个珠后台 · 公共层：DOM 工具、常量、状态、登录/请求、弹窗、知识库、3D 外观、图片、多图、时间线、渲染调度。
   所有模块脚本在它之后加载，直接引用这里的全局变量与函数。 */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 常量 ----------
const MATS = { wood: '木质', bodhi: '菩提', stone: '玉石', crystal: '水晶', metal: '金属配件', cord: '线材', textile: '织物', paper: '纸品', plastic: '塑料', glass: '玻璃', alloy: '合金' };
const TYPES = { bead: '珠子', spacer: '隔片', pendant: '吊坠', cord: '线材', packaging: '包装' };
const TYPE_MATS = { bead: ['wood', 'bodhi', 'stone', 'crystal', 'metal'], spacer: ['wood', 'bodhi', 'stone', 'crystal', 'metal'], pendant: ['stone', 'crystal', 'metal', 'glass', 'alloy', 'wood'], cord: ['cord', 'textile'], packaging: ['paper', 'plastic', 'textile'] };
const STOCKS = { in_stock: '现货', low_stock: '少量', out_of_stock: '缺货', preorder: '预售' };
const PROD_STATUS = { draft: '草稿', on_sale: '上架', off_sale: '下架', archived: '归档' };
const TERM_STATUS = { draft: '草稿', published: '已发布', disabled: '已停用' };
const GROUP_LABELS = { orderStatus: '订单状态', paymentStatus: '支付状态', fulfillmentStatus: '履约状态', afterSaleStatus: '售后状态' };
const STATUS_LABELS = {
  orderStatus: { pending_confirmation: '待确认', confirmed: '已确认', cancelled: '已取消', completed: '已完成', closed: '已关闭' },
  paymentStatus: { unpaid: '待支付', paying: '支付中', paid: '已支付', failed: '支付失败', partially_refunded: '部分退款', refunded: '已退款' },
  fulfillmentStatus: { unfulfilled: '待履约', producing: '制作中', ready_to_ship: '待发货', shipped: '已发货', delivered: '已签收', exception: '物流异常', returned: '已退回' },
  afterSaleStatus: { none: '无售后', requested: '申请中', approved: '已同意', rejected: '已拒绝', returning: '退货中', refunding: '退款中', completed: '售后完成', closed: '售后关闭' },
};
const statusLabel = (group, v) => (STATUS_LABELS[group] && STATUS_LABELS[group][v]) || v;
const GROUP_VALUES = {
  orderStatus: ['pending_confirmation', 'confirmed', 'cancelled', 'completed', 'closed'],
  paymentStatus: ['unpaid', 'paying', 'paid', 'failed', 'partially_refunded', 'refunded'],
  fulfillmentStatus: ['unfulfilled', 'producing', 'ready_to_ship', 'shipped', 'delivered', 'exception', 'returned'],
  afterSaleStatus: ['none', 'requested', 'approved', 'rejected', 'returning', 'refunding', 'completed', 'closed'],
};
const ORDER_TRANSITIONS = { pending_confirmation: ['confirmed', 'cancelled'], confirmed: ['completed', 'closed'], cancelled: [], completed: [], closed: [] };
const FULFILLMENT_TRANSITIONS = { unfulfilled: ['producing'], producing: ['ready_to_ship', 'returned'], ready_to_ship: ['shipped', 'returned'], shipped: ['delivered', 'exception', 'returned'], exception: ['shipped', 'returned'], delivered: [], returned: [] };
const AFTER_SALE_TYPES = ['仅退款', '退货退款', '补发'];
const AFTER_SALE_STATUSES = ['requested', 'approved', 'rejected', 'returning', 'refunding', 'completed', 'closed'];
const TERM_TYPES = ['售前说明', '天然材料差异说明', '定制商品说明', '发货与物流说明', '退货退款说明', '售后服务说明'];
const TARGETS = { product: '商品', template: '模板', banner: '宣传位', order: '订单', after_sale: '售后', term: '条款' };
const ACTIONS = { create: '新建', update: '更新', delete: '删除', copy: '复制', archive: '归档', transition: '状态变更', update_logistics: '修改物流', approve: '同意售后', reject: '拒绝售后', returning: '记录退货', receive: '确认收货', complete: '完成售后', close: '关闭售后' };
const WIDE = new Set(['orders', 'aftersales', 'logistics', 'audit']);

// ---------- 状态 ----------
let tab = 'beads';
let data = { beads: [], templates: [], banners: [], orders: [], afterSales: [], terms: [], audit: [] };
let editing = null;
const filters = {
  beads: { q: '', type: '', status: '' }, templates: { q: '', status: '' },
  orders: { q: '', orderStatus: '', paymentStatus: '', fulfillmentStatus: '', afterSaleStatus: '' },
  afterSales: { q: '', status: '' }, terms: { q: '', status: '' }, audit: { q: '', target: '' },
};
let token = ''; try { token = localStorage.getItem('cgz_admin_token') || ''; } catch {}
let toastT; const toast = t => { $('toast').textContent = t; $('toast').classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => $('toast').classList.remove('show'), 2200); };

// ---------- 工具 ----------
const productStatus = b => (PROD_STATUS[b.status] ? b.status : (b.onSale === false ? 'off_sale' : 'on_sale'));
const productType = b => (TYPES[b.type] ? b.type : (b.spacer ? 'spacer' : 'bead'));
const fenYuan = fen => (fen == null ? '—' : '¥' + (fen / 100).toFixed(2));
const moneyFen = o => (o.payableFen != null ? o.payableFen : (o.totalFen != null ? o.totalFen : (o.total != null ? Math.round(Number(o.total) * 100) : null)));
const ts = ms => (ms ? new Date(ms).toLocaleString('zh-CN', { hour12: false }) : '—');
function dtLocal(ms) { if (!ms) return ''; const d = new Date(ms), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
function dtMs(v) { if (!v) return ''; const d = new Date(v); return isNaN(d.getTime()) ? '' : d.getTime(); }
function prodTag(s) { const m = { draft: 'info', on_sale: 'ok', off_sale: 'warn', archived: 'gray' }; return `<span class="tag tag-${m[s] || 'gray'}">${PROD_STATUS[s]}</span>`; }
function stagClass(group, v) {
  if (['delivered', 'completed', 'approved', 'paid'].includes(v)) return 'ok';
  if (['cancelled', 'closed', 'returned', 'failed', 'exception', 'rejected', 'refunded', 'partially_refunded'].includes(v)) return 'danger';
  if (v === 'none') return 'gray';
  if (['shipped', 'paying', 'returning', 'refunding'].includes(v)) return 'info';
  return 'warn';
}
function stag(group, v) { return `<span class="tag tag-${stagClass(group, v)}">${esc(statusLabel(group, v) || '—')}</span>`; }

// ---------- 登录 + 请求封装 ----------
let loginPromise = null;
function requireAdminLogin() {
  if (loginPromise) return loginPromise;
  loginPromise = new Promise(resolve => {
    $('adminLogin').hidden = false;
    $('adminPassword').focus();
    $('loginForm').onsubmit = async event => {
      event.preventDefault();
      const candidate = $('adminPassword').value.trim();
      if (!candidate || $('loginSubmit').disabled) return;
      $('loginSubmit').disabled = true; $('loginError').textContent = '';
      try {
        const response = await fetch('/api/admin/orders', { headers: { 'X-Admin-Token': candidate } });
        if (!response.ok) throw new Error(response.status === 401 ? '口令不正确，或服务尚未配置后台口令' : '登录失败，请稍后重试');
        token = candidate;
        try { localStorage.setItem('cgz_admin_token', token); } catch {}
        $('adminPassword').value = '';
        $('adminLogin').hidden = true;
        loginPromise = null;
        resolve();
      } catch (error) { $('loginError').textContent = error.message; }
      finally { $('loginSubmit').disabled = false; }
    };
  });
  return loginPromise;
}
async function api(method, url, body, retried = false) {
  const sentToken = token;
  let r;
  try {
    r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Token': sentToken }, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    if (e instanceof TypeError) throw new Error('网络错误，请检查服务是否启动');
    throw e;
  }
  if (r.status === 401 && !retried) {
    if (sentToken === token) await requireAdminLogin();
    return api(method, url, body, true);
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('请求失败 ' + r.status));
  return j;
}
async function load(t) {
  if (t === 'beads') data.beads = await api('GET', '/api/admin/beads');
  else if (t === 'templates') data.templates = await api('GET', '/api/admin/templates');
  else if (t === 'banners') data.banners = await api('GET', '/api/admin/banners');
  else if (t === 'orders' || t === 'logistics') data.orders = await api('GET', '/api/admin/orders');
  else if (t === 'aftersales') { data.afterSales = await api('GET', '/api/admin/after-sales'); data.orders = await api('GET', '/api/admin/orders'); }
  else if (t === 'terms') data.terms = await api('GET', '/api/admin/terms');
  else if (t === 'audit') data.audit = await api('GET', '/api/admin/audit');
}
const BEAD = id => data.beads.find(b => b.id === id);

// ---------- 二次确认 / 输入弹窗 ----------
function confirmBox(title, message) {
  return new Promise(resolve => {
    $('modalBox').innerHTML = `<h2>${esc(title)}</h2><div class="mbody">${message}</div>
      <div class="bar" style="margin:0;justify-content:flex-end"><button class="btn ghost" id="mCancel">取消</button><button class="btn danger" id="mOk">确认</button></div>`;
    $('modal').hidden = false;
    const done = v => { $('modal').hidden = true; resolve(v); };
    $('mOk').onclick = () => done(true);
    $('mCancel').onclick = () => done(false);
  });
}
function promptBox(title, fields) {
  return new Promise(resolve => {
    $('modalBox').innerHTML = `<h2>${esc(title)}</h2><div class="mbody">${fields.map(f => `<label class="f">${esc(f.label)}<input type="${f.type || 'text'}" id="pf_${f.key}" value="${esc(f.value || '')}"></label>`).join('')}</div>
      <div class="bar" style="margin:0;justify-content:flex-end"><button class="btn ghost" id="mCancel">取消</button><button class="btn" id="mOk">确定</button></div>`;
    $('modal').hidden = false;
    $('mCancel').onclick = () => { $('modal').hidden = true; resolve(null); };
    $('mOk').onclick = () => { const out = {}; for (const f of fields) out[f.key] = $('pf_' + f.key).value; $('modal').hidden = true; resolve(out); };
  });
}

// ---------- 珠子知识库 ----------
let KB = [], KBA = { dims: [] }; const kbCache = {};
const DIMN = k => (KBA.dims.find(d => d.key === k) || {}).name || k;
const POINT_ORDER = ['origin', 'color', 'clarity', 'purity', 'effect', 'pattern', 'inclusion', 'texture', 'age'];
async function kbRec(id) { if (!id) return null; if (!kbCache[id]) { try { kbCache[id] = await api('GET', '/api/kb/bead/' + id); } catch { kbCache[id] = null; } } return kbCache[id]; }
function kbFind(text) { const t = String(text || '').trim(); if (!t) return null;
  return KB.find(k => k.name === t || t.startsWith(k.name + ' ') || k.std === t) || KB.find(k => (k.aliases || []).includes(t)) || null; }
function beadPoints(e, rec) { const a = e.attrs || {}, out = POINT_ORDER.filter(k => a[k]).map(k => a[k]);
  if (a.treatment === '天然') out.push('天然');
  const g = rec && (rec.grades || []).find(g => g.level === e.grade); if (g && !out.includes(g.label)) out.push(g.label);
  return out.slice(0, 4); }
function kbLabel(id) { const k = KB.find(k => k.id === id); return k ? k.name + (k.std && k.std !== k.name ? ' ' + k.std : '') : ''; }

// ---------- 珠子外观 ----------
function beadBg(b) {
  if (!b) return '#ddd';
  if (b.mat === 'metal') return `linear-gradient(135deg, ${b.c[0]} 0%, ${b.c[1]} 55%, ${b.c[0]} 100%)`;
  return `radial-gradient(circle at 32% 28%, rgba(255,255,255,.7) 0, rgba(255,255,255,0) 30%), radial-gradient(circle at 40% 35%, ${b.c[0]}, ${b.c[1]})`;
}
const margin = d => Math.max(8, 2.5 * d - 5);
const lengthOf = ids => ids.reduce((s, id) => s + (BEAD(id)?.mm || 0), 0);
function mainSize(ids) {
  const cnt = {}; ids.forEach(id => { const b = BEAD(id); if (b && !b.spacer && b.mm >= 6) cnt[b.mm] = (cnt[b.mm] || 0) + 1; });
  const k = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; return k ? +k : 8;
}
function fill(special, pattern, tail, wrist = 15) {
  if (!pattern.length) return special.concat(tail);
  const beads = [...special], target = Math.round(wrist * 10 + margin(mainSize(special.concat(pattern, tail)))) - lengthOf(tail);
  let i = 0; while (lengthOf(beads) + (BEAD(pattern[i % pattern.length])?.mm || 8) / 2 < target && beads.length < 80) beads.push(pattern[i++ % pattern.length]);
  return beads.concat(tail);
}
function ringHtml(ids, size = 220) {
  const total = lengthOf(ids); if (!total) return `<div class="ring" style="width:${size}px;height:${size}px"></div>`;
  const R = size / 2 - 14, k = (2 * Math.PI * R) / total; let cur = -Math.PI / 2;
  return `<div class="ring" style="width:${size}px;height:${size}px">` + ids.map(id => {
    const b = BEAD(id), d = (b?.mm || 8) * k, a = cur + d / 2 / R; cur += d / R;
    const w = b?.spacer ? d : d, h = b?.spacer ? d * 3 : d;
    return `<span class="bead" style="left:${size / 2 + R * Math.cos(a) - w / 2}px;top:${size / 2 + R * Math.sin(a) - h / 2}px;width:${w}px;height:${h}px;background:${beadBg(b)};${b?.spacer ? `border-radius:30%;transform:rotate(${a + Math.PI / 2}rad)` : ''}"></span>`;
  }).join('') + '</div>';
}
function ringSame(e, size = 160) {
  const n = Math.round((150 + margin(e.mm)) / e.mm), R = size / 2 - 12, d = Math.min(2 * Math.PI * R / n, 24);
  return `<div class="ring" style="width:${size}px;height:${size}px">` + Array.from({ length: n }, (_, i) => { const a = i / n * 2 * Math.PI - Math.PI / 2;
    return `<span class="bead" style="left:${size / 2 + R * Math.cos(a) - d / 2}px;top:${size / 2 + R * Math.sin(a) - d / 2}px;width:${d}px;height:${d}px;background:${beadBg(e)}"></span>`; }).join('') + '</div>';
}

// ---------- 图片：压缩上传 + 取色 ----------
function readImage(file) {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file); });
}
function toDataUrl(img, max = 1000) {
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', .88);
}
function extractBeadColors(img) {
  const n = 80, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d');
  const s = Math.min(img.naturalWidth, img.naturalHeight); x.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, n, n);
  const d = x.getImageData(0, 0, n, n).data, px = [];
  for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
    if ((xx - n / 2) ** 2 + (y - n / 2) ** 2 > (n * .3) ** 2) continue;
    const i = (y * n + xx) * 4; px.push([d[i], d[i + 1], d[i + 2], .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]]);
  }
  px.sort((a, b) => a[3] - b[3]);
  const avg = arr => '#' + [0, 1, 2].map(k => Math.round(arr.reduce((s, p) => s + p[k], 0) / arr.length).toString(16).padStart(2, '0')).join('');
  const q = Math.max(1, Math.round(px.length * .15));
  return [avg(px.slice(-q * 2, -Math.round(q / 3) || undefined)), avg(px.slice(Math.round(q / 3), q * 2))];
}
async function upload(img) { return (await api('POST', '/api/upload', { data: toDataUrl(img) })).url; }

// ---------- 多图管理 ----------
function imagesGridHtml(e) {
  const imgs = e.images || [];
  return `<div class="imgrid">
    ${imgs.map((u, i) => `<div class="imgcell">
      <div class="imgthumb"><img src="${esc(u)}" alt="">${i === 0 ? '<span class="cover-badge">主图</span>' : ''}</div>
      <div class="imgops">
        ${i !== 0 ? `<button class="mini" data-imgop="cover" data-i="${i}">设主图</button>` : ''}
        <button class="mini" data-imgop="up" data-i="${i}" ${i === 0 ? 'disabled' : ''}>上移</button>
        <button class="mini" data-imgop="down" data-i="${i}" ${i === imgs.length - 1 ? 'disabled' : ''}>下移</button>
        <button class="mini danger" data-imgop="del" data-i="${i}">删除</button>
      </div>
    </div>`).join('')}
    <label class="imgadd">＋ 添加图片<input type="file" accept="image/*" id="imgUpload" multiple hidden></label>
  </div>`;
}
function imgOpDo(e, op, i) {
  const imgs = e.images || [];
  if (op === 'cover' && i > 0) { const [x] = imgs.splice(i, 1); imgs.unshift(x); }
  else if (op === 'up' && i > 0) { [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]]; }
  else if (op === 'down' && i < imgs.length - 1) { [imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]]; }
  else if (op === 'del') imgs.splice(i, 1);
  e.images = imgs; e.photo = imgs[0] || '';
}

// ---------- 状态历史时间线（订单与售后共用） ----------
function timelineHtml(h) {
  if (!h || !h.length) return '';
  return `<div class="timeline">${h.slice().reverse().map(x => `<div class="tl"><span class="tl-dot"></span><div><span class="sub">${ts(x.at)} · ${esc(x.actor)}</span><div>${esc(GROUP_LABELS[x.group] || x.group)}：${esc(statusLabel(x.group, x.from))} → <b>${esc(statusLabel(x.group, x.to))}</b>${x.note ? ` <span class="muted">(${esc(x.note)})</span>` : ''}</div></div></div>`).join('')}</div>`;
}

// ---------- 渲染调度 ----------
const renderers = {};
function render() {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  const wide = WIDE.has(tab);
  $('main').classList.toggle('wide', wide);
  $('panel').hidden = wide;
  (renderers[tab] || (() => {}))();
}
