// 보스별 승률 측정 (SIM_BOSSES=1 일 때만): 같은 조건에서 원조 보스(주교·대사제)와 비교한다
import { test } from 'vitest';
import { aiTakeTurn } from '../../src/core/battle/ai';
import { advance, type BEvent, createBattle, endTurn, startTurn } from '../../src/core/battle/battle';
import { DUNGEONS } from '../../src/core/data/dungeons';
import { ENEMIES } from '../../src/core/data/enemies';
import { WARBANDS } from '../../src/core/data/warbands';
import { generateMap, makeBattle, type RunState } from '../../src/core/dungeon';
import { dungeonOf, generateDungeon, genDungeonId } from '../../src/core/gen/dungeon';
import { Rng } from '../../src/core/rng';
import { newGame } from '../../src/core/state';
import { computeStats } from '../../src/core/stats';

function fight(dungeon: string, kind: 'boss' | 'elite', seed: number, level: number, eliteId?: string): { win: boolean; turns: number } {
  const g = newGame(seed);
  for (const c of g.roster) c.level = level;
  const d = dungeonOf(dungeon);
  const run = { dungeon, nodes: generateMap(d, seed), current: null, torch: 80 } as unknown as RunState;
  run.current = kind === 'boss' ? run.nodes.find((n) => n.kind === 'boss')!.id : run.nodes.find((n) => n.layer === Math.floor(d.floors / 2))!.id;
  const spec = makeBattle(run, kind, g.roster, new Rng(seed));
  if (eliteId) { spec.enemies = spec.enemies.slice(0, 1).map((e) => ({ ...e, def: eliteId })); }
  const st = createBattle({ party: g.roster.map((c) => ({ char: c, hp: computeStats(c).hp })), spec, morale: 0 });
  let turns = 0;
  while (!st.over && turns < 800) {
    const u = advance(st);
    const ev: BEvent[] = [];
    if (!startTurn(st, u, ev) && u.alive) aiTakeTurn(st, u);
    endTurn(st, u);
    turns++;
  }
  return { win: st.over === 'victory', turns };
}

test.skipIf(!process.env.SIM_BOSSES)('boss win rates', () => {
  const N = Number(process.env.SIM_N ?? 16);
  const rows: [string, number, number][] = [];
  const lvl = (risk: number) => 1 + (risk - 1) * 2 + 2;
  for (const id of ['necropolis', 'sunken']) {
    const d = DUNGEONS[id];
    let w = 0;
    for (let i = 0; i < N; i++) if (fight(id, 'boss', 500 + i * 97, lvl(d.risk)).win) w++;
    rows.push([`${ENEMIES[d.boss].name} (고정, ☠${d.risk})`, w, N]);
  }
  for (const wb of Object.values(WARBANDS)) {
    const risk = Math.max(2, wb.minRisk);
    for (const boss of wb.bosses) {
      const seeds: number[] = [];
      for (let s = 1; seeds.length < N && s < 40000; s++) { const g = generateDungeon(s, risk); if (g.boss === boss && g.warband === wb.id && !g.mods?.length) seeds.push(s); }
      let w = 0;
      for (const s of seeds) if (fight(genDungeonId(risk, s), 'boss', s, lvl(risk)).win) w++;
      rows.push([`${ENEMIES[boss].name} [${wb.id}] ☠${risk}`, w, seeds.length]);
    }
  }
  console.log(rows.map(([n, w, t]) => `${(w / Math.max(1, t) * 100).toFixed(0).padStart(4)}%  ${w}/${t}  ${n}`).join('\n'));
}, 600_000);

// 한 판 추적: SIM_DEBUG=<보스 id> → 유닛 목록과 매 행동 뒤 체력
test.skipIf(!process.env.SIM_DEBUG)('boss fight trace', () => {
  const bossId = process.env.SIM_DEBUG!;
  const wb = Object.values(WARBANDS).find((w) => w.bosses.includes(bossId))!;
  const risk = Math.max(2, wb.minRisk);
  let seed = 1;
  while (!(generateDungeon(seed, risk).boss === bossId && generateDungeon(seed, risk).warband === wb.id && !generateDungeon(seed, risk).mods?.length)) seed++;
  const id = genDungeonId(risk, seed);
  const d = dungeonOf(id);
  const g = newGame(seed);
  for (const c of g.roster) c.level = 1 + (risk - 1) * 2 + 2;
  const run = { dungeon: id, nodes: generateMap(d, seed), current: null, torch: 80 } as unknown as RunState;
  run.current = run.nodes.find((n) => n.kind === 'boss')!.id;
  const spec = makeBattle(run, 'boss', g.roster, new Rng(seed));
  const st = createBattle({ party: g.roster.map((c) => ({ char: c, hp: computeStats(c).hp })), spec, morale: 0 });
  const out: string[] = [`${d.name} (☠${risk})`];
  for (const u of st.units) out.push(`  ${u.side} ${u.name} Lv${u.level} hp ${u.hp}/${u.maxHp} atk ${u.stats.atk} mag ${u.stats.mag} def ${u.stats.def} spd ${u.stats.spd}`);
  let turns = 0;
  while (!st.over && turns < 800) {
    const u = advance(st);
    const ev: BEvent[] = [];
    if (!startTurn(st, u, ev) && u.alive) aiTakeTurn(st, u);
    endTurn(st, u);
    if (turns < 80) out.push(`${String(turns).padStart(3)} ${u.side[0]} ${u.name.padEnd(10)} → ${st.units.filter((x) => x.alive).map((x) => `${x.name}:${x.hp}`).join(' ')}`);
    turns++;
  }
  out.push(`결과: ${st.over} (${turns}턴)`);
  console.log(out.join('\n'));
});
