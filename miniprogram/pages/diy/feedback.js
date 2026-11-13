// D16 工作台反馈表：文案由操作和当时状态决定，不读取页面或微信对象。
function message(type, state = {}) {
  const name = state.name || '珠子'
  switch (type) {
    case 'add': return `+1 ${name}`
    case 'firstAdd': return `+1 ${name}　长按珠子可以看详情`
    case 'fit': return `+1 ${name} · 刚好合适`
    case 'over': return null
    case 'removeLast': return `已去掉 1 颗${name}`
    case 'finishShort': return `还差约 ${state.mm}mm，再加 1 颗就合适`
    case 'finishFew': return `至少 6 颗才能串成一条，还差 ${Math.max(0, 6 - state.count)} 颗`
    case 'finishOK': return null
    case 'select': return null
    case 'move': return null
    case 'replace': return `已换成${name}`
    case 'delete': return `已删除 1 颗${name}`
    case 'undo': return '已撤销'
    case 'selectKind': return null
    case 'inspect': return null
    case 'safety': return null
    case 'outOfStock': return '这颗暂时缺货，看看相似的'
    case 'multi': return '已经是多圈串了，长度以实际佩戴为准'
    case 'stackEmpty': return '先串好一条，才能叠着看'
    case 'shareFew': return '至少 6 颗才能分享'
    case 'rename': return '已改名'
    case 'unnamedFinish': return `先叫它“${state.name || '海风'}”，随时能改`
    case 'more': return null
    case 'autoSave': return '已存到我的作品'
    case 'wrist': return `已按 ${state.wrist}cm 重新判断`
    case 'catalogError': return null
    default: return null
  }
}
module.exports = { message }
