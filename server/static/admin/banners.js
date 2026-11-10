/* 宣传位 */
function renderBanners() {
  $('bar').innerHTML = `<h2 class="grow">宣传位（${data.banners.length}）</h2><button class="btn" id="new">新建宣传位</button>`;
  const tname = id => data.templates.find(t => t.id === id)?.name || '（模板已删除）';
  $('list').innerHTML = `<div class="list">` + data.banners.map(b => `
    <button class="row ${editing?.id === b.id ? 'on' : ''} ${b.on === false ? 'off' : ''}" data-id="${esc(b.id)}" style="grid-template-columns:minmax(0,1fr)">
      <span><div class="nm"><span class="tag">${esc(b.tag)}</span>${esc(b.title)}${b.on === false ? ' <span class="tag">已关闭</span>' : ''}</div>
      <div class="sub">${esc(b.sub)}</div><div class="sub">点击去：${b.tpl ? '模板「' + esc(tname(b.tpl)) + '」' : b.go === 'ai' ? 'AI 配' : '自己串'}${b.newUser ? ' · 只给没下过单的人看' : ''}</div></span></button>`).join('') + `</div>`;
  $('bar').onclick = e => { if (e.target.id === 'new') editBanner(null); };
  $('list').onclick = e => { const r = e.target.closest('[data-id]'); if (r) editBanner(data.banners.find(b => b.id === r.dataset.id)); };
}
function editBanner(b) {
  editing = b ? JSON.parse(JSON.stringify(b)) : { tag: '', title: '', sub: '', tpl: '', go: 'diy', newUser: false, on: true, order: (data.banners.length + 1) * 10 };
  renderBanners();
  const e = editing, link = e.tpl ? 'tpl:' + e.tpl : 'go:' + (e.go || 'diy');
  $('panel').innerHTML = `
    <div class="bar" style="margin:0"><h2 class="grow">${e.id ? '编辑宣传位' : '新建宣传位'}</h2></div>
    <div class="fields">
      <label class="f">角标<input type="text" id="nTag" maxlength="6" value="${esc(e.tag)}" placeholder="例：考试季"></label>
      <label class="f">排序<input type="number" id="nOrder" value="${e.order ?? ''}"></label>
      <label class="f wide">标题<input type="text" id="nTitle" maxlength="12" value="${esc(e.title)}" placeholder="例：金榜题名手串"></label>
      <label class="f wide">一句说明<input type="text" id="nSub" maxlength="24" value="${esc(e.sub)}"></label>
      <label class="f wide">点击后去哪<select id="nLink"><option value="go:diy" ${link === 'go:diy' ? 'selected' : ''}>自己串</option><option value="go:ai" ${link === 'go:ai' ? 'selected' : ''}>AI 配</option>
        ${data.templates.map(t => `<option value="tpl:${t.id}" ${link === 'tpl:' + t.id ? 'selected' : ''}>模板：${esc(t.name)}</option>`).join('')}</select></label>
      <label class="check wide"><input type="checkbox" id="nNew" ${e.newUser ? 'checked' : ''}>新人活动：只给没下过单的人看</label>
      <label class="check wide"><input type="checkbox" id="nOn" ${e.on !== false ? 'checked' : ''}>显示</label>
    </div>
    <div class="err" id="nErr"></div>
    <div class="bar" style="margin:0">${e.id ? '<button class="btn danger" id="nDel">删除</button>' : ''}<span class="grow"></span><button class="btn" id="nSave">保存</button></div>`;
  $('panel').onclick = async ev => {
    if (ev.target.id === 'nSave') {
      const l = $('nLink').value.split(':');
      Object.assign(e, { tag: $('nTag').value.trim(), title: $('nTitle').value.trim(), sub: $('nSub').value.trim(), order: +$('nOrder').value || 0,
        newUser: $('nNew').checked, on: $('nOn').checked, tpl: l[0] === 'tpl' ? l[1] : '', go: l[0] === 'go' ? l[1] : '' });
      $('nErr').textContent = '';
      try {
        const saved = e.id ? await api('PUT', `/api/admin/banners/${e.id}`, e) : await api('POST', '/api/admin/banners', e);
        editing = saved; await load('banners'); toast('已保存'); render(); editBanner(saved);
      } catch (err) { $('nErr').textContent = err.message; }
    }
    if (ev.target.id === 'nDel') {
      (async () => { if (!await confirmBox('确认删除', `确定删除宣传位「${esc(e.title)}」吗？`)) return; try { await api('DELETE', `/api/admin/banners/${e.id}`); editing = null; await load('banners'); $('panel').innerHTML = '<div class="empty">已删除</div>'; render(); } catch (err) { toast(err.message); } })();
    }
  };
}
renderers.banners = renderBanners;
