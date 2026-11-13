// Dimension estimates follow the H5 prototype; they are not a physical fit guarantee.
function stats(ids, catalog, wrist) {
  const map = {}; catalog.forEach(b => { map[b.id] = b })
  const found = ids.map(id => map[id]).filter(Boolean)
  const missing = ids.length - found.length
  const length = found.reduce((sum, b) => sum + Number(b.mm || 0), 0)
  const sizeCounts = {}; found.filter(b => !b.spacer && b.mat !== 'metal' && Number(b.mm) >= 6).forEach(b => { const s=Number(b.mm); sizeCounts[s]=(sizeCounts[s] || 0)+1 })
  const main = Number(Object.keys(sizeCounts).sort((a,b) => sizeCounts[b] - sizeCounts[a])[0]) || 8
  const target = Math.round(Number(wrist) * 10 + Math.max(8, 2.5 * main - 5))
  let fit = '还没有珠子'
  if (missing) fit = '部分材料已下架，请替换后继续'
  else if (ids.length >= 54) fit = '多圈串长度请根据实际佩戴确认'
  else if (ids.length) { const diff=length-target; fit=diff < -4 ? `还差约 ${Math.round(-diff)}mm` : diff > 6 ? `超出约 ${Math.round(diff)}mm` : '长度基本合适' }
  return { length, target, fit, missing, price: found.reduce((sum,b)=>sum+Number(b.price||0),0), map }
}
function fill(ids, catalog, wrist, id) {
  const items=ids.slice(), initial=stats(items,catalog,wrist), bead=initial.map[id]
  if (initial.missing || !bead || !Number.isFinite(Number(bead.mm)) || Number(bead.mm)<=0) return items
  while (items.length < 80) { const next=stats(items.concat(id),catalog,wrist); if (stats(items,catalog,wrist).length+Number(bead.mm)/2 >= next.target) break; items.push(id) }
  return items
}
function move(ids, index, delta) {
  const items=ids.slice(); if (index < 0 || index >= items.length || items.length < 2) return {items,index}
  const other=(index+delta+items.length)%items.length; [items[index],items[other]]=[items[other],items[index]]; return {items,index:other}
}
function setCount(ids, catalog, wrist, count) {
  const map={}; catalog.forEach(b=>{map[b.id]=b}); if(ids.some(id=>!map[id])) return null
  const isAcc=b=>b.spacer||b.mat==='metal', mains=ids.map(id=>map[id]).filter(b=>!isAcc(b)); if(!mains.length) return null
  const names={}; mains.forEach(b=>{names[b.name]=(names[b.name]||0)+1}); const name=Object.keys(names).sort((a,b)=>names[b]-names[a])[0]
  let best=null
  catalog.filter(b=>b.name===name&&!isAcc(b)&&Number(b.mm)>0).forEach(b=>{
    const seq=[];let j=0,n=0
    while(n<count&&j<600){const orig=map[ids[j%ids.length]], item=orig.name===name&&!isAcc(orig)?b:orig;seq.push(item.id);if(!isAcc(item))n++;j++}
    const length=seq.reduce((s,id)=>s+Number(map[id].mm||0),0), diff=length-(Number(wrist)*10+Math.max(8,2.5*Number(b.mm)-5))
    if(!best||Math.abs(diff)<Math.abs(best.diff))best={seq,diff,bead:b}
  })
  return best&&Math.abs(best.diff)<=12?best:null
}
module.exports={stats,fill,move,setCount}
