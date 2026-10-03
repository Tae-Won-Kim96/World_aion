import { describe, expect, test } from 'vitest';
import { aiTakeTurn } from '../src/core/battle/ai';
import { actionsOf, advance, type BEvent, createBattle, endTurn, performAction, predictOrder, startTurn } from '../src/core/battle/battle';
import { DUNGEONS } from '../src/core/data/dungeons';
import { generateMap, makeBattle, type RunState } from '../src/core/dungeon';
import { Rng } from '../src/core/rng';
import { newGame } from '../src/core/state';
import { computeStats } from '../src/core/stats';

function setup(seed: number, kind: 'battle' | 'elite' | 'boss', layer: number, level = 1) {
  const g = newGame(seed);
  for (const c of g.roster) c.level = level;
  const run = { dungeon: 'necropolis', nodes: generateMap(DUNGEONS.necropolis, seed), current: null, torch: 80 } as unknown as RunState;
  run.current = run.nodes.find((n) => n.layer === layer)?.id ?? 'boss';
  const spec = makeBattle(run, kind, g.roster, new Rng(seed));
  return createBattle({ party: g.roster.map((c) => ({ char: c, hp: computeStats(c).hp })), spec, morale: 0 });
}

function simulate(st: ReturnType<typeof setup>) {
  let turns = 0;
  while (!st.over && turns < 600) {
    const u = advance(st);
    const ev: BEvent[] = [];
    if (!startTurn(st, u, ev) && u.alive) aiTakeTurn(st, u);
    endTurn(st, u);
    turns++;
  }
  return turns;
}

describe('전투 엔진', () => {
  test('AI끼리 싸우면 항상 결판이 난다 (교착 없음)', () => {
    for (let i = 0; i < 40; i++) {
      for (const [kind, layer, lv] of [['battle', 0, 1], ['elite', 4, 3], ['boss', 7, 4]] as const) {
        const st = setup(2000 + i, kind, layer, lv);
        simulate(st);
        expect(st.over).not.toBeNull();
      }
    }
  });

  test('첫 전투는 대체로 이길 수 있다', () => {
    let wins = 0;
    for (let i = 0; i < 40; i++) { const st = setup(3000 + i, 'battle', 0); simulate(st); if (st.over === 'victory') wins++; }
    expect(wins / 40).toBeGreaterThan(0.8);
  });

  test('행동 순서 예측은 실제 진행과 일치한다', () => {
    const st = setup(77, 'battle', 2);
    const predicted = predictOrder(st, 5).map((u) => u.uid);
    const actual: string[] = [];
    for (let i = 0; i < 5; i++) { const u = advance(st); actual.push(u.uid); u.ct -= 100; }
    expect(actual).toEqual(predicted);
  });

  test('죽음을 거부하는 가호는 치명상을 1회 버틴다', () => {
    const st = setup(5, 'battle', 0);
    const ally = st.units.find((u) => u.side === 'ally')!;
    const foe = st.units.find((u) => u.side === 'enemy')!;
    ally.cheatDeath = 1;
    ally.hp = 1;
    ally.statuses = [];
    foe.x = ally.x + 1; foe.y = ally.y;
    if (st.units.some((u) => u !== foe && u.alive && u.x === foe.x && u.y === foe.y)) return;
    const atk = actionsOf(foe)[0];
    foe.stats.atk = 999;
    const ev = performAction(st, foe, { ...atk, skill: { ...atk.skill, range: [1, 9] } }, ally.x, ally.y);
    expect(ev.some((e) => e.t === 'cheat')).toBe(true);
    expect(ally.alive).toBe(true);
    expect(ally.hp).toBe(1);
  });
});
