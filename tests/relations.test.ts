// 동료 관계와 대사
import { describe, expect, test } from 'vitest';
import { advance, type BEvent, bondAdjMul, createBattle, endTurn, performAction, startTurn } from '../src/core/battle/battle';
import { aiTakeTurn } from '../src/core/battle/ai';
import { CLASSES } from '../src/core/data/classes';
import { DUNGEONS } from '../src/core/data/dungeons';
import { SKILLS } from '../src/core/data/skills';
import { bark, campTalk, voiceOf } from '../src/core/dialogue';
import { generateMap, makeBattle, type RunState } from '../src/core/dungeon';
import { generateCharacter } from '../src/core/gen/character';
import { baseBond, houseTie, pairKey, tierOf } from '../src/core/relations';
import { Rng } from '../src/core/rng';
import { newGame, Store } from '../src/core/state';
import { computeStats } from '../src/core/stats';
import type { Character } from '../src/core/types';

const mk = (seed: number, o: Partial<Character> = {}): Character => ({ ...generateCharacter(seed, { now: 0 }), house: undefined, traits: [], curses: [], blessings: [], ...o });

describe('관계 점수', () => {
  test('대칭이고 범위를 지킨다', () => {
    for (let i = 0; i < 300; i++) {
      const a = generateCharacter(10 + i * 31, { now: 0 });
      const b = generateCharacter(99 + i * 57, { now: 0 });
      const x = baseBond(a, b).score;
      expect(x).toBe(baseBond(b, a).score);
      expect(Math.abs(x)).toBeLessThanOrEqual(100);
    }
  });

  test('같은 소속은 선후배가 되고 가까워진다', () => {
    const a = mk(1, { race: 'human', cls: 'knight', star: 4, house: 'halton', level: 10 });
    const b = mk(2, { race: 'human', cls: 'knight', star: 3, house: 'halton', level: 3 });
    const tie = houseTie(a, b)!;
    expect(tie.senior.id).toBe(a.id);
    expect(tie.titles).toEqual(['기사', '종자']);
    const loner = { ...b, house: undefined };
    expect(baseBond(a, b).score).toBeGreaterThan(baseBond(a, loner).score + 20);
  });

  test('원한·종족 반목은 관계를 나쁘게 만든다', () => {
    const hater = mk(3, { race: 'human', cls: 'warrior', traits: ['orc_grudge'] });
    const orc = mk(4, { race: 'orc', cls: 'warrior' });
    const human = mk(5, { race: 'human', cls: 'warrior' });
    expect(baseBond(hater, orc).score).toBeLessThan(baseBond(hater, human).score - 25);
    const fire = mk(6, { race: 'fire_spirit', cls: 'mage' });
    const tree = mk(7, { race: 'dryad', cls: 'druid' });
    expect(tierOf(baseBond(fire, tree).score)).not.toBe('comrade');
  });
});

describe('관계의 성장', () => {
  test('승리하면 함께 싸운 동료끼리 가까워지고, 붙어 섰다면 더 가까워진다', () => {
    const s = new Store(newGame(777));
    const [a, b, c] = s.s.roster;
    s.startRun('necropolis', [a.id, b.id, c.id]);
    const first = s.s.run!.nodes.find((n) => n.layer === 0)!;
    s.moveTo(first.id);
    const ab0 = s.bondScoreOf(a, b);
    const ac0 = s.bondScoreOf(a, c);
    s.battleFinished({ victory: true, hp: { [a.id]: 10, [b.id]: 10, [c.id]: 10 }, deaths: [], kills: {}, cheatDeathUsed: [], adjacent: [[a.id, b.id]] });
    expect(s.bondScoreOf(a, b) - ab0).toBeGreaterThan(s.bondScoreOf(a, c) - ac0);
    expect(s.s.bonds[pairKey(a.id, b.id)].battles).toBe(1);
  });

  test('야영지에서는 모닥불 대화가 열린다', () => {
    const s = new Store(newGame(888));
    s.startRun('necropolis', s.s.roster.slice(0, 3).map((c) => c.id));
    const run = s.s.run!;
    const rest = run.nodes.find((n) => n.kind === 'rest')!;
    // 휴식 노드로 바로 이동 (경로 무시)
    run.current = null;
    rest.layer = 0;
    (s as unknown as { moveTo(id: string): unknown }).moveTo.call(s, rest.id);
    const lines = run.notice?.lines ?? [];
    expect(lines.some((l) => l.includes('모닥불 곁에서'))).toBe(true);
    expect(Object.values(s.s.bonds).some((b) => b.talks > 0)).toBe(true);
  });
});

describe('전투 속 관계', () => {
  function battleWith(bondScore: number) {
    const g = newGame(4242);
    const run = { dungeon: 'necropolis', nodes: generateMap(DUNGEONS.necropolis, 4242), current: null, torch: 80, relics: [] } as unknown as RunState;
    run.current = run.nodes.find((n) => n.layer === 1)!.id;
    const spec = makeBattle(run, 'battle', g.roster, new Rng(1));
    const bonds: Record<string, number> = {};
    for (const x of g.roster) for (const y of g.roster) if (x !== y) bonds[pairKey(x.id, y.id)] = bondScore;
    return createBattle({ party: g.roster.map((c) => ({ char: c, hp: computeStats(c).hp })), spec, morale: 0, bonds });
  }

  test('맹우가 옆에 있으면 피해가 늘고, 원수가 옆에 있으면 줄어든다', () => {
    for (const [score, cmp] of [[80, 1], [-80, -1]] as const) {
      const st = battleWith(score);
      const [a, b] = st.units.filter((u) => u.side === 'ally');
      a.x = 2; a.y = 2; b.x = 3; b.y = 2;
      const m = bondAdjMul(st, a);
      expect(Math.sign(m - 1)).toBe(cmp);
    }
  });

  test('맹우가 쓰러지면 복수를 맹세한다 (축복 + 대사)', () => {
    const st = battleWith(80);
    const [a, b] = st.units.filter((u) => u.side === 'ally');
    const foe = st.units.find((u) => u.side === 'enemy')!;
    foe.stats.atk = 9999;
    a.hp = 1;
    foe.x = a.x + 1; foe.y = a.y;
    for (const u of st.units) if (u !== a && u !== foe && u.x === foe.x && u.y === foe.y) u.x = 9;
    const ev: BEvent[] = performAction(st, foe, { id: 'x', name: '공격', skill: { ...SKILLS.cleave, area: 0, target: 'enemy', range: [1, 1] }, isAttack: true }, a.x, a.y);
    expect(a.alive).toBe(false);
    expect(b.statuses.some((s) => s.id === 'bless')).toBe(true);
    expect(ev.some((e) => e.t === 'say')).toBe(true);
  });

  test('전투 시작 대사가 준비되고, 전투는 여전히 결판이 난다', () => {
    const st = battleWith(30);
    expect(st.opening.length).toBeGreaterThan(0);
    let turns = 0;
    while (!st.over && turns < 600) {
      const u = advance(st);
      const ev: BEvent[] = [];
      if (!startTurn(st, u, ev) && u.alive) aiTakeTurn(st, u);
      endTurn(st, u);
      turns++;
    }
    expect(st.over).not.toBeNull();
  });
});

describe('대사', () => {
  test('모든 직업이 전투 시작 대사를 갖고, 치환자가 남지 않는다', () => {
    const rng = new Rng(5);
    for (const id of Object.keys(CLASSES)) {
      const ch = mk(100 + id.length, { cls: id, house: 'halton' });
      for (const sit of ['start', 'kill', 'hurt', 'allyDown', 'vengeance', 'rivalDown', 'victory', 'recruit'] as const) {
        const line = bark(rng, voiceOf(ch), sit, { target: '토마' });
        expect(line, `${id}/${sit}`).toBeTruthy();
        expect(line!).not.toMatch(/[{}]/);
      }
    }
  });

  test('야영 대화: 두 사람의 대사와 관계 변화가 나온다', () => {
    const rng = new Rng(9);
    const pairs: [Partial<Character>, Partial<Character>][] = [
      [{ race: 'catkin' }, { race: 'rabbitkin' }],
      [{ cls: 'gravedigger' }, { cls: 'mourner' }],
      [{ race: 'human', cls: 'knight', star: 4, house: 'halton' }, { race: 'human', cls: 'knight', star: 3, house: 'halton' }],
      [{}, {}],
    ];
    for (const [x, y] of pairs) {
      const a = mk(11, x);
      const b = mk(12, y);
      for (let i = 0; i < 10; i++) {
        const t = campTalk(rng, a, b, baseBond(a, b).score);
        expect(t.lines.length).toBeGreaterThanOrEqual(2);
        for (const l of t.lines) expect(l).not.toMatch(/[{}]/);
        expect(Number.isInteger(t.delta)).toBe(true);
      }
    }
  });
});
