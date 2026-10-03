import { lookFromCharacter } from '../art/look';
import { bufUrl, spriteEl } from '../art/registry';
import { drawItemIcon, drawRelicIcon } from '../art/items';
import { drawStar } from '../art/tiles';
import { CLASSES, ROLE_NAMES } from '../core/data/classes';
import { FACTIONS, FACTION_IDS } from '../core/data/factions';
import { HOUSES } from '../core/data/houses';
import { RARITY_COLORS, SLOT_NAMES } from '../core/data/items';
import { RELICS } from '../core/data/relics';
import { itemLines } from '../core/gen/item';
import { RACES } from '../core/data/races';
import { SKILLS } from '../core/data/skills';
import { TRAITS } from '../core/data/traits';
import { characterAffinity, computeStats, expToNext, fullName, levelCap, powerScore } from '../core/stats';
import { type Character, type GearSlot, type Item, STAT_KEYS, STAT_NAMES } from '../core/types';
import { h, tooltip } from './dom';

export function starsEl(n: number, max = 5): HTMLElement {
  const on = bufUrl('star_on', () => drawStar(true));
  const off = bufUrl('star_off', () => drawStar(false));
  return h('span', { class: 'stars' }, ...Array.from({ length: max }, (_, i) => h('i', { style: { backgroundImage: `url(${i < n ? on : off})` } })));
}

export function traitChip(id: string): HTMLElement {
  const t = TRAITS[id];
  if (!t) return h('span', { class: 'chip' }, id);
  const cls = t.kind === 'curse' ? 'curse' : t.kind === 'blessing' ? 'bless' : t.polarity > 0 ? 'pos' : t.polarity < 0 ? 'neg' : 'neu';
  const label = t.kind === 'curse' ? `☠ ${t.name}` : t.kind === 'blessing' ? `✦ ${t.name}` : t.name;
  return tooltip(h('span', { class: `chip ${cls}` }, label), `${t.name}\n${t.desc}`);
}

export function houseChip(id: string | undefined): HTMLElement | null {
  if (!id) return null;
  const hd = HOUSES[id];
  const el = h('span', { class: 'chip house', style: `--hc:${hd.colors[0]};--hc2:${hd.colors[1]}` }, `${hd.emblem} ${hd.name}`);
  return tooltip(el, `${hd.name}${hd.rarity === 'legendary' ? ' (전설)' : ''}\n${hd.desc}\n\n[${hd.perk.name}] ${hd.perk.desc}`);
}

export function itemIcon(it: Item, size = 32): HTMLImageElement {
  const img = h('img', { class: 'pix', src: bufUrl(`item_${it.base}_${it.rarity}`, () => drawItemIcon(it.base, it.rarity)), width: size, height: size, alt: it.name });
  return img;
}

export function itemTip(it: Item): string {
  return [it.name, ...itemLines(it)].join('\n');
}

/** 아이콘 + 이름 한 줄 */
export function itemRow(it: Item, extra: HTMLElement | null = null): HTMLElement {
  return tooltip(h('div', { class: 'item-row' },
    itemIcon(it, 32),
    h('div', { class: 'col', style: { gap: '1px', flex: '1', minWidth: '0' } },
      h('span', { class: 'item-name', style: { color: RARITY_COLORS[it.rarity] } }, it.name),
      h('span', { class: 'small dim' }, itemLines(it)[1] ?? ''),
    ),
    extra,
  ), itemTip(it));
}

export function relicIcon(id: string, size = 24): HTMLElement {
  const r = RELICS[id];
  return tooltip(h('img', { class: 'pix relic', src: bufUrl(`relic_${id}`, () => drawRelicIcon(id)), width: size, height: size, alt: r?.name ?? id }), r ? `${r.name}\n${r.desc}` : id);
}

export function gearSlots(ch: Character, onSlot?: (slot: GearSlot) => void): HTMLElement {
  return h('div', { class: 'gear' }, ...(['weapon', 'armor', 'trinket'] as GearSlot[]).map((slot) => {
    const it = ch.gear?.[slot];
    const el = it
      ? itemRow(it)
      : h('div', { class: 'item-row empty' }, h('span', { class: 'slot-ph' }, '+'), h('span', { class: 'dim small' }, `${SLOT_NAMES[slot]} 비어 있음`));
    if (onSlot) { el.classList.add('clickable'); el.addEventListener('click', () => onSlot(slot)); }
    return el;
  }));
}

export function hpBar(hp: number, max: number): HTMLElement {
  const r = Math.max(0, Math.min(1, hp / max));
  return h('div', { class: `bar hp ${r < 0.3 ? 'low' : r < 0.6 ? 'mid' : ''}` }, h('i', { style: { width: `${r * 100}%` } }));
}

export function raceClassLine(ch: Character): string {
  return `${RACES[ch.race].name} · ${CLASSES[ch.cls].name}`;
}

export interface CardOpts {
  onClick?: (ch: Character) => void;
  selected?: boolean;
  disabled?: boolean;
  hp?: number;
  scale?: number;
  showTraits?: boolean;
}

export function charCard(ch: Character, o: CardOpts = {}): HTMLElement {
  const look = lookFromCharacter(ch);
  const spr = spriteEl(look, o.scale ?? 2, { className: ch.dormant > 0 ? 'dormant' : '' });
  const card = h('div', {
    class: `card s${ch.star} ${ch.isLord ? 'lord' : ''} ${o.selected ? 'sel' : ''} ${o.disabled ? 'disabled' : ''}`,
    onclick: () => { if (!o.disabled) o.onClick?.(ch); },
  },
    h('span', { class: 'lv' }, `Lv.${ch.level}`),
    h('span', { class: 'badge' }, ch.isLord ? h('span', { class: 'core', title: '지휘관' }, '♛') : null, ch.vampire ? h('span', { class: 'core', title: '결속자' }, '◈') : null, ch.dormant > 0 ? h('span', { title: '휴면' }, '☾') : null),
    spr,
    starsEl(ch.star),
    h('div', { class: 'nm' }, fullName(ch)),
    h('div', { class: 'sub' }, raceClassLine(ch)),
    ch.house ? houseChip(ch.house) : null,
    o.hp !== undefined ? h('div', { class: 'hb' }, hpBar(o.hp, computeStats(ch).hp)) : null,
    o.showTraits ? h('div', { class: 'center' }, ...[...ch.traits, ...ch.curses, ...ch.blessings].map(traitChip)) : null,
  );
  return card;
}

function affinityRows(ch: Character): HTMLElement[] {
  const aff = characterAffinity(ch);
  return FACTION_IDS.filter((f) => aff[f] !== 0)
    .sort((a, b) => Math.abs(aff[b]) - Math.abs(aff[a]))
    .map((f) => {
      const v = Math.max(-6, Math.min(6, aff[f]));
      const w = (Math.abs(v) / 6) * 50;
      const bar = h('div', { class: 'affbar' }, h('span', { class: 'mid' }),
        h('i', { style: { left: v >= 0 ? '50%' : `${50 - w}%`, width: `${w}%`, background: v >= 0 ? '#7ad08a' : '#e0606a' } }));
      return h('div', { class: 'aff' }, h('span', { style: { color: FACTIONS[f].color } }, FACTIONS[f].name), bar, h('span', { class: v >= 0 ? 'good' : 'bad' }, `${aff[f] > 0 ? '+' : ''}${aff[f]}`));
    });
}

/** 캐릭터 상세 시트 */
export function charDetail(ch: Character, actions: HTMLElement | null = null, onGear?: (slot: GearSlot) => void): HTMLElement {
  const look = lookFromCharacter(ch);
  const st = computeStats(ch);
  const c = CLASSES[ch.cls];
  const r = RACES[ch.race];
  const cap = ch.isLord ? 99 : levelCap(ch.star);
  const expPct = ch.level >= cap ? 100 : (ch.exp / expToNext(ch.level)) * 100;
  const hd = ch.house ? HOUSES[ch.house] : undefined;
  return h('div', { class: 'detail' },
    h('div', { class: 'portrait' },
      spriteEl(look, 4, { className: ch.dormant > 0 ? 'dormant' : '' }),
      starsEl(ch.star),
      h('div', { class: 'nm' }, fullName(ch)),
      h('div', { class: 'dim' }, `${raceClassLine(ch)} · ${ROLE_NAMES[c.role]}`),
      h('div', { class: 'dim small' }, `Lv.${ch.level} / ${cap}  전투력 ${powerScore(ch)}`),
      h('div', { style: { width: '100%' } }, h('div', { class: 'bar exp' }, h('i', { style: { width: `${ch.vampire ? 100 : expPct}%` } }))),
      ch.isLord ? h('span', { class: 'chip core' }, '♛ 지휘관 · 쓰러지면 1회 휴면') : ch.vampire ? h('span', { class: 'chip core' }, `◈ 결속자 (Lv.${ch.turnedAtLevel}에 결속, 성장 정지)`) : h('span', { class: 'chip' }, '필멸자 · 사망 시 묘지행'),
      ch.dormant > 0 ? h('span', { class: 'chip neg' }, `◈ 세계핵에서 휴면 (원정 ${ch.dormant}회)`) : null,
      h('div', { class: 'small dim' }, `처치 ${ch.kills} · 원정 ${ch.runs}회`),
      actions,
    ),
    h('div', { class: 'col scroll', style: { maxHeight: '560px' } },
      h('h3', null, '장비'),
      gearSlots(ch, onGear),
      h('h3', null, '능력치'),
      h('table', { class: 'stat-table' }, ...STAT_KEYS.map((k) => h('tr', null, h('td', null, STAT_NAMES[k]), h('td', null, k === 'crit' ? `${st[k]}%` : String(st[k]))))),
      h('h3', null, '기술'),
      h('div', { class: 'skill' }, h('b', null, c.attack.name), h('span', { class: 'dim small' }, ` · 기본 공격 · 사거리 ${c.attack.range[0]}-${c.attack.range[1]}`)),
      ...ch.skills.map((id) => {
        const s = SKILLS[id];
        return h('div', { class: 'skill' }, h('b', null, s.name), h('span', { class: 'dim small' }, ` · 사거리 ${s.range[0]}-${s.range[1]}${s.area ? ` · 범위 ${s.area}` : ''} · 재사용 ${s.cooldown}턴`), h('div', { class: 'small' }, s.desc));
      }),
    ),
    h('div', { class: 'col scroll', style: { maxHeight: '560px' } },
      hd ? h('div', null,
        h('h3', null, '소속'),
        h('div', null, houseChip(hd.id)),
        h('div', { class: 'small dim', style: { marginTop: '4px', lineHeight: '1.6' } }, hd.desc),
        h('div', { class: 'small gold' }, `[${hd.perk.name}] ${hd.perk.desc}`),
      ) : null,
      h('h3', null, '특성 · 저주 · 가호'),
      h('div', null, ...[...ch.traits, ...ch.curses, ...ch.blessings].map(traitChip)),
      h('div', { class: 'small dim', style: { lineHeight: '1.6' } }, ...[...ch.traits, ...ch.curses, ...ch.blessings].map((id) => h('div', null, `· ${TRAITS[id].name}: ${TRAITS[id].desc}`))),
      h('h3', null, '종족'),
      h('div', { class: 'small dim', style: { lineHeight: '1.6' } }, `${r.name}: ${r.desc}`, r.canBind ? null : h('div', { class: 'bad' }, `결속 불가 — ${r.bindNote ?? ''}`)),
      h('h3', null, '진영 호감 (시작 호감도)'),
      ...affinityRows(ch),
    ),
  );
}
