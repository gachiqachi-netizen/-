// C0a：tokens.wxss 与 theme.js 一致、变量预算、app.wxss 不写颜色字面量
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const tokens = fs.readFileSync(path.join(root, 'styles', 'tokens.wxss'), 'utf8');
const theme = require('../utils/theme.js');

function parseColors(src) {
  const out = {};
  const re = /--c-([a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(src))) {
    const key = m[1].replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    out[key] = m[2].replace(/\/\*.*?\*\//g, '').trim();
  }
  return out;
}

test('theme.js 与 tokens.wxss 的 --c-* 逐项相等', () => {
  assert.deepStrictEqual(theme, parseColors(tokens));
});

test('颜色变量总数不超过 30', () => {
  assert.ok(Object.keys(parseColors(tokens)).length <= 30);
});

test('tokens.wxss 里没有 accent', () => {
  assert.ok(!tokens.includes('accent'));
});

test('app.wxss 没有 # 开头的颜色值', () => {
  const app = fs.readFileSync(path.join(root, 'app.wxss'), 'utf8');
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(app), 'app.wxss 里还有写死的颜色');
});
