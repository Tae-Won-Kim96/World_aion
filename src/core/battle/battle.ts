import { CLASSES } from '../data/classes';
import { DUNGEONS } from '../data/dungeons';
import { ENEMIES } from '../data/enemies';
import { RACES } from '../data/races';
import { SKILLS } from '../data/skills';
import type { BattleSpec, Darkness } from '../dungeon';
import { Rng } from '../rng';
import { computeEffects, computeStats, fullName } from '../stats';
import {
  type Character, type ClassDef, type DamageKind, defaultEffects, type Effects, type FxKind, type Role,
  type SkillDef, STAT_KEYS, type Stats, type StatusApply, type StatusId,
} from '../types';

export const GRID_W = 10;
export const GRID_H = 7;

export interface Status { id: StatusId; turns: number; value?: number }

export interface Unit {
  uid: string;
  side: 'ally' | 'enemy';
  name: string;
  charId?: string;
  enemyDef?: string;
  seed: number;
  x: number;
  y: number;
  stats: Stats;
  maxHp: number;
  hp: number;
  eff: Effects;
  tags: string[];
  role: Role;
  attack: ClassDef['attack'];
  skills: string[];
  cd: Record<string, number>;
  statuses: Status[];
  ct: number;
  alive: boolean;
  vampire: boolean;
  boss: boolean;
  elite: boolean;
  cheatDeath: number;
  kills: number;
  level: number;
  pending?: Pending;
  phasesDone?: number[];
}

/** 예고 공격: 다음 자기 턴 시작 시 발동 */
export interface Pending { skill: string; x: number; y: number; tiles: { x: number; y: number }[] }

export interface Obstacle { x: number; y: number; kind: string }

export type BEvent =
  | { t: 'cast'; src: string; fx: FxKind; x: number; y: number; area: number; projectile: boolean; name: string }
  | { t: 'dmg'; src: string; dst: string; amount: number; crit: boolean; fx: FxKind }
  | { t: 'heal'; src: string; dst: string; amount: number }
  | { t: 'status'; dst: string; id: StatusId }
  | { t: 'death'; dst: string; by: string }
  | { t: 'cheat'; dst: string }
  | { t: 'push'; dst: string; x: number; y: number }
  | { t: 'dot'; dst: string; amount: number; id: StatusId }
  | { t: 'stun'; dst: string }
  | { t: 'charge'; src: string; name: string; tiles: { x: number; y: number }[] }
  | { t: 'interrupt'; src: string }
  | { t: 'phase'; src: string; text: string }
  | { t: 'spawn'; uid: string }
  | { t: 'gold'; src: string; amount: number }
  | { t: 'log'; text: string };

export interface BattleState {
  w: number;
  h: number;
  obstacles: Obstacle[];
  units: Unit[];
  turn: number;
  rng: Rng;
  darkness: Darkness;
  morale: number;
  over: null | 'victory' | 'defeat';
  log: string[];
  cheatUsed: string[];
  relics: string[];
  spawnN: number;
  bonusEssence: number;
  bonusGold: number;
}

export interface Action { id: string; name: string; skill: SkillDef; isAttack: boolean }

export const STATUS_NAMES: Record<StatusId, string> = {
  bleed: '출혈', poison: '중독', burn: '화상', stun: '기절', weak: '약화', vuln: '취약', guard: '방어',
  taunt: '도발', regen: '재생', bless: '축복', slow: '둔화', haste: '가속', shield: '보호막', mark: '표식',
};
export const BAD_STATUS: StatusId[] = ['bleed', 'poison', 'burn', 'stun', 'weak', 'vuln', 'slow', 'mark'];

// ---------------------------------------------------------------- 생성

function unitFromChar(ch: Character, hp: number, morale: number): Unit {
  const stats = computeStats(ch);
  const m = 1 + 0.04 * morale;
  for (const k of ['atk', 'mag', 'def', 'res'] as const) stats[k] = Math.round(stats[k] * m);
  const c = CLASSES[ch.cls];
  const eff = computeEffects(ch);
  return {
    uid: ch.id, side: 'ally', name: fullName(ch), charId: ch.id, seed: ch.seed,
    x: 0, y: 0, stats, maxHp: stats.hp, hp: Math.min(stats.hp, hp),
    eff, tags: [...RACES[ch.race].tags, ...(ch.vampire ? ['bound'] : [])], role: c.role,
    attack: c.attack, skills: [...ch.skills], cd: {}, statuses: [], ct: 0, alive: hp > 0,
    vampire: ch.vampire, boss: false, elite: false, cheatDeath: eff.cheatDeath, kills: 0, level: ch.level,
  };
}

export function enemyStats(defId: string, level: number): Stats {
  const def = ENEMIES[defId];
  const c = CLASSES[def.cls];
  const r = RACES[def.race];
  const s = {} as Stats;
  for (const k of STAT_KEYS) {
    const base = (c.base[k] ?? 0) + (r.statMod[k] ?? 0);
    s[k] = base * (def.mul[k] ?? 1) + (c.growth[k] ?? 0) * (level - 1) * 0.9;
    s[k] = k === 'mov' ? Math.round(s[k]) : Math.round(s[k]);
  }
  s.mov = Math.max(2, s.mov);
  return s;
}

function unitFromEnemy(defId: string, level: number, seed: number, idx: number): Unit {
  const def = ENEMIES[defId];
  const c = CLASSES[def.cls];
  const stats = enemyStats(defId, level);
  return {
    uid: `e${idx}_${defId}`, side: 'enemy', name: def.name, enemyDef: defId, seed,
    x: 0, y: 0, stats, maxHp: stats.hp, hp: stats.hp, eff: defaultEffects(),
    tags: [...new Set([...def.tags, ...RACES[def.race].tags])], role: c.role, attack: c.attack,
    skills: [...def.skills], cd: {}, statuses: [], ct: 0, alive: true, vampire: false,
    boss: !!def.boss, elite: !!def.elite, cheatDeath: 0, kills: 0, level,
  };
}

export interface BattleInput {
  party: { char: Character; hp: number }[];
  spec: BattleSpec;
  morale: number;
  relics?: string[];
}

export function createBattle(input: BattleInput): BattleState {
  const rng = new Rng(input.spec.seed);
  const st: BattleState = {
    w: GRID_W, h: GRID_H, obstacles: [], units: [], turn: 0, rng,
    darkness: input.spec.darkness, morale: input.morale, over: null, log: [], cheatUsed: [],
    relics: [...(input.relics ?? [])], spawnN: 0, bonusEssence: 0, bonusGold: 0,
  };
  const allies = input.party.filter((p) => p.hp > 0).map((p) => unitFromChar(p.char, p.hp, input.morale));
  const enemies = input.spec.enemies.map((e, i) => unitFromEnemy(e.def, e.level, e.seed, i));

  const rows = [1, 3, 5, 2, 4, 0, 6];
  allies.forEach((u, i) => {
    const front = u.role === 'tank' || u.role === 'melee';
    u.x = front ? 1 : 0;
    u.y = rows[i % rows.length];
  });
  enemies.forEach((u, i) => {
    const front = u.role === 'tank' || u.role === 'melee' || u.boss;
    u.x = front ? GRID_W - 2 : GRID_W - 1;
    u.y = u.boss ? 3 : rows[i % rows.length];
  });
  // 겹침 해소
  const taken = new Set<string>();
  for (const u of [...allies, ...enemies]) {
    let tries = 0;
    while (taken.has(`${u.x},${u.y}`) && tries < 30) {
      u.y = (u.y + 1) % GRID_H;
      if (tries % GRID_H === GRID_H - 1) u.x += u.side === 'ally' ? 1 : -1;
      tries++;
    }
    taken.add(`${u.x},${u.y}`);
  }
  st.units = [...allies, ...enemies];

  // 장애물: 중앙 지대에 배치하되 양 진영이 이어지도록
  const theme = DUNGEONS[input.spec.theme]?.theme.obstacles ?? ['rubble'];
  const n = rng.int(4, 7);
  for (let i = 0; i < n * 3 && st.obstacles.length < n; i++) {
    const x = rng.int(2, GRID_W - 3);
    const y = rng.int(0, GRID_H - 1);
    if (taken.has(`${x},${y}`)) continue;
    st.obstacles.push({ x, y, kind: rng.pick(theme) });
    if (!connected(st)) st.obstacles.pop();
    else taken.add(`${x},${y}`);
  }

  const has = (r: string) => st.relics.includes(r);
  for (const u of st.units) {
    u.ct = rng.int(0, 30) + u.stats.spd * 2;
    if (u.eff.firstStrike) u.ct += 60;
    if (u.side === 'enemy' && input.spec.ambush) u.ct += 60;
    if (u.eff.cowardice > 0 && rng.chance(u.eff.cowardice)) u.statuses.push({ id: 'slow', turns: 2 });
    if (u.side !== 'ally') continue;
    // 유물 (원정 한정 파티 효과)
    if (has('iron_boots')) u.stats.mov += 1;
    if (has('wolf_fang')) u.stats.crit += 8;
    if (has('black_contract')) { u.eff.dmgMul *= 1.15; u.eff.dmgTakenMul *= 1.1; }
    if (has('ward_crest')) u.statuses.push({ id: 'shield', turns: 3, value: Math.round(1.5 * Math.max(u.stats.mag, u.stats.def)) });
    if (has('war_drum')) u.statuses.push({ id: 'bless', turns: 2 });
    if (has('wind_feather')) { u.statuses.push({ id: 'haste', turns: 2 }); u.ct += 20; }
  }
  if (input.spec.ambush) st.log.push('기습당했다! 적이 먼저 움직인다.');
  return st;
}

function connected(st: BattleState): boolean {
  const start = { x: 0, y: 3 };
  const seen = new Set<string>([`${start.x},${start.y}`]);
  const q = [start];
  while (q.length) {
    const p = q.shift()!;
    for (const [dx, dy] of DIRS) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= st.w || ny >= st.h || seen.has(k)) continue;
      if (st.obstacles.some((o) => o.x === nx && o.y === ny)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  return seen.size >= st.w * st.h - st.obstacles.length;
}

// ---------------------------------------------------------------- 유틸

export const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function unitAt(st: BattleState, x: number, y: number): Unit | undefined {
  return st.units.find((u) => u.alive && u.x === x && u.y === y);
}

export function blocked(st: BattleState, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= st.w || y >= st.h) return true;
  return st.obstacles.some((o) => o.x === x && o.y === y);
}

export function hasStatus(u: Unit, id: StatusId): boolean {
  return u.statuses.some((s) => s.id === id && s.turns > 0);
}

export function effSpd(u: Unit): number {
  let s = u.stats.spd;
  if (hasStatus(u, 'haste')) s *= 1.3;
  if (hasStatus(u, 'slow')) s *= 0.7;
  return Math.max(1, s);
}

export function effMov(u: Unit): number {
  return Math.max(1, u.stats.mov - (hasStatus(u, 'slow') ? 1 : 0));
}

export function actionsOf(u: Unit): Action[] {
  const atk: SkillDef = {
    id: 'attack', name: u.attack.name, desc: '기본 공격', kind: u.attack.kind, target: 'enemy',
    range: u.attack.range, area: 0, power: 1, cooldown: 0, fx: u.attack.fx, projectile: u.attack.projectile,
  };
  const list: Action[] = [{ id: 'attack', name: u.attack.name, skill: atk, isAttack: true }];
  for (const id of u.skills) {
    const s = SKILLS[id];
    if (s) list.push({ id, name: s.name, skill: s, isAttack: false });
  }
  return list;
}

export function actionReady(u: Unit, a: Action): boolean {
  return (u.cd[a.id] ?? 0) <= 0;
}

// ---------------------------------------------------------------- 턴 진행

/** 다음 행동할 유닛까지 CT를 진행 */
export function advance(st: BattleState): Unit {
  for (let guard = 0; guard < 10000; guard++) {
    const ready = st.units.filter((u) => u.alive && u.ct >= 100);
    if (ready.length) {
      ready.sort((a, b) => b.ct - a.ct || b.stats.spd - a.stats.spd);
      return ready[0];
    }
    for (const u of st.units) if (u.alive) u.ct += effSpd(u);
  }
  throw new Error('advance: no unit');
}

/** 앞으로의 행동 순서 예측 */
export function predictOrder(st: BattleState, n: number): Unit[] {
  const sim = st.units.filter((u) => u.alive).map((u) => ({ u, ct: u.ct, spd: effSpd(u) }));
  const out: Unit[] = [];
  for (let g = 0; g < 5000 && out.length < n && sim.length; g++) {
    const ready = sim.filter((s) => s.ct >= 100).sort((a, b) => b.ct - a.ct || b.spd - a.spd);
    if (ready.length) {
      out.push(ready[0].u);
      ready[0].ct -= 100;
      continue;
    }
    for (const s of sim) s.ct += s.spd;
  }
  return out;
}

/** 턴 시작 처리. 기절이면 true(턴 넘김) */
export const BLOOD_MOON_TURN = 200;

export function startTurn(st: BattleState, u: Unit, ev: BEvent[]): boolean {
  st.turn++;
  if (st.turn === BLOOD_MOON_TURN) {
    // 교착 방지: 모두가 취약해진다
    for (const x of st.units) if (x.alive) x.statuses.push({ id: 'vuln', turns: 999 });
    ev.push({ t: 'log', text: '피의 달이 떠올랐다… 모두가 취약해진다.' });
  }
  for (const k of Object.keys(u.cd)) u.cd[k] = Math.max(0, u.cd[k] - 1);
  const dots: [StatusId, number][] = [['bleed', 0.05], ['poison', 0.06], ['burn', 0.07]];
  for (const [id, pct] of dots) {
    if (!hasStatus(u, id)) continue;
    let amount = Math.max(1, Math.round(u.maxHp * pct));
    if (u.side === 'ally' && st.relics.includes('holy_vial')) amount = Math.max(1, Math.ceil(amount / 2));
    u.hp -= amount;
    ev.push({ t: 'dot', dst: u.uid, amount, id });
    if (u.hp <= 0) {
      handleLethal(st, u, STATUS_NAMES[id], ev);
      if (!u.alive) return true;
    }
    checkPhases(st, u, ev);
  }
  let regen = u.eff.regen;
  if (hasStatus(u, 'regen')) regen += 0.08;
  if (regen > 0 && u.hp < u.maxHp) {
    const amount = Math.max(1, Math.round(u.maxHp * regen));
    const real = Math.min(amount, u.maxHp - u.hp);
    u.hp += real;
    if (real > 0) ev.push({ t: 'heal', src: u.uid, dst: u.uid, amount: real });
  }
  if (hasStatus(u, 'stun')) {
    ev.push({ t: 'stun', dst: u.uid });
    if (u.pending) {
      u.pending = undefined;
      ev.push({ t: 'interrupt', src: u.uid });
      ev.push({ t: 'log', text: `${u.name}의 영창이 끊겼다!` });
    }
    return true;
  }
  return false;
}

/** 위험 칸: side 진영을 노리는 예고 공격 범위 */
export function dangerTiles(st: BattleState, side: Unit['side']): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const u of st.units) if (u.alive && u.side !== side && u.pending) out.push(...u.pending.tiles);
  return out;
}

/** 예고했던 공격을 발동. 없으면 null */
export function resolvePending(st: BattleState, u: Unit): BEvent[] | null {
  const p = u.pending;
  if (!p || !u.alive) return null;
  u.pending = undefined;
  const sk = SKILLS[p.skill];
  return performAction(st, u, { id: p.skill, name: sk.name, skill: sk, isAttack: false }, p.x, p.y, true);
}

/** 소환: near 주변 빈 칸에 적 생성 */
export function spawnEnemies(st: BattleState, defId: string, count: number, near: Unit, ev: BEvent[]): void {
  const seen = new Set<string>([`${near.x},${near.y}`]);
  const q = [{ x: near.x, y: near.y }];
  const free: { x: number; y: number }[] = [];
  while (q.length && free.length < count) {
    const p = q.shift()!;
    for (const [dx, dy] of DIRS) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const k = `${nx},${ny}`;
      if (seen.has(k) || blocked(st, nx, ny)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny });
      if (!unitAt(st, nx, ny)) free.push({ x: nx, y: ny });
    }
  }
  for (const t of free.slice(0, count)) {
    const unit = unitFromEnemy(defId, Math.max(1, near.level - 3), st.rng.seed32(), 0);
    unit.uid = `s${st.spawnN++}_${defId}`;
    unit.side = near.side;
    unit.x = t.x;
    unit.y = t.y;
    unit.ct = 40;
    st.units.push(unit);
    ev.push({ t: 'spawn', uid: unit.uid });
  }
}

/** 보스/정예 페이즈 */
function checkPhases(st: BattleState, u: Unit, ev: BEvent[]): void {
  if (!u.alive || !u.enemyDef) return;
  const phases = ENEMIES[u.enemyDef]?.phases;
  if (!phases) return;
  phases.forEach((ph, i) => {
    if (u.phasesDone?.includes(i) || u.hp / u.maxHp > ph.at) return;
    (u.phasesDone ??= []).push(i);
    ev.push({ t: 'phase', src: u.uid, text: ph.text });
    for (const sa of ph.selfStatus ?? []) applyStatus(st, u, u, sa, ev);
    if (ph.heal) {
      const amt = Math.min(Math.round(u.maxHp * ph.heal), u.maxHp - u.hp);
      u.hp += amt;
      if (amt > 0) ev.push({ t: 'heal', src: u.uid, dst: u.uid, amount: amt });
    }
    for (const id of ph.addSkills ?? []) {
      if (!u.skills.includes(id)) u.skills.push(id);
      u.cd[id] = Math.max(1, (SKILLS[id]?.cooldown ?? 3) - 2);
    }
    if (ph.summon) spawnEnemies(st, ph.summon.def, ph.summon.count, u, ev);
  });
}

export function endTurn(st: BattleState, u: Unit): void {
  u.ct -= 100;
  for (const s of u.statuses) if (s.id !== 'shield' || s.turns > 0) s.turns--;
  u.statuses = u.statuses.filter((s) => s.turns > 0 && !(s.id === 'shield' && (s.value ?? 0) <= 0));
  checkOver(st);
}

export function checkOver(st: BattleState): BattleState['over'] {
  if (!st.units.some((u) => u.side === 'enemy' && u.alive)) st.over = 'victory';
  // 소환수만 남으면 패배 (동료가 모두 쓰러졌다)
  else if (!st.units.some((u) => u.side === 'ally' && u.alive && !isSummon(u))) st.over = 'defeat';
  return st.over;
}

/** 아군 소환수 (동료 캐릭터가 아닌 아군) */
export function isSummon(u: Unit): boolean {
  return u.side === 'ally' && !u.charId;
}

// ---------------------------------------------------------------- 이동

export function reachableTiles(st: BattleState, u: Unit): { x: number; y: number; d: number }[] {
  const mov = effMov(u);
  const out: { x: number; y: number; d: number }[] = [{ x: u.x, y: u.y, d: 0 }];
  const seen = new Map<string, number>([[`${u.x},${u.y}`, 0]]);
  const q = [{ x: u.x, y: u.y, d: 0 }];
  while (q.length) {
    const p = q.shift()!;
    if (p.d >= mov) continue;
    for (const [dx, dy] of DIRS) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const k = `${nx},${ny}`;
      if (seen.has(k) || blocked(st, nx, ny)) continue;
      const occ = unitAt(st, nx, ny);
      if (occ && occ.side !== u.side) continue; // 적은 통과 불가
      seen.set(k, p.d + 1);
      q.push({ x: nx, y: ny, d: p.d + 1 });
      if (!occ) out.push({ x: nx, y: ny, d: p.d + 1 });
    }
  }
  return out;
}

export function findPath(st: BattleState, u: Unit, tx: number, ty: number): { x: number; y: number }[] {
  const prev = new Map<string, string | null>([[`${u.x},${u.y}`, null]]);
  const q = [{ x: u.x, y: u.y }];
  while (q.length) {
    const p = q.shift()!;
    if (p.x === tx && p.y === ty) break;
    for (const [dx, dy] of DIRS) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const k = `${nx},${ny}`;
      if (prev.has(k) || blocked(st, nx, ny)) continue;
      const occ = unitAt(st, nx, ny);
      if (occ && occ.side !== u.side) continue;
      prev.set(k, `${p.x},${p.y}`);
      q.push({ x: nx, y: ny });
    }
  }
  const path: { x: number; y: number }[] = [];
  let cur: string | null | undefined = `${tx},${ty}`;
  if (!prev.has(cur)) return [];
  while (cur) {
    const [x, y] = cur.split(',').map(Number);
    path.unshift({ x, y });
    cur = prev.get(cur);
  }
  return path;
}

export function moveUnit(st: BattleState, u: Unit, x: number, y: number): boolean {
  if (!reachableTiles(st, u).some((t) => t.x === x && t.y === y)) return false;
  u.x = x;
  u.y = y;
  return true;
}

// ---------------------------------------------------------------- 대상

export function inRange(a: Action, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const d = dist(from, to);
  return d >= a.skill.range[0] && d <= a.skill.range[1];
}

/** 이 행동으로 지정 가능한 칸들 */
export function targetTiles(st: BattleState, u: Unit, a: Action, from: { x: number; y: number } = u): { x: number; y: number }[] {
  const s = a.skill;
  if (s.target === 'self') return [{ x: from.x, y: from.y }];
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < st.h; y++) {
    for (let x = 0; x < st.w; x++) {
      if (!inRange(a, from, { x, y })) continue;
      if (s.target === 'tile') { if (!blocked(st, x, y)) out.push({ x, y }); continue; }
      const t = unitAt(st, x, y);
      if (!t) {
        if (s.target === 'ally' && x === from.x && y === from.y) out.push({ x, y });
        continue;
      }
      if (s.target === 'enemy' && t.side !== u.side) out.push({ x, y });
      if (s.target === 'ally' && t.side === u.side && t !== u) out.push({ x, y });
      if (s.target === 'ally' && t === u && s.range[0] === 0) out.push({ x, y });
    }
  }
  return out;
}

/** 실제로 영향을 받는 유닛 */
export function affectedUnits(st: BattleState, u: Unit, a: Action, tx: number, ty: number, from: { x: number; y: number } = u): Unit[] {
  const s = a.skill;
  const friendly = s.kind === 'heal' || s.kind === 'buff';
  const center = s.target === 'self' ? from : { x: tx, y: ty };
  const units = st.units.filter((v) => v.alive);
  const posOf = (v: Unit) => (v === u ? from : v);
  if (s.area === 0) {
    if (s.target === 'self') return [u];
    const t = units.find((v) => posOf(v).x === tx && posOf(v).y === ty);
    if (!t) return [];
    return friendly === (t.side === u.side) ? [t] : [];
  }
  return units.filter((v) => dist(posOf(v), center) <= s.area && (friendly ? v.side === u.side : v.side !== u.side));
}

// ---------------------------------------------------------------- 피해 계산

function atkMul(u: Unit): number {
  let m = 1;
  if (hasStatus(u, 'bless')) m *= 1.25;
  if (hasStatus(u, 'weak')) m *= 0.75;
  if (u.eff.lowHpRage && u.hp < u.maxHp * 0.5) m *= 1 + u.eff.lowHpRage;
  return m * u.eff.dmgMul;
}

function guardAuraFor(st: BattleState, t: Unit): number {
  let best = 0;
  for (const v of st.units) {
    if (!v.alive || v === t || v.side !== t.side) continue;
    if (dist(v, t) === 1) best = Math.max(best, v.eff.guardAura);
  }
  return best;
}

export function estimateDamage(st: BattleState, u: Unit, t: Unit, s: SkillDef): number {
  return damageCore(st, u, t, s, false, 1).dmg;
}

function damageCore(st: BattleState, u: Unit, t: Unit, s: SkillDef, crit: boolean, variance: number): { dmg: number } {
  const kind: DamageKind = s.kind === 'phys' ? 'phys' : 'mag';
  const base = kind === 'phys' ? u.stats.atk : u.stats.mag;
  let raw = base * s.power * 1.25 * atkMul(u);
  const def = (kind === 'phys' ? t.stats.def : t.stats.res) * (1 - (s.pierce ?? 0));
  raw *= 30 / (30 + Math.max(0, def) * 2.5);
  const tags = unitTags(t);
  if (s.bonusVsTag && tags.includes(s.bonusVsTag.tag)) raw *= s.bonusVsTag.mul;
  let vs = 0;
  for (const tag of tags) vs += u.eff.dmgVsTag[tag] ?? 0;
  raw *= 1 + vs;
  const holy = s.fx === 'holy' || u.eff.holyAttack;
  if (holy) {
    raw *= 1 + (t.eff.dmgTakenTag.holy ?? 0);
    if (t.tags.includes('unholy')) raw *= 1.2;
  }
  if (crit) raw *= 1.5 + u.eff.critDmg;
  if (hasStatus(t, 'guard')) raw *= 0.7;
  if (hasStatus(t, 'vuln')) raw *= 1.25;
  if (hasStatus(t, 'mark')) raw *= 1.2;
  raw *= 1 - guardAuraFor(st, t);
  // 공격자 특징에 따른 받는 피해 (예: 결속자는 균열 피해에 약함)
  for (const tag of u.tags) raw *= 1 + (t.eff.dmgTakenTag[tag] ?? 0);
  raw *= t.eff.dmgTakenMul;
  if (u.side === 'enemy' && !t.eff.nightVision) raw *= st.darkness === 'dark' ? 1.15 : st.darkness === 'dim' ? 1.05 : 1;
  raw *= variance;
  return { dmg: Math.max(1, Math.round(raw)) };
}

/** 고정 태그 + 상태에서 오는 태그 (빈사·출혈 중·불타는 중 …) */
const STATUS_TAGS: Partial<Record<StatusId, string>> = { bleed: 'bleeding', poison: 'poisoned', burn: 'burning', stun: 'stunned', slow: 'slowed' };
export function unitTags(t: Unit): string[] {
  const tags = [...t.tags];
  if (t.hp < t.maxHp * 0.5) tags.push('wounded');
  for (const st of t.statuses) { const tag = STATUS_TAGS[st.id]; if (tag) tags.push(tag); }
  return tags;
}

function healAmount(u: Unit, s: SkillDef): number {
  return Math.max(1, Math.round(Math.max(u.stats.mag, u.stats.atk * 0.6) * s.power * u.eff.healMul));
}

function applyStatus(st: BattleState, src: Unit, t: Unit, a: StatusApply, ev: BEvent[]): void {
  if (a.chance !== undefined && !st.rng.chance(a.chance)) return;
  if (t.boss && a.id === 'stun' && st.rng.chance(0.5)) return; // 보스는 기절 저항
  const value = a.id === 'shield' ? Math.round((a.value ?? 1) * Math.max(src.stats.mag, src.stats.def)) : a.value;
  const ex = t.statuses.find((s) => s.id === a.id);
  if (ex) { ex.turns = Math.max(ex.turns, a.turns); if (value) ex.value = Math.max(ex.value ?? 0, value); }
  else t.statuses.push({ id: a.id, turns: a.turns, value });
  ev.push({ t: 'status', dst: t.uid, id: a.id });
}

function handleLethal(st: BattleState, t: Unit, by: string, ev: BEvent[]): void {
  if (t.cheatDeath > 0) {
    t.cheatDeath--;
    t.hp = 1;
    if (t.charId && !st.cheatUsed.includes(t.charId)) st.cheatUsed.push(t.charId);
    ev.push({ t: 'cheat', dst: t.uid });
    ev.push({ t: 'log', text: `${t.name}이(가) 죽음을 거부했다!` });
    return;
  }
  t.hp = 0;
  t.alive = false;
  ev.push({ t: 'death', dst: t.uid, by });
}

function dealDamage(st: BattleState, u: Unit, t: Unit, s: SkillDef, ev: BEvent[]): number {
  const crit = s.kind === 'phys' || s.kind === 'mag' ? st.rng.chance(u.stats.crit / 100) : false;
  let { dmg } = damageCore(st, u, t, s, crit, st.rng.float(0.9, 1.1));
  const shield = t.statuses.find((x) => x.id === 'shield' && (x.value ?? 0) > 0);
  if (shield) {
    const absorbed = Math.min(shield.value!, dmg);
    shield.value! -= absorbed;
    dmg -= absorbed;
  }
  t.hp -= dmg;
  ev.push({ t: 'dmg', src: u.uid, dst: t.uid, amount: dmg, crit, fx: s.fx });
  if (t.hp <= 0) {
    handleLethal(st, t, u.name, ev);
    if (!t.alive) {
      u.kills++;
      if (u.side === 'ally') onAllyKill(st, u, ev);
    }
  }
  checkPhases(st, t, ev);
  // 가시 갑옷: 근접 피해 반사
  if (t.side === 'ally' && st.relics.includes('thorn_mail') && dmg > 0 && u.alive && dist(u, t) === 1) {
    const back = Math.max(1, Math.round(dmg * 0.2));
    u.hp -= back;
    ev.push({ t: 'dmg', src: t.uid, dst: u.uid, amount: back, crit: false, fx: 'pierce' });
    if (u.hp <= 0) {
      handleLethal(st, u, '가시 갑옷', ev);
      if (!u.alive) t.kills++;
    }
    checkPhases(st, u, ev);
  }
  return dmg;
}

function onAllyKill(st: BattleState, u: Unit, ev: BEvent[]): void {
  if (st.relics.includes('bloody_grail') && u.alive) {
    const amt = Math.min(Math.round(u.maxHp * 0.1), u.maxHp - u.hp);
    if (amt > 0) { u.hp += amt; ev.push({ t: 'heal', src: u.uid, dst: u.uid, amount: amt }); }
  }
  if (st.relics.includes('finger_bone') && st.rng.chance(0.08)) {
    st.bonusEssence++;
    ev.push({ t: 'log', text: '성자의 손가락뼈가 떨린다… 핵 조각 +1' });
  }
}

function gainGold(st: BattleState, u: Unit, n: number, ev: BEvent[]): void {
  if (u.side !== 'ally') return;
  st.bonusGold += n;
  ev.push({ t: 'gold', src: u.uid, amount: n });
}

/** 대상을 시전자 쪽으로 최대 n칸 끌어온다 */
function pullToward(st: BattleState, u: Unit, t: Unit, n: number, ev: BEvent[]): void {
  let moved = false;
  for (let i = 0; i < n; i++) {
    const dx = Math.sign(u.x - t.x);
    const dy = Math.sign(u.y - t.y);
    // 더 먼 축부터 줄인다
    const steps: [number, number][] = Math.abs(u.x - t.x) >= Math.abs(u.y - t.y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
    let ok = false;
    for (const [sx, sy] of steps) {
      if (sx === 0 && sy === 0) continue;
      const nx = t.x + sx;
      const ny = t.y + sy;
      if (blocked(st, nx, ny) || unitAt(st, nx, ny)) continue;
      t.x = nx; t.y = ny; ok = true; moved = true;
      break;
    }
    if (!ok) break;
  }
  if (moved) ev.push({ t: 'push', dst: t.uid, x: t.x, y: t.y });
}

/** 행동 실행 */
export function performAction(st: BattleState, u: Unit, a: Action, tx: number, ty: number, resolving = false): BEvent[] {
  const ev: BEvent[] = [];
  const s = a.skill;
  const cx = s.target === 'self' ? u.x : tx;
  const cy = s.target === 'self' ? u.y : ty;
  if (s.charge && !resolving) {
    const tiles: { x: number; y: number }[] = [];
    for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) if (!blocked(st, x, y) && dist({ x, y }, { x: cx, y: cy }) <= s.area) tiles.push({ x, y });
    u.pending = { skill: a.id, x: cx, y: cy, tiles };
    ev.push({ t: 'charge', src: u.uid, name: a.name, tiles });
    ev.push({ t: 'log', text: `${u.name}이(가) 「${a.name}」을(를) 영창한다! 붉은 칸에서 벗어나라.` });
    if (s.cooldown > 0) u.cd[a.id] = s.cooldown;
    return ev;
  }
  const targets = affectedUnits(st, u, a, tx, ty);
  ev.push({ t: 'cast', src: u.uid, fx: s.fx, x: cx, y: cy, area: s.area, projectile: !!s.projectile, name: a.name });
  if (s.hpCost) {
    const cost = Math.round(u.maxHp * s.hpCost);
    u.hp = Math.max(1, u.hp - cost);
  }
  if (s.kind === 'summon' && s.summon) spawnEnemies(st, s.summon.def, s.summon.count, u, ev);
  if (s.goldGain) gainGold(st, u, s.goldGain, ev);
  let dealt = 0;
  for (const t of targets) {
    if (!t.alive) continue;
    if (s.sacrifice && t !== u) {
      const cost = Math.min(t.hp - 1, Math.round(t.maxHp * s.sacrifice));
      if (cost > 0) { t.hp -= cost; ev.push({ t: 'dmg', src: u.uid, dst: t.uid, amount: cost, crit: false, fx: 'blood' }); }
    }
    if (s.kind === 'phys' || s.kind === 'mag' || (s.kind === 'debuff' && s.power > 0)) {
      dealt += dealDamage(st, u, t, s, ev);
      if (s.goldOnHit) gainGold(st, u, s.goldOnHit, ev);
      if (s.goldOnKill && !t.alive) gainGold(st, u, s.goldOnKill, ev);
    }
    if (s.kind === 'heal') {
      const amt = Math.min(healAmount(u, s), t.maxHp - t.hp);
      t.hp += amt;
      ev.push({ t: 'heal', src: u.uid, dst: t.uid, amount: amt });
    }
    if (t.alive && s.cleanse) {
      const before = t.statuses.length;
      t.statuses = t.statuses.filter((x) => !BAD_STATUS.includes(x.id));
      if (t.statuses.length < before) ev.push({ t: 'log', text: `${t.name}의 나쁜 상태가 씻겨 나갔다.` });
    }
    if (t.alive) for (const sa of s.status ?? []) applyStatus(st, u, t, sa, ev);
    if (t.alive && s.randomStatus?.length) applyStatus(st, u, t, st.rng.pick(s.randomStatus), ev);
    if (t.alive && s.push) {
      const dx = Math.sign(t.x - u.x);
      const dy = dx === 0 ? Math.sign(t.y - u.y) : 0;
      const nx = t.x + dx * s.push;
      const ny = t.y + dy * s.push;
      if (!blocked(st, nx, ny) && !unitAt(st, nx, ny)) {
        t.x = nx;
        t.y = ny;
        ev.push({ t: 'push', dst: t.uid, x: nx, y: ny });
      }
    }
    if (t.alive && s.pull) pullToward(st, u, t, s.pull, ev);
    if (t.alive && s.swap && !t.boss && t !== u) {
      const [ox, oy] = [u.x, u.y];
      u.x = t.x; u.y = t.y;
      t.x = ox; t.y = oy;
      ev.push({ t: 'push', dst: u.uid, x: u.x, y: u.y });
      ev.push({ t: 'push', dst: t.uid, x: t.x, y: t.y });
    }
  }
  for (const sa of s.selfStatus ?? []) applyStatus(st, u, u, sa, ev);
  const ls = (s.lifesteal ?? 0) + u.eff.lifesteal;
  if (ls > 0 && dealt > 0 && u.alive) {
    const amt = Math.min(Math.round(dealt * ls), u.maxHp - u.hp);
    if (amt > 0) { u.hp += amt; ev.push({ t: 'heal', src: u.uid, dst: u.uid, amount: amt }); }
  }
  if (s.cooldown > 0 && !resolving) u.cd[a.id] = s.cooldown;
  checkOver(st);
  return ev;
}
