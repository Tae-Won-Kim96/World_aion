import { CLASSES } from './data/classes';
import { HOUSES } from './data/houses';
import { RACES } from './data/races';
import { houseEligible } from './gen/character';
import { fullName } from './stats';
import type { Character } from './types';

// 세계관: 대붕괴 이후의 세계. 지휘관은 세계핵의 조각으로 동료를 '결속'한다.
// (원작 '인간 혹은 뱀파이어'의 필멸/불멸 규칙을 그대로 따른다)
//  - 필멸자는 성장하지만, 죽으면 묘지로 간다.
//  - 결속자는 성장이 멈추는 대신 죽지 않는다 — 쓰러지면 세계핵에서 다시 형체를 갖출 때까지 휴면.
//  - 지휘관은 결속할 때 그 동료의 기술을 핵에 기록해 배운다.
// 저장 호환을 위해 데이터 필드 이름은 그대로 둔다: Character.vampire = 결속 여부, essence = 핵 조각, lord = 지휘관.

export const DORMANT_RUNS = 2;

export function lordExpToNext(level: number): number {
  return 60 * level;
}

/** 지휘관 레벨에 따른 결속 한도 */
export function bindSlots(lordLevel: number): number {
  return 1 + Math.floor(lordLevel / 2);
}

export function bindCost(ch: Character): number {
  return 1 + Math.floor(ch.star / 2);
}

export function lordExpFromBind(ch: Character): number {
  return ch.level * ch.star * 8;
}

export function canBind(ch: Character, ctx: { essence: number; vampires: number; lordLevel: number }): { ok: boolean; reason?: string } {
  if (ch.isLord) return { ok: false, reason: '지휘관 자신은 결속할 수 없다.' };
  if (ch.vampire) return { ok: false, reason: '이미 세계핵에 결속되어 있다.' };
  const r = RACES[ch.race];
  if (!r.canBind) return { ok: false, reason: r.bindNote ?? '이 종족은 세계핵과 공명하지 않는다.' };
  if (ch.cls === 'vhunter') return { ok: false, reason: '흡혈귀 사냥꾼은 죽지 않는 존재가 되기를 거부한다.' };
  if (ctx.vampires >= bindSlots(ctx.lordLevel)) return { ok: false, reason: `세계핵의 힘이 부족하다 (결속 ${ctx.vampires}/${bindSlots(ctx.lordLevel)}). 지휘관 레벨을 올리자.` };
  const cost = bindCost(ch);
  if (ctx.essence < cost) return { ok: false, reason: `핵 조각이 부족하다 (${cost} 필요).` };
  return { ok: true };
}

/** 결속 적용. 결과 메시지 반환 */
export function applyBind(ch: Character): string[] {
  const msgs: string[] = [];
  ch.vampire = true;
  ch.turnedAtLevel = ch.level;
  msgs.push(`${fullName(ch)}의 심장에 세계핵의 문양이 새겨졌다. 더 이상 늙지도, 자라지도 않는다. 대신 쉽게 사라지지도 않는다.`);
  if (ch.house && HOUSES[ch.house]?.forbidBound) {
    msgs.push(`${HOUSES[ch.house].name}은(는) 결속을 신성모독으로 여긴다. 파문당했다.`);
    if (ch.surname === HOUSES[ch.house].surname) ch.surname = '';
    ch.house = undefined;
  }
  if (!ch.house) {
    const cov = HOUSES.core_covenant;
    if (cov && houseEligible(cov, ch)) {
      ch.house = cov.id;
      msgs.push(`${cov.name}이(가) 그를 맞이했다. 핵과 깊이 공명하는 자만 받는다는 결사다.`);
    }
  }
  if ((CLASSES[ch.cls].affinity.radiance ?? 0) > 0) msgs.push('빛을 섬기던 자의 신앙이 흔들린다.');
  return msgs;
}
