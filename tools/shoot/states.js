#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const pages = require('./pages.json')
const { connect, seed, waitReady, capture, screenWarnings, api } = require('./shoot')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const args = process.argv.slice(2)
const value = key => { const i = args.indexOf(key); return i >= 0 ? args[i + 1] || '' : '' }
const only = value('--only').split(',').filter(Boolean)
const out = path.resolve(value('--out') || 'docs/reports/shots/T3')
const selected = pages.filter(p => !only.length || only.some(name => p.name === name || p.name.startsWith(name + '-')))

async function login(mini, data) {
  await mini.callWxMethod('setStorageSync', 'cgz_token', data.token)
  await mini.callWxMethod('setStorageSync', 'cgz_expiry', data.expiry)
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
  let activeState = 'normal'
  const proxy = http.createServer(async (request, response) => {
    if (activeState === 'loading') await sleep(15000)
    if (activeState === 'error' || activeState === 'loading') {
      response.writeHead(500, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: '服务暂不可用' }))
      return
    }
    try {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      const upstream = await fetch(service + request.url, {
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
    const { data: emptySession } = await api('/auth/dev', { method: 'POST', body: { name: 'T3-empty-screenshots' } })
    await api('/auth/phone', { method: 'POST', token: emptySession.token, body: { code: 'dev-00000000' } })
    await login(mini, data)
    const home = await mini.reLaunch('/pages/home/home')
    await home.waitFor(1000)
    const card = await home.$('.tpl')
    if (card) await card.tap()
    for (const item of selected) {
      for (const state of item.states) {
        const filename = `${item.name}-${state}.png`
        try {
          activeState = state
          if (state === 'empty' && ['my-orders', 'mine'].includes(item.name)) {
            await login(mini, { ...data, token: emptySession.token, expiry: emptySession.expiresAt })
          } else {
            await login(mini, data)
          }
          if (state === 'empty' && ['workbench', 'bracelet-detail'].includes(item.name)) {
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
            } else await sleep(800)
          } else if (state === 'error') {
            const failed = await open(mini, item, data)
            await sleep(1200)
            if (failed) await failed.setData({ loading: false, ready: true, error: '服务暂不可用' })
          } else if (state === 'logged-out') {
            await mini.callWxMethod('removeStorageSync', 'cgz_token')
            await mini.callWxMethod('removeStorageSync', 'cgz_expiry')
            await open(mini, item, data, true)
            await sleep(1000)
          } else if (state === 'loading') {
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
          results.push({ page: item.name, state, ok: false, error: error.message })
          console.error(`FAIL ${filename}: ${error.message}`)
        }
      }
    }
  } finally { await mini.disconnect(); proxy.close() }
  fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(results, null, 2) + '\n')
  if (results.some(x => !x.ok)) process.exitCode = 1
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
