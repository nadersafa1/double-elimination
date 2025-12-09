import { BracketMatch } from './types';

export const wireLoserRouting = (
  winnersMatches: BracketMatch[],
  losersMatches: BracketMatch[],
  winnersRounds: number,
  startFromWbRound: number = 1
): void => {
  const losersIdMap = buildLosersIdMap(losersMatches);

  for (const match of winnersMatches) {
    const { round, bracketPosition } = match;
    const routing = getLoserDestination(
      round,
      bracketPosition,
      winnersRounds,
      startFromWbRound
    );

    if (routing) {
      const targetId = losersIdMap.get(`${routing.lbRound}-${routing.lbPosition}`);
      if (targetId) {
        match.loserTo = targetId;
        match.loserToSlot = routing.slot;
      }
    }
  }
};

const buildLosersIdMap = (matches: BracketMatch[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const m of matches) {
    map.set(`${m.round}-${m.bracketPosition}`, m.id);
  }
  return map;
};

interface LoserDestination {
  lbRound: number;
  lbPosition: number;
  slot: number;
}

const getLoserDestination = (
  wbRound: number,
  wbPosition: number,
  totalWbRounds: number,
  startFromWbRound: number
): LoserDestination | null => {
  // WB Finals: winner=1st, loser=2nd (no routing to LB)
  if (wbRound === totalWbRounds) return null;

  // Skip rounds before losers bracket starts (single elimination portion)
  if (wbRound < startFromWbRound) return null;

  // Calculate relative round (treating startFromWbRound as "round 1")
  const relativeRound = wbRound - startFromWbRound + 1;

  if (relativeRound === 1) {
    // First feeder round losers → LB Round 1
    // LB position = floor(WB_position / 2), slot = (WB_position % 2) + 1
    return {
      lbRound: 1,
      lbPosition: Math.floor(wbPosition / 2),
      slot: (wbPosition % 2) + 1,
    };
  }

  // For relativeRound >= 2, mirror position to create cross-bracket matchups
  // This prevents rematches between players from the same bracket side
  const matchCount = Math.pow(2, totalWbRounds - wbRound);
  const mirroredPosition = matchCount - 1 - wbPosition;

  if (relativeRound === 2) {
    // Second feeder round losers → LB Round 2
    return {
      lbRound: 2,
      lbPosition: mirroredPosition,
      slot: 2,
    };
  }

  // Third+ feeder round losers: LB_round = (relativeRound - 2) * 2 + 2
  const lbRound = (relativeRound - 2) * 2 + 2;
  return {
    lbRound,
    lbPosition: mirroredPosition,
    slot: 2,
  };
};

