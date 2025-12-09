export const wireLoserRouting = (winnersMatches, losersMatches, winnersRounds) => {
    const losersIdMap = buildLosersIdMap(losersMatches);
    for (const match of winnersMatches) {
        const { round, bracketPosition } = match;
        const routing = getLoserDestination(round, bracketPosition, winnersRounds);
        if (routing) {
            const targetId = losersIdMap.get(`${routing.lbRound}-${routing.lbPosition}`);
            if (targetId) {
                match.loserTo = targetId;
                match.loserToSlot = routing.slot;
            }
        }
    }
};
const buildLosersIdMap = (matches) => {
    const map = new Map();
    for (const m of matches) {
        map.set(`${m.round}-${m.bracketPosition}`, m.id);
    }
    return map;
};
const getLoserDestination = (wbRound, wbPosition, totalWbRounds) => {
    // WB Finals: winner=1st, loser=2nd (no routing to LB)
    if (wbRound === totalWbRounds)
        return null;
    if (wbRound === 1) {
        // Round 1 losers → LB Round 1
        // LB position = floor(WB_position / 2), slot = (WB_position % 2) + 1
        return {
            lbRound: 1,
            lbPosition: Math.floor(wbPosition / 2),
            slot: (wbPosition % 2) + 1,
        };
    }
    if (wbRound === 2) {
        // Round 2 losers → LB Round 2
        // LB position = same as WB position, slot = 2
        return {
            lbRound: 2,
            lbPosition: wbPosition,
            slot: 2,
        };
    }
    // Round 3+ losers: LB_round = (WB_round - 2) * 2 + 2
    const lbRound = (wbRound - 2) * 2 + 2;
    return {
        lbRound,
        lbPosition: wbPosition,
        slot: 2,
    };
};
