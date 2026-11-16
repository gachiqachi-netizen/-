#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const http = require('node:http')
const net = require('node:net')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')
const pages = require('./pages.json')
const { connect, seed, waitReady, capture, screenWarnings } = require('./shoot')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const args = process.argv.slice(2)
const value = key => { const i = args.indexOf(key); return i >= 0 ? args[i + 1] || '' : '' }
const only = value('--only').split(',').filter(Boolean)
const stateOnly = value('--state').split(',').filter(Boolean)
const out = path.resolve(value('--out') || 'docs/reports/shots/T3')
const selected = pages.filter(p => !only.length || only.some(name => p.name === name || p.name.startsWith(name + '-')))

async function emptyServer() {
  const reserved = net.createServer()
  await new Promise(resolve => reserved.listen(0, '127.0.0.1', resolve))
  const port = reserved.address().port
  await new Promise(resolve => reserved.close(resolve))
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chuan-t3-empty-'))
  const child = spawn('python3', ['server/app.py'], { cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, DEV_LOGIN: '1',
      ENV: 'development', PAYMENT_PROVIDER: 'mock', DEMO_ORDERS: '0' }, stdio: 'ignore' })
  const base = `http://127.0.0.1:${port}`
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(base + '/api/catalog')).ok) return { base, child, dataDir }
    } catch (_) {}
    await sleep(100)
  }
  child.kill()
  throw new Error('空数据测试服务未能启动')
}

async function emptyLogin(base) {
  const post = async (route, body, token) => {
    const response = await fetch(base + '/api' + route, { method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`空数据测试登录失败：${response.status}`)
    return response.json()
  }
  const session = await post('/auth/dev', { name: 'T3-empty-screenshots' })
  const phone = await post('/auth/phone', { code: 'dev-00000000' }, session.token)
  return { ...session, phoneMasked: phone.phoneMasked }
}

async function login(mini, data) {
  await mini.callWxMethod('setStorageSync', 'cgz_token', data.token)
  await mini.callWxMethod('setStorageSync', 'cgz_expiry', data.expiry)
  await mini.callWxMethod('setStorageSync', 'cgz_phone_masked', data.phoneMasked || '')
  const design = { id: 't3-design', ...data.design }
  await mini.callWxMethod('setStorageSync', 'cgz_current_design', design)
  await mini.callWxMethod('setStorageSync', 'cgz_miniprogram_designs', [design])
}

async function open(mini, item, data, allowRedirect = false) {
  const url = item.path.replace(/\{(\w+)\}/g, (_, key) => data[key])
  const expected = item.path.split('?')[0].replace(/^\//, '')
  let page
  for (let attempt = 0; attempt < 2; attempt++) {
    await mini.reLaunch(url)
    page = await mini.currentPage()
    if (page && (page.path === expected || allowRedirect)) return page
    await sleep(500)
  }
  throw new Error(`打开了别的页面：${page && page.path}`)
}

async function main() {
  fs.mkdirSync(out, { recursive: true })
  const service = process.env.SHOOT_BASE_URL || 'http://127.0.0.1:8801'
  const empty = await emptyServer()
  let activeState = 'normal'
  const proxy = http.createServer(async (request, response) => {
    const requestState = activeState
    if (request.url.includes('/my/')) console.log(`HTTP ${requestState} ${request.method} ${request.url}`)
    if (requestState === 'logged-out' && /^\/api\/auth\/(dev|wechat)/.test(request.url)) {
      response.writeHead(401, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: '请先登录' }))
      return
    }
    if (requestState === 'loading') await sleep(15000)
    if (requestState === 'error' || requestState === 'loading') {
      response.writeHead(500, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: '服务暂不可用' }))
      return
    }
    try {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      const upstream = await fetch((requestState === 'empty' ? empty.base : service) + request.url, {
        method: request.method, headers: { 'Content-Type': request.headers['content-type'] || 'application/json',
          ...(request.headers.authorization ? { Authorization: request.headers.authorization } : {}) },
        body: chunks.length ? Buffer.concat(chunks) : undefined
      })
      response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' })
      response.end(Buffer.from(await upstream.arrayBuffer()))
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: '服务暂不可用' }))
    }
  })
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve))
  const mini = await connect()
  const results = []
  try {
    const miniBase = `http://127.0.0.1:${proxy.address().port}`
    const configured = await mini.evaluate(url => {
      const app = getApp()
      app.globalData.apiBase = url
      app.globalData.configError = ''
      return app.globalData.apiBase
    }, miniBase)
    if (configured !== miniBase) throw new Error(`小程序测试服务不是 ${miniBase}`)
    const device = await mini.systemInfo()
    if (device.screenWidth !== 390 || device.screenHeight !== 844) throw new Error(`需要 390×844 模拟器，当前 ${device.screenWidth}×${device.screenHeight}`)
    const data = await seed()
    const emptySession = await emptyLogin(empty.base)
    await login(mini, data)
    const home = await mini.reLaunch('/pages/home/home')
    await home.waitFor(1000)
    const card = await home.$('.tpl')
    if (card) await card.tap()
    for (const state of ['normal', 'empty', 'error', 'logged-out', 'loading'].filter(state => !stateOnly.length || stateOnly.includes(state))) {
      for (const item of selected.filter(item => item.states.includes(state))) {
        const filename = `${item.name}-${state}.png`
        try {
          activeState = state
          if (state === 'empty') {
            await login(mini, { ...data, token: emptySession.token, expiry: emptySession.expiresAt,
              phoneMasked: emptySession.phoneMasked })
          } else {
            await login(mini, data)
          }
          if (state === 'empty' && ['workbench', 'bracelet-detail', 'order-confirm', 'share-poster', 'mine'].includes(item.name)) {
            await mini.callWxMethod('removeStorageSync', 'cgz_current_design')
            await mini.callWxMethod('removeStorageSync', 'cgz_miniprogram_designs')
          }
          if (state === 'loading') {
            await mini.callWxMethod('removeStorageSync', 'cgz_catalog_version')
          }
          const page = await open(mini, item, data)
          if (!page) throw new Error('页面没有打开')
          if (state === 'normal') {
            await waitReady(page)
            if (item.name === 'ai-match') {
              const example = await page.$('.ai-example')
              if (example) await example.tap()
              let complete = false
              for (let attempt = 0; attempt < 30; attempt++) {
                await sleep(1000)
                const messages = await page.data('messages') || []
                if (!await page.data('busy') && messages.some(message => message.role === 'assistant')) {
                  complete = true
                  break
                }
              }
              if (!complete) throw new Error('AI 配 30 秒内没有返回完整方案')
            }
            if (item.name === 'order-confirm') await page.setData({ sheet: 'gift' })
          } else if (state === 'empty') {
            if (!['workbench', 'bracelet-detail', 'my-orders', 'mine'].includes(item.name)) {
              await page.setData({ loading: false, ready: true, error: '', orders: [], items: [], templates: [], designs: [], messages: [], order: null, sale: null, reviews: [] })
              if (['order-confirm', 'share-poster'].includes(item.name)) await page.setData({ design: null })
            } else await sleep(800)
          } else if (state === 'error') {
            if (item.name === 'ai-match') {
              const newChat = await page.$('.ai-new')
              if (newChat) { await newChat.tap(); await sleep(300) }
              const example = await page.$('.ai-example')
              if (example) await example.tap()
            }
            await sleep(1200)
            await page.setData({ loading: false, ready: true, error: '服务暂不可用' })
          } else if (state === 'logged-out') {
            await mini.callWxMethod('removeStorageSync', 'cgz_token')
            await mini.callWxMethod('removeStorageSync', 'cgz_expiry')
            await mini.callWxMethod('removeStorageSync', 'cgz_phone_masked')
            const loggedOutPage = await open(mini, item, data, true)
            if (item.name === 'ai-match') {
              const newChat = await loggedOutPage.$('.ai-new')
              if (newChat) { await newChat.tap(); await sleep(300) }
              const example = await loggedOutPage.$('.ai-example')
              if (example) await example.tap()
            }
            await sleep(1000)
          } else if (state === 'loading') {
            if (item.name === 'ai-match') {
              const newChat = await page.$('.ai-new')
              if (newChat) { await newChat.tap(); await sleep(300) }
              const example = await page.$('.ai-example')
              if (example) await example.tap()
            }
            if (item.name === 'order-success' || item.name.startsWith('order-detail-')) {
              await page.setData({ loading: true, ready: false, error: '', order: null })
            }
            await sleep(150)
          }
          const current = await mini.currentPage()
          if (!current) throw new Error('页面被跳转后找不到')
          if (state === 'normal' && current.path !== item.path.split('?')[0].replace(/^\//, '')) {
            throw new Error(`打开了别的页面：${current.path}`)
          }
          const warnings = await screenWarnings(current)
          await capture(mini, path.join(out, filename))
          results.push({ page: item.name, state, ok: true, warnings, path: current.path, keys: Object.keys(await current.data()) })
          console.log(`OK ${filename}`)
        } catch (error) {
          let detail = error.message
          try {
            const current = await mini.currentPage()
            const pageData = current && await current.data()
            detail += `；页面 ${current && current.path}；错误 ${pageData && (pageData.error || pageData.configError || '')}`
          } catch (_) {}
          results.push({ page: item.name, state, ok: false, error: detail })
          console.error(`FAIL ${filename}: ${detail}`)
        }
      }
    }
  } finally { await mini.disconnect(); proxy.close(); empty.child.kill() }
  const resultFile = path.join(out, 'result.json')
  let combined = results
  if ((only.length || stateOnly.length) && fs.existsSync(resultFile)) {
    const previous = JSON.parse(fs.readFileSync(resultFile, 'utf8'))
    const replaced = new Set(results.map(x => `${x.page}/${x.state}`))
    combined = [...previous.filter(x => !replaced.has(`${x.page}/${x.state}`)), ...results]
    combined.sort((a, b) => pages.findIndex(p => p.name === a.page) - pages.findIndex(p => p.name === b.page) ||
      ['normal', 'empty', 'error', 'logged-out', 'loading'].indexOf(a.state) - ['normal', 'empty', 'error', 'logged-out', 'loading'].indexOf(b.state))
  }
  fs.writeFileSync(resultFile, JSON.stringify(combined, null, 2) + '\n')
  if (results.some(x => !x.ok)) process.exitCode = 1
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
