// 거점 시설: 대장간 · 치유소 · 추모비
import { lookFromCharacter } from '../art/look';
import { spriteEl } from '../art/registry';
import { FACILITIES, FACILITY_IDS, type FacilityId } from '../core/data/facilities';
import { TRAITS } from '../core/data/traits';
import {
  cureCost, DORMANCY_COST, ENHANCE_CHANCE, enhanceCost, heroBonusPct, isMeritorious, MAX_PLUS_BY_LEVEL, memorialBonus, meritOf,
  purgeCost, REZ, rerollCost, SLIP_FROM,
} from '../core/facilities';
import { store } from '../core/state';
import { fullName } from '../core/stats';
import type { Character, Item } from '../core/types';
import { clear, confirmBox, h, modal, toast, tooltip } from './dom';
import { houseChip, itemRow, raceClassLine, starsEl } from './widgets';

type Tab = FacilityId;

export function openFacilities(onChange: () => void, tab: Tab = 'forge'): void {
  const body = h('div', { class: 'col fac', style: { height: '100%' } });
  let cur: Tab = tab;
  const render = () => {
    clear(body);
    const s = store.s;
    body.append(
      h('div', { class: 'row', style: { marginRight: '28px' } },
        h('h2', { style: { margin: 0 } }, '거점 시설'),
        h('span', { class: 'chip core' }, `재건 ${store.restoration()}%`),
        h('span', { class: 'grow' }),
        h('span', { class: 'res' }, h('span', { class: 'gold' }, '◆ '), `금화 ${s.gold.toLocaleString()}`),
        h('span', { class: 'res' }, h('span', { class: 'core' }, '◆ '), `핵 조각 ${s.essence}`),
      ),
      h('div', { class: 'fac-cards' }, ...FACILITY_IDS.map((id) => facCard(id, cur === id, () => { cur = id; render(); }, () => { render(); onChange(); }))),
      h('div', { class: 'fac-body scroll' }, panel(cur, () => { render(); onChange(); })),
    );
  };
  render();
  modal(body, { wide: true });
}

function facCard(id: FacilityId, active: boolean, onPick: () => void, onBuilt: () => void): HTMLElement {
  const f = FACILITIES[id];
  const lv = store.facilityLevel(id);
  const next = f.levels[lv];
  const pips = h('span', { class: 'pips' }, ...f.levels.map((_, i) => h('i', { class: i < lv ? 'on' : '' })));
  const btn = next
    ? h('button', {
      class: 'btn small gold',
      disabled: store.s.gold < next.gold || store.s.essence < next.shards,
      onclick: (e: Event) => {
        e.stopPropagation();
        const r = store.buildFacility(id);
        if (!r.ok) toast(r.reason ?? '실패', 'warn'); else toast(`${f.name} ${lv + 1}단계 완성`, 'good');
        onBuilt();
      },
    }, `${lv ? '증축' : '건설'} · ◆${next.gold}${next.shards ? ` · 핵 ${next.shards}` : ''}`)
    : h('span', { class: 'small gold' }, '최고 단계');
  return h('div', { class: `fac-card ${active ? 'active' : ''} ${lv ? '' : 'ruin'}`, onclick: onPick },
    h('div', { class: 'row' }, h('b', null, `${f.icon} ${f.name}`), pips),
    h('div', { class: 'small dim' }, lv ? f.levels[lv - 1].desc : '무너진 채 방치되어 있다.'),
    next ? h('div', { class: 'small' }, `다음: ${next.desc}`) : null,
    btn,
  );
}

function panel(id: FacilityId, refresh: () => void): HTMLElement {
  const lv = store.facilityLevel(id);
  const f = FACILITIES[id];
  if (!lv) return h('div', { class: 'dim center', style: { marginTop: '60px' } }, `${f.desc}\n\n먼저 ${f.name}을(를) 지어야 한다.`);
  if (id === 'forge') return forgePanel(refresh);
  if (id === 'infirmary') return infirmaryPanel(refresh);
  return memorialPanel(refresh);
}

// ================================================================== 대장간
function forgePanel(refresh: () => void): HTMLElement {
  const lv = store.facilityLevel('forge');
  const cap = MAX_PLUS_BY_LEVEL[lv];
  const owned: { it: Item; owner?: Character }[] = [];
  for (const c of [store.s.lordChar, ...store.s.roster]) for (const g of Object.values(c.gear ?? {})) if (g) owned.push({ it: g, owner: c });
  for (const it of store.s.stash) owned.push({ it });
  owned.sort((a, b) => b.it.rarity - a.it.rarity || (b.it.plus ?? 0) - (a.it.plus ?? 0) || b.it.ilvl - a.it.ilvl);
  return h('div', null,
    h('div', { class: 'small dim', style: { marginBottom: '6px' } },
      `강화 한도 +${cap}. 단계가 오를수록 성공률이 떨어지고, +${SLIP_FROM} 이상에서 실패하면 한 단계 떨어진다 (파괴되지는 않는다).${lv >= 2 ? ' 고급·희귀 장비는 접두사를 다시 벼릴 수 있다.' : ''}`),
    owned.length ? h('div', { class: 'items-grid' }, ...owned.map(({ it, owner }) => {
      const p = it.plus ?? 0;
      const canUp = p < cap && p < 10;
      const cost = enhanceCost(it);
      const up = h('button', {
        class: 'btn small', disabled: !canUp || store.s.gold < cost,
        onclick: () => {
          const r = store.enhanceItem(it.id);
          if (!r.ok) toast(r.reason ?? '실패', 'warn');
          else if (r.success) toast(`강화 성공! ${it.name}`, 'good');
          else toast(r.slipped ? `실패… 흠집이 나 +${r.plus}(으)로 떨어졌다.` : '실패… 금화만 녹아내렸다.', 'warn');
          refresh();
        },
      }, canUp ? `+${p + 1} ◆${cost} (${Math.round(ENHANCE_CHANCE[p] * 100)}%)` : p >= 10 ? '최대' : `한도 +${cap}`);
      const reroll = lv >= 2 && (it.rarity === 2 || it.rarity === 3)
        ? h('button', {
          class: 'btn small', disabled: store.s.gold < rerollCost(it),
          onclick: () => confirmBox(`「${it.name}」의 접두사를 다시 벼린다. (◆${rerollCost(it)})`, '재련', () => { const r = store.rerollItem(it.id); if (!r.ok) toast(r.reason ?? '실패', 'warn'); refresh(); }),
        }, `재련 ◆${rerollCost(it)}`)
        : null;
      return itemRow(it, h('div', { class: 'col', style: { gap: '3px', alignItems: 'flex-end' } },
        owner ? h('span', { class: 'small mute' }, `${owner.given} 착용`) : h('span', { class: 'small mute' }, '창고'), up, reroll));
    })) : h('div', { class: 'dim center' }, '강화할 장비가 없다.'),
  );
}

// ================================================================== 치유소
function infirmaryPanel(refresh: () => void): HTMLElement {
  const lv = store.facilityLevel('infirmary');
  const chars = [store.s.lordChar, ...store.s.roster];
  const rows: HTMLElement[] = [];
  chars.forEach((c) => {
    const acts: HTMLElement[] = [];
    for (const id of c.curses) {
      const cost = purgeCost(c);
      acts.push(tooltip(h('button', {
        class: 'btn small', disabled: store.s.gold < cost,
        onclick: () => { const r = store.purgeCurse(c.id, id); if (!r.ok) toast(r.reason ?? '실패', 'warn'); else toast(`「${TRAITS[id].name}」을(를) 걷어 냈다.`, 'good'); refresh(); },
      }, `정화: ${TRAITS[id].name} ◆${cost}`), TRAITS[id].desc));
    }
    if (lv >= 2) {
      for (const id of c.traits.filter((t) => TRAITS[t]?.polarity === -1)) {
        const cost = cureCost(c);
        acts.push(tooltip(h('button', {
          class: 'btn small', disabled: store.s.gold < cost.gold || store.s.essence < cost.shards,
          onclick: () => { const r = store.cureTrait(c.id, id); if (!r.ok) toast(r.reason ?? '실패', 'warn'); else toast(`「${TRAITS[id].name}」이(가) 나았다.`, 'good'); refresh(); },
        }, `치료: ${TRAITS[id].name} ◆${cost.gold}·핵 ${cost.shards}`), TRAITS[id].desc));
      }
    }
    if (lv >= 3 && c.dormant > 0) {
      acts.push(h('button', {
        class: 'btn small', disabled: store.s.gold < DORMANCY_COST.gold || store.s.essence < DORMANCY_COST.shards,
        onclick: () => { const r = store.shortenDormancy(c.id); if (!r.ok) toast(r.reason ?? '실패', 'warn'); refresh(); },
      }, `휴면 단축 (남은 ${c.dormant}) ◆${DORMANCY_COST.gold}·핵 ${DORMANCY_COST.shards}`));
    }
    if (!acts.length) return;
    rows.push(h('div', { class: 'inf-row' },
      spriteEl(lookFromCharacter(c), 1.5, { still: true }),
      h('div', { class: 'col', style: { gap: '1px', minWidth: '160px' } }, h('b', null, fullName(c)), h('span', { class: 'small dim' }, raceClassLine(c))),
      h('div', { class: 'row wrap', style: { gap: '4px' } }, ...acts),
    ));
  });
  return h('div', null,
    h('div', { class: 'small dim', style: { marginBottom: '6px' } },
      `1단계: 저주 정화${lv >= 2 ? ' · 2단계: 부정적 특성 치료' : ''}${lv >= 3 ? ' · 3단계: 세계핵 휴면 단축' : ''}`),
    rows.length ? h('div', null, ...rows) : h('div', { class: 'dim center', style: { marginTop: '40px' } }, '돌볼 환자가 없다. 드문 일이다.'),
  );
}

// ================================================================== 추모비
function memorialPanel(refresh: () => void): HTMLElement {
  const slots = store.memorialSlots();
  const ids = store.s.memorial.enshrined;
  const graves = store.s.graveyard;
  const heroes = ids.map((id) => graves.find((g) => g.char.id === id)!).filter(Boolean);
  const living = [store.s.lordChar, ...store.s.roster];
  const heirsOf = (hero: Character) => living.filter((c) => memorialBonus(c, [hero]).sources.length).length;
  const slotEls: HTMLElement[] = [];
  for (let i = 0; i < slots; i++) {
    const g = heroes[i];
    if (!g) { slotEls.push(h('div', { class: 'mem-slot empty' }, h('span', { class: 'dim' }, '빈 자리'))); continue; }
    const ch = g.char;
    slotEls.push(h('div', { class: 'mem-slot' },
      spriteEl(lookFromCharacter(ch), 2, { still: true, className: 'dead' }),
      h('div', { class: 'col', style: { gap: '2px' } },
        starsEl(ch.star), h('b', null, fullName(ch)), h('span', { class: 'small dim' }, `${raceClassLine(ch)} · Lv.${ch.level}`),
        h('span', { class: 'small gold' }, `공적 ${meritOf(ch)} · 유지 ${heroBonusPct(ch)}% · 잇는 동료 ${heirsOf(ch)}명`),
        h('button', { class: 'btn small', onclick: () => confirmBox(`${fullName(ch)}을(를) 추모비에서 내린다.`, '내리기', () => { store.unenshrine(ch.id); refresh(); }) }, '내리기'),
      ),
    ));
  }
  const candidates = graves.filter((g) => !ids.includes(g.char.id));
  const rezPanel = store.facilityLevel('memorial') >= 3 && heroes.length ? resurrectionPanel(heroes.map((g) => g.char), refresh) : null;
  return h('div', null,
    h('div', { class: 'small dim', style: { marginBottom: '6px', lineHeight: '1.6' } },
      '죽은 자의 수가 아니라, 그가 남긴 공적만이 기려진다. 고레벨(Lv.12+)이거나 보스·정예를 토벌한 영웅만 이름을 새길 수 있다. ',
      '봉안된 영웅의 유지는 같은 직업(공격·마력), 같은 종족(체력·방어·저항), 같은 소속(경험치·치명)의 동료에게만 이어진다.'),
    h('h3', null, `봉안된 영웅 ${heroes.length}/${slots}`),
    h('div', { class: 'mem-slots' }, ...slotEls),
    rezPanel,
    h('h3', null, '묘지의 이름들'),
    candidates.length ? h('div', { class: 'graves' }, ...candidates.map((g) => {
      const ch = g.char;
      const ok = isMeritorious(ch);
      return h('div', { class: `grave ${ok ? '' : 'faded'}` },
        spriteEl(lookFromCharacter(ch), 1.5, { still: true, className: 'dead' }),
        h('div', { class: 'col', style: { gap: '2px' } },
          h('b', null, fullName(ch)), h('span', { class: 'small dim' }, `${raceClassLine(ch)} · Lv.${ch.level}`), ch.house ? houseChip(ch.house) : null,
          h('span', { class: ok ? 'small gold' : 'small mute' }, ok ? `공적 ${meritOf(ch)} — 봉안 가능` : `공적 ${meritOf(ch)} — 기릴 만한 공적이 없다`),
          ok ? h('button', {
            class: 'btn small gold', disabled: heroes.length >= slots,
            onclick: () => { const r = store.enshrine(ch.id); if (!r.ok) toast(r.reason ?? '실패', 'warn'); refresh(); },
          }, '추모비에 이름을 새긴다') : null,
        ));
    })) : h('div', { class: 'dim' }, '묘지가 비어 있다.'),
  );
}

function resurrectionPanel(heroes: Character[], refresh: () => void): HTMLElement {
  let heroId = heroes[0].id;
  let sacId = '';
  const wrap = h('div', { class: 'rez panel thin' });
  const draw = () => {
    clear(wrap);
    const hero = heroes.find((x) => x.id === heroId)!;
    const sacs = store.s.roster.filter((c) => c.star >= hero.star && !c.isLord);
    const chk = store.resurrectionCheck(heroId, sacId || undefined);
    const heroSel = h('select', { onchange: (e: Event) => { heroId = (e.target as HTMLSelectElement).value; draw(); } },
      ...heroes.map((x) => h('option', { value: x.id, selected: x.id === heroId }, `${fullName(x)} (공적 ${meritOf(x)})`)));
    const sacSel = h('select', { onchange: (e: Event) => { sacId = (e.target as HTMLSelectElement).value; draw(); } },
      h('option', { value: '' }, '— 제물을 고른다 —'),
      ...sacs.map((c) => h('option', { value: c.id, selected: c.id === sacId }, `★${c.star} ${fullName(c)} (${raceClassLine(c)})`)));
    wrap.append(
      h('h3', { class: 'bad' }, '소생 의식'),
      h('div', { class: 'small dim', style: { lineHeight: '1.6' } },
        `세계핵의 이름으로 봉안된 영웅을 부른다. 금화 ${REZ.gold}, 핵 조각 ${REZ.shards}, 그리고 영웅 이상의 성급을 가진 살아 있는 동료 한 명이 필요하다. `,
        `공적 ${REZ.merit} 이상만 응답한다. 성공해도 결속된 채로 돌아오며, 실패해도 바친 것은 돌아오지 않는다.`),
      h('div', { class: 'row wrap', style: { gap: '8px', margin: '6px 0' } }, heroSel, sacSel),
      ...chk.reasons.map((r) => h('div', { class: 'small bad' }, `· ${r}`)),
      h('div', { class: 'row' },
        h('span', { class: 'small' }, `성공 확률 ${Math.round(chk.chance * 100)}%`),
        h('span', { class: 'grow' }),
        h('button', {
          class: 'btn danger', disabled: !chk.ok,
          onclick: () => confirmBox(`${fullName(hero)}을(를) 부르기 위해 ${store.char(sacId)?.given}을(를) 바친다. 실패해도 되돌릴 수 없다.`, '의식을 시작한다', () => {
            const r = store.resurrect(heroId, sacId);
            if (!r.ok) toast((r.reasons ?? ['실패']).join(' / '), 'warn');
            else toast(r.line ?? '', r.success ? 'good' : 'warn');
            refresh();
          }, true),
        }, '의식을 시작한다'),
      ),
    );
  };
  draw();
  return wrap;
}
