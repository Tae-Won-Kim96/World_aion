import { CLASSES } from './data/classes';
import { HOUSES } from './data/houses';
import { RACES } from './data/races';
import { houseEligible } from './gen/character';
import { fullName } from './stats';
import type { Character } from './types';

// 원작 '인간 혹은 뱀파이어'의 핵심 규칙:
//  - 필멸자(흡혈 전)는 성장하지만, 죽으면 묘지로 간다.
//  - 뱀파이어는 성장이 멈추는 대신 죽지 않는다(휴면 후 복귀).
//  - 혈주(플레이어)는 동료를 흡혈해 경험치를 얻는다.

export const DORMANT_RUNS = 2;

export function lordExpToNext(level: number): number {
  return 60 * level;
}

export function vampireSlots(lordLevel: number): number {
  return 1 + Math.floor(lordLevel / 2);
}

export function turnCost(ch: Character): number {
  return 1 + Math.floor(ch.star / 2);
}

export function lordExpFromTurn(ch: Character): number {
  return ch.level * ch.star * 8;
}

export function canTurn(ch: Character, ctx: { essence: number; vampires: number; lordLevel: number }): { ok: boolean; reason?: string } {
  if (ch.vampire) return { ok: false, reason: '이미 뱀파이어다.' };
  const r = RACES[ch.race];
  if (!r.canTurn) return { ok: false, reason: r.turnNote ?? '이 종족은 흡혈할 수 없다.' };
  if (ch.cls === 'vhunter') return { ok: false, reason: '흡혈귀 사냥꾼은 송곳니를 거부한다.' };
  if (ctx.vampires >= vampireSlots(ctx.lordLevel)) return { ok: false, reason: `혈주의 힘이 부족하다 (뱀파이어 ${ctx.vampires}/${vampireSlots(ctx.lordLevel)}).` };
  const cost = turnCost(ch);
  if (ctx.essence < cost) return { ok: false, reason: `피의 정수가 부족하다 (${cost} 필요).` };
  return { ok: true };
}

/** 흡혈 적용. 결과 메시지 반환 */
export function applyTurn(ch: Character): string[] {
  const msgs: string[] = [];
  ch.vampire = true;
  ch.turnedAtLevel = ch.level;
  msgs.push(`${fullName(ch)}이(가) 혈주의 송곳니를 받아들였다. 더 이상 늙지도, 자라지도 않는다.`);
  if (ch.house && HOUSES[ch.house]?.forbidVampire) {
    msgs.push(`${HOUSES[ch.house].name}에서 파문당했다.`);
    if (ch.surname === HOUSES[ch.house].surname) ch.surname = '';
    ch.house = undefined;
  }
  if (!ch.house) {
    const crimson = HOUSES.crimson;
    if (crimson && houseEligible(crimson, ch)) {
      ch.house = crimson.id;
      msgs.push(`${crimson.name}의 초대장이 도착했다. 피가 맞는 자만 받는다는 그 초대장이.`);
    }
  }
  if (CLASSES[ch.cls].affinity.radiance && CLASSES[ch.cls].affinity.radiance! > 0) {
    msgs.push('빛을 섬기던 자의 신앙이 흔들린다.');
  }
  return msgs;
}
