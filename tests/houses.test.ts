import { describe, expect, test } from 'vitest';
import { HOUSES } from '../src/core/data/houses';
import { generateCharacter, houseEligible } from '../src/core/gen/character';
import { applyTurn, canTurn, vampireSlots } from '../src/core/vampire';
import type { Character } from '../src/core/types';

function make(over: Partial<Character>): Character {
  return { ...generateCharacter(99, { now: 0, race: 'human', cls: 'knight', star: 3 }), house: undefined, traits: [], curses: [], blessings: [], ...over };
}

describe('가문 조건', () => {
  test('할튼 기사단: 인간 + ★3 + 기사 계열 + 특정 특성', () => {
    const h = HOUSES.halton;
    expect(houseEligible(h, make({ traits: ['oath'] }))).toBe(true);
    expect(houseEligible(h, make({ traits: [] }))).toBe(false);
    expect(houseEligible(h, make({ traits: ['oath'], star: 2 }))).toBe(false);
    expect(houseEligible(h, make({ traits: ['oath'], race: 'elf' }))).toBe(false);
    expect(houseEligible(h, make({ traits: ['oath'], cls: 'mage' }))).toBe(false);
  });
  test('진홍의 혈맹은 뱀파이어 상태에서만', () => {
    expect(houseEligible(HOUSES.crimson, make({ vampire: false }))).toBe(false);
    expect(houseEligible(HOUSES.crimson, make({ vampire: true }))).toBe(true);
  });
});

describe('흡혈', () => {
  test('천사와 신족, 흡혈귀 사냥꾼은 흡혈할 수 없다', () => {
    const ctx = { essence: 99, vampires: 0, lordLevel: 10 };
    expect(canTurn(make({ race: 'angel' }), ctx).ok).toBe(false);
    expect(canTurn(make({ race: 'divine' }), ctx).ok).toBe(false);
    expect(canTurn(make({ cls: 'vhunter' }), ctx).ok).toBe(false);
    expect(canTurn(make({}), ctx).ok).toBe(true);
  });
  test('혈주 레벨이 뱀파이어 수를 제한한다', () => {
    expect(canTurn(make({}), { essence: 99, vampires: vampireSlots(1), lordLevel: 1 }).ok).toBe(false);
  });
  test('흡혈하면 성스러운 기사단에서 파문되고 진홍의 혈맹에 초대된다', () => {
    const c = make({ traits: ['oath'], house: 'halton', surname: '할튼' });
    const msgs = applyTurn(c);
    expect(c.vampire).toBe(true);
    expect(c.house).toBe('crimson');
    expect(c.surname).toBe('');
    expect(msgs.join(' ')).toContain('파문');
  });
});
