// Deterministic, seeded PRNG. Same seed => same sequence, forever.
// mulberry32 — tiny, fast, good enough for mock data generation.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Deterministic string hash → 32-bit int seed (so we can key streams by string).
export function hashSeed(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface Rng {
  next: () => number
  int: (min: number, max: number) => number
  float: (min: number, max: number, decimals?: number) => number
  pick: <T>(arr: readonly T[]) => T
  bool: (p?: number) => boolean
}

export function makeRng(seed: number): Rng {
  const r = mulberry32(seed)
  const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d
  return {
    next: r,
    int: (min, max) => Math.floor(r() * (max - min + 1)) + min,
    float: (min, max, decimals = 2) => round(min + r() * (max - min), decimals),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    bool: (p = 0.5) => r() < p,
  }
}
