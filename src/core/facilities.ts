// 거점 시설 규칙 (순수 함수)
import { HOUSES } from './data/houses';
import type { Character, Item, Stats } from './types';

// ---------------------------------------------------------------- 대장간
export const MAX_PLUS_BY_LEVEL = [0, 3, 6, 10];
/** p → p+1 성공 확률 */
export const ENHANCE_CHANCE = [0.95, 0.9, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15];
/** 이 단계 이상에서 실패하면 한 단계 떨어진다 */
export const SLIP_FROM = 5;

export function enhanceCost(it: Item): number {
  const p = it.plus ?? 0;
  return Math.round((30 + 8 * it.rarity * it.rarity + it.ilvl * 3) * (1 + p * 0.7));
}

export function rerollCost(it: Item): number {
  return 60 + 16 * it.rarity * it.rarity + it.ilvl * 6;
}

export const SALVAGE_BONUS = [0, 0.2, 0.4, 0.6];

// ---------------------------------------------------------------- 치유소
export const purgeCost = (ch: Character) => 120 * ch.star;
export const cureCost = (ch: Character) => ({ gold: 220 * ch.star, shards: 1 });
export const DORMANCY_COST = { gold: 200, shards: 2 };

// ---------------------------------------------------------------- 추모비
export const MEMORIAL_SLOTS = [0, 1, 2, 4];
export const MERIT_LEVEL = 12;
export const REZ = { gold: 4000, shards: 15, merit: 24, chance: 0.6, decay: 0.1 };

/** 업적 점수: 높은 레벨과 보스·정예 토벌. 단순 사망자 수와는 무관하다. */
export function meritOf(ch: Character): number {
  const d = ch.deeds ?? { boss: 0, elite: 0 };
  return ch.level + d.boss * 6 + d.elite * 2 + Math.floor(ch.kills / 15);
}

/** 추모비에 새길 자격: 고레벨이거나 큰 공을 세운 자 */
export function isMeritorious(ch: Character): boolean {
  const d = ch.deeds ?? { boss: 0, elite: 0 };
  return ch.level >= MERIT_LEVEL || d.boss >= 1 || d.elite >= 3;
}

export function heroBonusPct(hero: Character): number {
  return Math.max(2, Math.min(8, Math.floor(meritOf(hero) / 4)));
}

export interface MemorialBonus { mul: Partial<Stats>; expMul: number; crit: number; sources: string[] }

/** 봉안된 영웅들이 살아 있는 동료에게 남기는 유지. 같은 직업 → 공격·마력, 같은 종족 → 체력·방어·저항, 같은 소속 → 경험치·치명 */
export function memorialBonus(ch: Character, heroes: Character[]): MemorialBonus {
  const add: Partial<Record<keyof Stats, number>> = {};
  let exp = 0;
  let crit = 0;
  const sources: string[] = [];
  for (const hero of heroes) {
    if (hero.id === ch.id) continue;
    const pct = heroBonusPct(hero) / 100;
    const why: string[] = [];
    if (hero.cls === ch.cls) { add.atk = (add.atk ?? 0) + pct; add.mag = (add.mag ?? 0) + pct; why.push('같은 직업'); }
    if (hero.race === ch.race) { add.hp = (add.hp ?? 0) + pct; add.def = (add.def ?? 0) + pct; add.res = (add.res ?? 0) + pct; why.push('같은 종족'); }
    if (hero.house && hero.house === ch.house) { exp += pct * 2; crit += 2; why.push(`같은 ${HOUSES[hero.house]?.short ?? '소속'}`); }
    if (why.length) sources.push(`${hero.given} (${why.join('·')}, ${Math.round(pct * 100)}%)`);
  }
  const mul: Partial<Stats> = {};
  for (const [k, v] of Object.entries(add)) mul[k as keyof Stats] = 1 + Math.min(0.2, v!);
  return { mul, expMul: 1 + Math.min(0.3, exp), crit: Math.min(6, crit), sources };
}

export function rezChance(attempts: number): number {
  return Math.max(0.2, REZ.chance - REZ.decay * attempts);
}

// ---------------------------------------------------------------- 재건도
export function restorationPct(fac: Record<string, number>, cleared: number, totalDungeons: number, lordLevel: number): number {
  const facSum = Object.values(fac).reduce((a, b) => a + b, 0);
  const p = (facSum / 9) * 55 + (cleared / Math.max(1, totalDungeons)) * 35 + Math.min(10, lordLevel);
  return Math.min(100, Math.round(p));
}
