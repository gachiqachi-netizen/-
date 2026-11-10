const test = require('node:test')
const assert = require('node:assert/strict')

let stack, relaunched
global.getCurrentPages = () => stack
global.wx = {
  navigateTo({ url }) { stack.push({ route: url.replace(/^\//, '') }) },
  navigateBack({ delta }) { stack.splice(stack.length - delta, delta) },
  redirectTo({ url }) { stack[stack.length - 1] = { route: url.replace(/^\//, '') } },
  reLaunch({ url }) { relaunched = url; stack = [{ route: url.split('?')[0].replace(/^\//, '') }] }
}
const nav = require('../utils/nav')

test('editor and order loop twenty times without exceeding ten pages', () => {
  stack = [{ route: 'pages/home/home' }]
  for (let i = 0; i < 20; i++) {
    nav.openEditor()
    nav.openOrder()
    assert.ok(stack.length <= 10)
  }
})

test('successful order relaunches order detail', () => {
  stack = [{ route: 'pages/order/order' }]
  nav.orderComplete('A 1')
  assert.equal(relaunched, '/pages/order-detail/order-detail?no=A%201')
})
