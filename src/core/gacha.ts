import { generateCharacter, rollStar } from './gen/character';
import { freshSeed, Rng } from './rng';
import type { Character, Star } from './types';

export const PULL_COST = 100;
export const PULL10_COST = 900;
export const PITY5 = 60; // 60회 안에 ★5 보장
export const ROSTER_CAP = 40;

export interface Pity { pulls: number; since5: number }

/** 모집: n명. 10연차는 ★3 이상 1명 보장 */
export function pull(n: number, pity: Pity, seedSource: () => number = freshSeed): Character[] {
  const out: Character[] = [];
  for (let i = 0; i < n; i++) {
    const seed = seedSource();
    const rng = new Rng(seed ^ 0x5bd1e995);
    let minStar: Star = 1;
    if (pity.since5 + 1 >= PITY5) minStar = 5;
    else if (n >= 10 && i === n - 1 && !out.some((c) => c.star >= 3)) minStar = 3;
    const star = rollStar(rng, minStar);
    const ch = generateCharacter(seed, { star });
    pity.pulls++;
    pity.since5 = star === 5 ? 0 : pity.since5 + 1;
    out.push(ch);
  }
  return out;
}
