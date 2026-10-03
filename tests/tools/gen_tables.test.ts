// docs/GAME_DESIGN.md 부록 표 생성기 (TABLES_OUT 설정 시에만)
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { BIOMES } from '../../src/core/data/biomes';
import { CLASSES, ROLE_NAMES } from '../../src/core/data/classes';
import { DUNGEON_MODS } from '../../src/core/data/dungeon_mods';
import { ENEMIES } from '../../src/core/data/enemies';
import { EVENTS } from '../../src/core/data/events';
import { FACILITIES } from '../../src/core/data/facilities';
import { FACTIONS, FACTION_IDS, factionRelation } from '../../src/core/data/factions';
import { HOUSES } from '../../src/core/data/houses';
import { AFFIXES, ITEM_BASES, SLOT_NAMES, UNIQUES } from '../../src/core/data/items';
import { PLAYABLE_RACES, RACES } from '../../src/core/data/races';
import { RELICS } from '../../src/core/data/relics';
import { SKILLS } from '../../src/core/data/skills';
import { TRAITS } from '../../src/core/data/traits';
import { WARBANDS } from '../../src/core/data/warbands';
import { STAT_NAMES } from '../../src/core/types';

const mods = (m: Record<string, number | undefined>) => Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${(STAT_NAMES as Record<string, string>)[k] ?? k} ${v! > 0 ? '+' : ''}${v}`).join(', ') || '—';
const aff = (a: Record<string, number | undefined>) => Object.entries(a).filter(([, v]) => v).map(([k, v]) => `${FACTIONS[k as keyof typeof FACTIONS].name} ${v! > 0 ? '+' : ''}${v}`).join(', ') || '—';
const rn = (ids: string[]) => ids.map((r) => RACES[r as keyof typeof RACES].name).join('/');

test.skipIf(!process.env.TABLES_OUT)('tables', () => {
  const out: string[] = [];
  out.push(`### 종족 (모집 가능 ${PLAYABLE_RACES.length})\n\n| 종족 | 최소 성급 | 가중치 | 능력치 보정 | 진영 호감 | 결속 |\n|---|---|---|---|---|---|`);
  for (const r of PLAYABLE_RACES) {
    const fx = [r.effects?.regen ? `재생 ${r.effects.regen * 100}%` : '', r.effects?.lifesteal ? `흡혈 ${r.effects.lifesteal * 100}%` : '', r.effects?.goldMul ? `금화 ×${r.effects.goldMul}` : ''].filter(Boolean).join(', ');
    out.push(`| ${r.name} | ★${r.minStar} | ${r.weight} | ${mods(r.statMod as never)}${fx ? `, ${fx}` : ''} | ${aff(r.affinity as never)} | ${r.canBind ? '가능' : '불가'} |`);
  }
  out.push(`\n지휘관 전용: 핵지기 · 적 전용: ${Object.values(RACES).filter((r) => r.weight === 0 && r.id !== 'corebearer').map((r) => r.name).join(', ')}\n`);
  const playable = Object.values(CLASSES).filter((c) => c.weight > 0);
  out.push(`### 직업 (${playable.length} + 지휘관 전용 1)\n\n| 직업 | 역할 | 기본 공격 (사거리) | 기술 풀 | 제한 |\n|---|---|---|---|---|`);
  for (const c of Object.values(CLASSES)) out.push(`| ${c.name} | ${ROLE_NAMES[c.role]} | ${c.attack.name} (${c.attack.range.join('-')}) | ${c.skills.map((s) => SKILLS[s].name).join(', ')} | ${c.races ? `${rn(c.races)}만` : c.notRaces ? `${rn(c.notRaces)} 불가` : '—'} |`);
  out.push(`\n### 네임드 집단 (${Object.keys(HOUSES).length})\n\n| 집단 | 표어 | 등급 | 조건 | 특전 | 위계 |\n|---|---|---|---|---|---|`);
  for (const h of Object.values(HOUSES)) {
    const c = h.cond;
    const cond = [c.races ? rn(c.races) : null, `★${c.minStar}+`, c.classes ? c.classes.map((x) => CLASSES[x].name).join('/') : null,
      c.anyTraits ? `특성(${c.anyTraits.map((t) => TRAITS[t].name).join('/')} 중 1)` : null, c.noTraits ? `금지(${c.noTraits.map((t) => TRAITS[t].name).join('/')})` : null,
      c.vampire ? '결속 상태' : null, `${Math.round(h.chance * 100)}%`].filter(Boolean).join(' · ');
    out.push(`| ${h.emblem} ${h.name} | ${h.motto ?? ''} | ${h.rarity === 'legendary' ? '전설' : '네임드'} | ${cond} | **${h.perk.name}**: ${h.perk.desc}${h.forbidBound ? ' (결속 시 파문)' : ''} | ${h.ranks?.join(' / ') ?? '선배 / 후배'} |`);
  }
  out.push('\n### 진영 상성표\n');
  out.push('| | ' + FACTION_IDS.map((f) => FACTIONS[f].name).join(' | ') + ' |');
  out.push('|---|' + FACTION_IDS.map(() => '---').join('|') + '|');
  for (const a of FACTION_IDS) out.push(`| **${FACTIONS[a].name}** | ` + FACTION_IDS.map((b) => (a === b ? '·' : String(factionRelation(a, b) || ''))).join(' | ') + ' |');
  for (const kind of ['trait', 'curse', 'blessing'] as const) {
    const title = { trait: '특성', curse: '저주', blessing: '가호' }[kind];
    const list = Object.values(TRAITS).filter((t) => t.kind === kind);
    out.push(`\n### ${title} (${list.length})\n\n| 이름 | 효과 | 제한 |\n|---|---|---|`);
    for (const t of list) out.push(`| ${t.name} | ${t.desc}${t.affinity ? ` (${aff(t.affinity as never)})` : ''} | ${t.races ? rn(t.races) + '만' : t.notRaces ? rn(t.notRaces) + ' 불가' : '—'} |`);
  }
  out.push(`\n### 시설\n\n| 시설 | 1단계 | 2단계 | 3단계 |\n|---|---|---|---|`);
  for (const f of Object.values(FACILITIES)) out.push(`| ${f.icon} ${f.name} | ${f.levels.map((l) => `◆${l.gold}${l.shards ? ` · 핵 ${l.shards}` : ''} — ${l.desc}`).join(' | ')} |`);
  const en = (ids: string[]) => ids.map((id) => ENEMIES[id].name).join(', ');
  out.push(`\n### 적 세력 (${Object.keys(WARBANDS).length})\n\n| 세력 | 등장 ☠ | 일반 | 정예 | 보스 |\n|---|---|---|---|---|`);
  for (const w of Object.values(WARBANDS)) out.push(`| **${w.name}** — ${w.desc} | ${w.minRisk}+ | ${en(w.regulars)} | ${en(w.elites)} | ${w.bosses.map((b) => `${ENEMIES[b].name}${ENEMIES[b].title && ENEMIES[b].title !== ENEMIES[b].name ? ` (칭호 '${ENEMIES[b].title}')` : ''}`).join(', ')} |`);
  out.push(`\n### 지형 (${Object.keys(BIOMES).length})\n\n| 지형 | 이름 명사 | 장애물 | 배경 | 어울리는 세력 (가중치) |\n|---|---|---|---|---|`);
  for (const b of Object.values(BIOMES)) out.push(`| ${b.name} | ${b.nouns.join(', ')} | ${b.obstacles.join(', ')} | ${b.style} | ${Object.entries(b.warbands).map(([w, n]) => `${WARBANDS[w].name} ${n}`).join(', ')} |`);
  out.push(`\n### 던전 변이 (${Object.keys(DUNGEON_MODS).length})\n\n| 변이 | 등장 ☠ | 효과 |\n|---|---|---|`);
  for (const m of Object.values(DUNGEON_MODS)) out.push(`| ${m.good ? '🟢' : '🔴'} ${m.name} | ${m.minRisk}+ | ${m.desc} |`);
  out.push(`\n### 사건 (${EVENTS.length})\n\n| 사건 | 나오는 곳 | 선택지 (조건) |\n|---|---|---|`);
  for (const e of EVENTS) {
    const where = [...(e.biomes ?? []).map((b) => BIOMES[b].name), ...(e.warbands ?? []).map((w) => WARBANDS[w].name)].join(', ') || '어디서나';
    out.push(`| ${e.title} | ${where} | ${e.options.map((o) => o.label + (o.reqText ? ` [${o.reqText}]` : '')).join(' / ')} |`);
  }
  out.push('\n### 적과 소환수\n\n| 이름 | 종족 · 직업 | 기술 | 비고 |\n|---|---|---|---|');
  for (const e of Object.values(ENEMIES)) out.push(`| ${e.name} | ${RACES[e.race].name} · ${CLASSES[e.cls].name} | ${e.skills.map((s) => SKILLS[s].name).join(', ')} | ${e.boss ? '보스' : e.elite ? '정예' : e.tags.includes('summon') ? '아군 소환수' : ''}${e.phases ? ` · 페이즈 ${e.phases.length}` : ''} |`);
  out.push(`\n### 장비 베이스 (${Object.keys(ITEM_BASES).length})\n\n| 이름 | 부위 | 기본 능력치 |\n|---|---|---|`);
  for (const b of Object.values(ITEM_BASES)) out.push(`| ${b.name} | ${SLOT_NAMES[b.slot]} | ${mods(b.stats as never)} |`);
  out.push(`\n### 접두어 (${Object.keys(AFFIXES).length})\n\n| 이름 | 부위 | 효과 |\n|---|---|---|`);
  for (const a of Object.values(AFFIXES)) out.push(`| ${a.name} | ${a.slots.map((s) => SLOT_NAMES[s]).join('/')} | ${a.desc} |`);
  out.push(`\n### 전설 장비 (${Object.keys(UNIQUES).length})\n\n| 이름 | 효과 |\n|---|---|`);
  for (const u of Object.values(UNIQUES)) out.push(`| ${u.name} | ${u.desc} |`);
  out.push(`\n### 유물 (${Object.keys(RELICS).length})\n\n| 이름 | 효과 |\n|---|---|`);
  for (const r of Object.values(RELICS)) out.push(`| ${r.name} | ${r.desc} |`);
  writeFileSync(process.env.TABLES_OUT!, out.join('\n') + '\n');
});
