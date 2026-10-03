import { describe, expect, test } from 'vitest';
import { createBattle } from '../src/core/battle/battle';
import { DUNGEONS } from '../src/core/data/dungeons';
import { generateMap, makeBattle, type RunState } from '../src/core/dungeon';
import { Rng } from '../src/core/rng';
import { LORD_ID, LORD_SLOTS, migrate, newGame, type SaveData, Store } from '../src/core/state';

describe('지휘관', () => {
  test('새 게임에 지휘관이 있고, 동료 목록에는 없다', () => {
    const s = new Store(newGame(1));
    expect(s.char(LORD_ID)?.isLord).toBe(true);
    expect(s.s.roster.some((c) => c.isLord)).toBe(false);
    expect(s.release(LORD_ID).ok).toBe(false);
    expect(s.lord().skills.slice(0, 2)).toEqual(['core_strike', 'rally']);
  });

  test('예전 저장 데이터도 지휘관과 창고가 채워진다', () => {
    const old = newGame(2) as Partial<SaveData>;
    delete old.lordChar;
    delete old.stash;
    (old.lord as Record<string, unknown>) = { level: 3, exp: 10 };
    const d = migrate(old as SaveData);
    expect(d.lordChar.isLord).toBe(true);
    expect(d.stash).toEqual([]);
    expect(d.lord.learned.length).toBeGreaterThan(0);
    expect(new Store(d).lord().level).toBe(3);
  });

  test('v0.2 저장(혈주·진홍의 혈맹)은 지휘관·핵의 맹약단으로 바뀐다', () => {
    const old = newGame(8);
    (old.lordChar as { race: string }).race = 'dhampir';
    old.lordChar.cls = 'bloodlord';
    old.lordChar.given = '혈주';
    old.roster[0].house = 'crimson';
    const d = migrate(old);
    expect(d.lordChar.race).toBe('corebearer');
    expect(d.lordChar.cls).toBe('commander');
    expect(d.lordChar.given).toBe('지휘관');
    expect(d.roster[0].house).toBe('core_covenant');
  });

  test('결속하면 그 동료의 기술을 기록한다', () => {
    const s = new Store(newGame(3));
    s.s.essence = 10;
    const c = s.s.roster.find((x) => s.bindCheck(x.id).ok)!;
    s.bindCompanion(c.id);
    for (const id of c.skills) expect(s.s.lord.learned).toContain(id);
  });

  test('장착 기술은 최대 3개', () => {
    const s = new Store(newGame(4));
    for (const id of ['heal', 'fireball', 'cleave', 'volley']) s.lordLearn(id);
    expect(s.s.lord.equipped.length).toBeLessThanOrEqual(LORD_SLOTS);
    const extra = s.s.lord.learned.find((id) => !s.s.lord.equipped.includes(id))!;
    expect(s.toggleLordSkill(extra).ok).toBe(false);
  });

  test('지휘관은 쓰러져도 묘지에 가지 않고 원정 1회 휴면한다', () => {
    const s = new Store(newGame(5));
    s.startRun('necropolis', [LORD_ID, s.s.roster[0].id]);
    s.battleDeath(LORD_ID, '해골 병사');
    expect(s.s.graveyard).toHaveLength(0);
    s.retreat();
    s.finishRun();
    expect(s.lord().dormant).toBe(1);
    expect(s.canJoinParty(s.lord()).ok).toBe(false);
    s.startRun('necropolis', [s.s.roster[0].id]);
    s.retreat();
    s.finishRun();
    expect(s.canJoinParty(s.lord()).ok).toBe(true);
  });

  test('전투 유닛으로 참가한다', () => {
    const s = new Store(newGame(6));
    const lord = s.lord();
    const run = { dungeon: 'necropolis', nodes: generateMap(DUNGEONS.necropolis, 1), current: null, torch: 80, relics: [] } as unknown as RunState;
    const st = createBattle({ party: [{ char: lord, hp: 50 }], spec: makeBattle(run, 'battle', [lord], new Rng(1)), morale: 0 });
    const u = st.units.find((x) => x.uid === LORD_ID)!;
    expect(u.skills).toContain('core_strike');
    expect(u.eff.regen).toBeGreaterThan(0);
  });
});
