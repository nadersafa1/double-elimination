import { BracketMatch } from './types.js'

/**
 * Resolves every walkover the bracket structure already implies.
 *
 * When the participant count is not a power of two some matches can never be
 * played, and that has to be pushed through the whole bracket, not just the
 * first winners round:
 *
 * - A match with one participant and one permanently empty slot is a walkover:
 *   the participant is placed in the next match straight away and the match
 *   produces no loser, so its `loserTo` link is dropped.
 * - A match that will only ever receive one player from an earlier match is
 *   bypassed: the feeder is re-pointed at whatever came after it. Without this
 *   the losers bracket stalls, because a match sitting on a missing opponent
 *   never resolves and never advances anyone.
 * - A match no one can reach is left in place with empty slots and no routing,
 *   so bracket positions stay stable for rendering.
 */
export const resolveByes = (matches: BracketMatch[]): void => {
  const byId = new Map(matches.map((match) => [match.id, match]))
  const order = topologicalOrder(matches, byId)

  const slots = new Map<string, [SlotState, SlotState]>()
  for (const match of matches) {
    slots.set(match.id, [
      slotStateOf(match.registration1Id),
      slotStateOf(match.registration2Id),
    ])
  }

  const shapes = new Map<string, MatchShape>()

  const deliver = (
    targetId: string | null,
    targetSlot: number | null,
    state: SlotState
  ): void => {
    if (!targetId || !targetSlot) return
    const targetSlots = slots.get(targetId)
    if (!targetSlots) return
    targetSlots[targetSlot - 1] = state
  }

  // Forward pass: work out what each match will actually hold.
  for (const match of order) {
    const [slot1, slot2] = slots.get(match.id)!
    const shape = classify(match, slot1, slot2)
    shapes.set(match.id, shape)

    if (shape === 'live') {
      deliver(match.winnerTo, match.winnerToSlot, PENDING)
      deliver(match.loserTo, match.loserToSlot, PENDING)
    } else if (shape === 'walkover') {
      const entrant = slot1.kind === 'known' ? slot1 : slot2
      deliver(match.winnerTo, match.winnerToSlot, entrant)
    } else if (shape === 'bypassed') {
      deliver(match.winnerTo, match.winnerToSlot, PENDING)
    }
  }

  // Resolve routing before mutating anything, since bypassed matches lose their
  // own links and can sit anywhere in the iteration order.
  const rerouted = new Map<string, { winner: Link; loser: Link }>()
  for (const match of matches) {
    const shape = shapes.get(match.id)!
    rerouted.set(match.id, {
      winner: followBypasses(match.winnerTo, match.winnerToSlot, byId, shapes),
      loser:
        shape === 'live'
          ? followBypasses(match.loserTo, match.loserToSlot, byId, shapes)
          : NO_LINK,
    })
  }

  for (const match of matches) {
    const [slot1, slot2] = slots.get(match.id)!
    if (slot1.kind === 'known') match.registration1Id = slot1.playerId
    if (slot2.kind === 'known') match.registration2Id = slot2.playerId

    const shape = shapes.get(match.id)!
    const links =
      shape === 'unused' || shape === 'bypassed'
        ? { winner: NO_LINK, loser: NO_LINK }
        : rerouted.get(match.id)!

    match.winnerTo = links.winner.id
    match.winnerToSlot = links.winner.slot
    match.loserTo = links.loser.id
    match.loserToSlot = links.loser.slot
  }
}

type SlotState =
  | { kind: 'empty' }
  | { kind: 'pending' }
  | { kind: 'known'; playerId: string }

/** No player can ever arrive here. */
const EMPTY: SlotState = { kind: 'empty' }
/** A player will arrive once earlier matches are played. */
const PENDING: SlotState = { kind: 'pending' }

const slotStateOf = (registrationId: string | null): SlotState =>
  registrationId === null ? EMPTY : { kind: 'known', playerId: registrationId }

type MatchShape =
  /** Two entrants (or one entrant and nowhere to advance them to). */
  | 'live'
  /** One known entrant against an empty slot: advance them now. */
  | 'walkover'
  /** One entrant, not yet known: route the feeder past this match. */
  | 'bypassed'
  /** Unreachable. */
  | 'unused'

const classify = (
  match: BracketMatch,
  slot1: SlotState,
  slot2: SlotState
): MatchShape => {
  const live1 = slot1.kind !== 'empty'
  const live2 = slot2.kind !== 'empty'

  if (live1 && live2) return 'live'
  if (!live1 && !live2) return 'unused'

  const entrant = live1 ? slot1 : slot2
  if (entrant.kind === 'known') return 'walkover'

  // Nothing to bypass into: the single entrant wins the bracket by walkover,
  // so keep the match to record that.
  return match.winnerTo ? 'bypassed' : 'live'
}

interface Link {
  id: string | null
  slot: number | null
}

const NO_LINK: Link = { id: null, slot: null }

/** Follows bypassed matches to the first match that is actually played. */
const followBypasses = (
  targetId: string | null,
  targetSlot: number | null,
  byId: Map<string, BracketMatch>,
  shapes: Map<string, MatchShape>
): Link => {
  let id = targetId
  let slot = targetSlot
  let hops = 0

  while (id && shapes.get(id) === 'bypassed') {
    const bypassed = byId.get(id)!
    id = bypassed.winnerTo
    slot = bypassed.winnerToSlot
    if (++hops > byId.size) {
      throw new Error('Cycle detected while resolving byes')
    }
  }

  return id && slot ? { id, slot } : NO_LINK
}

/** Orders matches so that every match comes after the matches that feed it. */
const topologicalOrder = (
  matches: BracketMatch[],
  byId: Map<string, BracketMatch>
): BracketMatch[] => {
  const incoming = new Map<string, number>()
  for (const match of matches) incoming.set(match.id, 0)

  const targetsOf = (match: BracketMatch): string[] => {
    const targets: string[] = []
    if (match.winnerTo && byId.has(match.winnerTo)) targets.push(match.winnerTo)
    if (match.loserTo && byId.has(match.loserTo)) targets.push(match.loserTo)
    return targets
  }

  for (const match of matches) {
    for (const target of targetsOf(match)) {
      incoming.set(target, incoming.get(target)! + 1)
    }
  }

  const queue = matches.filter((match) => incoming.get(match.id) === 0)
  const order: BracketMatch[] = []

  for (let i = 0; i < queue.length; i++) {
    const match = queue[i]
    order.push(match)
    for (const target of targetsOf(match)) {
      const remaining = incoming.get(target)! - 1
      incoming.set(target, remaining)
      if (remaining === 0) queue.push(byId.get(target)!)
    }
  }

  if (order.length !== matches.length) {
    throw new Error('Bracket routing contains a cycle')
  }

  return order
}
