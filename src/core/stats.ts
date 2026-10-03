import { CLASSES } from './data/classes';
import { factionRelation, FACTION_IDS } from './data/factions';
import { HOUSES } from './data/houses';
import { RACES } from './data/races';
import { TRAITS } from './data/traits';
import { memorialBonus } from './facilities';
import { itemEffects, itemStatMod } from './gen/item';
import {
  type Affinity, type Character, type Effects, type FactionId, type Stats, type StatKey,
  STAT_KEYS, defaultEffects, emptyStats,
} from './types';

// 결속자: 세계핵의 힘으로 강해지고 재생하지만, 균열(대붕괴의 잔재)에서 온 공격에 약하다
export const BOUND_EFFECTS: Partial<Effects> = { regen: 0.03, nightVision: true, dmgTakenTag: { rift: 0.3 } };
export const BOUND_STAT_MUL: Partial<Stats> = { atk: 1.1, mag: 1.1, spd: 1.1 };
export const BOUND_AFFINITY: Affinity = { radiance: -2 };

// 추모비에 봉안된 영웅들 (저장 데이터에서 Store가 등록한다)
let enshrined: Character[] = [];
export function setEnshrined(heroes: Character[]): void {
  enshrined = heroes;
}
export function enshrinedHeroes(): Character[] {
  return enshrined;
}

export function allTraitIds(ch: Character): string[] {
  return [...ch.traits, ...ch.curses, ...ch.blessings];
}

export function levelCap(star: number): number {
  return 5 + star * 3;
}

export function expToNext(level: number): number {
  return 20 + level * 15;
}

const STAR_SCALED: StatKey[] = ['hp', 'atk', 'mag', 'def', 'res', 'spd'];

export function computeStats(ch: Character): Stats {
  const c = CLASSES[ch.cls];
  const r = RACES[ch.race];
  const s = emptyStats();
  for (const k of STAT_KEYS) {
    s[k] = (c.base[k] ?? 0) + (r.statMod[k] ?? 0) + (ch.roll[k] ?? 0);
  }
  const starMul = 1 + 0.1 * (ch.star - 1);
  for (const k of STAR_SCALED) s[k] *= starMul;
  const lv = ch.level - 1;
  for (const k of STAT_KEYS) s[k] += (c.growth[k] ?? 0) * lv;

  const mods: Partial<Stats>[] = [];
  const muls: Partial<Stats>[] = [];
  for (const id of allTraitIds(ch)) {
    const t = TRAITS[id];
    if (!t) continue;
    if (t.statMod) mods.push(t.statMod);
    if (t.statMul) muls.push(t.statMul);
  }
  if (ch.house) {
    const h = HOUSES[ch.house];
    if (h?.perk.statMod) mods.push(h.perk.statMod);
    if (h?.perk.statMul) muls.push(h.perk.statMul);
  }
  for (const it of Object.values(ch.gear ?? {})) if (it) mods.push(itemStatMod(it));
  if (ch.vampire) muls.push(BOUND_STAT_MUL);
  if (enshrined.length) {
    const mb = memorialBonus(ch, enshrined);
    muls.push(mb.mul);
    if (mb.crit) mods.push({ crit: mb.crit });
  }
  for (const m of mods) for (const k of STAT_KEYS) s[k] += m[k] ?? 0;
  for (const m of muls) for (const k of STAT_KEYS) s[k] *= m[k] ?? 1;

  for (const k of STAT_KEYS) s[k] = Math.round(s[k]);
  s.hp = Math.max(10, s.hp);
  s.mov = Math.max(2, Math.min(7, s.mov));
  s.spd = Math.max(3, s.spd);
  s.crit = Math.max(0, Math.min(60, s.crit));
  for (const k of ['atk', 'mag', 'def', 'res'] as StatKey[]) s[k] = Math.max(0, s[k]);
  return s;
}

export function mergeEffects(into: Effects, e: Partial<Effects> | undefined): Effects {
  if (!e) return into;
  for (const key of Object.keys(e) as (keyof Effects)[]) {
    const v = e[key];
    if (v === undefined) continue;
    switch (key) {
      case 'expMul': case 'goldMul': case 'healMul': case 'dmgMul': case 'dmgTakenMul':
        (into[key] as number) *= v as number;
        break;
      case 'nightVision': case 'firstStrike': case 'holyAttack':
        (into[key] as boolean) = (into[key] as boolean) || (v as boolean);
        break;
      case 'dmgVsTag': case 'dmgTakenTag': {
        const dict = into[key];
        for (const [tag, n] of Object.entries(v as Record<string, number>)) dict[tag] = (dict[tag] ?? 0) + n;
        break;
      }
      default:
        (into[key] as number) += v as number;
    }
  }
  return into;
}

export function computeEffects(ch: Character): Effects {
  const eff = defaultEffects();
  mergeEffects(eff, RACES[ch.race].effects);
  for (const id of allTraitIds(ch)) mergeEffects(eff, TRAITS[id]?.effects);
  if (ch.house) mergeEffects(eff, HOUSES[ch.house]?.perk.effects);
  for (const it of Object.values(ch.gear ?? {})) if (it) for (const e of itemEffects(it)) mergeEffects(eff, e);
  if (ch.vampire) mergeEffects(eff, BOUND_EFFECTS);
  if (ch.cheatDeathUsed) eff.cheatDeath = Math.max(0, eff.cheatDeath - 1);
  if (enshrined.length) eff.expMul *= memorialBonus(ch, enshrined).expMul;
  return eff;
}

export function characterAffinity(ch: Character): Record<FactionId, number> {
  const out = Object.fromEntries(FACTION_IDS.map((f) => [f, 0])) as Record<FactionId, number>;
  const add = (a?: Affinity) => {
    if (!a) return;
    for (const [f, v] of Object.entries(a)) out[f as FactionId] += v as number;
  };
  add(RACES[ch.race].affinity);
  add(CLASSES[ch.cls].affinity);
  for (const id of allTraitIds(ch)) add(TRAITS[id]?.affinity);
  if (ch.house) add(HOUSES[ch.house]?.affinity);
  if (ch.vampire) add(BOUND_AFFINITY);
  return out;
}

/** 두 캐릭터의 진영 상성 점수. 양수 = 화합, 음수 = 불화 */
export function compatibility(a: Character, b: Character): number {
  const fa = characterAffinity(a);
  const fb = characterAffinity(b);
  let sum = 0;
  for (const f of FACTION_IDS) {
    if (!fa[f]) continue;
    for (const g of FACTION_IDS) {
      if (!fb[g]) continue;
      sum += fa[f] * fb[g] * factionRelation(f, g);
    }
  }
  return sum / 9;
}

export interface SynergyPair { a: string; b: string; score: number; kind: 'harmony' | 'discord' }
export interface PartySynergy { pairs: SynergyPair[]; morale: number }

export const HARMONY_T = 5;
export const DISCORD_T = -5;

export function partySynergy(chars: Character[]): PartySynergy {
  const pairs: SynergyPair[] = [];
  for (let i = 0; i < chars.length; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      const score = compatibility(chars[i], chars[j]);
      if (score >= HARMONY_T) pairs.push({ a: chars[i].id, b: chars[j].id, score, kind: 'harmony' });
      else if (score <= DISCORD_T) pairs.push({ a: chars[i].id, b: chars[j].id, score, kind: 'discord' });
    }
  }
  let morale = 0;
  for (const p of pairs) morale += p.kind === 'harmony' ? 1 : -1;
  morale = Math.max(-3, Math.min(3, morale));
  return { pairs, morale };
}

export function topFactions(ch: Character): { loves: FactionId[]; hates: FactionId[] } {
  const aff = characterAffinity(ch);
  const entries = Object.entries(aff) as [FactionId, number][];
  return {
    loves: entries.filter(([, v]) => v >= 2).sort((x, y) => y[1] - x[1]).map(([f]) => f),
    hates: entries.filter(([, v]) => v <= -2).sort((x, y) => x[1] - y[1]).map(([f]) => f),
  };
}

export function fullName(ch: Character): string {
  const base = ch.surname ? `${ch.given} ${ch.surname}` : ch.given;
  return ch.epithet ? `${ch.epithet} ${base}` : base;
}

export function powerScore(ch: Character): number {
  const s = computeStats(ch);
  return Math.round(s.hp * 0.5 + (s.atk + s.mag) * 2 + (s.def + s.res) * 1.5 + s.spd * 1.5 + s.crit * 0.5);
}
