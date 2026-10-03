import { CLASSES } from './data/classes';
import { DUNGEONS } from './data/dungeons';
import { ENEMIES } from './data/enemies';
import { EVENTS, type Fx, type Who } from './data/events';
import { FACTION_IDS, FACTIONS } from './data/factions';
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
import { computeEffects, computeStats, expToNext, fullName, levelCap } from './stats';
import type { Character, FactionId, GearSlot, Grave, Item, Star } from './types';
import { applyTurn, canTurn, DORMANT_RUNS, lordExpFromTurn, lordExpToNext, turnCost, vampireSlots } from './vampire';

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
}

export interface BattleResult {
  victory: boolean;
  hp: Record<string, number>;
  deaths: { id: string; by: string }[];
  kills: Record<string, number>;
  cheatDeathUsed: string[];
  bonusEssence?: number;
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

/** 혈주(플레이어) 유닛 */
export function makeLord(seed: number): Character {
  const rng = new Rng(mixSeed(seed, 'lord'));
  return {
    id: LORD_ID, seed: rng.seed32(), given: '혈주', surname: '', gender: rng.pick(['m', 'f'] as const),
    race: 'dhampir', cls: 'bloodlord', star: 3, level: 1, exp: 0,
    traits: [], curses: [], blessings: [], skills: ['lord_fang'], roll: {},
    vampire: false, dormant: 0, kills: 0, runs: 0, createdAt: Date.now(), isLord: true,
  };
}

export const LORD_START_SKILLS = ['quick_slash', 'shadow_bolt'];

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
    news: [{ t: Date.now(), text: '혈주가 오랜 잠에서 깨어났다. 폐허가 된 저택에 네 명의 떠돌이가 찾아왔다.' }],
    stats: { deaths: 0, turned: 0, victories: 0, runs: 0, recruited: 0 },
    stash: [],
  };
}

/** 예전 저장 데이터에 새 필드를 채운다 */
export function migrate(d: SaveData): SaveData {
  d.stash ??= [];
  d.lord.learned ??= [...LORD_START_SKILLS];
  d.lord.equipped ??= [...LORD_START_SKILLS];
  d.lordChar ??= makeLord(d.createdAt ?? 1);
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

  /** 혈주 유닛 (레벨·장착 기술을 동기화해서 반환) */
  lord(): Character {
    const c = this.s.lordChar;
    c.level = this.s.lord.level;
    c.skills = ['lord_fang', ...this.s.lord.equipped.filter((id) => this.s.lord.learned.includes(id) && SKILLS[id])].slice(0, LORD_SLOTS + 1);
    return c;
  }

  /** 혈주가 기술을 배운다. 새로 배웠으면 true */
  lordLearn(skillId: string): boolean {
    const L = this.s.lord;
    if (!SKILLS[skillId] || L.learned.includes(skillId) || skillId === 'lord_fang') return false;
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
      msgs.push(`혈주 레벨 ${this.s.lord.level}! 뱀파이어 한도 ${vampireSlots(this.s.lord.level)}명.`);
    }
    return msgs;
  }

  vampireCount(): number {
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
    if (this.s.roster.length + n > ROSTER_CAP) return { ok: false, reason: `저택이 꽉 찼다 (최대 ${ROSTER_CAP}명).` };
    this.s.gold -= cost;
    const chars = pull(n, this.s.pity);
    this.s.roster.push(...chars);
    this.s.stats.recruited += n;
    const best = chars.reduce((a, b) => (b.star > a.star ? b : a));
    if (best.star >= 4) this.news(`★${best.star} ${fullName(best)}이(가) 저택의 문을 두드렸다.`);
    this.save();
    return { ok: true, chars };
  }

  release(id: string): { ok: boolean; reason?: string; gold?: number } {
    if (this.s.run?.party.includes(id)) return { ok: false, reason: '원정 중인 동료다.' };
    const ch = this.char(id);
    if (!ch) return { ok: false, reason: '없는 동료다.' };
    if (ch.isLord) return { ok: false, reason: '혈주는 저택을 떠날 수 없다.' };
    const gold = 10 * ch.star;
    this.s.roster = this.s.roster.filter((c) => c.id !== id);
    this.s.gold += gold;
    this.news(`${fullName(ch)}이(가) 저택을 떠났다.`);
    this.save();
    return { ok: true, gold };
  }

  // ------------------------------------------------------------ 흡혈
  turnCheck(id: string): { ok: boolean; reason?: string; cost: number } {
    const ch = this.char(id);
    if (!ch) return { ok: false, reason: '없는 동료다.', cost: 0 };
    if (this.s.run?.party.includes(id)) return { ok: false, reason: '원정 중인 동료다.', cost: 0 };
    const r = canTurn(ch, { essence: this.s.essence, vampires: this.vampireCount(), lordLevel: this.s.lord.level });
    return { ...r, cost: turnCost(ch) };
  }

  turn(id: string): { ok: boolean; msgs: string[] } {
    const chk = this.turnCheck(id);
    const ch = this.char(id);
    if (!chk.ok || !ch) return { ok: false, msgs: [chk.reason ?? '불가'] };
    this.s.essence -= chk.cost;
    const msgs = applyTurn(ch);
    const exp = lordExpFromTurn(ch);
    msgs.push(`혈주가 피를 마시고 경험치 ${exp}를 얻었다.`);
    msgs.push(...this.lordGainExp(exp));
    const learned = ch.skills.filter((id) => this.lordLearn(id));
    if (learned.length) msgs.push(`피와 함께 기술을 흡수했다: ${learned.map((id) => SKILLS[id].name).join(', ')}`);
    this.addRep('nightcourt', 3);
    this.addRep('radiance', -3);
    this.s.stats.turned++;
    this.news(`${fullName(ch)}이(가) 뱀파이어가 되었다.`);
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
    return Object.values(DUNGEONS).filter((d) => !d.unlockAfter || this.s.cleared.includes(d.unlockAfter)).map((d) => d.id);
  }

  canJoinParty(ch: Character): { ok: boolean; reason?: string } {
    if (ch.dormant > 0) return { ok: false, reason: `관 속에서 휴면 중 (${ch.dormant}회 남음)` };
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
      nodes: generateMap(DUNGEONS[dungeon], seed),
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
    run.torch = Math.max(0, run.torch - torchCost(party, run.relics));
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
          const pct = 0.35 + computeEffects(c).surviveBonus + (run.relics.includes('camp_kit') ? 0.25 : 0);
          const before = run.hp[c.id];
          run.hp[c.id] = Math.min(max, before + Math.round(max * pct));
          lines.push(`${fullName(c)} 체력 +${run.hp[c.id] - before}`);
        }
        run.torch = Math.min(100, run.torch + 15);
        lines.push('모닥불에서 횃불을 손질했다 (+15).');
        run.notice = { title: '야영지', lines };
        break;
      }
      case 'treasure': {
        const gold = Math.round((40 + rng.int(0, 50) + node.layer * 10) * this.partyGoldMul(party));
        run.gold += gold;
        const lines = [`금화 ${gold}을(를) 발견했다.`];
        if (rng.chance(0.55)) this.grantItem({ ilvl: itemLevel(run) }, rng, lines);
        if (rng.chance(0.3)) this.grantRelic(rng, lines);
        if (rng.chance(0.25)) { run.essence++; lines.push('피의 정수가 담긴 유리병을 찾았다!'); }
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
      gold += itemValue(it);
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
      lines.push(`피의 정수 +${fx.essence}`);
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

  // ------------------------------------------------------------ 전투 결과
  battleFinished(res: BattleResult): RewardSummary {
    const run = this.s.run!;
    const spec = run.battle as BattleSpec;
    const d = DUNGEONS[run.dungeon];
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
        summary.lines.push(f.vampire ? `${f.name}은(는) 재가 되어 흩어졌다… 관 속에서 다시 깨어날 것이다.` : `${f.name}이(가) 영원히 잠들었다.`);
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
    let gold = 0;
    let exp = 0;
    for (const e of spec.enemies) {
      const def = ENEMIES[e.def];
      gold += def.gold * 2 * (1 + 0.15 * (e.level - 1));
      exp += def.exp * (1 + 0.1 * (e.level - 1));
    }
    gold = Math.round(gold * spec.goldBonus * this.partyGoldMul(party));
    run.gold += gold;
    summary.gold = gold;
    if (spec.elite) { run.essence += 1; summary.essence += 1; }
    if (spec.boss) { run.essence += 2; summary.essence += 2; }
    if (res.bonusEssence) { run.essence += res.bonusEssence; summary.essence += res.bonusEssence; }
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
    // 혈주의 기술 흡수 (함께 싸운 동료에게서)
    if (party.some((c) => c.isLord) && drop.chance(LORD_LEARN_CHANCE)) {
      const pool = party.filter((c) => !c.isLord).flatMap((c) => c.skills).filter((id) => !this.s.lord.learned.includes(id));
      if (pool.length) {
        const id = drop.pick(pool);
        this.lordLearn(id);
        summary.lines.push(`혈주가 전투 중 「${SKILLS[id].name}」을(를) 흡수했다!`);
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
    const d = DUNGEONS[run.dungeon];
    const node = run.nodes.find((n) => n.id === run.current);
    const at = where ?? `${d.name} ${node?.kind === 'boss' ? '보스의 방' : `${node ? node.layer + 1 : '?'}층`}`;
    run.hp[c.id] = 0;
    let line: string;
    if (c.isLord) {
      c.dormant = 2;
      run.fallen.push({ id: c.id, vampire: true, name: fullName(c) });
      line = '혈주가 붉은 안개가 되어 흩어졌다… 저택에서 다시 형체를 갖출 것이다.';
    } else if (c.vampire) {
      c.dormant = DORMANT_RUNS + 1;
      run.fallen.push({ id: c.id, vampire: true, name: fullName(c) });
      line = `${fullName(c)}은(는) 재가 되어 흩어졌다… 관 속에서 다시 깨어날 것이다.`;
    } else {
      run.fallen.push({ id: c.id, vampire: false, name: fullName(c) });
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
    const d = DUNGEONS[run.dungeon];
    const keep = run.outcome === 'victory' ? 1 : run.outcome === 'retreat' ? 0.5 : 0;
    const gold = Math.round(run.gold * keep);
    const essence = run.outcome === 'wipe' ? 0 : run.essence;
    this.s.gold += gold;
    this.s.essence += essence;
    if (gold) lines.push(`금화 +${gold}`);
    if (essence) lines.push(`피의 정수 +${essence}`);
    if (run.outcome === 'victory') {
      if (!this.s.cleared.includes(run.dungeon)) {
        this.s.cleared.push(run.dungeon);
        lines.push(`「${d.name}」 최초 정복!`);
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
        if (this.s.roster.length < ROSTER_CAP) { this.s.roster.push(r); lines.push(`${fullName(r)}이(가) 저택에 합류했다.`); }
      }
    }
    const fallenNow = new Set(run.fallen.map((f) => f.id));
    for (const c of [...this.s.roster, this.s.lordChar]) {
      if (run.party.includes(c.id)) c.runs++;
      if (c.dormant > 0 && !fallenNow.has(c.id)) c.dormant--;
      else if (c.dormant > 0 && fallenNow.has(c.id)) c.dormant = c.isLord ? 1 : DORMANT_RUNS;
    }
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
