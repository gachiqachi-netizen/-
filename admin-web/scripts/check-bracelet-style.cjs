const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')

const fixture = require('../../server/tests/fixtures/bracelet_style.json')
const styleSource = fs.readFileSync(path.resolve(__dirname, '../src/bracelet/style.ts'), 'utf8')
const expectedSource = '// Generated from server/tests/fixtures/bracelet_style.json; check:layout verifies exact parity.\n'
  + 'export const style = ' + JSON.stringify(fixture, null, 2) + ' as const;\n'
assert.equal(styleSource, expectedSource, 'admin style.ts must exactly match the V8 fixture')

function compiled(file, imports = {}) {
  const filename = path.resolve(__dirname, '../src/bracelet/' + file)
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  const requireOriginal = loaded.require.bind(loaded)
  loaded.require = name => imports[name] || requireOriginal(name)
  loaded._compile(source, filename)
  return loaded.exports
}
const layout = compiled('layout.ts')
const bracelet = compiled('Bracelet.tsx', { './layout': layout, './style': { style: fixture } })
const render = (tier, sequence, numbered = false) => renderToStaticMarkup(
  React.createElement(bracelet.default, { tier, sequence, numbered, label: '测试手串' }))
const sample = [
  { id: 'metal', mm: 6, name: '金属隔珠', mat: 'metal', colors: ['#ffcc77', '#886622'] },
  { id: 'crystal', mm: 8, name: '水晶', mat: 'crystal', colors: ['#ddddee', '#9999aa'] },
  { id: 'wood', mm: 8, name: '木珠', mat: 'wood', colors: ['#aa7744', '#553322'] },
  { id: 'photo', mm: 8, name: '照片珠', photo: '/large.png', photoSm: '/small.png', photoMd: '/medium.png' },
]
assert.equal(bracelet.materialOf(sample[0]), 'metal')
assert.equal(bracelet.materialOf(sample[1]), 'translucent')
assert.equal(bracelet.materialOf(sample[2]), 'matte')
for (const [tier, pixels] of Object.entries({ s: 72, m: 160, l: 320 })) {
  const html = render(tier, sample, true)
  assert.match(html, new RegExp(`<svg[^>]*width="${pixels}"[^>]*height="${pixels}"`), `${tier} dimensions`)
  assert.match(html, /测试手串/)
  assert.match(html, /<text[^>]*>1<\/text>/)
  assert.match(html, new RegExp(tier === 's' ? '/small.png' : '/medium.png'))
  assert.match(html, /#e8dcc9/, 'V8 warm fallback must replace gray')
  if (tier === 'l') assert.match(html, /#f8f3e9/, 'large tier has warm background')
  else assert.match(html, /background:transparent/, 'small and medium tiers are transparent')
  if (tier === 's') assert.doesNotMatch(html, /<linearGradient/, 'small tier uses simple fill')
  else {
    assert.match(html, /<linearGradient/, 'metal uses directional shine')
    for (const alpha of [fixture.materials.metal.highlightAlpha, fixture.materials.translucent.highlightAlpha, fixture.materials.matte.highlightAlpha]) {
      assert.ok(html.includes(`stop-opacity="${alpha}"`), `missing material highlight ${alpha}`)
    }
  }
}
const calls = [
  ['../src/components/OrdersView.tsx', 's'],
  ['../src/pages/afterSales/detail.tsx', 's'],
  ['../src/pages/workOrders/detail.tsx', 'l'],
  ['../src/pages/templates/TemplatesWorkbench.tsx', 'l'],
  ['../src/components/TemplatesView.tsx', 'l'],
  ['../src/pages/products/beadPhoto.tsx', 'm'],
]
for (const [file, tier] of calls) {
  const source = fs.readFileSync(path.resolve(__dirname, file), 'utf8')
  assert.match(source, new RegExp(`<Bracelet\\b[^>]*tier="${tier}"`), file)
}
console.log('bracelet style parity: V8 fixture, 3 tiers, 3 materials and call sites passed')
