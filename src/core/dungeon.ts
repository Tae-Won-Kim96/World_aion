import { CLASSES } from './data/classes';
import { DUNGEONS, type DungeonDef } from './data/dungeons';
import { ENEMIES } from './data/enemies';
import { EVENTS, type Cond, type EventDef } from './data/events';
import { RACES } from './data/races';
import { Rng } from './rng';
import { characterAffinity, computeEffects } from './stats';
import type { Character } from './types';

export type NodeKind = 'battle' | 'elite' | 'event' | 'rest' | 'treasure' | 'shop' | 'boss';

export const NODE_NAMES: Record<NodeKind, string> = {
  battle: '전투', elite: '정예', event: '사건', rest: '야영지', treasure: '보물', shop: '떠돌이 상인', boss: '보스',
};

export interface MapNode {
  id: string;
  layer: number;
  col: number;
  kind: NodeKind;
  next: string[];
}

export interface EnemySpawn { def: string; level: number; seed: number }

export interface BattleSpec {
  enemies: EnemySpawn[];
  elite: boolean;
  boss: boolean;
  ambush: boolean;
  darkness: Darkness;
  seed: number;
  goldBonus: number;
  theme: string;
}

export type Darkness = 'bright' | 'dim' | 'dark';

export interface Notice { title: string; lines: string[] }

export interface ShopItem { id: string; name: string; desc: string; price: number; sold?: boolean }

export interface RunState {
  dungeon: string;
  seed: number;
  runNo: number;
  nodes: MapNode[];
  current: string | null;
  visited: string[];
  party: string[];
  hp: Record<string, number>;
  fallen: { id: string; vampire: boolean; name: string }[];
  torch: number;
  gold: number;
  essence: number;
  recruits: Character[];
  log: string[];
  phase: 'map' | 'event' | 'battle' | 'shop' | 'result';
  event?: { id: string; resolved?: { text: string; lines: string[]; fight?: 'battle' | 'elite' } };
  battle?: BattleSpec;
  shop?: ShopItem[];
  notice?: Notice;
  usedEvents: string[];
  outcome?: 'victory' | 'retreat' | 'wipe';
  step: number;
}

export function generateMap(d: DungeonDef, seed: number): MapNode[] {
  const rng = new Rng(seed);
  const layers: MapNode[][] = [];
  const L = d.floors;
  for (let i = 0; i < L; i++) {
    const cols = [0, 1, 2].filter(() => rng.chance(0.8));
    if (cols.length < 2) cols.splice(0, cols.length, ...rng.sample([0, 1, 2], 2).sort());
    const layer = cols.map((col) => {
      let kind: NodeKind;
      if (i === 0) kind = 'battle';
      else if (i === L - 1) kind = 'rest';
      else {
        kind = rng.weighted<NodeKind>(['battle', 'event', 'elite', 'treasure', 'rest', 'shop'], (k) => ({
          battle: 42, event: 28, elite: i >= 2 ? 11 : 0, treasure: 8, rest: i >= 2 ? 6 : 0, shop: i >= 2 ? 5 : 0,
        }[k as string] ?? 0));
      }
      return { id: `n${i}_${col}`, layer: i, col, kind, next: [] } as MapNode;
    });
    layers.push(layer);
  }
  const boss: MapNode = { id: 'boss', layer: L, col: 1, kind: 'boss', next: [] };
  layers.push([boss]);
  for (let i = 0; i < layers.length - 1; i++) {
    const cur = layers[i];
    const nxt = layers[i + 1];
    for (const n of cur) {
      let targets = nxt.filter((m) => Math.abs(m.col - n.col) <= 1);
      if (!targets.length) targets = [nxt.reduce((a, b) => (Math.abs(a.col - n.col) <= Math.abs(b.col - n.col) ? a : b))];
      n.next = targets.map((t) => t.id);
    }
    for (const m of nxt) {
      if (!cur.some((n) => n.next.includes(m.id))) {
        const src = cur.reduce((a, b) => (Math.abs(a.col - m.col) <= Math.abs(b.col - m.col) ? a : b));
        src.next.push(m.id);
      }
    }
  }
  return layers.flat();
}

export function reachable(run: RunState): string[] {
  if (run.current === null) return run.nodes.filter((n) => n.layer === 0).map((n) => n.id);
  return run.nodes.find((n) => n.id === run.current)?.next ?? [];
}

export function darkness(torch: number): Darkness {
  return torch >= 50 ? 'bright' : torch >= 25 ? 'dim' : 'dark';
}

export const DARKNESS_NAMES: Record<Darkness, string> = { bright: '밝음', dim: '어스름', dark: '칠흑' };
export const LOOT_MUL: Record<Darkness, number> = { bright: 1, dim: 1.1, dark: 1.25 };

export function torchCost(party: Character[]): number {
  const saver = Math.max(0, ...party.map((c) => computeEffects(c).torchSaver));
  return Math.max(4, Math.round(12 * (1 - Math.min(0.6, saver))));
}

export function makeBattle(run: RunState, kind: 'battle' | 'elite' | 'boss', party: Character[], rng: Rng): BattleSpec {
  const d = DUNGEONS[run.dungeon];
  const node = run.nodes.find((n) => n.id === run.current);
  const layer = node?.layer ?? 0;
  const level = 1 + Math.floor(layer * 0.8) + d.tier * 5;
  const count = kind === 'battle' ? Math.min(5, 2 + Math.floor(layer / 2) + (rng.chance(0.5) ? 1 : 0)) : kind === 'boss' ? 2 : 2 + (layer > 4 ? 1 : 0);
  const enemies: EnemySpawn[] = [];
  if (kind === 'elite') enemies.push({ def: rng.pick(d.elites), level: level + 1, seed: rng.seed32() });
  if (kind === 'boss') enemies.push({ def: d.boss, level: level + 2, seed: rng.seed32() });
  for (let i = 0; i < count; i++) enemies.push({ def: rng.pick(d.enemies), level, seed: rng.seed32() });
  const dk = darkness(run.torch);
  const nv = party.filter((c) => computeEffects(c).nightVision).length;
  let ambushP = dk === 'dim' ? 0.15 : dk === 'dark' ? 0.35 : 0;
  if (nv * 2 >= party.length) ambushP /= 2;
  return {
    enemies, elite: kind === 'elite', boss: kind === 'boss', ambush: kind !== 'boss' && rng.chance(ambushP),
    darkness: dk, seed: rng.seed32(), goldBonus: LOOT_MUL[dk], theme: run.dungeon,
  };
}

// ---------------------------------------------------------------- 이벤트 조건

export function condMatch(c: Cond, party: Character[], gold: number): Character | null | true {
  if ('any' in c) {
    for (const sub of c.any) {
      const r = condMatch(sub, party, gold);
      if (r) return r;
    }
    return null;
  }
  if ('gold' in c) return gold >= c.gold ? true : null;
  const pred = (ch: Character): boolean => {
    if ('race' in c) return c.race.includes(ch.race);
    if ('cls' in c) return c.cls.includes(ch.cls);
    if ('trait' in c) return [...ch.traits, ...ch.curses, ...ch.blessings].some((t) => c.trait.includes(t));
    if ('house' in c) return !!ch.house && c.house.includes(ch.house);
    if ('vampire' in c) return ch.vampire;
    if ('mortal' in c) return !ch.vampire;
    if ('tag' in c) return RACES[ch.race].tags.includes(c.tag);
    if ('role' in c) return c.role.includes(CLASSES[ch.cls].role);
    if ('curse' in c) return ch.curses.length > 0;
    if ('affinity' in c) return characterAffinity(ch)[c.affinity] >= c.min;
    return false;
  };
  return party.find(pred) ?? null;
}

export function pickEvent(run: RunState, rng: Rng): EventDef {
  const pool = EVENTS.filter((e) => !run.usedEvents.includes(e.id));
  return rng.weighted(pool.length ? pool : EVENTS, (e) => e.weight);
}

export function makeShop(rng: Rng, discount: number): ShopItem[] {
  const p = (n: number) => Math.max(1, Math.round(n * (1 - Math.min(0.5, discount))));
  const items: ShopItem[] = [
    { id: 'torch', name: '횃불 기름', desc: '횃불 +30', price: p(30) },
    { id: 'bandage', name: '붕대 꾸러미', desc: '파티 전원 체력 35% 회복', price: p(50) },
    { id: 'holywater', name: '성수', desc: '저주 하나를 정화한다', price: p(80) },
    { id: 'essence', name: '피의 정수', desc: '피의 정수 +1', price: p(120) },
  ];
  return rng.sample(items, 3);
}

export function enemyName(id: string): string {
  return ENEMIES[id]?.name ?? id;
}
