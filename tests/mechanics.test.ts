// 새 기술 메커니즘: 끌어오기·자리바꿈·정화·희생·금화·상태 태그·아군 소환
import { describe, expect, test } from 'vitest';
import { aiTakeTurn } from '../src/core/battle/ai';
import {
  advance, type BattleState, type BEvent, checkOver, createBattle, endTurn, estimateDamage, isSummon, performAction, startTurn, type Unit,
} from '../src/core/battle/battle';
import { DUNGEONS } from '../src/core/data/dungeons';
import { SKILLS } from '../src/core/data/skills';
import { generateMap, makeBattle, type RunState } from '../src/core/dungeon';
import { Rng } from '../src/core/rng';
import { newGame } from '../src/core/state';
import { computeStats } from '../src/core/stats';

function battle(seed: number): BattleState {
  const g = newGame(seed);
  for (const c of g.roster) c.level = 4;
  const run = { dungeon: 'necropolis', nodes: generateMap(DUNGEONS.necropolis, seed), current: null, torch: 80, relics: [] } as unknown as RunState;
  run.current = run.nodes.find((n) => n.layer === 1)!.id;
  const spec = makeBattle(run, 'battle', g.roster, new Rng(seed));
  const st = createBattle({ party: g.roster.map((c) => ({ char: c, hp: computeStats(c).hp })), spec, morale: 0 });
  st.obstacles = [];
  return st;
}

const act = (id: string) => ({ id, name: SKILLS[id].name, skill: SKILLS[id], isAttack: false });
const ally = (st: BattleState) => st.units.find((u) => u.side === 'ally' && !!u.charId)!;
const foe = (st: BattleState) => st.units.find((u) => u.side === 'enemy')!;
function place(u: Unit, x: number, y: number) { u.x = x; u.y = y; }
function clearBoard(st: BattleState, keep: Unit[]) { for (const u of st.units) if (!keep.includes(u)) place(u, 9, 6 - st.units.indexOf(u) % 7); }

describe('새 기술 메커니즘', () => {
  test('갈고리는 적을 시전자 쪽으로 끌어온다', () => {
    const st = battle(11);
    const a = ally(st);
    const e = foe(st);
    clearBoard(st, [a, e]);
    place(a, 1, 3); place(e, 4, 3);
    performAction(st, a, act('meat_hook'), e.x, e.y);
    if (e.alive) expect(e.x).toBe(2);
  });

  test('바꿔치기는 자리를 바꾼다 (보스 제외)', () => {
    const st = battle(12);
    const a = ally(st);
    const e = foe(st);
    clearBoard(st, [a, e]);
    place(a, 1, 1); place(e, 3, 2);
    performAction(st, a, act('switcheroo'), e.x, e.y);
    expect([a.x, a.y]).toEqual([3, 2]);
    expect([e.x, e.y]).toEqual([1, 1]);
  });

  test('격리는 나쁜 상태를 씻어낸다', () => {
    const st = battle(13);
    const [a, b] = st.units.filter((u) => u.side === 'ally');
    clearBoard(st, [a, b]);
    place(a, 1, 1); place(b, 2, 1);
    b.statuses.push({ id: 'poison', turns: 3 }, { id: 'stun', turns: 1 }, { id: 'bless', turns: 2 });
    performAction(st, a, act('quarantine'), b.x, b.y);
    expect(b.statuses.map((s) => s.id).sort()).toEqual(['bless', 'guard']);
  });

  test('십일조는 아군 체력을 바치지만 죽이지는 않는다', () => {
    const st = battle(14);
    const [a, b] = st.units.filter((u) => u.side === 'ally');
    clearBoard(st, [a, b]);
    place(a, 1, 1); place(b, 2, 1);
    b.hp = 2;
    performAction(st, a, act('tithe'), b.x, b.y);
    expect(b.hp).toBe(1);
    expect(b.alive).toBe(true);
    expect(b.statuses.some((s) => s.id === 'bless')).toBe(true);
  });

  test('빚 독촉·소매치기·뒤지기는 금화를 모은다', () => {
    const st = battle(15);
    const a = ally(st);
    const e = foe(st);
    clearBoard(st, [a, e]);
    place(a, 1, 1); place(e, 2, 1);
    e.hp = 1;
    performAction(st, a, act('collect_debt'), e.x, e.y);
    expect(st.bonusGold).toBe(4 + 20);
    performAction(st, a, act('scrounge'), a.x, a.y);
    expect(st.bonusGold).toBe(32);
  });

  test('상태 태그: 출혈 중인 적에게 상처에 소금이 더 아프다', () => {
    const st = battle(16);
    const a = ally(st);
    const e = foe(st);
    const before = estimateDamage(st, a, e, SKILLS.salt_wound);
    e.statuses.push({ id: 'bleed', turns: 2 });
    expect(estimateDamage(st, a, e, SKILLS.salt_wound)).toBeGreaterThan(before * 1.5);
  });

  test('와일드 카드는 목록의 상태 하나를 건다', () => {
    const st = battle(17);
    const a = ally(st);
    const e = foe(st);
    clearBoard(st, [a, e]);
    place(a, 1, 1); place(e, 2, 1);
    e.hp = e.maxHp = 9999;
    const ev = performAction(st, a, act('wild_card'), e.x, e.y);
    const ids = SKILLS.wild_card.randomStatus!.map((s) => s.id);
    expect(ev.filter((x) => x.t === 'status' && ids.includes(x.id)).length).toBe(1);
  });

  test('아군 소환수는 아군 편이고, 동료가 모두 쓰러지면 소환수가 남아도 패배', () => {
    const st = battle(18);
    const a = ally(st);
    const before = st.units.length;
    performAction(st, a, act('rat_swarm'), a.x, a.y);
    const spawned = st.units.slice(before);
    expect(spawned.length).toBeGreaterThan(0);
    for (const s of spawned) { expect(s.side).toBe('ally'); expect(isSummon(s)).toBe(true); }
    for (const u of st.units) if (u.side === 'ally' && u.charId) { u.alive = false; u.hp = 0; }
    expect(checkOver(st)).toBe('defeat');
  });

  test('새 직업 기술을 쓰는 전투도 항상 결판이 난다', () => {
    const ids = ['hire_thug', 'make_puppet', 'call_beast', 'raise_help', 'rat_swarm'];
    for (let seed = 1; seed <= 6; seed++) {
      const st = battle(100 + seed);
      for (const u of st.units) if (u.side === 'ally') u.skills = [ids[seed % ids.length], 'meat_hook', 'switcheroo', 'tithe'];
      let turns = 0;
      while (!st.over && turns < 700) {
        const u = advance(st);
        const ev: BEvent[] = [];
        if (!startTurn(st, u, ev) && u.alive) aiTakeTurn(st, u);
        endTurn(st, u);
        turns++;
      }
      expect(st.over).not.toBeNull();
    }
  });
});
