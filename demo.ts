import { generateDoubleElimination, Participant } from './src'

// Helper to create participants
const createParticipants = (count: number): Participant[] =>
  Array.from({ length: count }, (_, i) => ({
    registrationId: `player-${i + 1}`,
    seed: i + 1,
  }))

// Simple ID factory
let idCounter = 0
const idFactory = () => `m${++idCounter}`

// Get participant count from CLI arg or default to 7
const count = parseInt(process.argv[2] || '7', 10)
const participants = createParticipants(count)
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants,
  idFactory,
})

console.log(matches)

// Display results
const winners = matches.filter((m) => m.bracketType === 'winners')
const losers = matches.filter((m) => m.bracketType === 'losers')

const formatSlot = (id: string | null, round: number) => {
  if (id) return id
  return round === 1 ? 'BYE' : 'TBD'
}

console.log('=== WINNERS BRACKET ===')
for (let r = 1; r <= Math.max(...winners.map((m) => m.round)); r++) {
  console.log(`\nRound ${r}:`)
  winners
    .filter((m) => m.round === r)
    .sort((a, b) => a.bracketPosition - b.bracketPosition)
    .forEach((m) => {
      const p1 = formatSlot(m.registration1Id, r)
      const p2 = formatSlot(m.registration2Id, r)
      console.log(
        `  [pos ${m.bracketPosition}] ${m.id}: ${p1} vs ${p2} → W:${
          m.winnerTo ?? 'GF'
        }[${m.winnerToSlot}] L:${m.loserTo ?? 'GF'}[${m.loserToSlot}]`
      )
    })
}

console.log('\n=== LOSERS BRACKET ===')
for (let r = 1; r <= Math.max(...losers.map((m) => m.round)); r++) {
  console.log(`\nRound ${r}:`)
  losers
    .filter((m) => m.round === r)
    .sort((a, b) => a.bracketPosition - b.bracketPosition)
    .forEach((m) => {
      const p1 = m.registration1Id ?? 'TBD'
      const p2 = m.registration2Id ?? 'TBD'
      console.log(
        `  [pos ${m.bracketPosition}] ${m.id}: ${p1} vs ${p2} → W:${
          m.winnerTo ?? 'GF'
        }[${m.winnerToSlot}]`
      )
    })
}

console.log('\n=== SUMMARY ===')
console.log(`Participants: ${participants.length}`)
console.log(
  `Bracket size: ${Math.pow(2, Math.ceil(Math.log2(participants.length)))}`
)
console.log(`Winners matches: ${winners.length}`)
console.log(`Losers matches: ${losers.length}`)
console.log(`Total matches: ${matches.length}`)
