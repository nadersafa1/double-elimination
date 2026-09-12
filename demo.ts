import {
  generateDoubleElimination,
  type GrandFinalFormat,
} from './src/index.js'

const createParticipants = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    registrationId: `player-${i + 1}`,
    seed: i + 1,
  }))

let idCounter = 0
const idFactory = () => `m${++idCounter}`

// Usage: npm run demo -- [participants] [grandFinal: none|single|reset]
const count = Number.parseInt(process.argv[2] || '7', 10)
const grandFinal = (process.argv[3] as GrandFinalFormat) || 'none'

const participants = createParticipants(count)
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants,
  idFactory,
  grandFinal,
})

const label = (id: string | null) => id ?? '—'

// A slot nobody feeds and nobody occupies can never be filled.
const fedSlots = new Set<string>()
for (const m of matches) {
  if (m.winnerTo) fedSlots.add(`${m.winnerTo}#${m.winnerToSlot}`)
  if (m.loserTo) fedSlots.add(`${m.loserTo}#${m.loserToSlot}`)
}
const canFill = (id: string, slot: 1 | 2, occupant: string | null) =>
  occupant !== null || fedSlots.has(`${id}#${slot}`)

const printBracket = (
  type: 'winners' | 'losers' | 'grandFinal',
  title: string
) => {
  const bracket = matches.filter((m) => m.bracketType === type)
  if (bracket.length === 0) return

  console.log(`\n=== ${title} ===`)
  const lastRound = Math.max(...bracket.map((m) => m.round))

  for (let round = 1; round <= lastRound; round++) {
    console.log(`\nRound ${round}:`)
    bracket
      .filter((m) => m.round === round)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)
      .forEach((m) => {
        const slot1 = canFill(m.id, 1, m.registration1Id)
        const slot2 = canFill(m.id, 2, m.registration2Id)
        const note =
          !slot1 && !slot2
            ? ' (unused: byes)'
            : slot1 && slot2
              ? ''
              : ' (walkover)'
        console.log(
          `  [${m.bracketPosition}] ${m.id}: ${label(m.registration1Id)} vs ${label(
            m.registration2Id
          )}${note}` +
            ` → W:${m.winnerTo ?? 'done'}${m.winnerToSlot ? `[${m.winnerToSlot}]` : ''}` +
            ` L:${m.loserTo ?? 'out'}${m.loserToSlot ? `[${m.loserToSlot}]` : ''}`
        )
      })
  }
}

printBracket('winners', 'WINNERS BRACKET')
printBracket('losers', 'LOSERS BRACKET')
printBracket('grandFinal', 'GRAND FINAL')

console.log('\n=== SUMMARY ===')
console.log(`Participants:    ${participants.length}`)
console.log(`Grand final:     ${grandFinal}`)
for (const type of ['winners', 'losers', 'grandFinal'] as const) {
  const count_ = matches.filter((m) => m.bracketType === type).length
  if (count_ > 0) console.log(`${type.padEnd(16)} ${count_} matches`)
}
console.log(`Total matches:   ${matches.length}`)
