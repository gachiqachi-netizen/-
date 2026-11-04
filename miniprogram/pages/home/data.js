const templates = require('../../utils/template')
const store = require('../../utils/design')
function wrist() { const n = Number(wx.getStorageSync('cgz_wrist')); return n >= 8 && n <= 30 ? n : 15 }
function materialUrl(path) { if (!path) return ''; return /^https?:/.test(path) ? path : getApp().globalData.apiBase + path }
function catalogCards(data) {
  const beads = data.beads || [], dict = Object.fromEntries(beads.map(b => [b.id,b]))
  return (data.templates || []).map(t => {
    const ids = templates.build(t, beads, wrist()); if (!ids) return null
    const tags = []; ids.forEach(id => (dict[id].tags || []).forEach(tag => { if (tag !== '点缀' && !tags.includes(tag)) tags.push(tag) }))
    const length = ids.reduce((n,id) => n + Number(dict[id].mm || 0), 0)
    const price = ids.reduce((n,id) => n + Number(dict[id].price || 0), 15)
    return {...t, beads:ids, tags:tags.slice(0,2), length, price:Math.round(price*100)/100, coverUrl:materialUrl(t.cover)}
  }).filter(Boolean)
}
function selectCard(card) { const d=store.create(); d.wrist=wrist(); d.name=card.name; d.beads=card.beads.slice(); d.source='tpl'; d.tplId=card.id; d.meaning=card.meaning||''; d.pattern=(card.pattern||[]).slice(); d.special=(card.special||[]).slice(); d.tail=(card.tail||[]).slice(); d.fixed=card.fixed||null; store.selected(d); return d }
function goWrist() { wx.navigateTo({url:'/pages/wrist/wrist'}) }
function openEditor(card, mode) { if (card) selectCard(card); else { const d=store.create();d.wrist=wrist();store.selected(d) } if(mode==='try') wx.navigateTo({url:'/pages/tryon/tryon'}); else wx.navigateTo({url:'/pages/editor/editor'}) }
module.exports = {wrist,catalogCards,selectCard,openEditor,goWrist}
