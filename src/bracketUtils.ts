/**
 * Smallest power of two >= n.
 *
 * Computed with integer doubling rather than `Math.pow(2, Math.ceil(Math.log2(n)))`,
 * which can round the wrong way for large inputs (e.g. `Math.log2(2 ** 29)` is
 * not guaranteed to be exactly 29 on every engine).
 */
export const nextPowerOf2 = (n: number): number => {
  let size = 1
  while (size < n) size *= 2
  return size
}

/** log2 of an exact power of two, without floating point. */
export const log2 = (powerOfTwo: number): number => {
  let exponent = 0
  let value = powerOfTwo
  while (value > 1) {
    value /= 2
    exponent++
  }
  return exponent
}

/**
 * Seed pairings for round 1, in bracket order.
 *
 * Builds the standard "fold" sequence — `[1, 2] -> [1, 4, 2, 3] -> [1, 8, 4, 5,
 * 2, 7, 3, 6] -> ...` — so that the top two seeds can only meet in the final,
 * the top four only in the semifinals, and so on.
 */
export const generateSeedPairs = (bracketSize: number): [number, number][] => {
  let positions = [1, 2]

  while (positions.length < bracketSize) {
    const sum = positions.length * 2 + 1
    const next: number[] = new Array(positions.length * 2)

    for (let i = 0; i < positions.length; i++) {
      next[i * 2] = positions[i]
      next[i * 2 + 1] = sum - positions[i]
    }

    positions = next
  }

  const pairs: [number, number][] = new Array(bracketSize / 2)
  for (let i = 0; i < positions.length; i += 2) {
    pairs[i / 2] = [positions[i], positions[i + 1]]
  }
  return pairs
}
