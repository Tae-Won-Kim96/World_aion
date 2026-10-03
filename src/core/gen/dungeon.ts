// 절차적 던전: 시드 + 위험도 → 지형 × 적 세력 × 보스 × 변이 × 이름
// 저장에는 id(`g{위험도}_{시드}`)만 남기고, 필요할 때 다시 만든다.
import { BIOMES, BIOME_IDS } from '../data/biomes';
import { DUNGEON_MODS, DUNGEON_MOD_IDS } from '../data/dungeon_mods';
import { DEFAULT_FX, DUNGEONS, type DungeonDef, type DungeonFx } from '../data/dungeons';
import { ENEMIES } from '../data/enemies';
import { WARBANDS } from '../data/warbands';
import { Rng } from '../rng';
import { generateName } from './character';

export const MAX_RISK = 10;
export const BOARD_SIZE = 5;

export function genDungeonId(risk: number, seed: number): string {
  return `g${risk}_${(seed >>> 0).toString(36)}`;
}

export function parseGenId(id: string): { risk: number; seed: number } | null {
  const m = /^g(\d+)_([0-9a-z]+)$/.exec(id);
  if (!m) return null;
  return { risk: Math.max(1, Math.min(MAX_RISK, Number(m[1]))), seed: parseInt(m[2], 36) >>> 0 };
}

export function isGenerated(id: string): boolean {
  return !DUNGEONS[id] && parseGenId(id) !== null;
}

const cache = new Map<string, DungeonDef>();

/** 고정 던전이든 생성 던전이든 id로 정의를 얻는다 */
export function dungeonOf(id: string): DungeonDef {
  const fixed = DUNGEONS[id];
  if (fixed) return fixed;
  let d = cache.get(id);
  if (d) return d;
  const p = parseGenId(id);
  if (!p) return DUNGEONS.necropolis;
  d = generateDungeon(p.seed, p.risk);
  cache.set(id, d);
  return d;
}

export function dungeonFx(d: DungeonDef): DungeonFx {
  return d.fx ?? DEFAULT_FX;
}

const ADJ = [
  '울부짖는', '잊힌', '불타는', '얼어붙은', '썩어가는', '속삭이는', '피에 젖은', '부서진', '버려진', '저주받은',
  '굶주린', '끝없는', '녹슨', '무너진', '검은', '창백한', '미친', '침묵하는', '뒤틀린', '마지막',
  '이름 없는', '붉은', '황금빛', '독이 스민', '안개 낀', '메아리치는', '눈먼', '웃는', '흐느끼는', '타락한',
  '오래된', '갈라진', '깨어난', '유령 들린', '천 개의', '영원한', '가라앉은', '뼈가 쌓인', '노래하는', '숨 막히는',
  '피 흘리는', '금지된', '비틀거리는', '잠들지 않는', '빛바랜', '타오르는', '얼음 같은', '굶어 죽은', '소리 없는', '무수한',
  '배신당한', '잿빛', '핏빛', '독한', '속이 빈', '돌아오지 못한', '끓어오르는', '눈물 젖은', '버림받은', '굽이치는',
];

const MUL_KEYS: (keyof DungeonFx)[] = ['torchMul', 'goldMul', 'expMul', 'enemyDmgMul', 'eliteW', 'restW', 'treasureW'];

function mergeFx(mods: string[]): DungeonFx {
  const fx: DungeonFx = { ...DEFAULT_FX };
  for (const id of mods) {
    for (const [k, v] of Object.entries(DUNGEON_MODS[id].fx) as [keyof DungeonFx, number][]) {
      if (MUL_KEYS.includes(k)) fx[k] *= v;
      else fx[k] += v;
    }
  }
  return fx;
}

export function generateDungeon(seed: number, risk: number): DungeonDef {
  const rng = new Rng((seed ^ 0xd1ce) >>> 0);
  risk = Math.max(1, Math.min(MAX_RISK, risk));
  // 지형 → 그 지형에 어울리고 위험도에 맞는 세력
  let biome = BIOMES[rng.pick(BIOME_IDS)];
  let cands = Object.entries(biome.warbands).filter(([w]) => WARBANDS[w].minRisk <= risk);
  if (!cands.length) {
    biome = BIOMES[rng.pick(BIOME_IDS.filter((b) => Object.keys(BIOMES[b].warbands).some((w) => WARBANDS[w].minRisk <= risk)))];
    cands = Object.entries(biome.warbands).filter(([w]) => WARBANDS[w].minRisk <= risk);
  }
  const wb = WARBANDS[rng.weighted(cands, ([, w]) => w)[0]];
  // 변이: 위험할수록 많다
  const nMods = rng.weighted([0, 1, 2], (n) => (risk >= 6 ? [1, 3, 3] : risk >= 3 ? [2, 3, 1] : [3, 2, 0])[n]);
  const mods: string[] = [];
  for (let i = 0; i < nMods; i++) {
    const pool = DUNGEON_MOD_IDS.filter((m) => DUNGEON_MODS[m].minRisk <= risk && !mods.includes(m)
      && !(m === 'long_road' && mods.includes('short_road')) && !(m === 'short_road' && mods.includes('long_road')));
    if (!pool.length) break;
    mods.push(rng.pick(pool));
  }
  const fx = mergeFx(mods);
  // 적 구성
  const enemies = [...wb.regulars];
  const elites = [...wb.elites];
  if (mods.includes('mixed')) {
    const others = Object.values(WARBANDS).filter((w) => w.id !== wb.id && w.minRisk <= risk);
    if (others.length) {
      const w2 = rng.pick(others);
      enemies.push(...rng.sample(w2.regulars, 3));
      elites.push(rng.pick(w2.elites));
    }
  }
  for (const m of mods) enemies.push(...(DUNGEON_MODS[m].extraEnemies ?? []));
  const bossId = rng.pick(wb.bosses);
  const bossDef = ENEMIES[bossId];
  const bossName = `${bossDef.title ?? bossDef.name} ${generateName(rng.fork('boss'), bossDef.race).given}`;
  const floorAdd = mods.reduce((a, m) => a + (DUNGEON_MODS[m].floors ?? 0), 0);
  const floors = Math.max(5, Math.min(11, 6 + Math.floor(risk / 3) + rng.int(-1, 1) + floorAdd));
  // 이름
  const noun = rng.pick(biome.nouns);
  const adj = rng.pick(ADJ);
  const roll = rng.next();
  // '균열의 균열'처럼 주인과 명사가 겹치면 주인을 빼고 짓는다
  const clash = noun.includes(wb.owner) || wb.owner.includes(noun);
  const name = roll < 0.55 || clash ? `${adj} ${noun}` : roll < 0.87 ? `${adj} ${wb.owner}의 ${noun}` : `${wb.owner}의 ${noun}`;
  return {
    id: genDungeonId(risk, seed),
    name,
    desc: `${biome.desc} ${wb.desc}`,
    floors,
    tier: Math.floor((risk - 1) / 2),
    lvl: Math.round((risk - 1) * 2),
    risk,
    enemies: [...new Set(enemies)],
    elites: [...new Set(elites)],
    boss: bossId,
    bossName,
    generated: true,
    biome: biome.id,
    warband: wb.id,
    mods,
    fx,
    theme: { floor: biome.floor, wall: biome.wall, accent: biome.accent, obstacles: biome.obstacles, sky: biome.sky, style: biome.style },
  };
}

// ---------------------------------------------------------------- 탐사 게시판
/** 정복한 최고 위험도 +1 까지 열린다 */
export function unlockedRisk(maxRisk: number): number {
  return Math.min(MAX_RISK, Math.max(1, maxRisk + 1));
}

export function rollBoardEntry(rng: Rng, unlocked: number, exact?: number): string {
  const risk = exact ?? rng.int(Math.max(1, unlocked - 3), unlocked);
  return genDungeonId(risk, rng.seed32());
}

/** 게시판을 size개로 채운다. 열린 최고 위험도짜리가 하나는 있도록 */
export function refillBoard(board: string[], unlocked: number, rng: Rng, size = BOARD_SIZE): string[] {
  const out = board.filter((id) => parseGenId(id) && parseGenId(id)!.risk <= unlocked);
  if (!out.some((id) => parseGenId(id)!.risk === unlocked)) {
    // 꽉 찼으면 가장 쉬운 곳을 빼고 자리를 만든다
    if (out.length >= size) {
      const easiest = out.reduce((a, b) => (parseGenId(b)!.risk < parseGenId(a)!.risk ? b : a));
      out.splice(out.indexOf(easiest), 1);
    }
    out.push(rollBoardEntry(rng, unlocked, unlocked));
  }
  while (out.length < size) {
    const id = rollBoardEntry(rng, unlocked);
    if (!out.includes(id)) out.push(id);
  }
  return out.slice(0, size);
}
