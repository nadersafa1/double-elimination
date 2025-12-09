import { BracketMatch } from './types'

export const processByes = (matches: BracketMatch[]): void => {
  const matchMap = new Map(matches.map((m) => [m.id, m]))

  // Only process round 1 winners bracket byes (no cascading)
  const round1Winners = matches.filter(
    (m) => m.bracketType === 'winners' && m.round === 1
  )

  for (const match of round1Winners) {
    processMatchBye(match, matchMap)
  }
}

const processMatchBye = (
  match: BracketMatch,
  matchMap: Map<string, BracketMatch>
): void => {
  const has1 = match.registration1Id !== null
  const has2 = match.registration2Id !== null

  if (!has1 && !has2) return
  if (has1 && has2) return

  const winnerId = match.registration1Id ?? match.registration2Id

  if (match.winnerTo && match.winnerToSlot && winnerId) {
    const targetMatch = matchMap.get(match.winnerTo)
    if (targetMatch) {
      if (match.winnerToSlot === 1) {
        targetMatch.registration1Id = winnerId
      } else {
        targetMatch.registration2Id = winnerId
      }
    }
  }
}
