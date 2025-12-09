/** Compute smallest power of 2 >= n */
export declare const nextPowerOf2: (n: number) => number;
/** Generate seeding pairs for first round: 1v8, 4v5, 2v7, 3v6 pattern */
export declare const generateSeedingPairs: (bracketSize: number) => [number, number][];
/** Standard seeding: 1vN, 2v(N-1), etc. reordered for bracket structure */
export declare const getStandardSeedingOrder: (bracketSize: number) => [number, number][];
