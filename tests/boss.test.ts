import { describe, expect, test } from 'vitest';
import { aiTakeTurn, planTurn } from '../src/core/battle/ai';
import {
  actionsOf, advance, type BattleState, type BEvent, createBattle, dangerTiles, endTurn, performAction, resolvePending, startTurn, type Unit,
} from '../src/core/battle/battle';
import { SKILLS } from '../src/core/data/skills';
import { DUNGEONS } from '../src/core/data/dungeons';
import { generateMap, makeBattle, type RunState } from '../src/core/dungeon';
import { Rng } from '../src/core/rng';
import { newGame } from '../src/core/state';
import { computeStats } from '../src/core/stats';

function bossBattle(seed: number, dungeon = 'necropolis', level = 5): BattleState {
  const g = newGame(seed);
  for (const c of g.roster) c.level = level;
  const run = { dungeon, nodes: generateMap(DUNGEONS[dungeon], seed), current: 'boss', torch: 80, relics: [] } as unknown as RunState;
  const spec = makeBattle(run, 'boss', g.roster, new Rng(seed));
  return createBattle({ party: g.roster.map((c) => ({ char: c, hp: computeStats(c).hp })), spec, morale: 0 });
}

const boss = (st: BattleState) => st.units.find((u) => u.boss)!;
const action = (_u: Unit, id: string) => ({ id, name: SKILLS[id].name, skill: SKILLS[id], isAttack: false });

describe('보스 패턴', () => {
  test('예고 공격: 영창 후 다음 턴에 표시된 칸만 맞는다', () => {
    const st = bossBattle(1);
    const b = boss(st);
    const target = st.units.find((u) => u.side === 'ally' && u.alive)!;
    const ev = performAction(st, b, action(b, 'unholy_requiem'), target.x, target.y);
    expect(ev.some((e) => e.t === 'charge')).toBe(true);
    expect(ev.some((e) => e.t === 'dmg')).toBe(false);
    expect(dangerTiles(st, 'ally').some((t) => t.x === target.x && t.y === target.y)).toBe(true);
    // 대상이 범위 밖으로 피하면 맞지 않는다
    const tiles = new Set(b.pending!.tiles.map((t) => `${t.x},${t.y}`));
    for (const u of st.units.filter((x) => x.side === 'ally')) { u.x = 0; u.y = 0; }
    const safe = !tiles.has('0,0');
    const hit = resolvePending(st, b)!;
    expect(b.pending).toBeUndefined();
    if (safe) expect(hit.some((e) => e.t === 'dmg')).toBe(false);
  });

  test('기절시키면 영창이 끊긴다', () => {
    const st = bossBattle(2);
    const b = boss(st);
    const t = st.units.find((u) => u.side === 'ally')!;
    performAction(st, b, action(b, 'unholy_requiem'), t.x, t.y);
    b.statuses.push({ id: 'stun', turns: 1 });
    const ev: BEvent[] = [];
    expect(startTurn(st, b, ev)).toBe(true);
    expect(ev.some((e) => e.t === 'interrupt')).toBe(true);
    expect(b.pending).toBeUndefined();
  });

  test('체력 50% 이하에서 페이즈 발동 → 소환 + 기술 추가 (1회)', () => {
    const st = bossBattle(3);
    const b = boss(st);
    const before = st.units.length;
    const ally = st.units.find((u) => u.side === 'ally')!;
    ally.stats.atk = 9999;
    b.hp = Math.floor(b.maxHp * 0.55);
    const atk = actionsOf(ally)[0];
    ally.x = b.x - 1; ally.y = b.y;
    ally.stats.atk = Math.max(1, Math.round(b.maxHp * 0.02));
    const ev = performAction(st, ally, { ...atk, skill: { ...atk.skill, range: [1, 20] } }, b.x, b.y);
    if (b.hp / b.maxHp <= 0.5 && b.alive) {
      expect(ev.some((e) => e.t === 'phase')).toBe(true);
      expect(st.units.length).toBe(before + 2);
      expect(b.skills).toContain('raise_dead');
      const ev2 = performAction(st, ally, { ...atk, skill: { ...atk.skill, range: [1, 20] } }, b.x, b.y);
      expect(ev2.some((e) => e.t === 'phase')).toBe(false);
    }
  });

  test('자동 전투 AI는 위험 칸에서 벗어난다', () => {
    let moved = 0, total = 0;
    for (let i = 0; i < 20; i++) {
      const st = bossBattle(100 + i);
      const b = boss(st);
      const t = st.units.find((u) => u.side === 'ally' && u.alive)!;
      performAction(st, b, action(b, 'unholy_requiem'), t.x, t.y);
      const plan = planTurn(st, t);
      const dest = plan.move ?? { x: t.x, y: t.y };
      total++;
      if (!dangerTiles(st, 'ally').some((d) => d.x === dest.x && d.y === dest.y)) moved++;
    }
    expect(moved / total).toBeGreaterThan(0.7);
  });

  test('보스전은 항상 결판이 나고, 패턴이 실제로 쓰인다', () => {
    let charges = 0, phases = 0;
    for (let i = 0; i < 20; i++) {
      const st = bossBattle(500 + i, i % 2 ? 'sunken' : 'necropolis', i % 2 ? 9 : 5);
      let t = 0;
      while (!st.over && t++ < 800) {
        const u = advance(st);
        const ev: BEvent[] = [];
        if (!startTurn(st, u, ev) && u.alive) ev.push(...aiTakeTurn(st, u));
        charges += ev.filter((e) => e.t === 'charge').length;
        phases += ev.filter((e) => e.t === 'phase').length;
        endTurn(st, u);
      }
      expect(st.over).not.toBeNull();
    }
    expect(charges).toBeGreaterThan(10);
    expect(phases).toBeGreaterThan(10);
  });
});
