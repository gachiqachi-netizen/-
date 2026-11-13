// A single display model for current materials and frozen order snapshots.
function group(beads) {
  const rows=new Map()
  for(const bead of beads){
    if(!bead)continue
    let row=rows.get(bead.id)
    if(!row){
      const unitPriceFen=Number.isInteger(bead.unitPriceFen)?bead.unitPriceFen:Math.round(Number(bead.price||0)*100)
      const safety=typeof bead.safety==='string'?bead.safety:(bead.safety&&bead.safety.note)||''
      row={...bead,qty:0,unitPriceFen,unit:(unitPriceFen/100).toFixed(2),pointsText:Array.isArray(bead.points)?bead.points.join(' · '):'',explanation:(typeof bead.meaning==='string'?bead.meaning:bead.meaning&&bead.meaning.text)||bead.summary||'',safety,subtotalFen:0}
      rows.set(bead.id,row)
    }
    row.qty++;row.subtotalFen+=row.unitPriceFen;row.subtotal=(row.subtotalFen/100).toFixed(2)
  }
  return Array.from(rows.values())
}
function fromCatalog(ids,catalog){const map=new Map(catalog.map(b=>[b.id,b]));return group(ids.map(id=>map.get(id)))}
function safetyLines(rows){return rows.filter(r=>r.safety).map(r=>r.name+'：'+r.safety).join('\n')}
module.exports={fromCatalog,fromSnapshot:group,safetyLines}
