import { CLASSES } from './data/classes';
import { DUNGEONS, levelBase } from './data/dungeons';
import { dungeonFx, dungeonOf, MAX_RISK, refillBoard, unlockedRisk } from './gen/dungeon';
import { ENEMIES } from './data/enemies';
import { EVENTS, type Fx, type Who } from './data/events';
import { FACTION_IDS, FACTIONS } from './data/factions';
import { RACES } from './data/races';
import { RELICS, RELIC_IDS } from './data/relics';
import { SKILLS } from './data/skills';
import { BLESSING_LIST, CURSE_LIST, TRAITS } from './data/traits';
import {
  type BattleSpec, generateMap, makeBattle, makeShop, NODE_NAMES, pickEvent, reachable, type RunState,
  condMatch, itemLevel, torchCost,
} from './dungeon';
import { makeEpitaph } from './epitaph';
import { pull, PULL10_COST, PULL_COST, ROSTER_CAP, type Pity } from './gacha';
import { generateCharacter } from './gen/character';
import { generateItem, type ItemGenOpts, itemValue } from './gen/item';
import { freshSeed, mixSeed, Rng } from './rng';
import { computeEffects, computeStats, expToNext, fullName, levelCap, partySynergy, setEnshrined } from './stats';
import type { Character, FactionId, GearSlot, Grave, Item, Star } from './types';
import { applyBind, canBind, DORMANT_RUNS, lordExpFromBind, lordExpToNext, bindCost, bindSlots } from './bond';
import { campTalk } from './dialogue';
import { type FacilityId, FACILITIES } from './data/facilities';
import {
  cureCost, DORMANCY_COST, ENHANCE_CHANCE, enhanceCost, isMeritorious, MAX_PLUS_BY_LEVEL, MEMORIAL_SLOTS, meritOf,
  purgeCost, REZ, rerollCost, restorationPct, rezChance, SALVAGE_BONUS, SLIP_FROM,
} from './facilities';
import { displayName, rerollAffixes } from './gen/item';
import { baseBond, type Bond, bondMorale, bondScore, clampBond, pairKey, pushNote, tierOf, TIER_NAMES } from './relations';

export const SAVE_KEY = 'world_aion_save_v1';
export const PARTY_SIZE = 4;
export const STASH_CAP = 60;
export const LORD_ID = 'lord';
export const LORD_SLOTS = 3;
export const LORD_LEARN_CHANCE = 0.3;

export interface SaveData {
  version: 1;
  createdAt: number;
  gold: number;
  essence: number;
  lord: { level: number; exp: number; learned: string[]; equipped: string[] };
  lordChar: Character;
  roster: Character[];
  graveyard: Grave[];
  rep: Record<FactionId, number>;
  pity: Pity;
  runNo: number;
  cleared: string[];
  run: RunState | null;
  news: { t: number; text: string }[];
  stats: { deaths: number; turned: number; victories: number; runs: number; recruited: number };
  stash: Item[];
  bonds: Record<string, Bond>;
  facilities: Record<FacilityId, number>;
  memorial: { enshrined: string[]; attempts: Record<string, number> };
  board: string[];       // 탐사 게시판의 생성 던전 id
  maxRisk: number;       // 정복한 최고 위험도
}

export interface BattleResult {
  victory: boolean;
  hp: Record<string, number>;
  deaths: { id: string; by: string }[];
  kills: Record<string, number>;
  cheatDeathUsed: string[];
  bonusEssence?: number;
  bonusGold?: number;
  adjacent?: [string, string][]; // 전투 종료 시 붙어 선 동료 쌍
}

export interface RewardSummary {
  gold: number;
  essence: number;
  items?: Item[];
  relics?: string[];
  exp: { id: string; name: string; gained: number; levels: number }[];
  lines: string[];
}

function starter(seedBase: number): Character[] {
  const plans: { cls: string[]; star: Star }[] = [
    { cls: ['knight', 'warrior', 'lancer', 'paladin'], star: 2 },
    { cls: ['priest', 'druid'], star: 2 },
    { cls: ['archer', 'mage', 'hunter', 'elementalist'], star: 1 },
    { cls: ['rogue', 'wanderer', 'swordsman', 'monk', 'berserker'], star: 1 },
  ];
  const rng = new Rng(seedBase);
  return plans.map((p, i) => {
    // 종족 제한에 걸리지 않도록 몇 번 시도
    for (let t = 0; t < 20; t++) {
      const seed = mixSeed(seedBase, `starter${i}_${t}`);
      const ch = generateCharacter(seed, { star: p.star, cls: rng.pick(p.cls) });
      const c = CLASSES[ch.cls];
      if ((!c.races || c.races.includes(ch.race)) && !(c.notRaces ?? []).includes(ch.race)) return ch;
    }
    return generateCharacter(mixSeed(seedBase, `starter${i}`), { star: p.star, cls: 'warrior', race: 'human' });
  });
}

/** 지휘관(플레이어) 유닛 */
export function makeLord(seed: number): Character {
  const rng = new Rng(mixSeed(seed, 'lord'));
  return {
    id: LORD_ID, seed: rng.seed32(), given: '지휘관', surname: '', gender: rng.pick(['m', 'f'] as const),
    race: 'corebearer', cls: 'commander', star: 3, level: 1, exp: 0,
    traits: [], curses: [], blessings: [], skills: [...LORD_INNATE], roll: {},
    vampire: false, dormant: 0, kills: 0, runs: 0, createdAt: Date.now(), isLord: true,
  };
}

export const LORD_START_SKILLS = ['quick_slash', 'shadow_bolt'];
export const LORD_INNATE = ['core_strike', 'rally'];

export function newGame(seed = freshSeed()): SaveData {
  const rep = Object.fromEntries(FACTION_IDS.map((f) => [f, 0])) as Record<FactionId, number>;
  rep.nightcourt = 10;
  rep.radiance = -10;
  return {
    version: 1,
    createdAt: Date.now(),
    gold: 1000,
    essence: 2,
    lord: { level: 1, exp: 0, learned: [...LORD_START_SKILLS], equipped: [...LORD_START_SKILLS] },
    lordChar: makeLord(seed),
    roster: starter(seed),
    graveyard: [],
    rep,
    pity: { pulls: 0, since5: 0 },
    runNo: 0,
    cleared: [],
    run: null,
    news: [{ t: Date.now(), text: '대붕괴로부터 백 년. 지휘관이 무너진 성채에서 세계핵의 조각을 품고 눈을 떴다. 네 명의 생존자가 불빛을 보고 찾아왔다.' }],
    stats: { deaths: 0, turned: 0, victories: 0, runs: 0, recruited: 0 },
    stash: [],
    bonds: {},
    facilities: { forge: 0, infirmary: 0, memorial: 0 },
    memorial: { enshrined: [], attempts: {} },
    board: refillBoard([], 1, new Rng(mixSeed(seed, 'board'))),
    maxRisk: 0,
  };
}

/** 예전 저장 데이터에 새 필드를 채운다 */
export function migrate(d: SaveData): SaveData {
  d.stash ??= [];
  d.bonds ??= {};
  d.facilities ??= { forge: 0, infirmary: 0, memorial: 0 };
  d.memorial ??= { enshrined: [], attempts: {} };
  d.maxRisk ??= Math.max(0, ...d.cleared.map((id) => dungeonOf(id).risk));
  d.board ??= refillBoard([], unlockedRisk(d.maxRisk), new Rng(mixSeed(d.createdAt ?? 1, 'board')));
  for (const f of FACTION_IDS) d.rep[f] ??= 0;
  d.lord.learned ??= [...LORD_START_SKILLS];
  d.lord.equipped ??= [...LORD_START_SKILLS];
  d.lordChar ??= makeLord(d.createdAt ?? 1);
  // v0.2 → v0.3: 혈주 → 지휘관, 진홍의 혈맹 → 핵의 맹약단
  if ((d.lordChar.race as string) === 'dhampir') d.lordChar.race = 'corebearer';
  if (d.lordChar.cls === 'bloodlord') d.lordChar.cls = 'commander';
  if (d.lordChar.given === '혈주') d.lordChar.given = '지휘관';
  for (const c of [...d.roster, ...d.graveyard.map((g) => g.char)]) if (c.house === 'crimson') c.house = 'core_covenant';
  if (d.run) {
    d.run.loot ??= [];
    d.run.relics ??= [];
  }
  return d;
}

const hasStorage = () => typeof localStorage !== 'undefined';

export class Store {
  s: SaveData;
  private listeners = new Set<() => void>();

  constructor(data?: SaveData) {
    this.s = migrate(data ?? this.load() ?? newGame());
    this.syncMemorial();
  }

  /** 봉안된 영웅 목록을 능력치 계산에 등록 */
  syncMemorial(): void {
    const ids = new Set(this.s.memorial.enshrined);
    setEnshrined(this.s.graveyard.filter((g) => ids.has(g.char.id)).map((g) => g.char));
  }

  // ------------------------------------------------------------ 기본
  load(): SaveData | null {
    if (!hasStorage()) return null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw) as SaveData;
      return d.version === 1 ? migrate(d) : null;
    } catch {
      return null;
    }
  }

  save(): void {
    if (hasStorage()) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch { /* 저장 공간 부족 등 */ }
    }
    for (const l of this.listeners) l();
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  reset(): void {
    this.s = newGame();
    this.syncMemorial();
    this.save();
  }

  news(text: string): void {
    this.s.news.unshift({ t: Date.now(), text });
    this.s.news = this.s.news.slice(0, 40);
  }

  char(id: string): Character | undefined {
    if (id === LORD_ID) return this.lord();
    return this.s.roster.find((c) => c.id === id);
  }

  /** 지휘관 유닛 (레벨·장착 기술을 동기화해서 반환) */
  lord(): Character {
    const c = this.s.lordChar;
    c.level = this.s.lord.level;
    c.skills = [...LORD_INNATE, ...this.s.lord.equipped.filter((id) => this.s.lord.learned.includes(id) && SKILLS[id])].slice(0, LORD_SLOTS + LORD_INNATE.length);
    return c;
  }

  /** 지휘관이 기술을 핵에 기록한다. 새로 배웠으면 true */
  lordLearn(skillId: string): boolean {
    const L = this.s.lord;
    if (!SKILLS[skillId] || L.learned.includes(skillId) || LORD_INNATE.includes(skillId)) return false;
    L.learned.push(skillId);
    if (L.equipped.length < LORD_SLOTS) L.equipped.push(skillId);
    return true;
  }

  toggleLordSkill(skillId: string): { ok: boolean; reason?: string } {
    const L = this.s.lord;
    if (this.s.run?.party.includes(LORD_ID)) return { ok: false, reason: '원정 중에는 바꿀 수 없다.' };
    if (!L.learned.includes(skillId)) return { ok: false };
    if (L.equipped.includes(skillId)) L.equipped = L.equipped.filter((s) => s !== skillId);
    else if (L.equipped.length >= LORD_SLOTS) return { ok: false, reason: `기술은 ${LORD_SLOTS}개까지 장착할 수 있다.` };
    else L.equipped.push(skillId);
    this.save();
    return { ok: true };
  }

  private lordGainExp(exp: number): string[] {
    const msgs: string[] = [];
    this.s.lord.exp += Math.round(exp);
    while (this.s.lord.exp >= lordExpToNext(this.s.lord.level)) {
      this.s.lord.exp -= lordExpToNext(this.s.lord.level);
      this.s.lord.level++;
      msgs.push(`지휘관 레벨 ${this.s.lord.level}! 결속 한도 ${bindSlots(this.s.lord.level)}명.`);
    }
    return msgs;
  }

  boundCount(): number {
    return this.s.roster.filter((c) => c.vampire).length;
  }

  addRep(f: FactionId, n: number): void {
    this.s.rep[f] = Math.max(-100, Math.min(100, (this.s.rep[f] ?? 0) + n));
  }

  // ------------------------------------------------------------ 모집
  recruit(n: 1 | 10): { ok: boolean; chars?: Character[]; reason?: string } {
    const cost = n === 10 ? PULL10_COST : PULL_COST;
    if (this.s.run) return { ok: false, reason: '원정 중에는 모집할 수 없다.' };
    if (this.s.gold < cost) return { ok: false, reason: `금화가 부족하다 (${cost} 필요).` };
    if (this.s.roster.length + n > ROSTER_CAP) return { ok: false, reason: `거점이 꽉 찼다 (최대 ${ROSTER_CAP}명).` };
    this.s.gold -= cost;
    const chars = pull(n, this.s.pity);
    this.s.roster.push(...chars);
    this.s.stats.recruited += n;
    const best = chars.reduce((a, b) => (b.star > a.star ? b : a));
    if (best.star >= 4) this.news(`★${best.star} ${fullName(best)}이(가) 거점의 불빛을 보고 찾아왔다.`);
    this.save();
    return { ok: true, chars };
  }

  release(id: string): { ok: boolean; reason?: string; gold?: number } {
    if (this.s.run?.party.includes(id)) return { ok: false, reason: '원정 중인 동료다.' };
    const ch = this.char(id);
    if (!ch) return { ok: false, reason: '없는 동료다.' };
    if (ch.isLord) return { ok: false, reason: '지휘관은 거점을 떠날 수 없다.' };
    const gold = 10 * ch.star;
    this.s.roster = this.s.roster.filter((c) => c.id !== id);
    this.s.gold += gold;
    this.news(`${fullName(ch)}이(가) 거점을 떠났다.`);
    this.save();
    return { ok: true, gold };
  }

  // ------------------------------------------------------------ 결속
  bindCheck(id: string): { ok: boolean; reason?: string; cost: number } {
    const ch = this.char(id);
    if (!ch) return { ok: false, reason: '없는 동료다.', cost: 0 };
    if (this.s.run?.party.includes(id)) return { ok: false, reason: '원정 중인 동료다.', cost: 0 };
    const r = canBind(ch, { essence: this.s.essence, vampires: this.boundCount(), lordLevel: this.s.lord.level });
    return { ...r, cost: bindCost(ch) };
  }

  bindCompanion(id: string): { ok: boolean; msgs: string[] } {
    const chk = this.bindCheck(id);
    const ch = this.char(id);
    if (!chk.ok || !ch) return { ok: false, msgs: [chk.reason ?? '불가'] };
    this.s.essence -= chk.cost;
    const msgs = applyBind(ch);
    const exp = lordExpFromBind(ch);
    msgs.push(`지휘관이 결속을 통해 경험치 ${exp}를 얻었다.`);
    msgs.push(...this.lordGainExp(exp));
    const learned = ch.skills.filter((id) => this.lordLearn(id));
    if (learned.length) msgs.push(`그의 기억이 핵에 기록되었다. 새 기술: ${learned.map((id) => SKILLS[id].name).join(', ')}`);
    this.addRep('nightcourt', 3);
    this.addRep('radiance', -3);
    this.s.stats.turned++;
    this.news(`${fullName(ch)}이(가) 세계핵에 결속되었다.`);
    this.save();
    return { ok: true, msgs };
  }

  // ------------------------------------------------------------ 경험치
  gainExp(ch: Character, amount: number): { gained: number; levels: number } {
    if (ch.isLord) {
      const before = this.s.lord.level;
      const gained = Math.round(amount);
      this.lordGainExp(gained);
      return { gained, levels: this.s.lord.level - before };
    }
    if (ch.vampire) return { gained: 0, levels: 0 };
    const gained = Math.round(amount * computeEffects(ch).expMul);
    const cap = levelCap(ch.star);
    let levels = 0;
    if (ch.level >= cap) return { gained: 0, levels: 0 };
    ch.exp += gained;
    while (ch.level < cap && ch.exp >= expToNext(ch.level)) {
      ch.exp -= expToNext(ch.level);
      ch.level++;
      levels++;
    }
    if (ch.level >= cap) ch.exp = 0;
    return { gained, levels };
  }

  // ------------------------------------------------------------ 원정
  availableDungeons(): string[] {
    const fixed = Object.values(DUNGEONS).filter((d) => !d.unlockAfter || this.s.cleared.includes(d.unlockAfter)).map((d) => d.id);
    return [...fixed, ...this.s.board];
  }

  canJoinParty(ch: Character): { ok: boolean; reason?: string } {
    if (ch.dormant > 0) return { ok: false, reason: `세계핵에서 휴면 중 (${ch.dormant}회 남음)` };
    return { ok: true };
  }

  startRun(dungeon: string, party: string[]): { ok: boolean; reason?: string } {
    if (this.s.run) return { ok: false, reason: '이미 원정 중이다.' };
    if (!this.availableDungeons().includes(dungeon)) return { ok: false, reason: '아직 갈 수 없는 곳이다.' };
    if (party.length < 1 || party.length > PARTY_SIZE) return { ok: false, reason: `파티는 1~${PARTY_SIZE}명이어야 한다.` };
    const chars = party.map((id) => this.char(id)).filter((c): c is Character => !!c);
    if (chars.length !== party.length) return { ok: false, reason: '없는 동료가 있다.' };
    for (const c of chars) {
      const j = this.canJoinParty(c);
      if (!j.ok) return { ok: false, reason: `${fullName(c)}: ${j.reason}` };
    }
    const seed = freshSeed();
    this.s.runNo++;
    for (const c of chars) c.cheatDeathUsed = false;
    this.s.run = {
      dungeon, seed, runNo: this.s.runNo,
      nodes: generateMap(dungeonOf(dungeon), seed),
      current: null, visited: [], party: [...party],
      hp: Object.fromEntries(chars.map((c) => [c.id, computeStats(c).hp])),
      fallen: [], torch: 100, gold: 0, essence: 0, recruits: [], log: [],
      phase: 'map', usedEvents: [], step: 0, loot: [], relics: [],
    };
    this.s.stats.runs++;
    this.save();
    return { ok: true };
  }

  partyChars(): Character[] {
    const run = this.s.run;
    if (!run) return [];
    return run.party.map((id) => this.char(id)).filter((c): c is Character => !!c);
  }

  /** 살아서 행동 가능한 파티원 */
  activeParty(): Character[] {
    const run = this.s.run;
    if (!run) return [];
    return this.partyChars().filter((c) => !run.fallen.some((f) => f.id === c.id) && (run.hp[c.id] ?? 0) > 0);
  }

  private runRng(salt: string): Rng {
    const run = this.s.run!;
    return new Rng(mixSeed(run.seed, `${salt}_${run.step}`));
  }

  moveTo(nodeId: string): { ok: boolean; reason?: string } {
    const run = this.s.run;
    if (!run || run.phase !== 'map') return { ok: false, reason: '이동할 수 없다.' };
    if (!reachable(run).includes(nodeId)) return { ok: false, reason: '갈 수 없는 길이다.' };
    const party = this.activeParty();
    run.step++;
    run.current = nodeId;
    run.visited.push(nodeId);
    const fx = dungeonFx(dungeonOf(run.dungeon));
    run.torch = Math.max(0, run.torch - torchCost(party, run.relics, fx.torchMul));
    run.notice = undefined;
    const node = run.nodes.find((n) => n.id === nodeId)!;
    const rng = this.runRng('node');
    switch (node.kind) {
      case 'battle': case 'elite': case 'boss':
        run.battle = makeBattle(run, node.kind, party, rng);
        run.phase = 'battle';
        break;
      case 'event': {
        const ev = pickEvent(run, rng);
        run.usedEvents.push(ev.id);
        run.event = { id: ev.id };
        run.phase = 'event';
        break;
      }
      case 'rest': {
        const lines: string[] = [];
        for (const c of party) {
          const max = computeStats(c).hp;
          const pct = 0.35 + fx.restHeal + computeEffects(c).surviveBonus + (run.relics.includes('camp_kit') ? 0.25 : 0);
          const before = run.hp[c.id];
          run.hp[c.id] = Math.min(max, before + Math.round(max * pct));
          lines.push(`${fullName(c)} 체력 +${run.hp[c.id] - before}`);
        }
        run.torch = Math.min(100, run.torch + 15);
        lines.push('모닥불에서 횃불을 손질했다 (+15).');
        lines.push(...this.campfire(party, rng));
        run.notice = { title: '야영지', lines };
        break;
      }
      case 'treasure': {
        const gold = Math.round((40 + rng.int(0, 50) + node.layer * 10 + levelBase(dungeonOf(run.dungeon)) * 8) * this.partyGoldMul(party) * fx.goldMul);
        run.gold += gold;
        const lines = [`금화 ${gold}을(를) 발견했다.`];
        if (fx.curseOnTreasure && party.length && rng.chance(fx.curseOnTreasure)) {
          const who = rng.pick(party);
          const cur = rng.pick(CURSE_LIST.filter((t) => !who.curses.includes(t.id) && (!t.races || t.races.includes(who.race))));
          if (cur) { who.curses.push(cur.id); lines.push(`저주받은 땅의 기운이 ${fullName(who)}에게 스며든다… 「${cur.name}」`); }
        }
        if (rng.chance(0.55)) this.grantItem({ ilvl: itemLevel(run) }, rng, lines);
        if (rng.chance(0.3)) this.grantRelic(rng, lines);
        if (rng.chance(0.25)) { run.essence++; lines.push('잔해 속에서 빛나는 핵 조각을 찾았다!'); }
        else if (rng.chance(0.12) && party.length) {
          const who = rng.pick(party);
          const b = rng.pick(BLESSING_LIST.filter((t) => !who.blessings.includes(t.id)));
          if (b) { who.blessings.push(b.id); lines.push(`${fullName(who)}이(가) 고대 유물에서 「${b.name}」을(를) 얻었다.`); }
        }
        run.notice = { title: '보물', lines };
        break;
      }
      case 'shop': {
        const disc = Math.max(0, ...party.map((c) => computeEffects(c).shopDiscount));
        run.shop = makeShop(rng, disc, itemLevel(run));
        run.phase = 'shop';
        break;
      }
    }
    run.log.push(node.kind === 'boss' ? '보스의 방' : `${node.layer + 1}층 ${NODE_NAMES[node.kind]}`);
    this.save();
    return { ok: true };
  }

  partyGoldMul(party: Character[]): number {
    let m = 1;
    for (const c of party) m += computeEffects(c).goldMul - 1;
    if (this.s.run?.relics.includes('golden_scale')) m += 0.25;
    return Math.max(0.3, m);
  }

  /** 원정 전리품에 장비 추가 */
  grantItem(o: ItemGenOpts, rng: Rng, lines?: string[]): Item | null {
    const run = this.s.run;
    if (!run) return null;
    const it = generateItem(rng.seed32(), o);
    run.loot.push(it);
    lines?.push(`장비 「${it.name}」 획득`);
    return it;
  }

  /** 아직 없는 유물 하나 */
  grantRelic(rng: Rng, lines?: string[]): string | null {
    const run = this.s.run;
    if (!run) return null;
    const pool = RELIC_IDS.filter((r) => !run.relics.includes(r));
    if (!pool.length) return null;
    const id = rng.pick(pool);
    run.relics.push(id);
    lines?.push(`유물 「${RELICS[id].name}」 — ${RELICS[id].desc}`);
    return id;
  }

  // ------------------------------------------------------------ 장비
  equip(charId: string, itemId: string): { ok: boolean; reason?: string } {
    const ch = this.char(charId);
    const idx = this.s.stash.findIndex((i) => i.id === itemId);
    if (!ch || idx < 0) return { ok: false, reason: '장착할 수 없다.' };
    if (this.s.run?.party.includes(charId)) return { ok: false, reason: '원정 중인 동료다.' };
    const it = this.s.stash[idx];
    ch.gear ??= {};
    const prev = ch.gear[it.slot];
    this.s.stash.splice(idx, 1);
    if (prev) this.s.stash.push(prev);
    ch.gear[it.slot] = it;
    this.save();
    return { ok: true };
  }

  unequip(charId: string, slot: GearSlot): { ok: boolean; reason?: string } {
    const ch = this.char(charId);
    const it = ch?.gear?.[slot];
    if (!ch || !it) return { ok: false };
    if (this.s.run?.party.includes(charId)) return { ok: false, reason: '원정 중인 동료다.' };
    if (this.s.stash.length >= STASH_CAP) return { ok: false, reason: '창고가 가득 찼다.' };
    delete ch.gear![slot];
    this.s.stash.push(it);
    this.save();
    return { ok: true };
  }

  salvage(itemIds: string[]): number {
    let gold = 0;
    this.s.stash = this.s.stash.filter((it) => {
      if (!itemIds.includes(it.id)) return true;
      gold += this.salvageValue(it);
      return false;
    });
    this.s.gold += gold;
    this.save();
    return gold;
  }

  buy(itemId: string): { ok: boolean; reason?: string } {
    const run = this.s.run;
    const item = run?.shop?.find((i) => i.id === itemId);
    if (!run || !item || item.sold) return { ok: false, reason: '살 수 없다.' };
    if (run.gold < item.price) return { ok: false, reason: '이번 원정에서 모은 금화가 부족하다.' };
    run.gold -= item.price;
    item.sold = true;
    const party = this.activeParty();
    if (itemId === 'torch') run.torch = Math.min(100, run.torch + 30);
    if (itemId === 'bandage') for (const c of party) run.hp[c.id] = Math.min(computeStats(c).hp, run.hp[c.id] + Math.round(computeStats(c).hp * 0.35));
    if (itemId === 'holywater') { const c = party.find((p) => p.curses.length); if (c) c.curses.shift(); }
    if (itemId === 'essence') run.essence++;
    if (itemId === 'gear' && item.item) run.loot.push(item.item);
    this.save();
    return { ok: true };
  }

  leaveShop(): void {
    const run = this.s.run;
    if (!run) return;
    run.phase = 'map';
    run.shop = undefined;
    this.save();
  }

  dismissNotice(): void {
    if (this.s.run) { this.s.run.notice = undefined; this.save(); }
  }

  // ------------------------------------------------------------ 이벤트
  chooseEvent(optIdx: number): { ok: boolean; reason?: string } {
    const run = this.s.run;
    if (!run || run.phase !== 'event' || !run.event || run.event.resolved) return { ok: false };
    const ev = EVENTS.find((e) => e.id === run.event!.id)!;
    const opt = ev.options[optIdx];
    if (!opt) return { ok: false };
    const party = this.activeParty();
    let actor: Character | null = null;
    if (opt.req) {
      const m = condMatch(opt.req, party, run.gold);
      if (!m) return { ok: false, reason: `조건 부족: ${opt.reqText ?? ''}` };
      if (m !== true) actor = m;
    }
    const rng = this.runRng(`event_${optIdx}`);
    const outcome = rng.weighted(opt.outcomes, (o) => {
      let w = o.w;
      for (const b of o.bonus ?? []) if (condMatch(b.cond, party, run.gold)) w += b.add;
      return Math.max(0, w);
    });
    const randomOne = rng.pick(party);
    const who = (w: Who | undefined): Character[] => (w === 'all' ? party : w === 'actor' ? [actor ?? randomOne] : [randomOne]);
    const lines: string[] = [];
    let fight: 'battle' | 'elite' | undefined;
    for (const fx of outcome.fx) {
      const r = this.applyFx(fx, who, rng, lines);
      if (r) fight = r;
    }
    const name = actor ? fullName(actor) : randomOne ? fullName(randomOne) : '누군가';
    run.event.resolved = { text: outcome.text.replaceAll('{actor}', name), lines, fight };
    this.save();
    return { ok: true };
  }

  private applyFx(fx: Fx, who: (w: Who | undefined) => Character[], rng: Rng, lines: string[]): 'battle' | 'elite' | undefined {
    const run = this.s.run!;
    if ('gold' in fx) {
      const g = fx.gold > 0 ? Math.round(fx.gold * this.partyGoldMul(this.activeParty())) : fx.gold;
      run.gold = Math.max(0, run.gold + g);
      lines.push(`금화 ${g > 0 ? '+' : ''}${g}`);
    } else if ('torch' in fx) {
      run.torch = Math.max(0, Math.min(100, run.torch + fx.torch));
      lines.push(`횃불 ${fx.torch > 0 ? '+' : ''}${fx.torch}`);
    } else if ('essence' in fx) {
      run.essence += fx.essence;
      lines.push(`핵 조각 +${fx.essence}`);
    } else if ('heal' in fx) {
      for (const c of who(fx.who)) {
        const max = computeStats(c).hp;
        run.hp[c.id] = Math.min(max, run.hp[c.id] + Math.round(max * fx.heal));
        lines.push(`${fullName(c)} 회복`);
      }
    } else if ('hurt' in fx) {
      for (const c of who(fx.who)) {
        const max = computeStats(c).hp;
        run.hp[c.id] = Math.max(1, run.hp[c.id] - Math.round(max * fx.hurt));
        lines.push(`${fullName(c)} 피해`);
      }
    } else if ('addTrait' in fx) {
      for (const c of who(fx.who)) {
        let id = fx.addTrait;
        if (id === 'curse') id = rng.pick(CURSE_LIST.filter((t) => !c.curses.includes(t.id) && (!t.races || t.races.includes(c.race)))).id;
        else if (id === 'blessing') id = rng.pick(BLESSING_LIST.filter((t) => !c.blessings.includes(t.id) && (!t.notRaces || !t.notRaces.includes(c.race)))).id;
        const t = TRAITS[id];
        if (!t) continue;
        const list = t.kind === 'curse' ? c.curses : t.kind === 'blessing' ? c.blessings : c.traits;
        if (!list.includes(id)) list.push(id);
        lines.push(`${fullName(c)}: ${t.kind === 'curse' ? '저주' : t.kind === 'blessing' ? '가호' : '특성'} 「${t.name}」`);
      }
    } else if ('removeCurse' in fx) {
      for (const c of who(fx.who)) {
        const removed = c.curses.shift();
        if (removed) lines.push(`${fullName(c)}의 「${TRAITS[removed].name}」이(가) 사라졌다.`);
      }
    } else if ('rep' in fx) {
      this.addRep(fx.rep, fx.n);
      lines.push(`${FACTIONS[fx.rep].name} 호감도 ${fx.n > 0 ? '+' : ''}${fx.n}`);
    } else if ('exp' in fx) {
      for (const c of who(fx.who)) {
        const r = this.gainExp(c, fx.exp);
        if (r.gained) lines.push(`${fullName(c)} 경험치 +${r.gained}${r.levels ? ` (레벨 업!)` : ''}`);
      }
    } else if ('fight' in fx) {
      return fx.fight;
    } else if ('item' in fx) {
      this.grantItem({ ilvl: itemLevel(run), minRarity: Math.min(4, Math.max(1, fx.item)) as 1 }, rng, lines);
    } else if ('relic' in fx) {
      if (!this.grantRelic(rng, lines)) { run.gold += 60; lines.push('이미 가진 유물뿐이다. 금화 +60'); }
    } else if ('recruit' in fx) {
      const seed = rng.seed32();
      const ch = generateCharacter(seed, { star: rng.chance(0.2) ? 3 : rng.chance(0.5) ? 2 : 1 });
      run.recruits.push(ch);
      lines.push(`★${ch.star} ${fullName(ch)} 합류 예정`);
    }
    return undefined;
  }

  continueEvent(): void {
    const run = this.s.run;
    if (!run?.event?.resolved) return;
    const fight = run.event.resolved.fight;
    run.event = undefined;
    if (fight) {
      run.battle = makeBattle(run, fight, this.activeParty(), this.runRng('evfight'));
      run.phase = 'battle';
    } else {
      run.phase = 'map';
    }
    this.save();
  }

  // ------------------------------------------------------------ 탐사 게시판
  unlockedRisk(): number {
    return unlockedRisk(this.s.maxRisk);
  }

  boardRerollCost(): number {
    return 30 * this.unlockedRisk();
  }

  /** 금화를 내고 탐사 지도를 새로 그린다 (free: 개발자 모드) */
  rerollBoard(free = false): { ok: boolean; reason?: string } {
    if (this.s.run) return { ok: false, reason: '원정 중에는 다시 탐색할 수 없다.' };
    const cost = free ? 0 : this.boardRerollCost();
    if (this.s.gold < cost) return { ok: false, reason: '금화가 부족하다.' };
    this.s.gold -= cost;
    this.s.board = refillBoard([], this.unlockedRisk(), new Rng(freshSeed()));
    this.save();
    return { ok: true };
  }

  /** 원정이 끝날 때마다: 정복한 곳은 지도에서 지우고, 한두 곳이 새로 바뀐다 */
  private refreshBoardAfterRun(dungeon: string, cleared: boolean, seed: number): void {
    const rng = new Rng(mixSeed(seed, 'board'));
    const board = this.s.board.filter((id) => !(cleared && id === dungeon));
    const swaps = 1 + (rng.chance(0.4) ? 1 : 0);
    for (let i = 0; i < swaps && board.length > 1; i++) board.splice(rng.int(0, board.length - 1), 1);
    this.s.board = refillBoard(board, this.unlockedRisk(), rng);
  }

  // ------------------------------------------------------------ 개발자 모드 (?dev)
  devGrant(kind: 'gold' | 'essence' | 'facilities' | 'risk' | 'board'): string {
    switch (kind) {
      case 'gold': this.s.gold += 10000; break;
      case 'essence': this.s.essence += 50; break;
      case 'facilities':
        for (const id of Object.keys(FACILITIES) as FacilityId[]) this.s.facilities[id] = FACILITIES[id].levels.length;
        this.syncMemorial();
        break;
      case 'risk':
        this.s.maxRisk = MAX_RISK - 1;
        this.s.board = refillBoard([], this.unlockedRisk(), new Rng(freshSeed()));
        break;
      case 'board': return this.rerollBoard(true).reason ?? '탐사 지도를 새로 그렸다.';
    }
    this.save();
    return { gold: '금화 +10,000', essence: '핵 조각 +50', facilities: '모든 시설 최대 단계', risk: `위험도 ☠${MAX_RISK}까지 해금` }[kind];
  }

  // ------------------------------------------------------------ 거점 시설
  facilityLevel(id: FacilityId): number {
    return this.s.facilities[id] ?? 0;
  }

  restoration(): number {
    return restorationPct(this.s.facilities, this.s.maxRisk, MAX_RISK, this.s.lord.level);
  }

  buildFacility(id: FacilityId): { ok: boolean; reason?: string } {
    const lv = this.facilityLevel(id);
    const next = FACILITIES[id].levels[lv];
    if (!next) return { ok: false, reason: '이미 최고 단계다.' };
    if (this.s.gold < next.gold) return { ok: false, reason: '금화가 부족하다.' };
    if (this.s.essence < next.shards) return { ok: false, reason: '핵 조각이 부족하다.' };
    this.s.gold -= next.gold;
    this.s.essence -= next.shards;
    this.s.facilities[id] = lv + 1;
    this.news(lv === 0 ? `${FACILITIES[id].name}이(가) 다시 문을 열었다.` : `${FACILITIES[id].name}을(를) ${lv + 1}단계로 증축했다.`);
    this.save();
    return { ok: true };
  }

  salvageValue(it: Item): number {
    return Math.round(itemValue(it) * (1 + SALVAGE_BONUS[this.facilityLevel('forge')]));
  }

  /** 창고와 모든 동료의 장비에서 찾기 */
  findItem(itemId: string): { item: Item; owner?: Character } | null {
    const it = this.s.stash.find((i) => i.id === itemId);
    if (it) return { item: it };
    for (const c of [this.s.lordChar, ...this.s.roster]) {
      for (const g of Object.values(c.gear ?? {})) if (g?.id === itemId) return { item: g, owner: c };
    }
    return null;
  }

  enhanceItem(itemId: string, roll = Math.random()): { ok: boolean; reason?: string; success?: boolean; slipped?: boolean; plus?: number } {
    if (this.s.run) return { ok: false, reason: '원정 중에는 대장간을 쓸 수 없다.' };
    const f = this.findItem(itemId);
    if (!f) return { ok: false, reason: '장비가 없다.' };
    const it = f.item;
    const p = it.plus ?? 0;
    if (p >= MAX_PLUS_BY_LEVEL[this.facilityLevel('forge')]) return { ok: false, reason: '대장간 단계가 부족하다.' };
    if (p >= 10) return { ok: false, reason: '더 이상 강화할 수 없다.' };
    const cost = enhanceCost(it);
    if (this.s.gold < cost) return { ok: false, reason: '금화가 부족하다.' };
    this.s.gold -= cost;
    const success = roll < ENHANCE_CHANCE[p];
    let slipped = false;
    if (success) it.plus = p + 1;
    else if (p >= SLIP_FROM) { it.plus = p - 1; slipped = true; }
    it.name = displayName(it);
    this.save();
    return { ok: true, success, slipped, plus: it.plus ?? 0 };
  }

  rerollItem(itemId: string): { ok: boolean; reason?: string } {
    if (this.s.run) return { ok: false, reason: '원정 중에는 대장간을 쓸 수 없다.' };
    if (this.facilityLevel('forge') < 2) return { ok: false, reason: '대장간 2단계가 필요하다.' };
    const f = this.findItem(itemId);
    if (!f) return { ok: false, reason: '장비가 없다.' };
    if (f.item.rarity === 1 || f.item.rarity === 4) return { ok: false, reason: '고급·희귀 장비만 재련할 수 있다.' };
    const cost = rerollCost(f.item);
    if (this.s.gold < cost) return { ok: false, reason: '금화가 부족하다.' };
    this.s.gold -= cost;
    const next = rerollAffixes(f.item, freshSeed());
    Object.assign(f.item, { affixes: next.affixes, name: next.name });
    this.save();
    return { ok: true };
  }

  purgeCurse(charId: string, curseId: string): { ok: boolean; reason?: string } {
    if (this.facilityLevel('infirmary') < 1) return { ok: false, reason: '치유소가 없다.' };
    const c = this.char(charId);
    if (!c || !c.curses.includes(curseId)) return { ok: false, reason: '그런 저주는 없다.' };
    const cost = purgeCost(c);
    if (this.s.gold < cost) return { ok: false, reason: '금화가 부족하다.' };
    this.s.gold -= cost;
    c.curses = c.curses.filter((x) => x !== curseId);
    this.save();
    return { ok: true };
  }

  cureTrait(charId: string, traitId: string): { ok: boolean; reason?: string } {
    if (this.facilityLevel('infirmary') < 2) return { ok: false, reason: '치유소 2단계가 필요하다.' };
    const c = this.char(charId);
    if (!c || !c.traits.includes(traitId) || TRAITS[traitId]?.polarity !== -1) return { ok: false, reason: '치료할 수 있는 특성이 아니다.' };
    const cost = cureCost(c);
    if (this.s.gold < cost.gold || this.s.essence < cost.shards) return { ok: false, reason: '비용이 부족하다.' };
    this.s.gold -= cost.gold;
    this.s.essence -= cost.shards;
    c.traits = c.traits.filter((x) => x !== traitId);
    this.save();
    return { ok: true };
  }

  shortenDormancy(charId: string): { ok: boolean; reason?: string } {
    if (this.facilityLevel('infirmary') < 3) return { ok: false, reason: '치유소 3단계가 필요하다.' };
    const c = this.char(charId);
    if (!c || c.dormant <= 0) return { ok: false, reason: '휴면 중이 아니다.' };
    if (this.s.gold < DORMANCY_COST.gold || this.s.essence < DORMANCY_COST.shards) return { ok: false, reason: '비용이 부족하다.' };
    this.s.gold -= DORMANCY_COST.gold;
    this.s.essence -= DORMANCY_COST.shards;
    c.dormant--;
    this.save();
    return { ok: true };
  }

  memorialSlots(): number {
    return MEMORIAL_SLOTS[this.facilityLevel('memorial')];
  }

  enshrine(graveCharId: string): { ok: boolean; reason?: string } {
    const g = this.s.graveyard.find((x) => x.char.id === graveCharId);
    if (!g) return { ok: false, reason: '묘지에 없다.' };
    if (this.s.memorial.enshrined.includes(graveCharId)) return { ok: false, reason: '이미 봉안되었다.' };
    if (!isMeritorious(g.char)) return { ok: false, reason: `공적이 부족하다. (Lv.${12} 이상, 또는 보스 토벌 1회·정예 토벌 3회)` };
    if (this.s.memorial.enshrined.length >= this.memorialSlots()) return { ok: false, reason: '추모비에 빈자리가 없다.' };
    this.s.memorial.enshrined.push(graveCharId);
    this.syncMemorial();
    this.news(`${fullName(g.char)}의 이름이 추모비에 새겨졌다.`);
    this.save();
    return { ok: true };
  }

  unenshrine(graveCharId: string): void {
    this.s.memorial.enshrined = this.s.memorial.enshrined.filter((x) => x !== graveCharId);
    this.syncMemorial();
    this.save();
  }

  /** 소생 의식 조건 (모두 만족해야 한다) */
  resurrectionCheck(graveCharId: string, sacrificeId?: string): { ok: boolean; reasons: string[]; chance: number } {
    const reasons: string[] = [];
    const g = this.s.graveyard.find((x) => x.char.id === graveCharId);
    const attempts = this.s.memorial.attempts[graveCharId] ?? 0;
    if (!g) return { ok: false, reasons: ['묘지에 없다.'], chance: 0 };
    if (this.facilityLevel('memorial') < 3) reasons.push('추모비 3단계가 필요하다.');
    if (!this.s.memorial.enshrined.includes(graveCharId)) reasons.push('추모비에 봉안된 영웅만 부를 수 있다.');
    if (meritOf(g.char) < REZ.merit) reasons.push(`공적 ${meritOf(g.char)}/${REZ.merit} — 더 큰 업적을 남긴 자만 돌아올 수 있다.`);
    if (!RACES[g.char.race].canBind) reasons.push(`${RACES[g.char.race].name}은(는) 세계핵이 받아들이지 않는다.`);
    if (this.s.gold < REZ.gold) reasons.push(`금화 ${REZ.gold} 필요`);
    if (this.s.essence < REZ.shards) reasons.push(`핵 조각 ${REZ.shards} 필요`);
    const sac = sacrificeId ? this.char(sacrificeId) : undefined;
    if (!sac) reasons.push('살아 있는 동료 한 명을 제물로 바쳐야 한다.');
    else {
      if (sac.isLord) reasons.push('지휘관은 제물이 될 수 없다.');
      if (sac.star < g.char.star) reasons.push(`제물은 ★${g.char.star} 이상이어야 한다.`);
      if (this.s.run?.party.includes(sac.id)) reasons.push('원정 중인 동료는 바칠 수 없다.');
    }
    if (this.s.run) reasons.push('원정 중에는 의식을 치를 수 없다.');
    return { ok: reasons.length === 0, reasons, chance: rezChance(attempts) };
  }

  /** 소생 의식: 실패해도 비용과 제물은 돌아오지 않는다. 성공하면 세계핵에 결속된 채로 돌아온다. */
  resurrect(graveCharId: string, sacrificeId: string): { ok: boolean; reasons?: string[]; success?: boolean; line?: string } {
    const chk = this.resurrectionCheck(graveCharId, sacrificeId);
    if (!chk.ok) return { ok: false, reasons: chk.reasons };
    const g = this.s.graveyard.find((x) => x.char.id === graveCharId)!;
    const sac = this.char(sacrificeId)!;
    const attempts = this.s.memorial.attempts[graveCharId] ?? 0;
    this.s.gold -= REZ.gold;
    this.s.essence -= REZ.shards;
    this.s.memorial.attempts[graveCharId] = attempts + 1;
    this.bury(sac, '추모비의 제물', '거점 추모비');
    const success = new Rng(mixSeed(g.char.seed, `rez_${attempts}`)).next() < chk.chance;
    let line: string;
    if (success) {
      this.s.graveyard = this.s.graveyard.filter((x) => x !== g);
      this.s.memorial.enshrined = this.s.memorial.enshrined.filter((x) => x !== graveCharId);
      const ch = g.char;
      ch.dormant = 0;
      ch.cheatDeathUsed = false;
      ch.resurrected = (ch.resurrected ?? 0) + 1;
      if (!ch.vampire) applyBind(ch);
      this.s.roster.push(ch);
      this.s.stats.turned++;
      line = `${fullName(ch)}이(가) 세계핵의 빛 속에서 다시 눈을 떴다. ${sac.given}의 이름이 대신 묘비에 새겨졌다.`;
    } else {
      line = `의식은 실패했다. ${fullName(g.char)}은(는) 돌아오지 않았고, ${sac.given}만이 묘지로 갔다.`;
    }
    this.news(line);
    this.syncMemorial();
    this.save();
    return { ok: true, success, line };
  }

  // ------------------------------------------------------------ 관계
  bondOf(a: string, b: string): Bond {
    const k = pairKey(a, b);
    return (this.s.bonds[k] ??= { delta: 0, battles: 0, talks: 0, notes: [] });
  }

  /** 현재 관계 점수 (기본 상성 + 쌓인 경험) */
  bondScoreOf(a: Character, b: Character): number {
    return bondScore(a, b, this.s.bonds[pairKey(a.id, b.id)]);
  }

  adjustBond(a: Character, b: Character, delta: number, note?: string): { before: number; after: number } {
    const bond = this.bondOf(a.id, b.id);
    const before = bondScore(a, b, bond);
    bond.delta = clampBond(bond.delta + delta);
    if (note) pushNote(bond, note);
    return { before, after: bondScore(a, b, bond) };
  }

  /** 전투에 넘길 관계표 */
  partyBonds(chars: Character[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (let i = 0; i < chars.length; i++) for (let j = i + 1; j < chars.length; j++) out[pairKey(chars[i].id, chars[j].id)] = this.bondScoreOf(chars[i], chars[j]);
    return out;
  }

  /** 사기 = 진영 상성 + 동료 관계 (-3 ~ +3) */
  partyMorale(chars: Character[]): number {
    const syn = partySynergy(chars).morale;
    return Math.max(-3, Math.min(3, syn + bondMorale(Object.values(this.partyBonds(chars)))));
  }

  /** 한 동료가 다른 동료들과 맺은 관계 (점수 절댓값 순) */
  relationsOf(ch: Character): { other: Character; score: number; reasons: string[]; bond?: Bond }[] {
    const others = [this.s.lordChar, ...this.s.roster].filter((o) => o.id !== ch.id);
    return others
      .map((o) => ({ other: o, score: this.bondScoreOf(ch, o), reasons: baseBond(ch, o).reasons, bond: this.s.bonds[pairKey(ch.id, o.id)] }))
      .sort((x, y) => Math.abs(y.score) - Math.abs(x.score));
  }

  /** 승리 후: 함께 싸운 동료들은 가까워진다. 붙어 싸웠다면 더. */
  private growBonds(party: Character[], res: BattleResult, summary: RewardSummary): void {
    const adj = new Set((res.adjacent ?? []).map(([a, b]) => pairKey(a, b)));
    for (let i = 0; i < party.length; i++) {
      for (let j = i + 1; j < party.length; j++) {
        const [a, b] = [party[i], party[j]];
        const bond = this.bondOf(a.id, b.id);
        bond.battles++;
        const near = adj.has(pairKey(a.id, b.id));
        const tierBefore = tierOf(bondScore(a, b, bond));
        const gain = (tierBefore === 'rival' || tierBefore === 'nemesis' ? 1 : 2) + (near ? 2 : 0);
        const r = this.adjustBond(a, b, gain);
        const tierAfter = tierOf(r.after);
        if (tierAfter !== tierBefore) summary.lines.push(`${a.given}와(과) ${b.given}의 관계가 「${TIER_NAMES[tierAfter]}」(으)로 바뀌었다.`);
      }
    }
  }

  /** 야영지 모닥불: 한두 쌍이 이야기를 나눈다 */
  private campfire(party: Character[], rng: Rng): string[] {
    if (party.length < 2) return [];
    const pairs: [Character, Character][] = [];
    for (let i = 0; i < party.length; i++) for (let j = i + 1; j < party.length; j++) pairs.push([party[i], party[j]]);
    const n = Math.min(pairs.length, rng.chance(0.4) ? 2 : 1);
    const out: string[] = ['— 모닥불 곁에서 —'];
    for (let k = 0; k < n; k++) {
      const [a, b] = rng.weighted(pairs, ([x, y]) => 1 + 3 / (1 + (this.s.bonds[pairKey(x.id, y.id)]?.talks ?? 0)));
      pairs.splice(pairs.findIndex((p) => p[0] === a && p[1] === b), 1);
      const talk = campTalk(rng, a, b, this.bondScoreOf(a, b));
      const bond = this.bondOf(a.id, b.id);
      bond.talks++;
      const r = this.adjustBond(a, b, talk.delta, talk.lines[talk.lines.length - 1].slice(0, 40));
      out.push(...talk.lines);
      const tier = tierOf(r.after);
      const change = tierOf(r.before) !== tier ? ` → 「${TIER_NAMES[tier]}」` : '';
      out.push(`(${a.given}·${b.given} 관계 ${talk.delta >= 0 ? '+' : ''}${talk.delta}${change})`);
    }
    return out;
  }

  // ------------------------------------------------------------ 전투 결과
  battleFinished(res: BattleResult): RewardSummary {
    const run = this.s.run!;
    const spec = run.battle as BattleSpec;
    const d = dungeonOf(run.dungeon);
    const dfx = dungeonFx(d);
    const node = run.nodes.find((n) => n.id === run.current);
    const where = `${d.name} ${node?.kind === 'boss' ? '보스의 방' : `${node ? node.layer + 1 : '?'}층`}`;
    const summary: RewardSummary = { gold: 0, essence: 0, exp: [], lines: [] };

    for (const id of res.cheatDeathUsed) { const c = this.char(id); if (c) c.cheatDeathUsed = true; }
    for (const [id, hp] of Object.entries(res.hp)) run.hp[id] = hp;
    for (const [id, k] of Object.entries(res.kills)) { const c = this.char(id); if (c) c.kills += k; }
    for (const dth of res.deaths) {
      const line = this.battleDeath(dth.id, dth.by, where);
      if (line) summary.lines.push(line);
    }
    for (const f of run.fallen) {
      if (res.deaths.some((d) => d.id === f.id)) continue;
      if (!summary.lines.some((l) => l.startsWith(f.name))) {
        summary.lines.push(f.vampire ? `${f.name}의 몸이 빛 조각으로 흩어졌다… 세계핵에서 다시 형체를 갖출 것이다.` : `${f.name}이(가) 영원히 잠들었다.`);
      }
    }

    if (!res.victory) {
      run.outcome = 'wipe';
      run.phase = 'result';
      run.battle = undefined;
      this.save();
      return summary;
    }

    const party = this.activeParty();
    this.growBonds(party, res, summary);
    let gold = 0;
    let exp = 0;
    for (const e of spec.enemies) {
      const def = ENEMIES[e.def];
      gold += def.gold * 2 * (1 + 0.15 * (e.level - 1));
      exp += def.exp * (1 + 0.1 * (e.level - 1));
    }
    gold = Math.round(gold * spec.goldBonus * this.partyGoldMul(party));
    exp *= dfx.expMul;
    run.gold += gold;
    summary.gold = gold;
    if (spec.elite) { const n = 1 + dfx.eliteEssence; run.essence += n; summary.essence += n; }
    if (spec.boss) { const n = 2 + dfx.bossEssence; run.essence += n; summary.essence += n; }
    if (spec.boss || spec.elite) {
      for (const c of party) {
        c.deeds ??= { boss: 0, elite: 0 };
        if (spec.boss) c.deeds.boss++;
        else c.deeds.elite++;
      }
    }
    if (res.bonusEssence) { run.essence += res.bonusEssence; summary.essence += res.bonusEssence; }
    if (res.bonusGold) { run.gold += res.bonusGold; summary.gold += res.bonusGold; summary.lines.push(`전투 중 챙긴 금화 +${res.bonusGold}`); }
    // 전리품
    const drop = this.runRng('drop');
    const lootLines: string[] = [];
    const items: Item[] = [];
    const relics: string[] = [];
    const ilvl = itemLevel(run);
    if (spec.boss) {
      const it = this.grantItem({ ilvl: ilvl + 1, minRarity: 3, luck: 0.3, bossId: spec.enemies[0]?.def }, drop, lootLines);
      if (it) items.push(it);
    } else if (spec.elite) {
      const it = this.grantItem({ ilvl, minRarity: 2 }, drop, lootLines);
      if (it) items.push(it);
      if (drop.chance(0.4)) { const r = this.grantRelic(drop, lootLines); if (r) relics.push(r); }
    } else if (drop.chance(0.15)) {
      const it = this.grantItem({ ilvl }, drop, lootLines);
      if (it) items.push(it);
    }
    summary.items = items;
    summary.relics = relics;
    for (const c of party) {
      const r = this.gainExp(c, exp);
      summary.exp.push({ id: c.id, name: fullName(c), gained: r.gained, levels: r.levels });
    }
    // 지휘관의 기술 기록 (함께 싸운 동료에게서)
    if (party.some((c) => c.isLord) && drop.chance(LORD_LEARN_CHANCE)) {
      const pool = party.filter((c) => !c.isLord).flatMap((c) => c.skills).filter((id) => !this.s.lord.learned.includes(id));
      if (pool.length) {
        const id = drop.pick(pool);
        this.lordLearn(id);
        summary.lines.push(`지휘관이 전투 중 「${SKILLS[id].name}」을(를) 핵에 기록했다!`);
      }
    }
    run.battle = undefined;
    if (spec.boss) {
      run.outcome = 'victory';
      run.phase = 'result';
    } else {
      run.phase = 'map';
    }
    this.save();
    return summary;
  }

  /** 전투 중 사망을 즉시 기록 (새로고침으로 되돌릴 수 없게) */
  battleDeath(id: string, by: string, where?: string): string | null {
    const run = this.s.run;
    if (!run || run.fallen.some((f) => f.id === id)) return null;
    const c = this.char(id);
    if (!c) return null;
    const d = dungeonOf(run.dungeon);
    const node = run.nodes.find((n) => n.id === run.current);
    const at = where ?? `${d.name} ${node?.kind === 'boss' ? '보스의 방' : `${node ? node.layer + 1 : '?'}층`}`;
    run.hp[c.id] = 0;
    let line: string;
    if (c.isLord) {
      c.dormant = 2;
      run.fallen.push({ id: c.id, vampire: true, name: fullName(c) });
      line = '지휘관이 쓰러졌다… 세계핵이 그를 거점으로 끌어당긴다. 다음 원정은 쉬어야 한다.';
    } else if (c.vampire) {
      c.dormant = DORMANT_RUNS + 1;
      run.fallen.push({ id: c.id, vampire: true, name: fullName(c) });
      line = `${fullName(c)}의 몸이 빛 조각으로 흩어졌다… 세계핵에서 다시 형체를 갖출 것이다.`;
    } else {
      run.fallen.push({ id: c.id, vampire: false, name: fullName(c) });
      for (const o of this.partyChars()) {
        if (o.id === c.id) continue;
        const b = this.bondOf(o.id, c.id);
        if (tierOf(bondScore(o, c, b)) === 'comrade' || tierOf(bondScore(o, c, b)) === 'sworn') pushNote(b, `${at}에서 ${c.given}의 마지막을 지켜보았다`);
      }
      this.bury(c, `${by}에게 쓰러짐`, at);
      line = `${fullName(c)}이(가) 영원히 잠들었다. 묘지에 이름이 새겨진다.`;
    }
    this.save();
    return line;
  }

  /** 전투 도주 (보스전 제외): 보상 없이 지도로, 생존자는 체력 15% 손실 */
  fleeBattle(hp: Record<string, number>): { ok: boolean; reason?: string } {
    const run = this.s.run;
    if (!run || run.phase !== 'battle' || !run.battle) return { ok: false };
    if (run.battle.boss) return { ok: false, reason: '보스에게서는 도망칠 수 없다.' };
    for (const [id, v] of Object.entries(hp)) {
      const c = this.char(id);
      if (!c) continue;
      run.hp[id] = Math.max(1, v - Math.round(computeStats(c).hp * 0.15));
    }
    run.battle = undefined;
    run.phase = 'map';
    run.log.push('전투에서 도주했다');
    this.save();
    return { ok: true };
  }

  bury(c: Character, cause: string, where: string): void {
    this.s.roster = this.s.roster.filter((x) => x.id !== c.id);
    this.s.graveyard.unshift({
      char: JSON.parse(JSON.stringify(c)),
      diedAt: Date.now(), cause, where,
      epitaph: makeEpitaph(c, mixSeed(c.seed, 'epitaph')),
      runNo: this.s.runNo,
    });
    this.s.stats.deaths++;
    this.news(`${fullName(c)}이(가) ${where}에서 ${cause}.`);
  }

  retreat(): void {
    const run = this.s.run;
    if (!run || run.phase === 'battle' || run.phase === 'result') return;
    run.outcome = 'retreat';
    run.phase = 'result';
    this.save();
  }

  /** 원정 종료 정산 */
  finishRun(): { lines: string[] } {
    const run = this.s.run;
    if (!run) return { lines: [] };
    const lines: string[] = [];
    const d = dungeonOf(run.dungeon);
    const keep = run.outcome === 'victory' ? 1 : run.outcome === 'retreat' ? 0.5 : 0;
    const gold = Math.round(run.gold * keep);
    const essence = run.outcome === 'wipe' ? 0 : run.essence;
    this.s.gold += gold;
    this.s.essence += essence;
    if (gold) lines.push(`금화 +${gold}`);
    if (essence) lines.push(`핵 조각 +${essence}`);
    if (run.outcome === 'victory') {
      if (!this.s.cleared.includes(run.dungeon)) {
        this.s.cleared.push(run.dungeon);
        lines.push(`「${d.name}」 최초 정복!`);
      }
      if (d.risk > this.s.maxRisk) {
        this.s.maxRisk = d.risk;
        if (d.risk < MAX_RISK) lines.push(`위험도 ${'☠'.repeat(d.risk + 1)} 던전이 탐사 지도에 나타나기 시작한다.`);
      }
      this.s.stats.victories++;
      this.addRep('kingdom', 5);
      this.news(`원정대가 「${d.name}」의 주인을 쓰러뜨렸다.`);
    } else if (run.outcome === 'wipe') {
      this.news(`「${d.name}」 원정대가 전멸했다.`);
    } else {
      this.news(`원정대가 「${d.name}」에서 퇴각했다.`);
    }
    if (run.outcome !== 'wipe') {
      let salvaged = 0;
      for (const it of run.loot) {
        if (this.s.stash.length < STASH_CAP) this.s.stash.push(it);
        else salvaged += itemValue(it);
      }
      if (run.loot.length) lines.push(`장비 ${run.loot.length}개를 창고로`);
      if (salvaged) { this.s.gold += salvaged; lines.push(`창고가 가득 차 일부를 분해 (금화 +${salvaged})`); }
    } else if (run.loot.length) {
      lines.push(`장비 ${run.loot.length}개를 잃었다`);
    }
    if (run.outcome !== 'wipe') {
      for (const r of run.recruits) {
        if (this.s.roster.length < ROSTER_CAP) { this.s.roster.push(r); lines.push(`${fullName(r)}이(가) 거점에 합류했다.`); }
      }
    }
    const fallenNow = new Set(run.fallen.map((f) => f.id));
    for (const c of [...this.s.roster, this.s.lordChar]) {
      if (run.party.includes(c.id)) c.runs++;
      if (c.dormant > 0 && !fallenNow.has(c.id)) c.dormant--;
      else if (c.dormant > 0 && fallenNow.has(c.id)) c.dormant = c.isLord ? 1 : DORMANT_RUNS;
    }
    this.refreshBoardAfterRun(run.dungeon, run.outcome === 'victory', run.seed);
    this.s.run = null;
    this.save();
    return { lines };
  }

  /** 테스트/디버그: 전투 결과 없이 강제로 다음 단계 */
  battleSpec(): BattleSpec | undefined {
    return this.s.run?.battle;
  }
}

export const store = new Store();
