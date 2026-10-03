// 상황별 대사 고르기 + 야영 대화 생성
import { CLASSES } from './data/classes';
import {
  CLASS_PAIR_TALK, CLASS_VOICE, COMMON_VOICE, HOUSE_TALK, HOUSE_VOICE, RACE_PAIR_TALK, RACE_VOICE, ROLE_VOICE,
  type Situation, type Talk, TIER_TALK, TRAIT_VOICE,
} from './data/dialogue';
import { HOUSES } from './data/houses';
import { houseTie, tierOf } from './relations';
import type { Rng } from './rng';
import type { Character, RaceId, Role } from './types';

export interface Voice { name: string; cls: string; race: RaceId; role: Role; house?: string; traits: string[] }

export function voiceOf(ch: Character): Voice {
  return { name: ch.given, cls: ch.cls, race: ch.race, role: CLASSES[ch.cls]?.role ?? 'melee', house: ch.house, traits: [...ch.traits, ...ch.curses] };
}

function fill(text: string, vars: Record<string, string | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

/** 상황에 맞는 한마디 (없으면 null) */
export function bark(rng: Rng, v: Voice, sit: Situation, vars: { target?: string } = {}): string | null {
  const pools: { lines: string[]; w: number }[] = [];
  const add = (lines: string[] | undefined, w: number) => { if (lines?.length) pools.push({ lines, w }); };
  for (const t of v.traits) add(TRAIT_VOICE[t]?.[sit], 3);
  const h = v.house ? HOUSES[v.house] : undefined;
  if (h && (sit === 'start' || sit === 'victory')) add(h.motto ? HOUSE_VOICE : HOUSE_VOICE.slice(1), 2.5);
  add(CLASS_VOICE[v.cls]?.[sit], 4);
  add(RACE_VOICE[v.race]?.[sit], 2);
  add(ROLE_VOICE[v.role]?.[sit], 1.5);
  add(COMMON_VOICE[sit], 3);
  if (!pools.length) return null;
  const pool = rng.weighted(pools, (p) => p.w);
  return fill(rng.pick(pool.lines), { name: v.name, target: vars.target, house: h?.name, motto: h?.motto });
}

const DEFAULT_DELTA: Record<string, [number, number]> = {
  sworn: [2, 5], comrade: [2, 5], neutral: [-1, 4], rival: [-4, 3], nemesis: [-5, 2], house: [2, 5], special: [-2, 5],
};

export interface CampTalk { title: string; lines: string[]; delta: number; kind: 'house' | 'race' | 'class' | 'tier' }

/** 모닥불 앞의 두 사람 */
export function campTalk(rng: Rng, a: Character, b: Character, score: number): CampTalk {
  const tier = tierOf(score);
  const tie = houseTie(a, b);
  let talk: Talk | undefined;
  let speakers: [Character, Character] = [a, b];
  let kind: CampTalk['kind'] = 'tier';
  const vars: Record<string, string | undefined> = { a: a.given, b: b.given };
  if (tie && rng.chance(0.5)) {
    talk = rng.pick(HOUSE_TALK);
    speakers = [tie.senior, tie.junior];
    const h = HOUSES[tie.house];
    Object.assign(vars, { s: tie.senior.given, j: tie.junior.given, st: tie.titles[0], jt: tie.titles[1], house: h.name, motto: h.motto ?? h.perk.name });
    kind = 'house';
  }
  if (!talk) {
    const r1 = RACE_PAIR_TALK[`${a.race}|${b.race}`];
    const r2 = RACE_PAIR_TALK[`${b.race}|${a.race}`];
    if ((r1 || r2) && rng.chance(0.6)) {
      talk = rng.pick((r1 ?? r2)!);
      speakers = r1 ? [a, b] : [b, a];
      kind = 'race';
    }
  }
  if (!talk) {
    const c1 = CLASS_PAIR_TALK[`${a.cls}|${b.cls}`];
    const c2 = CLASS_PAIR_TALK[`${b.cls}|${a.cls}`];
    if ((c1 || c2) && rng.chance(0.6)) {
      talk = rng.pick((c1 ?? c2)!);
      speakers = c1 ? [a, b] : [b, a];
      kind = 'class';
    }
  }
  if (!talk) {
    talk = rng.pick(TIER_TALK[tier]);
    if (rng.chance(0.5)) speakers = [b, a];
  }
  vars.a = speakers[0].given;
  vars.b = speakers[1].given;
  const [lo, hi] = talk.delta ?? DEFAULT_DELTA[kind === 'tier' ? tier : kind === 'house' ? 'house' : 'special'];
  return {
    title: `${a.given} ↔ ${b.given}`,
    lines: talk.lines.map(([who, text]) => `${speakers[who].given}: "${fill(text, vars)}"`),
    delta: rng.int(lo, hi),
    kind,
  };
}
