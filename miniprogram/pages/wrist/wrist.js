const { queue: toast } = require('../../utils/toast')
const store = require('../../utils/design')
const logic = require('../diy/logic')
const api = require('../../utils/api')
const MIN = 8, MAX = 30
function count(wrist, mm) { return Math.round(logic.stats(['sample'], [{id:'sample', mm}], wrist).target / mm) }
Page({
  data: {wrist:15, display:'15.0', mm:8, count:21, measured:false, noTape:false, min:false, max:false, marker:32},
  onLoad(options) {
    const design = store.current(), saved = Number(wx.getStorageSync('cgz_wrist')), current = Number(design && design.wrist)
    const fromEditor = options && options.source === 'editor'
    const wrist = fromEditor && current >= MIN && current <= MAX ? current : saved >= MIN && saved <= MAX ? saved : current >= MIN && current <= MAX ? current : 15
    this.setData({measured:!!wx.getStorageSync('cgz_wrist_confirmed')}); this.setWrist(wrist)
    if (design && design.beads && design.beads.length) api.catalog().then(c => {
      const result = logic.stats(design.beads, c.beads || [], wrist)
      const sizes = {}
      design.beads.map(id => result.map[id]).filter(b => b && !b.spacer && b.mat !== 'metal' && Number(b.mm) >= 6).forEach(b => { sizes[b.mm] = (sizes[b.mm] || 0) + 1 })
      const main = Object.keys(sizes).sort((a,b) => sizes[b] - sizes[a] || Number(a) - Number(b))[0]
      if (main) { this.setData({mm:Number(main)}); this.setWrist(this.data.wrist) }
    }).catch(() => {})
  },
  setWrist(value) {
    const wrist = Math.max(MIN, Math.min(MAX, Math.round(value * 2) / 2)), mm = this.data.mm || 8
    this.setData({wrist, display:wrist.toFixed(1), count:count(wrist,mm), min:wrist<=MIN, max:wrist>=MAX, marker:(wrist-MIN)/(MAX-MIN)*100})
  },
  step(e) {
    const next = this.data.wrist + Number(e.currentTarget.dataset.step)
    if (next < MIN || next > MAX) return toast.show({ text: '这个数不太像手围，再量一次看看' })
    this.setWrist(next); if (wx.vibrateShort) wx.vibrateShort({type:'light'})
  },
  rulerStart(e) { this.startX=e.touches[0].clientX; this.startWrist=this.data.wrist },
  rulerMove(e) {
    if (this.startX === undefined) return
    const next=this.startWrist+Math.round((e.touches[0].clientX-this.startX)/18)*0.5
    if (next >= MIN && next <= MAX && next !== this.data.wrist) { this.setWrist(next); if (wx.vibrateShort) wx.vibrateShort({type:'light'}) }
  },
  rulerEnd() { this.startX=undefined },
  tape(e) { this.setData({noTape:e.currentTarget.dataset.tape==='no'}) },
  confirm() {
    const wrist=this.data.wrist
    wx.setStorageSync('cgz_wrist',wrist); wx.setStorageSync('cgz_wrist_confirmed',true)
    const design=store.current(); if (design) { design.wrist=wrist; store.selected(design) }
    wx.navigateBack({success:() => toast.show({ text: `已按 ${wrist}cm 重新判断` })})
  }
})
