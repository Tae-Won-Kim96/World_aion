// 거점 시설: 대장간 · 치유소 · 추모비
import { describe, expect, test } from 'vitest';
import { FACILITIES } from '../src/core/data/facilities';
import { isMeritorious, meritOf, REZ } from '../src/core/facilities';
import { generateCharacter } from '../src/core/gen/character';
import { generateItem, itemStatMod } from '../src/core/gen/item';
import { newGame, Store } from '../src/core/state';
import { computeStats } from '../src/core/stats';
import type { Character } from '../src/core/types';

function rich(seed = 1): Store {
  const s = new Store(newGame(seed));
  s.s.gold = 100000;
  s.s.essence = 100;
  return s;
}

function buildAll(s: Store, lv = 3) {
  for (const id of ['forge', 'infirmary', 'memorial'] as const) for (let i = 0; i < lv; i++) expect(s.buildFacility(id).ok).toBe(true);
}

function grave(s: Store, o: Partial<Character>): Character {
  const c = { ...generateCharacter(9000 + s.s.graveyard.length * 13, { now: 0 }), ...o };
  s.s.roster.push(c);
  s.bury(c, '시험', '어딘가');
  return c;
}

describe('시설 건설', () => {
  test('단계마다 금화·핵 조각을 쓰고 최고 단계에서 멈춘다', () => {
    const s = rich();
    const g0 = s.s.gold;
    expect(s.buildFacility('forge').ok).toBe(true);
    expect(s.s.gold).toBe(g0 - FACILITIES.forge.levels[0].gold);
    s.buildFacility('forge'); s.buildFacility('forge');
    expect(s.facilityLevel('forge')).toBe(3);
    expect(s.buildFacility('forge').ok).toBe(false);
    const poor = new Store(newGame(2));
    poor.s.gold = 0;
    expect(poor.buildFacility('memorial').ok).toBe(false);
    expect(s.restoration()).toBeGreaterThan(poor.restoration());
  });
});

describe('대장간', () => {
  test('강화는 능력치를 올리고, 한도·실패·미끄러짐 규칙을 지킨다', () => {
    const s = rich(3);
    const it = generateItem(77, { ilvl: 5, minRarity: 2 });
    s.s.stash.push(it);
    expect(s.enhanceItem(it.id, 0).ok).toBe(false); // 대장간 없음
    s.buildFacility('forge');
    const before = Object.values(itemStatMod(it)).reduce((a, b) => a + Math.max(0, b ?? 0), 0);
    for (let i = 0; i < 3; i++) expect(s.enhanceItem(it.id, 0).success).toBe(true);
    expect(it.plus).toBe(3);
    expect(it.name.startsWith('+3 ')).toBe(true);
    expect(s.enhanceItem(it.id, 0).ok).toBe(false); // 1단계 한도 +3
    const after = Object.values(itemStatMod(it)).reduce((a, b) => a + Math.max(0, b ?? 0), 0);
    expect(after).toBeGreaterThan(before);
    s.buildFacility('forge'); s.buildFacility('forge');
    it.plus = 6;
    const r = s.enhanceItem(it.id, 0.999); // 실패
    expect(r.success).toBe(false);
    expect(r.slipped).toBe(true);
    expect(it.plus).toBe(5);
  });

  test('재련은 2단계부터, 분해 금화는 단계만큼 늘어난다', () => {
    const s = rich(4);
    const it = generateItem(78, { ilvl: 3, minRarity: 2 });
    if (it.rarity === 4) return;
    s.s.stash.push(it);
    s.buildFacility('forge');
    expect(s.rerollItem(it.id).ok).toBe(false);
    s.buildFacility('forge');
    expect(s.rerollItem(it.id).ok).toBe(true);
    const base = new Store(newGame(5)).salvageValue(it);
    expect(s.salvageValue(it)).toBeGreaterThan(base);
  });
});

describe('치유소', () => {
  test('저주 정화 → 특성 치료 → 휴면 단축', () => {
    const s = rich(6);
    const c = s.s.roster[0];
    c.curses = ['curse_lead'];
    c.traits = ['frail'];
    c.dormant = 2;
    expect(s.purgeCurse(c.id, 'curse_lead').ok).toBe(false);
    s.buildFacility('infirmary');
    expect(s.purgeCurse(c.id, 'curse_lead').ok).toBe(true);
    expect(c.curses).toEqual([]);
    expect(s.cureTrait(c.id, 'frail').ok).toBe(false);
    s.buildFacility('infirmary');
    expect(s.cureTrait(c.id, 'frail').ok).toBe(true);
    expect(s.shortenDormancy(c.id).ok).toBe(false);
    s.buildFacility('infirmary');
    expect(s.shortenDormancy(c.id).ok).toBe(true);
    expect(c.dormant).toBe(1);
  });
});

describe('추모비', () => {
  test('공적 없는 자는 새길 수 없고, 자리는 단계만큼만', () => {
    const s = rich(7);
    s.buildFacility('memorial');
    const nobody = grave(s, { level: 3, deeds: { boss: 0, elite: 0 }, kills: 2 });
    const hero = grave(s, { level: 6, deeds: { boss: 1, elite: 0 } });
    const hero2 = grave(s, { level: 13 });
    expect(isMeritorious(nobody)).toBe(false);
    expect(s.enshrine(nobody.id).ok).toBe(false);
    expect(s.enshrine(hero.id).ok).toBe(true);
    expect(s.enshrine(hero2.id).ok).toBe(false); // 1자리
    s.buildFacility('memorial');
    expect(s.enshrine(hero2.id).ok).toBe(true);
  });

  test('유지는 같은 직업·종족·소속에게만 이어진다', () => {
    const s = rich(8);
    s.buildFacility('memorial');
    const heir = s.s.roster[0];
    heir.level = 14;
    const other = s.s.roster.find((c) => c.cls !== heir.cls && c.race !== heir.race && c.house !== heir.house) ?? s.s.roster[1];
    const power = (c: Character) => { const st = computeStats(c); return st.atk + st.mag; };
    const a0 = power(heir);
    const o0 = computeStats(other);
    const hero = grave(s, { cls: heir.cls, race: other.race === heir.race ? 'human' : heir.race === 'human' ? 'elf' : 'human', house: undefined, level: 15, deeds: { boss: 2, elite: 1 } });
    expect(s.enshrine(hero.id).ok).toBe(true);
    expect(power(heir)).toBeGreaterThan(a0);
    if (other.cls !== hero.cls && other.race !== hero.race) expect(computeStats(other)).toEqual(o0);
    s.unenshrine(hero.id);
    expect(power(heir)).toBe(a0);
  });

  test('보스를 쓰러뜨리면 업적이 쌓인다', () => {
    const s = new Store(newGame(9));
    const party = s.s.roster.slice(0, 2);
    s.startRun('necropolis', party.map((c) => c.id));
    const run = s.s.run!;
    run.current = 'boss';
    run.battle = { ...(run.battle ?? {}), enemies: [], boss: true, elite: false, goldBonus: 1, seed: 1, darkness: 'bright', ambush: false } as never;
    run.phase = 'battle';
    s.battleFinished({ victory: true, hp: Object.fromEntries(party.map((c) => [c.id, 10])), deaths: [], kills: {}, cheatDeathUsed: [] });
    for (const c of party) expect(s.char(c.id)!.deeds?.boss).toBe(1);
  });

  test('소생 의식: 조건이 극도로 엄격하고, 실패해도 제물과 비용은 사라진다', () => {
    const s = rich(10);
    const hero = grave(s, { level: 16, star: 3, deeds: { boss: 2, elite: 2 }, race: 'human' });
    expect(meritOf(hero)).toBeGreaterThanOrEqual(REZ.merit);
    const sac = s.s.roster.find((c) => c.star >= 3) ?? Object.assign(s.s.roster[0], { star: 3 as const });
    let chk = s.resurrectionCheck(hero.id, sac.id);
    expect(chk.ok).toBe(false);
    expect(chk.reasons.length).toBeGreaterThan(1);
    buildAll(s);
    expect(s.enshrine(hero.id).ok).toBe(true);
    chk = s.resurrectionCheck(hero.id, sac.id);
    expect(chk.reasons).toEqual([]);
    const gold = s.s.gold;
    const r = s.resurrect(hero.id, sac.id);
    expect(r.ok).toBe(true);
    expect(s.s.gold).toBe(gold - REZ.gold);
    expect(s.char(sac.id)).toBeUndefined();
    expect(s.s.graveyard.some((g) => g.char.id === sac.id)).toBe(true);
    if (r.success) {
      const back = s.char(hero.id)!;
      expect(back.vampire).toBe(true);
      expect(s.s.graveyard.some((g) => g.char.id === hero.id)).toBe(false);
    } else {
      expect(s.s.graveyard.some((g) => g.char.id === hero.id)).toBe(true);
      expect(s.resurrectionCheck(hero.id).chance).toBeLessThan(REZ.chance);
    }
  });
});
