const { variants, fitHint, unitPrice } = require('./model')
Component({
  options: { styleIsolation: 'apply-shared' },
  properties: {
    show: {type:Boolean,value:false}, bead: {type:Object,value:null},
    catalog: {type:Array,value:[]}, design: {type:Object,value:null},
    safetyNote: {type:String,value:''}, safetyCare: {type:String,value:''}
  },
  data: {selected:null, sizes:[], quantity:1, imageIndex:0, images:[], hint:'', price:'0', similar:null},
  observers: {
    'bead,catalog,design,show'(bead,catalog,design,show) {
      if (!show || !bead) return
      const sizes=variants(bead,catalog), selected=sizes.find(item=>item.id===bead.id&&item.available)||sizes.find(item=>item.available)||null
      const images=Array.isArray(bead.images)?bead.images.slice(0,3):[]
      this.setData({sizes,selected,quantity:1,imageIndex:0,images,price:unitPrice(selected),hint:fitHint(design,catalog,selected,1),similar:!selected?(catalog||[]).find(item=>item.name!==bead.name&&item.mat===bead.mat&&item.onSale!==false&&item.stock!=='out_of_stock'):null})
    }
  },
  methods: {
    close(){this.triggerEvent('close')},
    slide(e){this.setData({imageIndex:e.detail.current})},
    selectSize(e){const selected=this.data.sizes.find(item=>item.id===e.currentTarget.dataset.id);if(!selected||!selected.available)return;this.setData({selected,price:unitPrice(selected),hint:fitHint(this.data.design,this.data.catalog,selected,this.data.quantity)})},
    step(e){const quantity=Math.max(1,Math.min(80, this.data.quantity+Number(e.currentTarget.dataset.delta)));this.setData({quantity,hint:fitHint(this.data.design,this.data.catalog,this.data.selected,quantity)})},
    add(){if(!this.data.selected)return;this.triggerEvent('add',{id:this.data.selected.id,quantity:this.data.quantity})},
    similar(){if(this.data.similar)this.triggerEvent('similar',{id:this.data.similar.id})}
  }
})
