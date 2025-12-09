/** Compute smallest power of 2 >= n */
export const nextPowerOf2 = (n) => {
    return Math.pow(2, Math.ceil(Math.log2(n)));
};
/** Generate seeding pairs for first round: 1v8, 4v5, 2v7, 3v6 pattern */
export const generateSeedingPairs = (bracketSize) => {
    const pairs = [];
    const half = bracketSize / 2;
    const buildPairs = (seeds) => {
        if (seeds.length === 2) {
            pairs.push([seeds[0], seeds[1]]);
            return;
        }
        const top = [];
        const bottom = [];
        for (let i = 0; i < seeds.length / 2; i++) {
            top.push(seeds[i]);
            bottom.push(seeds[seeds.length - 1 - i]);
        }
        buildPairs(top.map((t, i) => [t, bottom[i]]).flat());
        buildPairs(bottom.map((b, i) => [top[top.length - 1 - i], b]).flat());
    };
    // Start with seeds 1..bracketSize
    const initialSeeds = Array.from({ length: bracketSize }, (_, i) => i + 1);
    buildPairs(initialSeeds.slice(0, half).concat(initialSeeds.slice(half).reverse()));
    return pairs.slice(0, half);
};
/** Standard seeding: 1vN, 2v(N-1), etc. reordered for bracket structure */
export const getStandardSeedingOrder = (bracketSize) => {
    const matchCount = bracketSize / 2;
    const pairs = [];
    const fillBracket = (pos, round) => {
        if (round === 1)
            return pos;
        const prevPos = pos * 2;
        return fillBracket(prevPos, round - 1);
    };
    const rounds = Math.log2(bracketSize);
    for (let m = 0; m < matchCount; m++) {
        const seed1 = m + 1;
        const seed2 = bracketSize - m;
        pairs.push([seed1, seed2]);
    }
    // Reorder for proper bracket placement
    const ordered = [];
    const placeMatch = (start, end, depth) => {
        if (depth === 0) {
            ordered.push(pairs[start]);
            return;
        }
        const mid = Math.floor((start + end) / 2);
        placeMatch(start, mid, depth - 1);
        placeMatch(mid + 1, end, depth - 1);
    };
    placeMatch(0, matchCount - 1, rounds - 1);
    return ordered.length > 0 ? ordered : pairs;
};
