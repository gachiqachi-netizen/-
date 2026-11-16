#!/usr/bin/env node
'use strict'
const automator = require('miniprogram-automator')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const templates = require('../../miniprogram/utils/template')
const pages = require('./pages.json')
const base = process.env.SHOOT_BASE_URL || 'http://127.0.0.1:8801'
const project = path.resolve(__dirname, '../../miniprogram')
const cli = process.env.WECHAT_DEVTOOLS_CLI || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

function options() {
  const args = process.argv.slice(2)
  const get = name => { const i = args.indexOf(name); return i < 0 ? '' : args[i + 1] || '' }
  if (!get('--out')) throw new Error('用法：node tools/shoot/shoot.js --out docs/reports/shots/<卡号>/<before|after> [--only order-confirm,order-detail]')
  const only = get('--only').split(',').map(x => x.trim()).filter(Boolean)
  const unknown = only.filter(x => !pages.some(p => p.name === x || p.name.startsWith(x + '-')))
  if (unknown.length) throw new Error('未知页面：' + unknown.join(', '))
  return { out: path.resolve(get('--out')), only, timing: args.includes('--timing') }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function waitReady(page) {
  const started = Date.now()
  let legacyWaited = false
  while (Date.now() - started < 10000) {
    const data = await page.data()
    if (Object.prototype.hasOwnProperty.call(data || {}, 'ready')) {
      if (data.ready === true) return { ms: Date.now() - started, source: 'ready' }
    } else {
      const skeleton = await page.$('.c-skeleton') || await page.$('c-skeleton')
      if (!skeleton) {
        // Older pages may have no skeleton at all. Give their first render a short grace period.
        if (legacyWaited) return { ms: Date.now() - started, source: 'no-skeleton' }
        legacyWaited = true
        await sleep(800)
        continue
      }
    }
    await sleep(200)
  }
  throw new Error('未加载完：10 秒内未出现 ready: true，或骨架仍在画面中')
}

async function screenWarnings(page) {
  const data = await page.data()
  const hasFreeProduct = (data.catalog || data.items || []).some(item =>
    item && (item.priceFen === 0 || item.price === 0))
  const nodes = [...await page.$$('text'), ...await page.$$('button')]
  const visible = (await Promise.all(nodes.map(node => node.text().catch(() => '')))).join(' ')
  const warnings = []
  for (const value of ['NaN', 'undefined', '0 种']) {
    if (visible.includes(value)) warnings.push(value)
  }
  if (!hasFreeProduct && visible.includes('¥0.00')) warnings.push('¥0.00')
  return warnings
}

async function openPage(mini, url) {
  return ['/pages/home/home', '/pages/diy/diy', '/pages/ai/ai', '/pages/mine/mine'].includes(url)
    ? mini.switchTab(url) : mini.reLaunch(url)
}

async function api(route, { method = 'GET', body, token, cookie } = {}) {
  const response = await fetch(base + '/api' + route, { method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${data.error || ''}`)
  return { data, response }
}

async function adminCookie() {
  const username = 't1_shoot', password = 'T1-test-only-pass'
  const login = () => api('/admin/session', { method: 'POST', body: { username, password } })
  let result
  try { result = await login() }
  catch (error) {
    const adminToken = process.env.SHOOT_ADMIN_TOKEN || process.env.ADMIN_TOKEN
    if (!adminToken) throw new Error('首次截图需要 SHOOT_ADMIN_TOKEN（与本地服务的 ADMIN_TOKEN 相同）')
    result = await api('/admin/session', { method: 'POST', body: { username, password: adminToken } })
  }
  let cookie = result.response.headers.get('set-cookie')?.split(';', 1)[0]
  if (result.data.bootstrap) {
    await api('/admin/accounts/bootstrap', { method: 'POST', cookie,
      body: { username, name: '截图测试负责人', password } })
    result = await login()
    cookie = result.response.headers.get('set-cookie')?.split(';', 1)[0]
  }
  if (!cookie) throw new Error('后台测试会话没有 Cookie')
  return cookie
}

async function seed() {
  const { data: catalog } = await api('/catalog')
  const template = catalog.templates?.[0]
  const beads = template && templates.build(template, catalog.beads, 15)
  if (!beads || beads.length < 6) throw new Error('首个模板不能生成可下单手串')
  const design = { name: template.name, meaning: template.meaning || '', beads, wrist: 15,
    source: 'tpl', tplId: template.id, special: template.special || [],
    pattern: template.pattern || [], tail: template.tail || [] }
  const { data: session } = await api('/auth/dev', { method: 'POST', body: { name: 'T1-auto-screenshots' } })
  const token = session.token
  await api('/auth/phone', { method: 'POST', token, body: { code: 'dev-00000000' } })
  await api('/designs', { method: 'POST', token, body: design })
  const { data: shared } = await api('/shares', { method: 'POST', token, body: design })
  const byId = Object.fromEntries(catalog.beads.map(bead => [bead.id, bead]))
  const price = id => Number.isInteger(byId[id].priceFen) ? byId[id].priceFen : Math.round(Number(byId[id].price) * 100)
  const goods = beads.reduce((sum, id) => sum + price(id), 0)
  const subtotal = goods + catalog.pricing.handworkFen
  const totalFen = subtotal + (subtotal >= catalog.pricing.freeShippingThresholdFen ? 0 : catalog.pricing.shippingFen)
  const confirmedQuote = { totalFen, items: [...new Set(beads)].map(id => ({ id, unitPriceFen: price(id), mm: byId[id].mm })) }
  const createOrder = async () => (await api('/my/orders', { method: 'POST', token, body: {
    requestId: 't1-shoot-' + randomUUID(), name: template.name, beads, wrist: 15, cord: 0, gift: false,
    person: '演示收货人', phone: '10000000000', addr: '测试地址，不发货', confirmedQuote } })).data
  const pending = await createOrder(), paid = await createOrder()
  const transit = await createOrder(), saleOrder = await createOrder(), reviewOrder = await createOrder()
  const cookie = await adminCookie()
  const adminPut = (no, action, body) => api(`/admin/orders/${encodeURIComponent(no)}/${action}`,
    { method: 'PUT', body, cookie })
  const advance = async (no, delivered) => {
    const { data: started } = await api(`/my/orders/${encodeURIComponent(no)}/pay`, { method: 'POST', token, body: {} })
    await api('/payments/mock/notify', { method: 'POST', token,
      body: { orderNo: no, paymentId: started.payment.paymentId, result: 'success' } })
    await adminPut(no, 'status', { group: 'fulfillmentStatus', to: 'producing' })
    await adminPut(no, 'quality-gate', { sequenceOk: true, sizeOk: true, materialOk: true,
      appearanceOk: true, inspector: '截图测试质检' })
    await adminPut(no, 'status', { group: 'fulfillmentStatus', to: 'shipped',
      logistics: { carrierName: '测试快递', trackingNo: 'TEST123456' } })
    await adminPut(no, 'status', { group: 'logisticsStatus', to: 'in_transit' })
    if (delivered) await api(`/my/orders/${encodeURIComponent(no)}/actions/confirm_receipt`, { method: 'POST', token, body: {} })
  }
  await advance(paid.no, true)
  await advance(transit.no, false)
  await advance(saleOrder.no, true)
  await advance(reviewOrder.no, true)
  await api(`/my/orders/${encodeURIComponent(reviewOrder.no)}/review`, { method: 'POST', token,
    body: { stars: 5, text: '手串颜色很喜欢，寓意也好。', photoIds: [], anonymous: true } })
  const { data: choices } = await api(`/my/orders/${encodeURIComponent(saleOrder.no)}/after-sale-options`, { token })
  const choice = choices.types.find(x => x.type === '退货退款') || choices.types[0]
  if (!choice) throw new Error('已签收订单没有可申请的售后类型')
  const { data: sale } = await api(`/my/orders/${encodeURIComponent(saleOrder.no)}/after-sales`, { method: 'POST', token,
    body: { type: choice.type, reason: choice.reasons[0], userNote: '截图测试售后',
      idempotencyKey: 't1-shoot-' + randomUUID(), contactPhone: '10000000000' } })
  return { token, expiry: session.expiresAt, design, pendingNo: pending.no, paidNo: paid.no,
    transitNo: transit.no, saleOrderNo: saleOrder.no, saleNo: sale.afterSale.no,
    shareId: shared.shareId, saleType: encodeURIComponent(choice.type) }
}

async function connect() {
  if (!fs.existsSync(cli)) throw new Error('找不到微信开发者工具 CLI：' + cli)
  let output
  try { output = execFileSync(cli, ['auto', '--project', project, '--auto-port', '9421'],
    { encoding: 'utf8', timeout: 45000, maxBuffer: 1024 * 1024 }) }
  catch (error) { throw new Error('开发者工具自动化未就绪。请在「设置 → 安全设置」打开「服务端口」，然后重试。' + (error.stdout || error.stderr || error.message)) }
  const port = Number(output.match(/"autoPort":\s*(\d+)/)?.[1])
  if (!port) throw new Error('开发者工具没有返回自动化端口。请检查「设置 → 安全设置 → 服务端口」。')
  return automator.connect({ wsEndpoint: `ws://127.0.0.1:${port}` })
}

async function capture(mini, destination) {
  const raw = path.join(os.tmpdir(), 'chuan-t1-' + randomUUID() + '.png')
  try {
    await mini.screenshot({ path: raw })
    execFileSync('/usr/bin/sips', ['--resampleHeightWidth', '844', '390', raw, '--out', destination])
    if (fs.statSync(destination).size > 300 * 1024) throw new Error('截图大于 300KB：' + destination)
  } finally { try { fs.unlinkSync(raw) } catch (_) {} }
}

async function runTiming(mini, data, selected, out) {
  const rows = []
  for (const item of selected) {
    const url = item.path.replace(/\{(\w+)\}/g, (_, key) => data[key])
    const samples = []
    for (const phase of ['cold', 'cached']) {
      try {
        if (phase === 'cold') {
          await mini.callWxMethod('clearStorageSync')
          await mini.callWxMethod('setStorageSync', 'cgz_token', data.token)
          await mini.callWxMethod('setStorageSync', 'cgz_expiry', data.expiry)
          const design = { id: 't2-timing-design', ...data.design }
          await mini.callWxMethod('setStorageSync', 'cgz_current_design', design)
          await mini.callWxMethod('setStorageSync', 'cgz_miniprogram_designs', [design])
        }
        const opened = Date.now()
        const page = await mini.reLaunch(url)
        if (!page) throw new Error('页面没有打开')
        const ready = await waitReady(page)
        const ms = Date.now() - opened
        const warnings = await screenWarnings(page)
        samples.push({ ms, source: ready.source, warnings })
        console.log(`${item.name} ${phase}: ${ms}ms (${ready.source})`)
        if (warnings.length) console.warn(`\x1b[31m警告 ${item.name}: ${warnings.join('、')}\x1b[0m`)
      } catch (error) {
        samples.push({ error: error.message })
        console.error(`${item.name} ${phase}: ${error.message}`)
      }
    }
    rows.push({ name: item.name, cold: samples[0], cached: samples[1] })
  }
  const cell = sample => sample.error ? `失败：${sample.error}` : `${sample.ms} (${sample.source})`
  const lines = ['# 小程序页面加载耗时', '', '从打开页面到 `ready: true`；旧页面回退到骨架消失。单位：毫秒。', '',
    '| 页面 | 冷启动 | 有缓存 | 警告 |', '| --- | ---: | ---: | --- |',
    ...rows.map(row => `| ${row.name} | ${cell(row.cold)} | ${cell(row.cached)} | ${[...(row.cold.warnings || []), ...(row.cached.warnings || [])].join('、') || '无'} |`), '']
  fs.writeFileSync(path.join(out, 'timing.md'), lines.join('\n'))
  if (rows.some(row => row.cold.error || row.cached.error)) process.exitCode = 1
}

async function main() {
  const { out, only, timing } = options()
  const selected = pages.filter(p => !only.length || only.some(key => p.name === key || p.name.startsWith(key + '-')))
  fs.mkdirSync(out, { recursive: true })
  const started = Date.now(), mini = await connect(), results = []
  try {
    const device = await mini.systemInfo()
    if (device.screenWidth !== 390 || device.screenHeight !== 844 || !/^iPhone 12\/13/.test(device.model)) {
      throw new Error(`请在开发者工具模拟器选 iPhone 12/13 (Pro)（390×844）；当前是 ${device.model} ${device.screenWidth}×${device.screenHeight}`)
    }
    const data = await seed()
    if (timing) {
      await runTiming(mini, data, selected, out)
      return
    }
    console.log('自动化已连接，准备登录与选模板')
    await mini.callWxMethod('setStorageSync', 'cgz_token', data.token)
    await mini.callWxMethod('setStorageSync', 'cgz_expiry', data.expiry)
    console.log('开发版登录已写入')
    const home = await mini.reLaunch('/pages/home/home')
    console.log('首页已打开')
    await home.waitFor(1000)
    const templateCard = await home.$('.tpl')
    if (!templateCard) throw new Error('首页没有模板卡片')
    await templateCard.tap()
    console.log('模板已选择')
    for (const item of selected) {
      try {
        const url = item.path.replace(/\{(\w+)\}/g, (_, key) => data[key])
        const page = await openPage(mini, url)
        if (!page) throw new Error('页面没有打开')
        if (item.name === 'ai-match') {
          const newChat = await page.$('.ai-new')
          if (newChat) { await newChat.tap(); await page.waitFor(300) }
          const example = await page.$('.ai-example')
          if (!example) throw new Error('AI 配示例入口不存在')
          await example.tap()
          let complete = false
          for (let attempt = 0; attempt < 30; attempt++) {
            await page.waitFor(1000)
            const messages = await page.data('messages') || []
            if (!await page.data('busy') && messages.some(message => message.role === 'assistant')) {
              complete = true
              break
            }
          }
          if (!complete) throw new Error('AI 配 30 秒内没有返回完整方案')
        }
        if (item.name === 'order-confirm') {
          const gift = (await page.$$('.rows .row'))[2]
          if (!gift) throw new Error('送礼入口不存在')
          await gift.tap()
        }
        const ready = await waitReady(page)
        const state = await page.data()
        if (state.error || state.configError) throw new Error(state.error || state.configError)
        const warnings = await screenWarnings(page)
        if (warnings.length) console.warn(`\x1b[31m警告 ${item.name}: ${warnings.join('、')}\x1b[0m`)
        const file = path.join(out, item.name + '.png')
        await capture(mini, file)
        results.push({ page: item.name, ok: true, readyMs: ready.ms, readySource: ready.source,
          warnings, bytes: fs.statSync(file).size })
        console.log(`OK ${item.name} ${Math.round(fs.statSync(file).size / 1024)}KB`)
      } catch (error) {
        try { fs.unlinkSync(path.join(out, item.name + '.png')) } catch (_) {}
        results.push({ page: item.name, ok: false, error: error.message })
        console.error(`FAIL ${item.name}: ${error.message}`)
      }
    }
  } finally { await mini.disconnect() }
  const summary = { elapsedSeconds: Math.round((Date.now() - started) / 1000), results }
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(`完成 ${results.filter(x => x.ok).length}/${results.length} 页，耗时 ${summary.elapsedSeconds} 秒`)
  if (results.some(x => !x.ok)) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
