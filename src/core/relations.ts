// 동료 관계: 기본 상성(진영·종족·소속·특성·직업) + 함께한 경험(전투·야영 대화)
import { HOUSES } from './data/houses';
import { compatibility } from './stats';
import type { Character, RaceId } from './types';

export type BondTier = 'nemesis' | 'rival' | 'neutral' | 'comrade' | 'sworn';
export const TIER_NAMES: Record<BondTier, string> = { nemesis: '원수', rival: '앙숙', neutral: '동료', comrade: '전우', sworn: '맹우' };
export const TIER_ICONS: Record<BondTier, string> = { nemesis: '☠', rival: '⚡', neutral: '·', comrade: '♥', sworn: '❖' };

/** 저장되는 것은 경험으로 쌓인 변화량뿐. 기본값은 매번 다시 계산한다 (소속·결속이 바뀌어도 맞도록). */
export interface Bond {
  delta: number;
  battles: number;
  talks: number;
  notes: string[]; // 최근 사건 (최대 4개)
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function tierOf(score: number): BondTier {
  if (score <= -50) return 'nemesis';
  if (score <= -20) return 'rival';
  if (score < 20) return 'neutral';
  if (score < 50) return 'comrade';
  return 'sworn';
}

export const clampBond = (v: number) => Math.max(-100, Math.min(100, Math.round(v)));

// ---------------------------------------------------------------- 종족 관계표 (-3 ~ +3, 대칭)
const RACE_REL: [RaceId, RaceId, number][] = [
  // 고전적 반목
  ['elf', 'darkelf', -2], ['elf', 'orc', -2], ['dwarf', 'elf', -1], ['dwarf', 'goblin', -2], ['dwarf', 'kobold', -1],
  ['gnome', 'goblin', -1], ['angel', 'demon', -3], ['angel', 'imp', -2], ['divine', 'demon', -3], ['divine', 'imp', -2],
  ['angel', 'vampire', -2], ['angel', 'revenant', -2], ['angel', 'shade', -2], ['divine', 'vampire', -2],
  ['human', 'orc', -1], ['halfling', 'goblin', -1], ['troll', 'dwarf', -1],
  // 포식자와 먹잇감 (다크 유머)
  ['catkin', 'rabbitkin', -1], ['catkin', 'birdfolk', -2], ['wolfkin', 'rabbitkin', -2], ['foxkin', 'rabbitkin', -1],
  ['wolfkin', 'foxkin', -1], ['bearkin', 'mushfolk', -1], ['catkin', 'merfolk', -1],
  // 원소 상극
  ['fire_spirit', 'water_spirit', -3], ['earth_spirit', 'wind_spirit', -2], ['fire_spirit', 'dryad', -3], ['fire_spirit', 'mushfolk', -1],
  ['fire_spirit', 'merfolk', -1], ['water_spirit', 'earth_spirit', -1],
  // 기타 반목
  ['goblin', 'kobold', -1], ['pixie', 'goblin', -1], ['dokkaebi', 'foxkin', -1], ['minotaur', 'human', -1],
  ['automaton', 'dryad', -1], ['revenant', 'divine', -2], ['shade', 'divine', -2], ['deepone', 'elf', -1],
  // 우호
  ['human', 'halfling', 1], ['dwarf', 'gnome', 2], ['elf', 'dryad', 2], ['dryad', 'mushfolk', 1], ['satyr', 'dryad', 1],
  ['satyr', 'pixie', 1], ['water_spirit', 'merfolk', 2], ['deepone', 'merfolk', 1], ['dragonkin', 'lizardfolk', 1],
  ['dragonkin', 'kobold', 2], ['orc', 'halfogre', 2], ['orc', 'troll', 2], ['goblin', 'orc', 1], ['automaton', 'gnome', 2],
  ['automaton', 'dwarf', 1], ['revenant', 'vampire', 1], ['shade', 'darkelf', 1], ['dokkaebi', 'human', 1],
  ['bearkin', 'wolfkin', 1], ['catkin', 'foxkin', 1], ['rabbitkin', 'halfling', 1], ['birdfolk', 'wind_spirit', 2],
  ['earth_spirit', 'dwarf', 1], ['fire_spirit', 'dragonkin', 1], ['minotaur', 'halfogre', 1], ['imp', 'demon', 1],
  ['angel', 'divine', 2], ['lizardfolk', 'kobold', 1],
];
const raceMap = new Map<string, number>();
for (const [a, b, v] of RACE_REL) { raceMap.set(`${a}|${b}`, v); raceMap.set(`${b}|${a}`, v); }

export function raceRelation(a: RaceId, b: RaceId): number {
  if (a === b) return 1;
  return raceMap.get(`${a}|${b}`) ?? 0;
}

// ---------------------------------------------------------------- 특성·직업 원한
const UNHOLY_RACES: RaceId[] = ['demon', 'imp', 'vampire', 'revenant', 'shade'];
const has = (c: Character, t: string) => c.traits.includes(t) || c.curses.includes(t) || c.blessings.includes(t);

function grudge(x: Character, y: Character, out: string[]): number {
  let v = 0;
  if (has(x, 'orc_grudge') && ['orc', 'halfogre', 'troll'].includes(y.race)) { v -= 30; out.push('오크에 대한 원한'); }
  if (has(x, 'elf_grudge') && ['elf', 'darkelf'].includes(y.race)) { v -= 30; out.push('엘프에 대한 원한'); }
  if (has(x, 'zealot') && (UNHOLY_RACES.includes(y.race) || y.vampire)) { v -= 20; out.push('광신자의 혐오'); }
  if (x.cls === 'vhunter' && (y.race === 'vampire' || y.vampire)) { v -= 35; out.push('사냥꾼과 사냥감'); }
  if (x.cls === 'exorcist' && UNHOLY_RACES.includes(y.race)) { v -= 15; out.push('퇴마사의 경계'); }
  if (x.cls === 'pyromaniac' && ['dryad', 'mushfolk'].includes(y.race)) { v -= 15; out.push('방화광을 무서워한다'); }
  if (x.cls === 'loanshark' && (has(y, 'greedy') || has(y, 'curse_debt'))) { v -= 10; out.push('채권자와 채무자'); }
  if (has(x, 'silver_tongue')) v += 4;
  if (has(x, 'gallows_humor')) v += 3;
  if (has(x, 'hothead') && has(y, 'hothead')) { v -= 8; out.push('둘 다 다혈질'); }
  if (has(x, 'drunkard') && has(y, 'drunkard')) { v += 10; out.push('술친구'); }
  if (x.cls === 'drunkard' && has(y, 'drunkard')) { v += 6; out.push('술친구'); }
  return v;
}

const CLASS_PAIRS: [string, string, number, string][] = [
  ['priest', 'plaguedoc', -10, '신앙 대 의술'], ['priest', 'cultist', -15, '진짜 신관과 가짜 교주'], ['paladin', 'cultist', -12, '성기사와 사이비'],
  ['junkie', 'plaguedoc', 8, '단골 환자'], ['junkie', 'alchemist', 6, '공급자'], ['gravedigger', 'mourner', 12, '동업자'],
  ['jester', 'executioner', 6, '같은 무대의 두 사람'], ['butcher', 'drunkard', 5, '선술집 단골'], ['loanshark', 'conartist', -6, '사기꾼과 수금원'],
  ['ratcatcher', 'scavenger', 8, '하수도 동료'], ['knight', 'rogue', -6, '규율과 무질서'], ['torturer', 'priest', -10, '고문과 고해'],
  ['bard', 'mourner', 6, '노래하는 자들'], ['beastmaster', 'hunter', 6, '짐승을 아는 자들'], ['gunner', 'archer', -4, '화약 대 시위'],
  ['spellblade', 'swordsman', 5, '검의 길'], ['geomancer', 'druid', 6, '땅을 읽는 자들'], ['necromancer', 'gravedigger', -8, '무덤 영역 다툼'],
  ['executioner', 'torturer', 8, '같은 조합'], ['puppeteer', 'jester', 7, '유랑 극단'], ['duelist', 'swordsman', 4, '검객의 예'],
];
const classMap = new Map<string, [number, string]>();
for (const [a, b, v, why] of CLASS_PAIRS) { classMap.set(`${a}|${b}`, [v, why]); classMap.set(`${b}|${a}`, [v, why]); }

// ---------------------------------------------------------------- 같은 소속의 위계
export interface HouseTie { house: string; senior: Character; junior: Character; titles: [string, string] }

export function houseTie(a: Character, b: Character): HouseTie | null {
  if (!a.house || a.house !== b.house) return null;
  const h = HOUSES[a.house];
  const rankOf = (c: Character) => c.star * 100 + c.level * 2 + (c.runs ?? 0);
  const [senior, junior] = rankOf(a) >= rankOf(b) ? [a, b] : [b, a];
  return { house: a.house, senior, junior, titles: h?.ranks ?? ['선배', '후배'] };
}

/** 기본 관계 점수와 그 이유 */
export function baseBond(a: Character, b: Character): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let s = 0;
  const comp = compatibility(a, b);
  s += comp * 4;
  if (comp >= 5) reasons.push('진영 성향이 잘 맞는다');
  else if (comp <= -5) reasons.push('진영 성향이 부딪힌다');
  const rr = raceRelation(a.race, b.race);
  s += rr * 7;
  if (a.race === b.race) reasons.push('같은 종족');
  else if (rr >= 2) reasons.push('종족끼리 사이가 좋다');
  else if (rr <= -2) reasons.push('종족 간 오랜 반목');
  s += grudge(a, b, reasons) + grudge(b, a, reasons);
  const cp = classMap.get(`${a.cls}|${b.cls}`);
  if (cp) { s += cp[0]; reasons.push(cp[1]); }
  const tie = houseTie(a, b);
  if (tie) { s += 25; reasons.push(`${HOUSES[tie.house].name}의 ${tie.titles[0]}와 ${tie.titles[1]}`); }
  if (a.vampire && b.vampire) { s += 8; reasons.push('함께 세계핵에 결속된 사이'); }
  return { score: clampBond(s), reasons: [...new Set(reasons)] };
}

export function bondScore(a: Character, b: Character, bond?: Bond): number {
  return clampBond(baseBond(a, b).score + (bond?.delta ?? 0));
}

/** 인접한 동료에 따른 피해 배율 */
export function adjacencyMul(score: number): number {
  const t = tierOf(score);
  return t === 'sworn' ? 1.12 : t === 'comrade' ? 1.06 : t === 'rival' ? 0.95 : t === 'nemesis' ? 0.9 : 1;
}

/** 관계에서 오는 사기 (-2 ~ +2) */
export function bondMorale(scores: number[]): number {
  let m = 0;
  for (const s of scores) {
    const t = tierOf(s);
    m += t === 'sworn' ? 1 : t === 'comrade' ? 0.5 : t === 'rival' ? -0.5 : t === 'nemesis' ? -1 : 0;
  }
  return Math.max(-2, Math.min(2, Math.round(m)));
}

export function pushNote(b: Bond, note: string): void {
  b.notes.unshift(note);
  if (b.notes.length > 4) b.notes.length = 4;
}
