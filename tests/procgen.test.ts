import { describe, expect, test } from 'vitest';
import { aiTakeTurn } from '../src/core/battle/ai';
import { advance, type BEvent, createBattle, endTurn, startTurn } from '../src/core/battle/battle';
import { BIOMES, BIOME_IDS } from '../src/core/data/biomes';
import { CLASSES } from '../src/core/data/classes';
import { DUNGEON_MODS, DUNGEON_MOD_IDS } from '../src/core/data/dungeon_mods';
import { DUNGEONS, levelBase } from '../src/core/data/dungeons';
import { ENEMIES } from '../src/core/data/enemies';
import { EVENTS } from '../src/core/data/events';
import { FACTION_IDS } from '../src/core/data/factions';
import { RACES } from '../src/core/data/races';
import { TRAITS } from '../src/core/data/traits';
import { WARBANDS, WARBAND_IDS } from '../src/core/data/warbands';
import { eventFits, generateMap, makeBattle, pickEvent, type RunState } from '../src/core/dungeon';
import { dungeonOf, generateDungeon, genDungeonId, isGenerated, MAX_RISK, parseGenId, refillBoard, unlockedRisk } from '../src/core/gen/dungeon';
import { Rng } from '../src/core/rng';
import { newGame, Store } from '../src/core/state';
import { computeStats } from '../src/core/stats';
import type { Cond, EventDef } from '../src/core/data/events';
import { drawObstacle } from '../src/art/tiles';
import { drawDungeonBackdrop } from '../src/art/backdrops';

const SEEDS = Array.from({ length: 400 }, (_, i) => 1000 + i * 7919);

describe('적 세력·지형·변이 데이터', () => {
  test('규모: 세력 16, 지형 15, 변이 13', () => {
    expect(WARBAND_IDS.length).toBeGreaterThanOrEqual(16);
    expect(BIOME_IDS.length).toBeGreaterThanOrEqual(15);
    expect(DUNGEON_MOD_IDS.length).toBeGreaterThanOrEqual(13);
  });

  test('세력의 적·정예·보스가 존재하고 등급이 맞다', () => {
    for (const w of Object.values(WARBANDS)) {
      expect(w.regulars.length, w.id).toBeGreaterThanOrEqual(4);
      for (const id of w.regulars) { expect(ENEMIES[id], `${w.id} → ${id}`).toBeDefined(); expect(ENEMIES[id].boss, id).toBeFalsy(); }
      for (const id of w.elites) { expect(ENEMIES[id], `${w.id} → ${id}`).toBeDefined(); expect(ENEMIES[id].elite, id).toBe(true); }
      for (const id of w.bosses) { expect(ENEMIES[id], `${w.id} → ${id}`).toBeDefined(); expect(ENEMIES[id].boss, id).toBe(true); }
      expect(w.minRisk).toBeGreaterThanOrEqual(1);
      expect(w.minRisk).toBeLessThanOrEqual(MAX_RISK);
    }
  });

  test('모든 세력은 어떤 지형에 등장하고, 지형의 세력 참조가 유효하다', () => {
    const used = new Set<string>();
    for (const b of Object.values(BIOMES)) {
      expect(b.nouns.length, b.id).toBeGreaterThan(0);
      expect(b.obstacles.length, b.id).toBeGreaterThan(0);
      for (const w of Object.keys(b.warbands)) { expect(WARBANDS[w], `${b.id} → ${w}`).toBeDefined(); used.add(w); }
    }
    for (const w of WARBAND_IDS) expect(used.has(w), w).toBe(true);
  });

  test('모든 장애물과 배경이 실제로 그려진다', () => {
    const kinds = new Set(Object.values(BIOMES).flatMap((b) => b.obstacles));
    for (const k of kinds) {
      const b = drawObstacle(k, '#7fe3ff');
      expect([...b.data].filter((p) => p !== 0).length, k).toBeGreaterThan(30);
    }
    for (const b of Object.values(BIOMES)) {
      const bg = drawDungeonBackdrop(b.sky[0], b.sky[1], b.floor[0], b.accent, 3, b.style);
      expect([...bg.data].every((p) => (p & 0xff) > 0), `${b.id} 배경에 투명 픽셀`).toBe(true);
    }
  });
});

describe('절차적 던전 생성기', () => {
  test('id ↔ 시드·위험도 왕복, 같은 id는 같은 던전', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const risk = 1 + (seed % MAX_RISK);
      const id = genDungeonId(risk, seed);
      expect(parseGenId(id)).toEqual({ risk, seed: seed >>> 0 });
      expect(isGenerated(id)).toBe(true);
      const a = generateDungeon(seed, risk);
      const b = generateDungeon(seed, risk);
      expect(a).toEqual(b);
      expect(dungeonOf(id).name).toBe(a.name);
    }
    expect(isGenerated('necropolis')).toBe(false);
    expect(dungeonOf('???').id).toBe('necropolis');
  });

  test('위험도 규칙: 세력·변이 하한, 층수 범위, 적 참조', () => {
    for (let risk = 1; risk <= MAX_RISK; risk++) {
      for (const seed of SEEDS.slice(0, 120)) {
        const d = generateDungeon(seed, risk);
        expect(d.risk).toBe(risk);
        expect(WARBANDS[d.warband!].minRisk).toBeLessThanOrEqual(risk);
        expect(BIOMES[d.biome!].warbands[d.warband!], `${d.biome} 지형에 ${d.warband}`).toBeDefined();
        for (const m of d.mods!) expect(DUNGEON_MODS[m].minRisk).toBeLessThanOrEqual(risk);
        expect(d.mods!.includes('long_road') && d.mods!.includes('short_road')).toBe(false);
        expect(d.floors).toBeGreaterThanOrEqual(5);
        expect(d.floors).toBeLessThanOrEqual(11);
        for (const id of [...d.enemies, ...d.elites, d.boss]) expect(ENEMIES[id], `${d.id} → ${id}`).toBeDefined();
        expect(ENEMIES[d.boss].boss).toBe(true);
        expect(d.name.length).toBeGreaterThan(2);
        expect(d.bossName).toMatch(/\S+ \S+/);
      }
    }
  });

  test('높은 위험도일수록 적 레벨이 높다', () => {
    for (let r = 2; r <= MAX_RISK; r++) expect(levelBase(generateDungeon(7, r))).toBeGreaterThan(levelBase(generateDungeon(7, r - 1)));
  });

  test('충분히 뽑으면 모든 지형·세력·변이가 나온다', () => {
    const biomes = new Set<string>();
    const wbs = new Set<string>();
    const mods = new Set<string>();
    const names = new Set<string>();
    for (const seed of SEEDS) {
      const d = generateDungeon(seed, MAX_RISK);
      biomes.add(d.biome!); wbs.add(d.warband!); d.mods!.forEach((m) => mods.add(m)); names.add(d.name);
    }
    expect(biomes.size).toBe(BIOME_IDS.length);
    expect(wbs.size).toBe(WARBAND_IDS.length);
    expect(mods.size).toBe(DUNGEON_MOD_IDS.length);
    expect(names.size).toBeGreaterThan(SEEDS.length * 0.85); // 이름이 거의 겹치지 않는다
  });

  test('생성 던전 지도도 입구에서 보스까지 이어진다', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const d = generateDungeon(seed, 1 + (seed % MAX_RISK));
      const nodes = generateMap(d, seed);
      const byId = new Map(nodes.map((n) => [n.id, n]));
      const seen = new Set<string>();
      const q = nodes.filter((n) => n.layer === 0).map((n) => n.id);
      q.forEach((id) => seen.add(id));
      while (q.length) for (const m of byId.get(q.shift()!)!.next) if (!seen.has(m)) { seen.add(m); q.push(m); }
      expect(seen.size).toBe(nodes.length);
      expect(nodes.filter((n) => n.kind === 'boss')).toHaveLength(1);
    }
  });
});

describe('탐사 게시판', () => {
  test('열린 위험도는 정복 최고치 +1, 1~10', () => {
    expect(unlockedRisk(0)).toBe(1);
    expect(unlockedRisk(4)).toBe(5);
    expect(unlockedRisk(99)).toBe(MAX_RISK);
  });

  test('게시판은 5칸, 열린 위험도 이하, 최고 위험도 하나 포함', () => {
    for (let u = 1; u <= MAX_RISK; u++) {
      const board = refillBoard([], u, new Rng(u * 31));
      expect(board).toHaveLength(5);
      expect(new Set(board).size).toBe(5);
      const risks = board.map((id) => parseGenId(id)!.risk);
      expect(Math.max(...risks)).toBe(u);
      expect(risks.every((r) => r >= 1 && r <= u)).toBe(true);
    }
    // 위험도가 낮아지면 넘치는 칸은 지워진다
    const high = refillBoard([], 6, new Rng(5));
    expect(refillBoard(high, 2, new Rng(6)).every((id) => parseGenId(id)!.risk <= 2)).toBe(true);
  });

  test('보스를 쓰러뜨리면 위험도가 열리고, 정복한 던전은 지도에서 사라진다', () => {
    const s = new Store(newGame(4242));
    expect(s.s.board).toHaveLength(5);
    expect(s.unlockedRisk()).toBe(1);
    const target = s.s.board.find((id) => parseGenId(id)!.risk === 1)!;
    expect(s.startRun(target, [s.s.roster[0].id]).ok).toBe(true);
    s.s.run!.outcome = 'victory';
    s.finishRun();
    expect(s.s.maxRisk).toBe(1);
    expect(s.unlockedRisk()).toBe(2);
    expect(s.s.board).not.toContain(target);
    expect(s.s.board.some((id) => parseGenId(id)!.risk === 2)).toBe(true);
  });

  test('재탐색은 금화를 쓰고 지도를 바꾼다', () => {
    const s = new Store(newGame(77));
    const before = [...s.s.board];
    const gold = s.s.gold;
    expect(s.rerollBoard().ok).toBe(true);
    expect(s.s.gold).toBe(gold - s.boardRerollCost());
    expect(s.s.board).not.toEqual(before);
    s.s.gold = 0;
    expect(s.rerollBoard().ok).toBe(false);
    expect(s.rerollBoard(true).ok).toBe(true);
  });

  test('개발자 모드 지원: 금화·시설·위험도', () => {
    const s = new Store(newGame(9));
    s.devGrant('gold');
    expect(s.s.gold).toBe(1000 + 10000);
    s.devGrant('facilities');
    expect(Object.values(s.s.facilities).every((v) => v === 3)).toBe(true);
    s.devGrant('risk');
    expect(s.unlockedRisk()).toBe(MAX_RISK);
    expect(s.s.board.some((id) => parseGenId(id)!.risk === MAX_RISK)).toBe(true);
  });

  test('옛 저장(게시판 없음)도 이어서 할 수 있다', () => {
    const g = newGame(31) as unknown as Record<string, unknown>;
    delete g.board; delete g.maxRisk;
    (g as { cleared: string[] }).cleared = ['necropolis', 'sunken'];
    const s = new Store(g as never);
    expect(s.s.maxRisk).toBe(3);
    expect(s.s.board).toHaveLength(5);
    expect(s.unlockedRisk()).toBe(4);
  });
});

function condOk(c: Cond): string | null {
  if ('race' in c) return c.race.find((r) => !RACES[r]) ?? null;
  if ('cls' in c) return c.cls.find((x) => !CLASSES[x]) ?? null;
  if ('trait' in c) return c.trait.find((t) => !TRAITS[t]) ?? null;
  if ('affinity' in c) return FACTION_IDS.includes(c.affinity) ? null : c.affinity;
  if ('any' in c) return c.any.map(condOk).find((x) => x) ?? null;
  return null;
}

describe('지형 사건', () => {
  test('사건의 조건·효과 참조가 유효하다', () => {
    const ids = new Set<string>();
    for (const e of EVENTS) {
      expect(ids.has(e.id), `중복 ${e.id}`).toBe(false);
      ids.add(e.id);
      for (const b of e.biomes ?? []) expect(BIOMES[b], `${e.id} → ${b}`).toBeDefined();
      for (const w of e.warbands ?? []) expect(WARBANDS[w], `${e.id} → ${w}`).toBeDefined();
      for (const o of e.options) {
        if (o.req) expect(condOk(o.req), `${e.id}/${o.label}`).toBeNull();
        for (const out of o.outcomes) {
          for (const b of out.bonus ?? []) expect(condOk(b.cond), e.id).toBeNull();
          for (const f of out.fx) {
            if ('addTrait' in f && f.addTrait !== 'curse' && f.addTrait !== 'blessing') expect(TRAITS[f.addTrait], `${e.id} → ${f.addTrait}`).toBeDefined();
            if ('rep' in f) expect(FACTION_IDS).toContain(f.rep);
          }
        }
      }
    }
    expect(EVENTS.filter((e) => e.biomes || e.warbands).length).toBeGreaterThanOrEqual(15);
  });

  test('지형 전용 사건은 맞는 던전에서만 나온다', () => {
    const sewerOnly = EVENTS.find((e) => e.id === 'rat_nest') as EventDef;
    expect(eventFits(sewerOnly, 'sewer')).toBe(true);
    expect(eventFits(sewerOnly, 'desert')).toBe(false);
    expect(eventFits(EVENTS.find((e) => e.id === 'shrine')!, 'desert')).toBe(true);
    // 모든 지형에 자기 사건이 하나 이상 있다
    for (const b of BIOME_IDS) expect(EVENTS.some((e) => e.biomes?.includes(b)), b).toBe(true);
    // 실제 뽑기
    const seed = SEEDS.find((s) => generateDungeon(s, 5).biome === 'desert')!;
    const run = { dungeon: genDungeonId(5, seed), usedEvents: [] } as unknown as RunState;
    const d = dungeonOf(run.dungeon);
    for (let i = 0; i < 200; i++) {
      const e = pickEvent(run, new Rng(i));
      expect(eventFits(e, d.biome, d.warband), e.id).toBe(true);
    }
  });
});

describe('새 세력 전투 시뮬레이션', () => {
  function sim(dungeon: string, kind: 'battle' | 'elite' | 'boss', seed: number, level: number) {
    const g = newGame(seed);
    for (const c of g.roster) c.level = level;
    const d = dungeonOf(dungeon);
    const run = { dungeon, nodes: generateMap(d, seed), current: null, torch: 80 } as unknown as RunState;
    const layer = kind === 'boss' ? d.floors : kind === 'elite' ? Math.floor(d.floors / 2) : 1;
    run.current = run.nodes.find((n) => n.layer === layer)?.id ?? 'boss';
    const spec = makeBattle(run, kind, g.roster, new Rng(seed));
    const st = createBattle({ party: g.roster.map((c) => ({ char: c, hp: computeStats(c).hp })), spec, morale: 0 });
    let turns = 0;
    while (!st.over && turns < 800) {
      const u = advance(st);
      const ev: BEvent[] = [];
      if (!startTurn(st, u, ev) && u.alive) aiTakeTurn(st, u);
      endTurn(st, u);
      turns++;
    }
    return st;
  }

  test('모든 세력의 일반·정예·보스 전투가 오류 없이 결판난다', () => {
    const report: string[] = [];
    for (const w of WARBAND_IDS) {
      const risk = Math.max(WARBANDS[w].minRisk, 2);
      const seeds = SEEDS.filter((s) => generateDungeon(s, risk).warband === w).slice(0, 4);
      expect(seeds.length, w).toBeGreaterThan(0);
      const wins = { battle: 0, elite: 0, boss: 0 };
      let n = 0;
      for (const seed of seeds) {
        const id = genDungeonId(risk, seed);
        const lv = 1 + (risk - 1) * 2;
        for (const kind of ['battle', 'elite', 'boss'] as const) {
          const st = sim(id, kind, seed, lv + (kind === 'boss' ? 2 : 0));
          expect(st.over, `${w} ${kind} 교착`).not.toBeNull();
          if (kind === 'battle') n++;
          if (st.over === 'victory') wins[kind]++;
          if (kind === 'boss') expect(st.units.some((u) => u.side === 'enemy' && u.name === dungeonOf(id).bossName), `${w} 보스 이름`).toBe(true);
        }
      }
      report.push(`${w} (☠${risk}): 일반 ${wins.battle}/${n} · 정예 ${wins.elite}/${n} · 보스 ${wins.boss}/${n}`);
    }
    if (process.env.SIM_REPORT) console.log(report.join('\n'));
  }, 120_000);
});

test('고정 던전도 지형·세력을 가진다', () => {
  for (const d of Object.values(DUNGEONS)) {
    expect(BIOMES[d.biome!], d.id).toBeDefined();
    expect(WARBANDS[d.warband!], d.id).toBeDefined();
  }
});
