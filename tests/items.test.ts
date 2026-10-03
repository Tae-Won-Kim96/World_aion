import { describe, expect, test } from 'vitest';
import { createBattle } from '../src/core/battle/battle';
import { ITEM_BASES, UNIQUES } from '../src/core/data/items';
import { DUNGEONS } from '../src/core/data/dungeons';
import { generateMap, makeBattle, torchCost, type RunState } from '../src/core/dungeon';
import { generateItem, itemValue } from '../src/core/gen/item';
import { Rng } from '../src/core/rng';
import { newGame, Store } from '../src/core/state';
import { computeEffects, computeStats } from '../src/core/stats';

describe('장비 생성', () => {
  test('결정적이고 규칙을 지킨다', () => {
    expect(generateItem(42, { ilvl: 3 })).toEqual(generateItem(42, { ilvl: 3 }));
    for (let i = 0; i < 2000; i++) {
      const it = generateItem(i * 31 + 7, { ilvl: 1 + (i % 10), minRarity: (1 + (i % 3)) as 1 });
      expect(it.rarity).toBeGreaterThanOrEqual(1 + (i % 3));
      expect(ITEM_BASES[it.base].slot).toBe(it.slot);
      if (it.rarity === 4) expect(UNIQUES[it.unique!]).toBeDefined();
      else expect(it.affixes.length).toBe(it.rarity - 1);
      expect(new Set(it.affixes).size).toBe(it.affixes.length);
      expect(itemValue(it)).toBeGreaterThan(0);
    }
  });

  test('보스는 자기 전설 장비를 우선 떨어뜨린다', () => {
    let own = 0;
    for (let i = 0; i < 300; i++) {
      const it = generateItem(i, { ilvl: 5, minRarity: 4, bossId: 'bishop' });
      if (it.unique === 'mordane_mitre') own++;
    }
    expect(own / 300).toBeGreaterThan(0.5);
  });
});

describe('장착·창고', () => {
  test('장착하면 능력치와 효과가 바뀌고, 해제·분해할 수 있다', () => {
    const s = new Store(newGame(7));
    const ch = s.s.roster[0];
    const base = computeStats(ch);
    const sword = { ...generateItem(1, { ilvl: 5, slot: 'weapon' }), stats: { atk: 5 }, affixes: ['vampiric'], rarity: 2 as const };
    s.s.stash.push(sword);
    expect(s.equip(ch.id, sword.id).ok).toBe(true);
    expect(computeStats(ch).atk).toBe(base.atk + 5);
    expect(computeEffects(ch).lifesteal).toBeGreaterThanOrEqual(0.05);
    expect(s.s.stash).toHaveLength(0);
    expect(s.unequip(ch.id, 'weapon').ok).toBe(true);
    expect(computeStats(ch).atk).toBe(base.atk);
    const gold = s.s.gold;
    s.salvage([sword.id]);
    expect(s.s.gold).toBe(gold + itemValue(sword));
  });

  test('전리품은 퇴각 시 창고로, 전멸 시 사라진다', () => {
    for (const outcome of ['retreat', 'wipe'] as const) {
      const s = new Store(newGame(9));
      s.startRun('necropolis', [s.s.roster[0].id]);
      s.grantItem({ ilvl: 2 }, new Rng(1));
      s.s.run!.outcome = outcome;
      s.s.run!.phase = 'result';
      s.finishRun();
      expect(s.s.stash.length).toBe(outcome === 'retreat' ? 1 : 0);
    }
  });

  test('필멸자가 죽으면 장비도 함께 묻힌다', () => {
    const s = new Store(newGame(11));
    const ch = s.s.roster[0];
    const it = generateItem(3, { ilvl: 2 });
    s.s.stash.push(it);
    s.equip(ch.id, it.id);
    s.startRun('necropolis', [ch.id]);
    s.battleDeath(ch.id, '해골');
    expect(s.s.graveyard[0].char.gear?.[it.slot]?.id).toBe(it.id);
    expect(s.s.stash).toHaveLength(0);
  });
});

describe('유물', () => {
  const party = () => newGame(5).roster;
  const spec = (relics: string[] = []) => {
    const run = { dungeon: 'necropolis', nodes: generateMap(DUNGEONS.necropolis, 1), current: null, torch: 10, relics } as unknown as RunState;
    return makeBattle(run, 'battle', party(), new Rng(4));
  };
  test('전투 시작 효과', () => {
    const p = party();
    const plain = createBattle({ party: p.map((c) => ({ char: c, hp: 50 })), spec: spec(), morale: 0 });
    const buffed = createBattle({ party: p.map((c) => ({ char: c, hp: 50 })), spec: spec(), morale: 0, relics: ['iron_boots', 'ward_crest', 'wolf_fang'] });
    const a0 = plain.units.find((u) => u.side === 'ally')!;
    const a1 = buffed.units.find((u) => u.uid === a0.uid)!;
    expect(a1.stats.mov).toBe(a0.stats.mov + 1);
    expect(a1.stats.crit).toBe(a0.stats.crit + 8);
    expect(a1.statuses.some((s) => s.id === 'shield')).toBe(true);
  });
  test('경계의 눈은 기습을 막고, 은빛 등불은 횃불을 아낀다', () => {
    for (let i = 0; i < 30; i++) {
      const run = { dungeon: 'necropolis', nodes: generateMap(DUNGEONS.necropolis, i), current: null, torch: 5, relics: ['watchful_eye'] } as unknown as RunState;
      expect(makeBattle(run, 'battle', party(), new Rng(i)).ambush).toBe(false);
    }
    expect(torchCost(party(), ['silver_lantern'])).toBeLessThan(torchCost(party(), []));
  });
});
