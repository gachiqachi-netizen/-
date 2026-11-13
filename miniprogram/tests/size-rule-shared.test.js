const test = require('node:test')
const assert = require('node:assert/strict')
const fixture = require('../../server/tests/fixtures/size_rule_cases.json')
const logic = require('../pages/editor/logic')
const template = require('../utils/template')

fixture.stats.forEach(c => {
  test(`stats: ${c.name}`, () => {
    const s = logic.stats(c.ids, fixture.catalog, c.wrist)
    assert.equal(s.target, c.target)
    assert.equal(s.length, c.length)
  })
})

fixture.fill.forEach(c => {
  test(`fill: ${c.name}`, () => {
    const beads = template.build({ special: c.special, pattern: c.pattern, tail: c.tail }, fixture.catalog, c.wrist)
    assert.deepEqual(beads, c.beads)
  })
})
