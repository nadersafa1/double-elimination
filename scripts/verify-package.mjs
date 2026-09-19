// Loads the built package the way consumers do, so a broken publish fails CI
// instead of failing in someone else's project.
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)

const participants = [
  { registrationId: 'a', seed: 1 },
  { registrationId: 'b', seed: 2 },
  { registrationId: 'c', seed: 3 },
  { registrationId: 'd', seed: 4 },
]

let ids = 0
const options = { eventId: 'e', participants, idFactory: () => `m${++ids}` }

const esm = await import('../dist/esm/index.js')
assert.equal(typeof esm.generateDoubleElimination, 'function')
assert.equal(esm.generateDoubleElimination(options).length, 4)

const cjs = require('../dist/cjs/index.js')
assert.equal(typeof cjs.generateDoubleElimination, 'function')
assert.equal(cjs.generateDoubleElimination(options).length, 4)

console.log('package loads via import and require')
