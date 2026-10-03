import { CLASSES } from '../data/classes';
import { HOUSES } from '../data/houses';
import { EPITHETS, NAME_SETS } from '../data/names';
import { PLAYABLE_RACES, RACES } from '../data/races';
import { BLESSING_LIST, CURSE_LIST, TRAIT_LIST, TRAITS } from '../data/traits';
import { Rng } from '../rng';
import type { Character, ClassDef, Gender, HouseDef, RaceId, Star, TraitDef } from '../types';

export interface GenOptions {
  star?: Star;
  race?: RaceId;
  cls?: string;
  now?: number;
}

export const STAR_RATES: Record<Star, number> = { 1: 0.38, 2: 0.32, 3: 0.19, 4: 0.085, 5: 0.025 };

export function rollStar(rng: Rng, minStar: Star = 1): Star {
  const stars = ([1, 2, 3, 4, 5] as Star[]).filter((s) => s >= minStar);
  return rng.weighted(stars, (s) => STAR_RATES[s]);
}

export function generateName(rng: Rng, race: RaceId): { given: string; surname: string } {
  const set = NAME_SETS[race] ?? NAME_SETS.human!;
  let given = rng.pick(set.start);
  if (rng.chance(set.midChance)) given += rng.pick(set.mid);
  given += rng.pick(set.end);
  const surname = rng.chance(0.85) ? rng.pick(set.surnames) : '';
  return { given, surname };
}

function classAllowed(c: ClassDef, race: RaceId): boolean {
  if (c.races && !c.races.includes(race)) return false;
  if (c.notRaces && c.notRaces.includes(race)) return false;
  return true;
}

function traitAllowed(t: TraitDef, ch: Pick<Character, 'race' | 'cls' | 'star'>, have: string[]): boolean {
  if (have.includes(t.id)) return false;
  if (t.races && !t.races.includes(ch.race)) return false;
  if (t.notRaces && t.notRaces.includes(ch.race)) return false;
  if (t.classes && !t.classes.includes(ch.cls)) return false;
  if (t.minStar && ch.star < t.minStar) return false;
  for (const h of have) {
    if (t.exclusive?.includes(h)) return false;
    if (TRAITS[h]?.exclusive?.includes(t.id)) return false;
  }
  return true;
}

/** 가문 소속 조건 판정 */
export function houseEligible(h: HouseDef, ch: Character): boolean {
  const c = h.cond;
  if (ch.star < c.minStar) return false;
  if (c.races && !c.races.includes(ch.race)) return false;
  if (c.classes && !c.classes.includes(ch.cls)) return false;
  const all = [...ch.traits, ...ch.curses, ...ch.blessings];
  if (c.anyTraits && !c.anyTraits.some((t) => all.includes(t))) return false;
  if (c.noTraits && c.noTraits.some((t) => all.includes(t))) return false;
  if (c.vampire !== undefined && c.vampire !== ch.vampire) return false;
  if (c.blessing && ch.blessings.length === 0) return false;
  if (ch.vampire && h.forbidBound) return false;
  return true;
}

export function eligibleHouses(ch: Character): HouseDef[] {
  return Object.values(HOUSES).filter((h) => houseEligible(h, ch));
}

/** 조건을 만족하는 가문 중 하나에 확률적으로 소속 */
export function rollHouse(rng: Rng, ch: Character): HouseDef | undefined {
  const cands = eligibleHouses(ch);
  const legendary = cands.filter((h) => h.rarity === 'legendary');
  const ordered = [...rng.shuffle(legendary), ...rng.shuffle(cands.filter((h) => h.rarity !== 'legendary'))];
  for (const h of ordered) if (rng.chance(h.chance)) return h;
  return undefined;
}

export function generateCharacter(seed: number, opts: GenOptions = {}): Character {
  const rng = new Rng(seed);
  const star = opts.star ?? rollStar(rng);

  const raceDef = opts.race
    ? RACES[opts.race]
    : rng.weighted(
        PLAYABLE_RACES.filter((r) => r.minStar <= star),
        (r) => r.weight * (r.minStar >= 3 && star >= 4 ? 2 : 1),
      );
  const race = raceDef.id;

  const genders: Gender[] = raceDef.genders ?? ['m', 'f'];
  const gender: Gender = rng.chance(0.06) ? 'x' : rng.pick(genders);

  const clsDef = opts.cls
    ? CLASSES[opts.cls]
    : rng.weighted(
        Object.values(CLASSES).filter((c) => classAllowed(c, race)),
        (c) => c.weight * (raceDef.classBias?.[c.id] ?? 1),
      );

  const roll = {
    hp: rng.int(-5, 5), atk: rng.int(-2, 2), mag: rng.int(-2, 2), def: rng.int(-2, 2),
    res: rng.int(-2, 2), spd: rng.int(-2, 2), crit: rng.int(-2, 2),
  };

  const skills = rng.sample(clsDef.skills, star >= 4 ? 3 : 2);

  const base: Character = {
    id: `c_${seed.toString(36)}`,
    seed,
    given: '', surname: '',
    gender, race, cls: clsDef.id, star,
    level: 1, exp: 0,
    traits: [], curses: [], blessings: [],
    skills,
    roll,
    vampire: false,
    dormant: 0,
    kills: 0, runs: 0,
    createdAt: opts.now ?? Date.now(),
  };

  // 특성: 성급이 높을수록 긍정 특성이 잘 나온다
  const traitCount = 1 + (star >= 3 ? 1 : 0) + (rng.chance(0.35) ? 1 : 0);
  for (let i = 0; i < traitCount; i++) {
    const pool = TRAIT_LIST.filter((t) => traitAllowed(t, base, base.traits));
    if (!pool.length) break;
    const t = rng.weighted(pool, (t) => t.weight * (t.polarity === 1 ? 0.8 + 0.15 * star : t.polarity === -1 ? Math.max(0.3, 1.3 - 0.15 * star) : 1));
    base.traits.push(t.id);
  }
  if (rng.chance(0.22 - 0.02 * star)) {
    const pool = CURSE_LIST.filter((t) => traitAllowed(t, base, base.curses));
    if (pool.length) base.curses.push(rng.weighted(pool, (t) => t.weight).id);
  }
  if (rng.chance(0.03 + 0.07 * (star - 1))) {
    const pool = BLESSING_LIST.filter((t) => traitAllowed(t, base, base.blessings));
    if (pool.length) base.blessings.push(rng.weighted(pool, (t) => t.weight).id);
  }

  const h = rollHouse(rng.fork('house'), base);
  if (h) base.house = h.id;

  const nm = generateName(rng.fork('name'), race);
  base.given = nm.given;
  base.surname = h?.surname ?? nm.surname;
  if (star === 5 || (star === 4 && rng.chance(0.3))) base.epithet = rng.pick(EPITHETS);

  return base;
}
