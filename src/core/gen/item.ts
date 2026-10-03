import { AFFIXES, ITEM_BASES, RARITY_NAMES, SLOT_NAMES, UNIQUES } from '../data/items';
import { Rng } from '../rng';
import { addStats, type Effects, type GearSlot, type Item, type Rarity, STAT_KEYS, STAT_NAMES, type Stats } from '../types';

export interface ItemGenOpts {
  ilvl: number;
  minRarity?: Rarity;
  slot?: GearSlot;
  /** 희귀 이상 확률 가산 (0..1) */
  luck?: number;
  /** 이 보스의 전설을 우선 */
  bossId?: string;
}

const RARITY_W: Record<Rarity, number> = { 1: 55, 2: 30, 3: 12, 4: 3 };
const RARITY_MUL: Record<Rarity, number> = { 1: 1, 2: 1.1, 3: 1.2, 4: 1.3 };

export function rollRarity(rng: Rng, min: Rarity = 1, luck = 0): Rarity {
  const rs = ([1, 2, 3, 4] as Rarity[]).filter((r) => r >= min);
  return rng.weighted(rs, (r) => RARITY_W[r] * (r >= 3 ? 1 + luck * 4 : 1));
}

function scaledStats(base: Partial<Stats>, ilvl: number, rarity: Rarity): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const k of STAT_KEYS) {
    const v = base[k];
    if (!v) continue;
    out[k] = v > 0 ? Math.max(1, Math.round(v * (1 + 0.12 * (ilvl - 1)) * RARITY_MUL[rarity])) : v;
  }
  return out;
}

export function generateItem(seed: number, o: ItemGenOpts): Item {
  const rng = new Rng(seed);
  const rarity = rollRarity(rng, o.minRarity ?? 1, o.luck ?? 0);
  const ilvl = Math.max(1, Math.round(o.ilvl));
  if (rarity === 4) {
    const pool = Object.values(UNIQUES).filter((u) => !o.slot || ITEM_BASES[u.base].slot === o.slot);
    const pref = o.bossId ? pool.filter((u) => u.dropFrom === o.bossId) : [];
    const u = pref.length && rng.chance(0.7) ? rng.pick(pref) : rng.pick(pool);
    const b = ITEM_BASES[u.base];
    return { id: `i_${seed.toString(36)}`, seed, slot: b.slot, base: b.id, rarity, name: u.name, ilvl, stats: scaledStats(b.stats, ilvl, rarity), affixes: [], unique: u.id };
  }
  const bases = Object.values(ITEM_BASES).filter((b) => !o.slot || b.slot === o.slot);
  const b = rng.pick(bases);
  const nAff = rarity === 1 ? 0 : rarity === 2 ? 1 : 2;
  const affixes: string[] = [];
  for (let i = 0; i < nAff; i++) {
    const pool = Object.values(AFFIXES).filter((a) => a.slots.includes(b.slot) && !affixes.includes(a.id));
    if (!pool.length) break;
    affixes.push(rng.weighted(pool, (a) => a.weight).id);
  }
  let name = b.name;
  if (affixes[0]) name = `${AFFIXES[affixes[0]].name} ${b.name}`;
  if (affixes[1]) name += ` · ${AFFIXES[affixes[1]].short}`;
  return { id: `i_${seed.toString(36)}`, seed, slot: b.slot, base: b.id, rarity, name, ilvl, stats: scaledStats(b.stats, ilvl, rarity), affixes };
}

/** 장비가 주는 능력치 가산 합계 */
export function itemStatMod(it: Item): Partial<Stats> {
  const out: Partial<Stats> = { ...it.stats };
  for (const a of it.affixes) addStats(out, AFFIXES[a]?.statMod);
  if (it.unique) addStats(out, UNIQUES[it.unique]?.statMod);
  return out;
}

export function itemEffects(it: Item): Partial<Effects>[] {
  const list: Partial<Effects>[] = [];
  for (const a of it.affixes) if (AFFIXES[a]?.effects) list.push(AFFIXES[a].effects!);
  if (it.unique && UNIQUES[it.unique]?.effects) list.push(UNIQUES[it.unique].effects!);
  return list;
}

export function itemValue(it: Item): number {
  return 8 * it.rarity * it.rarity + it.ilvl * 3;
}

export function itemLines(it: Item): string[] {
  const st = itemStatMod(it);
  const statLine = STAT_KEYS.filter((k) => st[k]).map((k) => `${STAT_NAMES[k]} ${st[k]! > 0 ? '+' : ''}${st[k]}${k === 'crit' ? '%' : ''}`).join(', ');
  const lines = [`${RARITY_NAMES[it.rarity]} ${SLOT_NAMES[it.slot]} · 아이템 레벨 ${it.ilvl}`, statLine];
  for (const a of it.affixes) if (AFFIXES[a]?.effects) lines.push(`· ${AFFIXES[a].desc}`);
  if (it.unique) lines.push(`★ ${UNIQUES[it.unique].desc}`);
  return lines.filter(Boolean);
}

