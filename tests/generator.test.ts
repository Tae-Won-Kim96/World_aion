import { describe, expect, test } from 'vitest';
import { CLASSES } from '../src/core/data/classes';
import { HOUSES } from '../src/core/data/houses';
import { RACES } from '../src/core/data/races';
import { SKILLS } from '../src/core/data/skills';
import { TRAITS } from '../src/core/data/traits';
import { generateCharacter, houseEligible, STAR_RATES } from '../src/core/gen/character';
import { Rng } from '../src/core/rng';
import { computeStats, fullName } from '../src/core/stats';

describe('rng', () => {
  test('같은 시드는 같은 수열', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  test('int 범위', () => {
    const r = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(-3, 3);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThanOrEqual(3);
    }
  });
});

describe('캐릭터 생성기', () => {
  const N = 4000;
  const chars = Array.from({ length: N }, (_, i) => generateCharacter(1000 + i * 7919, { now: 0 }));

  test('같은 시드 → 같은 캐릭터', () => {
    expect(generateCharacter(123456, { now: 0 })).toEqual(generateCharacter(123456, { now: 0 }));
  });

  test('모든 캐릭터가 데이터 규칙을 지킨다', () => {
    for (const c of chars) {
      const race = RACES[c.race];
      const cls = CLASSES[c.cls];
      expect(race.weight).toBeGreaterThan(0);
      expect(c.star).toBeGreaterThanOrEqual(race.minStar);
      if (cls.races) expect(cls.races).toContain(c.race);
      if (cls.notRaces) expect(cls.notRaces).not.toContain(c.race);
      expect(c.given.length).toBeGreaterThan(0);
      expect(fullName(c).length).toBeGreaterThan(0);
      for (const s of c.skills) {
        expect(SKILLS[s]).toBeDefined();
        expect(cls.skills).toContain(s);
      }
      const all = [...c.traits, ...c.curses, ...c.blessings];
      expect(new Set(all).size).toBe(all.length);
      for (const id of all) {
        const t = TRAITS[id];
        expect(t).toBeDefined();
        if (t.races) expect(t.races).toContain(c.race);
        if (t.notRaces) expect(t.notRaces).not.toContain(c.race);
        for (const other of all) expect(t.exclusive ?? []).not.toContain(other);
      }
      if (c.house) expect(houseEligible(HOUSES[c.house], c)).toBe(true);
      const st = computeStats(c);
      expect(st.hp).toBeGreaterThanOrEqual(10);
      expect(st.mov).toBeGreaterThanOrEqual(2);
    }
  });

  test('성급 분포가 확률표와 비슷하다', () => {
    for (const s of [1, 2, 3, 4, 5] as const) {
      const ratio = chars.filter((c) => c.star === s).length / N;
      expect(Math.abs(ratio - STAR_RATES[s])).toBeLessThan(0.03);
    }
  });

  test('네임드 가문은 드물게만 나온다', () => {
    const housed = chars.filter((c) => c.house).length / N;
    expect(housed).toBeGreaterThan(0.01);
    expect(housed).toBeLessThan(0.2);
  });
});
