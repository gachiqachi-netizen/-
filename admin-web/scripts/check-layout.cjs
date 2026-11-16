const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const source = path.resolve(__dirname, '../src/bracelet/layout.ts')
const compiled = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const moduleUnderTest = new Module(source, module)
moduleUnderTest.filename = source
moduleUnderTest.paths = Module._nodeModulePaths(path.dirname(source))
moduleUnderTest._compile(compiled, source)

const adminLayout = moduleUnderTest.exports.layout
const miniLayout = require('../../miniprogram/utils/bracelet-layout').layout
const cases = require('../../server/tests/fixtures/bracelet_layout_cases.json')
assert.equal(cases.length, 10)

for (const item of cases) {
  const sequence = Array.from({ length: item.repeat }, () => item.sequence).flat()
  const admin = adminLayout(sequence, item.size)
  const mini = miniLayout(sequence, item.size)
  assert.equal(admin.length, sequence.length, item.name)
  for (let i = 0; i < admin.length; i++) {
    assert.equal(admin[i].index, i + 1, item.name)
    for (const field of ['x', 'y', 'r', 'rotate']) {
      assert.ok(Math.abs(admin[i][field] - mini[i][field]) <= 0.5,
        `${item.name} bead ${i + 1} ${field} differs by more than 0.5px`)
    }
    assert.equal(admin[i].photo, mini[i].photo, item.name)
    assert.deepEqual(admin[i].colors, mini[i].colors, item.name)
    assert.ok(admin[i].x - admin[i].r >= -1e-8 && admin[i].x + admin[i].r <= item.size + 1e-8, item.name)
    assert.ok(admin[i].y - admin[i].r >= -1e-8 && admin[i].y + admin[i].r <= item.size + 1e-8, item.name)
  }
}

console.log(`layout parity: ${cases.length} cases passed (max error 0.5px)`)
