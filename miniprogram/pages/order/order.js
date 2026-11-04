const auth=require('../../utils/auth'),store=require('../../utils/design'),api=require('../../utils/api'), sizing=require('../editor/logic')
// Store only a compact fingerprint and request ID; the shipping address is not persisted here.
function fingerprint(text){let a=2166136261,b=2246822519;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,3266489917)}return (a>>>0).toString(16)+'-'+(b>>>0).toString(16)+'-'+text.length}
const KEY='cgz_pending_order_request'
function requestId(payload){const key=fingerprint(JSON.stringify(payload)),pending=wx.getStorageSync(KEY)||{};if(pending[key])return pending[key];const id='order_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)+'_'+Math.random().toString(36).slice(2);pending[key]=id;wx.setStorageSync(KEY,pending);return id}
Page({
  data:{design:null,person:'',phone:'',addr:'',error:'',busy:false,order:null,cord:0,gift:false,items:[],preview:[],missing:[],goods:'0.00',ship:'0.00',total:'0.00',catalogReady:false,length:'0.0',catalog:[],fit:'',previewFallback:false},
  onShow(){const design=store.current();this.setData({design,cord:design&&design.cord===1?1:0,catalogReady:false});if(!design)return;api.catalog(true).then(c=>{this.catalog=c.beads||[];this.calculate()}).catch(e=>this.setData({catalogReady:false,error:'材料信息加载失败，请返回后重试：'+e.message}))},
  calculate(){const {design,cord,gift}=this.data;if(!design)return;const map=Object.fromEntries(this.catalog.map(b=>[b.id,b])), counts={},missing=[];let goods=0,length=0;design.beads.forEach(id=>{const bead=map[id];if(!bead){if(!missing.includes(id))missing.push(id);return}counts[id]=(counts[id]||0)+1;goods+=Math.round(Number(bead.price)*100);length+=Number(bead.mm)||0});const preview=design.beads.map((id,i)=>{const a=2*Math.PI*i/design.beads.length-Math.PI/2,b=map[id];return {x:50+36*Math.cos(a),y:50+36*Math.sin(a),color:b&&b.c&&b.c[0]||'#aaa'}});const items=Object.keys(counts).map(id=>({id,name:map[id].name,mm:map[id].mm,qty:counts[id],unit:Number(map[id].price).toFixed(2),color:(map[id].c||[])[0]||'#aaa',photo:map[id].photo?(/^https?:/.test(map[id].photo)?map[id].photo:getApp().globalData.apiBase+map[id].photo):'',subtotal:(Math.round(Number(map[id].price)*100)*counts[id]/100).toFixed(2)}));const sub=goods+1500+(cord===1?500:0)+(gift?1000:0),ship=sub>=9900?0:800;const fit=sizing.stats(design.beads,this.catalog,design.wrist).fit;this.setData({catalogReady:true,catalog:this.catalog,fit,items,preview,missing,goods:(goods/100).toFixed(2),ship:(ship/100).toFixed(2),total:((sub+ship)/100).toFixed(2),length:(length/10).toFixed(1)})},
  input(e){this.setData({[e.currentTarget.dataset.key]:e.detail.value})},
  setCord(e){this.setData({cord:Number(e.currentTarget.dataset.cord)},()=>this.calculate())},
  setGift(e){this.setData({gift:!!e.detail.value},()=>this.calculate())},
  edit(){wx.navigateTo({url:'/pages/editor/editor'})},
  wrist(){wx.navigateTo({url:'/pages/wrist/wrist?source=editor'})},
  unavailable(){this.setData({previewFallback:true})},
  async submit(){
    const {design,person,phone,addr,cord,gift,catalogReady,missing}=this.data
    if(this.data.busy||this.data.order)return
    if(!design)return this.setData({error:'未找到设计，请返回重新选择'})
    if(!catalogReady||missing.length)return this.setData({error:'部分材料已下架或不可用，请返回修改设计'})
    if(!person.trim()||!phone.trim()||!addr.trim())return this.setData({error:'请填写完整收货信息'})
    if(!/^1\d{10}$/.test(phone.trim()))return this.setData({error:'请输入有效的 11 位手机号'})
    const before=JSON.stringify({design,cord,gift,person,phone,addr}), oldTotal=this.data.total, oldItems=JSON.stringify(this.data.items)
    this.setData({busy:true,error:'',catalogReady:false})
    try {
      const c=await api.catalog(true)
      if(before!==JSON.stringify({design:this.data.design,cord:this.data.cord,gift:this.data.gift,person:this.data.person,phone:this.data.phone,addr:this.data.addr})) { this.catalog=c.beads||[];this.calculate();this.setData({error:'订单信息已更改，请检查后重新提交。'});return }
      this.catalog=c.beads||[];this.calculate()
      if(this.data.missing.length){this.setData({error:'部分材料已下架或不可用，请返回修改设计。'});return}
      if(this.data.total!==oldTotal || JSON.stringify(this.data.items)!==oldItems){this.setData({error:'材料信息或价格已更新，请核对后重新提交。'});return}
      if(this.data.fit !== '长度基本合适') {
        const result=await new Promise(resolve=>wx.showModal({title:'请确认制作尺寸',content:'手围 '+design.wrist+'cm，珠串总长 '+this.data.length+'cm。'+this.data.fit+'。如需单圈建议返回调整；多圈请先核实实际佩戴尺寸。',confirmText:'确认此尺寸',cancelText:'返回调整',success:resolve,fail:()=>resolve({confirm:false})}));
        if(!result.confirm){this.setData({error:'尚未确认尺寸，请调整设计后再提交。'});return}
        if(before!==JSON.stringify({design:this.data.design,cord:this.data.cord,gift:this.data.gift,person:this.data.person,phone:this.data.phone,addr:this.data.addr})){this.setData({error:'订单信息已更改，请重新核对。'});return}
      }
      const confirmedQuote={totalFen:Math.round(Number(this.data.total)*100),items:this.data.items.map(item=>({id:item.id,unitPriceFen:Math.round(Number(item.unit)*100),mm:Number(item.mm)}))}
      const payload={name:design.name,beads:design.beads,wrist:design.wrist,cord,gift,person:person.trim(),phone:phone.trim(),addr:addr.trim(),confirmedQuote}
      payload.requestId=requestId(payload)
      const order=await auth.authorized('/my/orders',payload)
      const pending=wx.getStorageSync(KEY)||{};Object.keys(pending).forEach(k=>{if(pending[k]===payload.requestId)delete pending[k]});wx.setStorageSync(KEY,pending);this.setData({order})
    } catch(e) {
      if(e.code==='price_changed') {
        try { const c=await api.catalog(true);this.catalog=c.beads||[];this.calculate();this.setData({error:'材料或价格已变化，请核对更新后的订单，再决定是否提交。'}) }
        catch(_) { this.setData({catalogReady:false,error:'材料或价格已变化，刷新失败，请重新进入订单页核对。'}) }
      } else this.setData({catalogReady:false,error:e.code==='idempotency_conflict'?'订单请求有冲突，请先查看我的订单并联系客服确认。':(e.message||'提交失败')+'。请重新进入订单页核对后重试，或到我的订单查看。'})
    }
    finally { this.setData({busy:false}) }
  },
  mine(){wx.switchTab({url:'/pages/mine/mine'})},
  home(){wx.switchTab({url:'/pages/home/home'})}
})
