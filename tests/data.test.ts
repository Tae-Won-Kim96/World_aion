// 데이터 무결성: 모든 참조(기술·소환·조건·편향·특성)가 실제로 존재하는지
import { describe, expect, test } from 'vitest';
import { CLASSES } from '../src/core/data/classes';
import { DUNGEONS } from '../src/core/data/dungeons';
import { ENEMIES } from '../src/core/data/enemies';
import { FACTION_IDS } from '../src/core/data/factions';
import { HOUSES } from '../src/core/data/houses';
import { NAME_SETS } from '../src/core/data/names';
import { PLAYABLE_RACES, RACES } from '../src/core/data/races';
import { SKILLS } from '../src/core/data/skills';
import { TRAITS } from '../src/core/data/traits';
import type { Affinity } from '../src/core/types';

const affOk = (a: Affinity | undefined) => Object.keys(a ?? {}).every((f) => (FACTION_IDS as string[]).includes(f));

describe('데이터 무결성', () => {
  test('규모: 종족 35+, 직업 50+, 집단 45+', () => {
    expect(PLAYABLE_RACES.length).toBeGreaterThanOrEqual(35);
    expect(Object.values(CLASSES).filter((c) => c.weight > 0).length).toBeGreaterThanOrEqual(50);
    expect(Object.keys(HOUSES).length).toBeGreaterThanOrEqual(45);
  });

  test('직업의 기술·종족 제한·진영이 유효하다', () => {
    for (const c of Object.values(CLASSES)) {
      for (const s of c.skills) expect(SKILLS[s], `${c.id} → ${s}`).toBeDefined();
      for (const r of [...(c.races ?? []), ...(c.notRaces ?? [])]) expect(RACES[r], `${c.id} → ${r}`).toBeDefined();
      expect(affOk(c.affinity), c.id).toBe(true);
      if (c.weight > 0) expect(PLAYABLE_RACES.some((r) => (!c.races || c.races.includes(r.id)) && !c.notRaces?.includes(r.id)), c.id).toBe(true);
    }
  });

  test('종족의 직업 편향·진영이 유효하고, 모든 종족이 이름을 가진다', () => {
    for (const r of Object.values(RACES)) {
      for (const k of Object.keys(r.classBias ?? {})) expect(CLASSES[k], `${r.id} → ${k}`).toBeDefined();
      expect(affOk(r.affinity), r.id).toBe(true);
    }
    for (const r of PLAYABLE_RACES) expect(NAME_SETS[r.id], r.id).toBeDefined();
  });

  test('집단 조건이 유효하고 표어가 있다', () => {
    for (const h of Object.values(HOUSES)) {
      for (const r of h.cond.races ?? []) expect(RACES[r], `${h.id} → ${r}`).toBeDefined();
      for (const c of h.cond.classes ?? []) expect(CLASSES[c], `${h.id} → ${c}`).toBeDefined();
      for (const t of [...(h.cond.anyTraits ?? []), ...(h.cond.noTraits ?? [])]) expect(TRAITS[t], `${h.id} → ${t}`).toBeDefined();
      expect(affOk(h.affinity), h.id).toBe(true);
      expect(h.motto, h.id).toBeTruthy();
    }
  });

  test('특성 제한 종족이 유효하다', () => {
    for (const t of Object.values(TRAITS)) {
      for (const r of [...(t.races ?? []), ...(t.notRaces ?? [])]) expect(RACES[r], `${t.id} → ${r}`).toBeDefined();
      for (const e of t.exclusive ?? []) expect(TRAITS[e], `${t.id} → ${e}`).toBeDefined();
      expect(affOk(t.affinity), t.id).toBe(true);
    }
  });

  test('적·소환수·던전 참조가 유효하다', () => {
    for (const e of Object.values(ENEMIES)) {
      expect(RACES[e.race], e.id).toBeDefined();
      expect(CLASSES[e.cls], e.id).toBeDefined();
      for (const s of e.skills) expect(SKILLS[s], `${e.id} → ${s}`).toBeDefined();
      for (const p of e.phases ?? []) {
        if (p.summon) expect(ENEMIES[p.summon.def]).toBeDefined();
        for (const s of p.addSkills ?? []) expect(SKILLS[s]).toBeDefined();
      }
    }
    for (const s of Object.values(SKILLS)) if (s.summon) expect(ENEMIES[s.summon.def], s.id).toBeDefined();
    for (const d of Object.values(DUNGEONS)) for (const id of [...d.enemies, ...d.elites, d.boss]) expect(ENEMIES[id], `${d.id} → ${id}`).toBeDefined();
  });

  test('모든 직업이 실제로 모집된다', () => {
    // 성급·종족 제한 때문에 영영 안 나오는 직업이 없어야 한다
    const seen = new Set<string>();
    const races = new Set<string>();
    for (let i = 0; i < 6000; i++) {
      const c = generateCharacterLazy(5000 + i * 7919);
      seen.add(c.cls);
      races.add(c.race);
    }
    for (const c of Object.values(CLASSES)) if (c.weight > 0) expect(seen.has(c.id), c.id).toBe(true);
    for (const r of PLAYABLE_RACES) expect(races.has(r.id), r.id).toBe(true);
  });
});

import { generateCharacter } from '../src/core/gen/character';
function generateCharacterLazy(seed: number) {
  return generateCharacter(seed, { now: 0 });
}
