import { lookFromCharacter } from '../art/look';
import { spriteEl } from '../art/registry';
import { CLASSES } from '../core/data/classes';
import { DUNGEONS } from '../core/data/dungeons';
import { factionRelation, FACTIONS, FACTION_IDS } from '../core/data/factions';
import { PITY5, PULL10_COST, PULL_COST, ROSTER_CAP } from '../core/gacha';
import { STAR_RATES } from '../core/gen/character';
import { PARTY_SIZE, store } from '../core/state';
import { compatibility, DISCORD_T, fullName, HARMONY_T, partySynergy, powerScore, topFactions } from '../core/stats';
import type { Character, FactionId } from '../core/types';
import { lordExpToNext, vampireSlots } from '../core/vampire';
import { clear, closeAllModals, confirmBox, h, modal, setScreen, toast, tooltip } from './dom';
import { charCard, charDetail, houseChip, raceClassLine, starsEl } from './widgets';
import { app } from './app';

function resBar(): HTMLElement {
  const s = store.s;
  const lordPct = (s.lord.exp / lordExpToNext(s.lord.level)) * 100;
  return h('div', { class: 'topbar' },
    h('span', { class: 'title' }, '혈주의 저택'),
    h('span', { class: 'res' }, h('span', { class: 'gold' }, '◆'), `금화 ${s.gold.toLocaleString()}`),
    tooltip(h('span', { class: 'res' }, h('span', { class: 'vamp' }, '●'), `피의 정수 ${s.essence}`), '동료를 뱀파이어로 만드는 데 쓰인다.\n정예·보스·제단·보물에서 얻는다.'),
    tooltip(h('span', { class: 'res' }, h('span', { class: 'vamp' }, '🦇'), `뱀파이어 ${store.vampireCount()}/${vampireSlots(s.lord.level)}`), '혈주 레벨이 오르면 한도가 늘어난다.'),
    h('span', { class: 'res' }, `동료 ${s.roster.length}/${ROSTER_CAP}`),
    h('span', { class: 'res' }, `묘비 ${s.graveyard.length}`),
    h('span', { class: 'grow' }),
    h('span', { class: 'res' }, `혈주 Lv.${s.lord.level}`),
    h('div', { style: { width: '120px' } }, h('div', { class: 'bar lord' }, h('i', { style: { width: `${lordPct}%` } }))),
  );
}

export function renderTown(): void {
  const s = store.s;
  const menuBtn = (label: string, sub: string, fn: () => void, cls = '') => h('button', { class: `btn ${cls}`, onclick: fn }, label, h('span', { class: 'k' }, sub));
  const screen = h('div', { class: 'screen' },
    resBar(),
    h('div', { class: 'town-menu' },
      menuBtn('⚔ 원정 출발', '던전으로 파티를 보낸다', openExpedition, 'primary'),
      menuBtn('✉ 모집소', `1회 ${PULL_COST} · 10회 ${PULL10_COST} 금화`, openRecruit, 'gold'),
      menuBtn('☗ 동료', `${s.roster.length}명 · 흡혈 의식`, () => openRoster()),
      menuBtn('✝ 묘지', `${s.graveyard.length}개의 묘비`, openGraveyard),
      menuBtn('⚑ 진영', '세력별 호감도와 상성', openFactions),
      menuBtn('⚙ 설정', '저장 데이터 관리', openSettings),
    ),
    h('div', { class: 'news panel' },
      h('h2', null, '소식'),
      h('ul', { class: 'scroll' }, ...s.news.slice(0, 14).map((n) => h('li', null, n.text))),
    ),
    h('div', { class: 'lordbox panel thin small dim', style: { lineHeight: '1.7' } },
      h('div', { class: 'gold' }, '혈주의 규칙'),
      h('div', null, '· 필멸자는 성장하지만, 죽으면 묘지로 간다.'),
      h('div', null, '· 뱀파이어는 성장이 멈추지만, 쓰러져도 관에서 다시 깨어난다.'),
      h('div', null, `· 원정 ${s.stats.runs}회 · 정복 ${s.stats.victories} · 사망 ${s.stats.deaths} · 흡혈 ${s.stats.turned}`),
    ),
  );
  setScreen(screen);
}

// ================================================================== 모집
function openRecruit(): void {
  const stage = h('div', { class: 'gacha-stage' }, h('div', { class: 'dim center' }, '모든 동료는 무작위로 태어난다. 종족, 직업, 이름, 외형, 특성, 저주, 가호… 그리고 운이 좋다면 이름난 가문까지.'));
  const info = h('div', { class: 'small dim' });
  const updateInfo = () => {
    clear(info);
    info.append(`보유 금화 ${store.s.gold.toLocaleString()} · ★5 천장까지 ${PITY5 - store.s.pity.since5}회 · 확률 `,
      ...Object.entries(STAR_RATES).map(([k, v]) => h('span', { class: 'chip' }, `★${k} ${(v * 100).toFixed(1)}%`)));
  };
  updateInfo();
  const doPull = (n: 1 | 10) => {
    const r = store.recruit(n);
    if (!r.ok) { toast(r.reason!, 'warn'); return; }
    clear(stage);
    const cards = r.chars!.map((ch, i) => {
      const card = charCard(ch, { scale: n === 1 ? 3 : 2, showTraits: n === 1 });
      const g = h('div', { class: `gcard ${n === 10 ? 'small' : ''}` },
        h('div', { class: 'inner' }, h('div', { class: 'back' }, '?'), h('div', { class: `face ${ch.star === 5 ? 'glow5' : ch.star === 4 ? 'glow4' : ''}` }, card)));
      setTimeout(() => g.classList.add('flip'), 250 + i * 160);
      return g;
    });
    stage.append(...cards);
    updateInfo();
    renderTown();
  };
  modal(h('div', { class: 'col', style: { width: '1080px' } },
    h('h2', null, '모집소'),
    info,
    stage,
    h('div', { class: 'row end' },
      h('button', { class: 'btn gold big', onclick: () => doPull(1) }, `1회 모집 (${PULL_COST})`),
      h('button', { class: 'btn primary big', onclick: () => doPull(10) }, `10회 모집 (${PULL10_COST}) · ★3 이상 1명 보장`),
    ),
  ));
}

// ================================================================== 동료
type SortKey = 'star' | 'level' | 'power' | 'race' | 'new';

export function openRoster(focusId?: string): void {
  let sort: SortKey = 'star';
  let selected = focusId ?? store.s.roster[0]?.id;
  const list = h('div', { class: 'cards scroll', style: { maxHeight: '560px', width: '330px', gridTemplateColumns: 'repeat(2, 1fr)' } });
  const detailWrap = h('div', { class: 'grow' });
  const sorted = () => {
    const r = [...store.s.roster];
    const by: Record<SortKey, (a: Character, b: Character) => number> = {
      star: (a, b) => b.star - a.star || b.level - a.level,
      level: (a, b) => b.level - a.level,
      power: (a, b) => powerScore(b) - powerScore(a),
      race: (a, b) => a.race.localeCompare(b.race),
      new: (a, b) => b.createdAt - a.createdAt,
    };
    return r.sort(by[sort]);
  };
  const render = () => {
    clear(list);
    for (const ch of sorted()) list.appendChild(charCard(ch, { selected: ch.id === selected, onClick: (c) => { selected = c.id; render(); } }));
    clear(detailWrap);
    const ch = selected ? store.char(selected) : undefined;
    if (ch) detailWrap.appendChild(charDetail(ch, actionsFor(ch)));
    else detailWrap.appendChild(h('div', { class: 'dim' }, '동료가 없다. 모집소에서 새 동료를 찾아보자.'));
  };
  const actionsFor = (ch: Character): HTMLElement => {
    const chk = store.turnCheck(ch.id);
    const turnBtn = h('button', {
      class: 'btn primary', disabled: !chk.ok,
      onclick: () => confirmBox(
        `${fullName(ch)}에게 송곳니를 박는다. 피의 정수 ${chk.cost}개가 든다.\n\n뱀파이어가 되면 더 이상 성장하지 않지만, 쓰러져도 묘지로 가지 않고 관 속에서 다시 깨어난다. 되돌릴 수 없다.`,
        '흡혈한다', () => {
          const r = store.turn(ch.id);
          modal(h('div', { class: 'col', style: { width: '460px' } }, h('h2', { class: 'vamp' }, '흡혈 의식'), ...r.msgs.map((m) => h('div', { style: { lineHeight: '1.7' } }, m))));
          render();
          renderTown();
        }),
    }, `🦇 흡혈 의식 (정수 ${chk.cost})`);
    const turnWrap = h('div', { class: 'col', style: { width: '100%', gap: '4px' } }, turnBtn, !chk.ok && chk.reason ? h('div', { class: 'small mute center' }, chk.reason) : null);
    const relBtn = h('button', {
      class: 'btn small danger',
      onclick: () => confirmBox(`${fullName(ch)}을(를) 저택에서 내보낸다. (금화 ${10 * ch.star} 회수) 되돌릴 수 없다.`, '방출', () => {
        const r = store.release(ch.id);
        if (!r.ok) toast(r.reason!, 'warn');
        selected = store.s.roster[0]?.id;
        render();
        renderTown();
      }, true),
    }, '방출');
    return h('div', { class: 'col', style: { width: '100%', marginTop: '6px' } }, turnWrap, relBtn);
  };
  const sortBtns = (['star', 'level', 'power', 'race', 'new'] as SortKey[]).map((k) => {
    const names: Record<SortKey, string> = { star: '성급', level: '레벨', power: '전투력', race: '종족', new: '최신' };
    const b = h('button', { class: `btn small ${sort === k ? 'on' : ''}`, onclick: () => { sort = k; sortBtns.forEach((x) => x.classList.remove('on')); b.classList.add('on'); render(); } }, names[k]);
    return b;
  });
  render();
  modal(h('div', { class: 'col', style: { height: '100%' } },
    h('div', { class: 'row', style: { marginRight: '28px' } }, h('h2', { style: { margin: 0 } }, '동료'), h('span', { class: 'grow' }), h('span', { class: 'small mute' }, '정렬'), ...sortBtns),
    h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '14px' } }, list, detailWrap),
  ), { wide: true });
}

// ================================================================== 묘지
function openGraveyard(): void {
  const g = store.s.graveyard;
  modal(h('div', { class: 'col', style: { height: '100%' } },
    h('h2', null, `묘지 — ${g.length}개의 묘비`),
    h('div', { class: 'dim small' }, '필멸자로 죽은 동료는 여기 잠든다. 계정은 사라지지 않지만, 그들은 돌아오지 않는다.'),
    g.length === 0
      ? h('div', { class: 'dim center', style: { marginTop: '120px', fontSize: '14px' } }, '아직 아무도 이곳에 묻히지 않았다.')
      : h('div', { class: 'graves scroll', style: { maxHeight: '560px' } }, ...g.map((gr) => {
        const ch = gr.char;
        return h('div', { class: 'grave' },
          spriteEl(lookFromCharacter(ch), 2, { still: true, className: 'dead' }),
          h('div', { class: 'col', style: { gap: '2px' } },
            h('div', { class: 'row' }, starsEl(ch.star), h('span', { class: 'small mute' }, `원정 #${gr.runNo}`)),
            h('b', null, fullName(ch)),
            h('span', { class: 'small dim' }, `${raceClassLine(ch)} · Lv.${ch.level}`),
            ch.house ? houseChip(ch.house) : null,
            h('span', { class: 'small bad' }, `${gr.where} — ${gr.cause}`),
            h('span', { class: 'ep' }, `“${gr.epitaph}”`),
          ),
        );
      })),
  ), { wide: true });
}

// ================================================================== 진영
function openFactions(): void {
  const rep = store.s.rep;
  const roster = store.s.roster;
  modal(h('div', { class: 'col', style: { height: '100%' } },
    h('h2', null, '진영'),
    h('div', { class: 'dim small' }, '호감도는 사건의 결과와 대우를 바꾼다. 동료 각자도 종족·직업·특성·가문에 따라 세력별 시작 호감을 가진다.'),
    h('div', { class: 'factions scroll', style: { maxHeight: '570px' } }, ...FACTION_IDS.map((f) => {
      const fd = FACTIONS[f];
      const v = rep[f] ?? 0;
      const w = (Math.abs(v) / 100) * 50;
      const allies = FACTION_IDS.filter((g) => g !== f && factionRelation(f, g) >= 1);
      const foes = FACTION_IDS.filter((g) => g !== f && factionRelation(f, g) <= -1);
      const lovers = roster.filter((c) => topFactions(c).loves.includes(f));
      const haters = roster.filter((c) => topFactions(c).hates.includes(f));
      const nm = (g: FactionId) => h('span', { style: { color: FACTIONS[g].color } }, FACTIONS[g].name);
      return h('div', { class: 'faction' },
        h('div', { class: 'row' }, h('span', { class: 'fn', style: { color: fd.color } }, fd.name), h('span', { class: 'grow' }), h('b', { class: v >= 0 ? 'good' : 'bad' }, `${v > 0 ? '+' : ''}${v}`)),
        h('div', { class: 'rep' }, h('span', { class: 'mid' }), h('i', { style: { left: v >= 0 ? '50%' : `${50 - w}%`, width: `${w}%`, background: v >= 0 ? '#7ad08a' : '#e0606a' } })),
        h('div', { class: 'small dim' }, fd.desc),
        h('div', { class: 'small', style: { marginTop: '4px' } }, '우호: ', ...allies.flatMap((g, i) => [i ? ', ' : '', nm(g)]), allies.length ? '' : '없음'),
        h('div', { class: 'small' }, '적대: ', ...foes.flatMap((g, i) => [i ? ', ' : '', nm(g)]), foes.length ? '' : '없음'),
        h('div', { class: 'small dim', style: { marginTop: '4px' } }, `따르는 동료 ${lovers.length} · 증오하는 동료 ${haters.length}`),
      );
    })),
  ), { wide: true });
}

// ================================================================== 설정
function openSettings(): void {
  const close = modal(h('div', { class: 'col', style: { width: '440px' } },
    h('h2', null, '설정'),
    h('div', { class: 'dim small', style: { lineHeight: '1.6' } }, '진행 상황은 브라우저(localStorage)에 자동 저장된다.'),
    h('button', {
      class: 'btn danger', onclick: () => confirmBox('모든 진행 상황(동료, 묘지, 금화)을 지우고 새로 시작한다. 되돌릴 수 없다.', '새로 시작', () => {
        close();
        store.reset();
        app.route();
      }, true),
    }, '새 게임으로 초기화'),
  ));
}

// ================================================================== 원정 준비
function synergyView(party: Character[]): HTMLElement {
  const syn = partySynergy(party);
  const byId = (id: string) => party.find((c) => c.id === id)!;
  return h('div', { class: 'syn' },
    h('div', null, '사기: ', h('b', { class: syn.morale > 0 ? 'good' : syn.morale < 0 ? 'bad' : 'dim' }, `${syn.morale > 0 ? '+' : ''}${syn.morale}`),
      h('span', { class: 'dim' }, `  (공격·마력·방어·저항 ${syn.morale >= 0 ? '+' : ''}${syn.morale * 4}%)`)),
    ...syn.pairs.map((p) => h('div', { class: p.kind === 'harmony' ? 'good' : 'bad' },
      `${p.kind === 'harmony' ? '♥ 화합' : '⚡ 불화'}: ${fullName(byId(p.a))} ↔ ${fullName(byId(p.b))} (${p.score.toFixed(1)})`)),
    syn.pairs.length === 0 && party.length > 1 ? h('div', { class: 'dim' }, '특별한 화합도 불화도 없다.') : null,
  );
}

function openExpedition(): void {
  const avail = store.availableDungeons();
  let dungeon = avail[avail.length - 1] ?? 'necropolis';
  let party: string[] = [];
  const dWrap = h('div', { class: 'dungeons' });
  const slots = h('div', { class: 'party-slots' });
  const syn = h('div', { class: 'grow' });
  const list = h('div', { class: 'cards scroll', style: { maxHeight: '300px', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))' } });
  const startBtn = h('button', { class: 'btn primary big' }, '출발');
  const render = () => {
    clear(dWrap);
    for (const d of Object.values(DUNGEONS)) {
      const locked = !avail.includes(d.id);
      dWrap.appendChild(h('div', {
        class: `dcard ${d.id === dungeon ? 'sel' : ''} ${locked ? 'locked' : ''}`,
        onclick: () => { if (!locked) { dungeon = d.id; render(); } },
      },
        h('div', { class: 'row' }, h('b', null, d.name), h('span', { class: 'grow' }), store.s.cleared.includes(d.id) ? h('span', { class: 'good small' }, '정복') : null),
        h('div', { class: 'small dim', style: { lineHeight: '1.5', marginTop: '4px' } }, locked ? `「${DUNGEONS[d.unlockAfter!].name}」 정복 후 개방` : d.desc),
        h('div', { class: 'small mute' }, `${d.floors}층 + 보스 · 위험도 ${'☠'.repeat(d.tier + 1)}`),
      ));
    }
    clear(slots);
    for (let i = 0; i < PARTY_SIZE; i++) {
      const ch = party[i] ? store.char(party[i]) : undefined;
      slots.appendChild(ch
        ? h('div', { class: 'slot filled', onclick: () => { party = party.filter((id) => id !== ch.id); render(); } },
          spriteEl(lookFromCharacter(ch), 2), h('span', { class: 'small' }, fullName(ch)), h('span', { class: 'small dim' }, `${CLASSES[ch.cls].name} Lv.${ch.level}`))
        : h('div', { class: 'slot dim small' }, '빈 자리'));
    }
    clear(syn);
    const pc = party.map((id) => store.char(id)!).filter(Boolean);
    syn.appendChild(h('h3', null, '파티 상성'));
    syn.appendChild(pc.length ? synergyView(pc) : h('div', { class: 'dim small' }, '동료를 선택하면 진영 상성에 따른 화합/불화가 표시된다.'));
    clear(list);
    for (const ch of [...store.s.roster].sort((a, b) => b.star - a.star || b.level - a.level)) {
      const j = store.canJoinParty(ch);
      const inParty = party.includes(ch.id);
      const card = charCard(ch, {
        selected: inParty, disabled: !j.ok,
        onClick: (c) => {
          if (inParty) party = party.filter((id) => id !== c.id);
          else if (party.length < PARTY_SIZE) party.push(c.id);
          else toast(`파티는 최대 ${PARTY_SIZE}명이다.`, 'warn');
          render();
        },
      });
      if (pc.length && !inParty) {
        const worst = Math.min(...pc.map((p) => compatibility(p, ch)));
        const best = Math.max(...pc.map((p) => compatibility(p, ch)));
        if (worst <= DISCORD_T) card.appendChild(h('span', { class: 'small bad' }, '⚡ 불화 예상'));
        else if (best >= HARMONY_T) card.appendChild(h('span', { class: 'small good' }, '♥ 화합 예상'));
      }
      if (!j.ok) card.appendChild(h('span', { class: 'small mute' }, j.reason!));
      list.appendChild(card);
    }
    startBtn.toggleAttribute('disabled', party.length === 0);
  };
  startBtn.addEventListener('click', () => {
    const r = store.startRun(dungeon, party);
    if (!r.ok) { toast(r.reason!, 'warn'); return; }
    closeAllModals();
    app.route();
  });
  render();
  modal(h('div', { class: 'col', style: { height: '100%' } },
    h('h2', null, '원정 준비'),
    dWrap,
    h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '16px' } }, slots, syn, h('div', { class: 'col' }, startBtn, h('span', { class: 'small mute' }, '횃불 100으로 출발'))),
    h('hr', { class: 'sep' }),
    list,
  ), { wide: true });
}

