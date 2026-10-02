import { describe, expect, test } from 'vitest';
import { newGame, Store } from '../src/core/state';
import { DORMANT_RUNS } from '../src/core/vampire';

const fresh = () => new Store(newGame(12345));

describe('저장/계정 흐름', () => {
  test('모집은 금화를 쓰고 동료를 늘린다', () => {
    const s = fresh();
    const before = s.s.roster.length;
    const r = s.recruit(10);
    expect(r.ok).toBe(true);
    expect(s.s.roster.length).toBe(before + 10);
    expect(s.s.gold).toBe(1000 - 900);
    expect(r.chars!.some((c) => c.star >= 3)).toBe(true);
    expect(s.recruit(1).ok).toBe(true);
    expect(s.recruit(1).ok).toBe(false); // 금화 부족
  });

  test('필멸자 사망 → 묘지, 뱀파이어 사망 → 휴면', () => {
    const s = fresh();
    const [a, b] = s.s.roster;
    b.vampire = true;
    expect(s.startRun('necropolis', [a.id, b.id]).ok).toBe(true);
    s.battleDeath(a.id, '해골 병사');
    s.battleDeath(b.id, '해골 병사');
    expect(s.s.graveyard).toHaveLength(1);
    expect(s.s.graveyard[0].char.id).toBe(a.id);
    expect(s.char(a.id)).toBeUndefined();
    expect(s.char(b.id)!.dormant).toBeGreaterThan(0);
    s.retreat();
    s.finishRun();
    expect(s.char(b.id)!.dormant).toBe(DORMANT_RUNS);
    expect(s.canJoinParty(s.char(b.id)!).ok).toBe(false);
  });

  test('원정: 이동하면 횃불이 줄고 노드 단계로 들어간다', () => {
    const s = fresh();
    s.startRun('necropolis', s.s.roster.map((c) => c.id));
    const first = s.s.run!.nodes.find((n) => n.layer === 0)!;
    expect(s.moveTo(first.id).ok).toBe(true);
    expect(s.s.run!.torch).toBeLessThan(100);
    expect(s.s.run!.phase).toBe('battle');
    expect(s.s.run!.battle!.enemies.length).toBeGreaterThan(0);
  });

  test('퇴각하면 금화 절반만 가져간다', () => {
    const s = fresh();
    s.startRun('necropolis', [s.s.roster[0].id]);
    s.s.run!.gold = 200;
    s.retreat();
    s.finishRun();
    expect(s.s.gold).toBe(1100);
    expect(s.s.run).toBeNull();
  });
});
