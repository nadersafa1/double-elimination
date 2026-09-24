import { MatchResult, TournamentMatch } from './types.js'

/**
 * Records the result of a bracket match and moves both players on.
 *
 * The winner is placed in `winnerTo` and the loser in `loserTo`. Returns a new
 * array of new match objects; the input is left untouched.
 *
 * When the winners bracket representative (slot 1) wins the first grand final
 * they are champion, so the bracket reset match is removed from the returned
 * array and the first grand final becomes the last match.
 */
export const recordResult = (
  matches: TournamentMatch[],
  result: MatchResult
): TournamentMatch[] => {
  if (!Array.isArray(matches)) throw new Error('matches must be an array')
  if (!result || typeof result.matchId !== 'string') {
    throw new Error('result needs a matchId')
  }

  const updated = matches.map((match) => ({ ...match }))
  const byId = new Map(updated.map((match) => [match.id, match]))

  const match = byId.get(result.matchId)
  if (!match) throw new Error(`Unknown match "${result.matchId}"`)

  const { registration1Id: player1, registration2Id: player2 } = match
  if (!player1 || !player2) {
    throw new Error(`Match "${match.id}" does not have two participants yet`)
  }

  const winner = winnerOf(result, player1, player2)
  const loser = winner === player1 ? player2 : player1

  const reset = match.winnerTo ? byId.get(match.winnerTo) : undefined
  const isFirstGrandFinal =
    match.bracketType === 'grandFinal' && reset?.bracketType === 'grandFinal'

  if (isFirstGrandFinal && winner === player1) {
    match.winnerTo = null
    match.winnerToSlot = null
    match.loserTo = null
    match.loserToSlot = null
    return updated.filter((m) => m.id !== reset!.id)
  }

  place(byId, match.winnerTo, match.winnerToSlot, winner)
  place(byId, match.loserTo, match.loserToSlot, loser)

  return updated
}

const winnerOf = (
  result: MatchResult,
  player1: string,
  player2: string
): string => {
  if ('winnerId' in result && result.winnerId !== undefined) {
    if (result.winnerId === player1 || result.winnerId === player2) {
      return result.winnerId
    }
    if (result.winnerId === null) {
      throw new Error(`Match "${result.matchId}" cannot end in a draw`)
    }
    throw new Error(
      `winnerId "${result.winnerId}" did not play in match "${result.matchId}"`
    )
  }

  const { score1, score2 } = result
  if (typeof score1 !== 'number' || typeof score2 !== 'number') {
    throw new Error(
      `Result for match "${result.matchId}" needs score1 and score2, or a winnerId`
    )
  }
  if (score1 === score2) {
    throw new Error(`Match "${result.matchId}" cannot end in a draw`)
  }
  return score1 > score2 ? player1 : player2
}

const place = (
  byId: Map<string, TournamentMatch>,
  targetId: string | null,
  slot: number | null,
  player: string
): void => {
  if (!targetId || !slot) return
  const target = byId.get(targetId)
  if (!target) return

  const key = slot === 1 ? 'registration1Id' : 'registration2Id'
  const occupant = target[key]
  if (occupant !== null && occupant !== player) {
    throw new Error(
      `Slot ${slot} of match "${targetId}" already holds "${occupant}"`
    )
  }
  target[key] = player
}
