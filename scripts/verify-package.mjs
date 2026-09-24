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

const standings = participants.map((participant, index) => ({
  registrationId: participant.registrationId,
  group: null,
  rank: index + 1,
  played: 3,
  won: 0,
  drawn: 0,
  lost: 0,
  scoreFor: 0,
  scoreAgainst: 0,
  scoreDifference: 0,
  points: 0,
}))

const esm = await import('../dist/esm/index.js')
assert.equal(typeof esm.generateDoubleElimination, 'function')
assert.equal(esm.generateDoubleElimination(options).length, 4)
assert.equal(typeof esm.qualifiersFromStandings, 'function')
assert.equal(esm.qualifiersFromStandings({ standings, perGroup: 2 }).length, 2)
assert.equal(typeof esm.recordResult, 'function')

const cjs = require('../dist/cjs/index.js')
assert.equal(typeof cjs.generateDoubleElimination, 'function')
assert.equal(cjs.generateDoubleElimination(options).length, 4)
assert.equal(typeof cjs.qualifiersFromStandings, 'function')
assert.equal(cjs.qualifiersFromStandings({ standings, perGroup: 2 }).length, 2)
assert.equal(typeof cjs.recordResult, 'function')

console.log('package loads via import and require')
