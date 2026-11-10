const test = require('node:test')
const assert = require('node:assert/strict')
const {resolveConfig, loadConfig} = require('../config')
test('开发工具使用本机8801，手机配置独立', () => {
  assert.equal(resolveConfig('develop', 'devtools').apiBase, 'http://127.0.0.1:8801')
  assert.equal(resolveConfig('develop', 'ios', {apiBase: 'http://lan.example:8801/'}).apiBase, 'http://lan.example:8801')
  assert.throws(() => resolveConfig('develop', 'android'), /config.local/)
  assert.equal(resolveConfig('develop', 'ios', {apiBase:'http://lan.example:8801'}).modelBase,'http://lan.example:8801/models')
})
test('体验和正式只使用自己的HTTPS配置', () => {
  for (const env of ['trial', 'release']) {
    assert.equal(resolveConfig(env, 'ios').apiBase, 'https://api.beadloop.cn')
    assert.equal(resolveConfig(env, 'ios').modelBase, 'https://api.beadloop.cn/models')
    assert.throws(() => resolveConfig(env, 'ios', null, {[env]:{apiBase:'https://api.example.com',modelBase:'https://static.real.cn'}}), /正式环境地址未配置/)
    assert.throws(() => resolveConfig(env, 'ios', null, {[env]:{apiBase:'https://api.real.cn',modelBase:'https://static.example.com'}}), /正式环境地址未配置/)
    assert.equal(resolveConfig(env, 'ios', null, {[env]:{apiBase:'https://api.real.cn',modelBase:'https://static.real.cn',modelVersion:'v2'}}).modelVersion,'v2')
    assert.throws(() => resolveConfig(env, 'ios', null, {[env]:{apiBase:'http://invalid',modelBase:'https://static.example.com'}}), /HTTPS/)
    assert.throws(() => resolveConfig(env, 'ios', null, {[env]:{apiBase:'https://',modelBase:'https://static.example.com'}}), /HTTPS/)
  }
  assert.throws(() => resolveConfig('unknown', 'ios'), /版本/)
})
test('没有全局 URL 时仍拦截占位域名', () => {
  const original = globalThis.URL
  try {
    delete globalThis.URL
    for (const env of ['trial', 'release']) {
      assert.throws(() => resolveConfig(env, 'ios', null, {[env]:{apiBase:'https://api.example.com:443/path',modelBase:'https://static.real.cn'}}), /正式环境地址未配置/)
    }
  } finally { globalThis.URL = original }
})
test('实际配置入口可在未提供本地文件时启动开发工具', () => {
  assert.equal(loadConfig({getAccountInfoSync:()=>({miniProgram:{envVersion:'develop'}}),getDeviceInfo:()=>({platform:'devtools'})}).apiBase,'http://127.0.0.1:8801')
})
test('缺失配置时请求失败且不发送网络请求', async () => {
  global.getApp=()=>({globalData:{configError:'需要配置',apiBase:''}})
  global.wx={request(){assert.fail('must not request')}}
  const api=require('../utils/api')
  await assert.rejects(api.request('/catalog'),/需要配置/)
  await assert.rejects(api.catalog(),/需要配置/)
})
