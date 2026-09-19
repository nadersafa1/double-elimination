import {
  calculateStandings,
  generateTournament,
  type TournamentFormat,
  type TournamentMatch,
} from './src/index.js'

const createParticipants = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    registrationId: `player-${i + 1}`,
    seed: i + 1,
  }))

let idCounter = 0
const idFactory = () => `m${++idCounter}`

// Usage: npm run demo -- [format] [participants] [extra]
//   npm run demo -- double-elimination 8 reset
//   npm run demo -- single-elimination 16 third-place
//   npm run demo -- round-robin 10 groups=2
const format = (process.argv[2] as TournamentFormat) || 'double-elimination'
const count = Number.parseInt(process.argv[3] || '8', 10)
const extra = process.argv[4] ?? ''

const participants = createParticipants(count)
const base = { eventId: 'event-1', participants, idFactory }

const matches = generateTournament(
  format === 'round-robin'
    ? {
        format,
        ...base,
        legs: extra.startsWith('legs=') ? Number(extra.slice(5)) : 1,
        groupCount: extra.startsWith('groups=') ? Number(extra.slice(7)) : 1,
      }
    : format === 'single-elimination'
      ? { format, ...base, thirdPlaceMatch: extra === 'third-place' }
      : {
          format,
          ...base,
          grandFinal: extra === 'reset' || extra === 'single' ? extra : 'none',
        }
)

const label = (id: string | null) => id ?? '—'

// A slot nobody feeds and nobody occupies can never be filled.
const fedSlots = new Set<string>()
for (const match of matches) {
  if (match.winnerTo) fedSlots.add(`${match.winnerTo}#${match.winnerToSlot}`)
  if (match.loserTo) fedSlots.add(`${match.loserTo}#${match.loserToSlot}`)
}
const canFill = (id: string, slot: 1 | 2, occupant: string | null) =>
  occupant !== null || fedSlots.has(`${id}#${slot}`)

const printSection = (title: string, section: TournamentMatch[]) => {
  if (section.length === 0) return

  console.log(`\n=== ${title} ===`)
  const lastRound = Math.max(...section.map((m) => m.round))

  for (let round = 1; round <= lastRound; round++) {
    const inRound = section
      .filter((m) => m.round === round)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)
    if (inRound.length === 0) continue

    console.log(`\nRound ${round}:`)
    for (const match of inRound) {
      const slot1 = canFill(match.id, 1, match.registration1Id)
      const slot2 = canFill(match.id, 2, match.registration2Id)
      const note =
        !slot1 && !slot2
          ? ' (unused: byes)'
          : slot1 && slot2
            ? ''
            : ' (walkover)'
      const routing =
        match.bracketType === 'roundRobin'
          ? ''
          : ` → W:${match.winnerTo ?? 'done'}${
              match.winnerToSlot ? `[${match.winnerToSlot}]` : ''
            } L:${match.loserTo ?? 'out'}${
              match.loserToSlot ? `[${match.loserToSlot}]` : ''
            }`

      console.log(
        `  [${match.bracketPosition}] ${match.id}: ${label(
          match.registration1Id
        )} vs ${label(match.registration2Id)}${note}${routing}`
      )
    }
  }
}

if (format === 'round-robin') {
  const groups = [...new Set(matches.map((m) => m.group))]
  for (const group of groups) {
    const inGroup = matches.filter((m) => m.group === group)
    printSection(group === null ? 'FIXTURES' : `GROUP ${group + 1}`, inGroup)
  }

  // Play it out so the standings table has something to show.
  const results = matches.map((match) => ({
    matchId: match.id,
    score1: (match.round * 7 + match.bracketPosition * 3) % 4,
    score2: (match.round * 5 + match.bracketPosition * 2) % 4,
  }))

  console.log('\n=== STANDINGS (with made-up results) ===')
  const standings = calculateStandings({ matches, results, participants })
  let shownGroup: number | null | undefined
  for (const row of standings) {
    if (row.group !== shownGroup) {
      shownGroup = row.group
      console.log(row.group === null ? '' : `\nGroup ${row.group + 1}:`)
      console.log(
        ['#', 'participant', 'P', 'W', 'D', 'L', 'SF', 'SA', 'SD', 'Pts']
          .map((header, i) =>
            i === 1 ? header.padEnd(12) : header.padStart(4)
          )
          .join('')
      )
    }
    console.log(
      [
        String(row.rank),
        row.registrationId,
        row.played,
        row.won,
        row.drawn,
        row.lost,
        row.scoreFor,
        row.scoreAgainst,
        row.scoreDifference,
        row.points,
      ]
        .map((cell, i) =>
          i === 1 ? String(cell).padEnd(12) : String(cell).padStart(4)
        )
        .join('')
    )
  }
} else {
  printSection(
    'WINNERS BRACKET',
    matches.filter((m) => m.bracketType === 'winners')
  )
  printSection(
    format === 'single-elimination' ? 'THIRD PLACE' : 'LOSERS BRACKET',
    matches.filter((m) => m.bracketType === 'losers')
  )
  printSection(
    'GRAND FINAL',
    matches.filter((m) => m.bracketType === 'grandFinal')
  )
}

console.log('\n=== SUMMARY ===')
console.log(`Format:          ${format}`)
console.log(`Participants:    ${participants.length}`)
console.log(`Total matches:   ${matches.length}`)
