const KEY = 'bracelets'
const CUR = 'currentId'
const DAY = 'daily'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function list() {
  let arr = wx.getStorageSync(KEY)
  if (!arr || !arr.length) {
    arr = [{
      id: 'b' + Date.now(),
      name: '小叶紫檀手串',
      beads: new Array(18).fill('zitan'),
      size: 70,
      count: 0,
      created: Date.now()
    }]
    wx.setStorageSync(KEY, arr)
  }
  return arr
}

function saveAll(arr) { wx.setStorageSync(KEY, arr) }

function current() {
  const arr = list()
  const id = wx.getStorageSync(CUR)
  return arr.find(b => b.id === id) || arr[0]
}

function setCurrent(id) { wx.setStorageSync(CUR, id) }

function add(b) {
  const arr = list()
  arr.unshift(b)
  saveAll(arr)
  setCurrent(b.id)
}

function update(b) {
  const arr = list()
  const i = arr.findIndex(x => x.id === b.id)
  if (i >= 0) { arr[i] = b; saveAll(arr) }
}

function remove(id) {
  saveAll(list().filter(b => b.id !== id))
}

function todayCount() {
  const d = wx.getStorageSync(DAY)
  return d && d.date === today() ? d.n : 0
}

function addToday(n) {
  const v = todayCount() + n
  wx.setStorageSync(DAY, { date: today(), n: v })
  return v
}

module.exports = { list, current, setCurrent, add, update, remove, todayCount, addToday }
