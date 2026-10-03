import { lookFromCharacter } from '../art/look';
import { bufUrl, spriteEl } from '../art/registry';
import { drawNodeIcon } from '../art/tiles';
import { DUNGEONS } from '../core/data/dungeons';
import { EVENTS } from '../core/data/events';
import { condMatch, DARKNESS_NAMES, darkness, NODE_NAMES, reachable, type RunState } from '../core/dungeon';
import { mixSeed, Rng } from '../core/rng';
import { store } from '../core/state';
import { computeStats, fullName, partySynergy } from '../core/stats';
import { app } from './app';
import { clear, closeAllModals, confirmBox, h, modal, setScreen, toast, tooltip } from './dom';
import { hpBar, itemRow, relicIcon, starsEl } from './widgets';

const SVGNS = 'http://www.w3.org/2000/svg';

function topBar(run: RunState): HTMLElement {
  const d = DUNGEONS[run.dungeon];
  const node = run.nodes.find((n) => n.id === run.current);
  const dk = darkness(run.torch);
  const party = store.partyChars();
  const syn = partySynergy(store.activeParty());
  return h('div', { class: 'run-top' },
    h('b', { class: 'gold', style: { fontSize: '15px' } }, d.name),
    h('span', { class: 'dim' }, !node ? '입구' : node.kind === 'boss' ? '보스의 방' : `${node.layer + 1}층 / ${d.floors}층`),
    tooltip(h('div', { class: 'row' }, h('span', null, '🔥 횃불'), h('div', { style: { width: '120px' } }, h('div', { class: 'bar torch' }, h('i', { style: { width: `${run.torch}%` } }))),
      h('span', { class: dk === 'bright' ? 'good' : dk === 'dim' ? 'gold' : 'bad' }, `${run.torch} · ${DARKNESS_NAMES[dk]}`)),
    '횃불은 이동할 때마다 줄어든다.\n어스름(50 미만): 기습 15%, 전리품 +10%, 적 피해 +5%\n칠흑(25 미만): 기습 35%, 전리품 +25%, 적 피해 +15%\n밤눈을 가진 동료는 어둠 패널티를 받지 않는다.'),
    h('span', { class: 'res' }, h('span', { class: 'gold' }, '◆'), `${run.gold}`),
    h('span', { class: 'res' }, h('span', { class: 'vamp' }, '●'), `${run.essence}`),
    tooltip(h('span', { class: 'res' }, '▣', `${run.loot.length}`), run.loot.length ? `이번 원정 전리품\n${run.loot.map((i) => `· ${i.name}`).join('\n')}\n(전멸하면 잃는다)` : '이번 원정 전리품 없음'),
    h('div', { class: 'relics' }, ...run.relics.map((r) => relicIcon(r, 24))),
    tooltip(h('span', { class: syn.morale > 0 ? 'good' : syn.morale < 0 ? 'bad' : 'dim' }, `사기 ${syn.morale > 0 ? '+' : ''}${syn.morale}`), '파티원 간 진영 상성으로 정해진다.'),
    h('span', { class: 'grow' }),
    h('span', { class: 'small mute' }, `원정 #${run.runNo} · ${party.length}명`),
    h('button', {
      class: 'btn small danger', onclick: () => confirmBox('원정을 포기하고 퇴각한다. 이번 원정에서 모은 금화의 절반만 가져간다.', '퇴각', () => { store.retreat(); renderRun(); }, true),
    }, '퇴각'),
  );
}

function partyPanel(run: RunState): HTMLElement {
  const wrap = h('div', { class: 'party-side' });
  for (const id of run.party) {
    const ch = store.char(id);
    const fallen = run.fallen.find((f) => f.id === id);
    if (!ch) {
      wrap.appendChild(h('div', { class: 'pmember fallen' }, h('span', { class: 'small bad' }, `✝ ${fallen?.name ?? '???'} — 묘지에 잠듦`)));
      continue;
    }
    const max = computeStats(ch).hp;
    const hp = run.hp[id] ?? 0;
    wrap.appendChild(h('div', { class: `pmember ${fallen ? 'fallen' : ''}` },
      spriteEl(lookFromCharacter(ch), 1.5, { className: fallen ? 'dormant' : '' }),
      h('div', { class: 'info' },
        h('div', { class: 'nm' }, fullName(ch)),
        h('div', { class: 'row', style: { gap: '4px' } }, starsEl(ch.star), h('span', { class: 'small dim' }, `Lv.${ch.level}`), ch.vampire ? h('span', { class: 'vamp small' }, '🦇') : null),
        fallen ? h('div', { class: 'small vamp' }, '⚰ 재가 되어 휴면 중') : h('div', null, hpBar(hp, max), h('span', { class: 'small dim' }, `${hp}/${max}`)),
      ),
    ));
  }
  return wrap;
}

function mapView(run: RunState): HTMLElement {
  const wrap = h('div', { class: 'map-wrap' });
  const W = 750;
  const H = 640;
  const L = DUNGEONS[run.dungeon].floors;
  const rng = new Rng(mixSeed(run.seed, 'layout'));
  const pos = new Map<string, { x: number; y: number }>();
  for (const n of run.nodes) {
    const y = H - 40 - (n.layer * (H - 80)) / L;
    const x = n.kind === 'boss' ? W / 2 : W / 2 + (n.col - 1) * 190 + rng.int(-24, 24);
    pos.set(n.id, { x, y });
  }
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));
  const reach = new Set(reachable(run));
  const visited = new Set(run.visited);
  for (const n of run.nodes) {
    for (const m of n.next) {
      const a = pos.get(n.id)!;
      const b = pos.get(m)!;
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', String(a.x)); line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x)); line.setAttribute('y2', String(b.y));
      const walked = visited.has(n.id) && visited.has(m);
      const active = n.id === run.current && reach.has(m);
      line.setAttribute('stroke', walked ? '#f2c45a' : active ? '#ff8aa0' : '#4a3d63');
      line.setAttribute('stroke-width', walked || active ? '4' : '3');
      line.setAttribute('stroke-dasharray', walked ? '' : '6 6');
      svg.appendChild(line);
    }
  }
  wrap.appendChild(svg);
  for (let i = 0; i <= L; i++) {
    const y = H - 40 - (i * (H - 80)) / L;
    wrap.appendChild(h('span', { class: 'layer-label', style: { left: '16px', top: `${y - 7}px` } }, i === L ? '보스' : `${i + 1}층`));
  }
  if (run.current === null) {
    wrap.appendChild(h('div', { class: 'small gold', style: { position: 'absolute', left: `${W / 2 - 60}px`, top: `${H - 12}px` } }, '▲ 입구에서 출발'));
  }
  for (const n of run.nodes) {
    const p = pos.get(n.id)!;
    const isReach = reach.has(n.id) && run.phase === 'map';
    const el = h('div', {
      class: `mnode ${n.kind === 'boss' ? 'boss' : ''} ${visited.has(n.id) ? 'visited' : ''} ${n.id === run.current ? 'current' : ''} ${isReach ? 'reach' : ''}`,
      style: { left: `${p.x}px`, top: `${p.y}px` },
      onclick: () => {
        if (!isReach) return;
        const r = store.moveTo(n.id);
        if (!r.ok) { toast(r.reason!, 'warn'); return; }
        app.route();
      },
    }, h('img', { src: bufUrl(`node_${n.kind}`, () => drawNodeIcon(n.kind)), alt: n.kind }));
    tooltip(el, `${NODE_NAMES[n.kind]}${isReach ? '\n클릭해서 이동' : ''}`);
    wrap.appendChild(el);
  }
  return wrap;
}

export function renderRun(): void {
  const run = store.s.run;
  if (!run) { app.route(); return; }
  closeAllModals();
  const screen = h('div', { class: 'screen' },
    topBar(run),
    partyPanel(run),
    mapView(run),
    h('div', { class: 'run-log panel thin' },
      h('h3', null, '원정 기록'),
      h('div', { class: 'scroll small dim', style: { maxHeight: '560px', lineHeight: '1.7' } },
        ...[...run.log].reverse().map((l) => h('div', null, l)),
        ...run.fallen.map((f) => h('div', { class: f.vampire ? 'vamp' : 'bad' }, f.vampire ? `⚰ ${f.name} 휴면` : `✝ ${f.name} 사망`)),
      ),
    ),
  );
  setScreen(screen);

  if (run.phase === 'event') showEvent(run);
  else if (run.phase === 'shop') showShop(run);
  else if (run.phase === 'result') showResult(run);
  else if (run.notice) {
    const n = run.notice;
    modal(h('div', { class: 'col', style: { width: '460px' } },
      h('h2', null, n.title),
      ...n.lines.map((l) => h('div', { style: { lineHeight: '1.7' } }, l)),
      h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: () => { store.dismissNotice(); renderRun(); } }, '확인')),
    ), { closable: false });
  }
}

function showEvent(run: RunState): void {
  const ev = EVENTS.find((e) => e.id === run.event?.id);
  if (!ev) return;
  const party = store.activeParty();
  const resolved = run.event?.resolved;
  const body = h('div', { class: 'event-box col' },
    h('h2', null, ev.title),
    h('div', { class: 'etext' }, ev.text),
  );
  if (!resolved) {
    ev.options.forEach((o, i) => {
      const ok = !o.req || !!condMatch(o.req, party, run.gold);
      body.appendChild(h('button', {
        class: `btn opt ${ok ? '' : ''}`, disabled: !ok,
        onclick: () => {
          const r = store.chooseEvent(i);
          if (!r.ok) { toast(r.reason ?? '선택할 수 없다.', 'warn'); return; }
          renderRun();
        },
      }, `${i + 1}. ${o.label}`, o.reqText ? h('span', { class: 'req' }, `[${o.reqText}]`) : null));
    });
  } else {
    body.appendChild(h('div', { class: 'result' },
      h('div', null, resolved.text),
      ...resolved.lines.map((l) => h('div', { class: 'small gold' }, `· ${l}`)),
    ));
    body.appendChild(h('div', { class: 'row end' }, h('button', {
      class: 'btn primary', onclick: () => { store.continueEvent(); app.route(); },
    }, resolved.fight ? '⚔ 전투 시작' : '계속')));
  }
  modal(body, { closable: false });
}

function showShop(run: RunState): void {
  const render = () => {
    clear(body);
    body.append(
      h('h2', null, '떠돌이 상인'),
      h('div', { class: 'dim' }, `"좋은 물건 있수다." — 이번 원정 금화: `, h('b', { class: 'gold' }, String(run.gold))),
      ...(run.shop ?? []).map((it) => h('div', { class: 'row', style: { padding: '6px 0', borderBottom: '1px dashed #3b3050' } },
        it.item ? h('div', { class: 'grow' }, itemRow(it.item)) : h('div', { class: 'grow' }, h('b', null, it.name), h('div', { class: 'small dim' }, it.desc)),
        h('button', {
          class: 'btn small gold', disabled: !!it.sold || run.gold < it.price,
          onclick: () => { const r = store.buy(it.id); if (!r.ok) toast(r.reason!, 'warn'); render(); },
        }, it.sold ? '판매됨' : `${it.price} 금화`),
      )),
      h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: () => { store.leaveShop(); renderRun(); } }, '떠난다')),
    );
  };
  const body = h('div', { class: 'col', style: { width: '460px' } });
  render();
  modal(body, { closable: false });
}

function showResult(run: RunState): void {
  const title = run.outcome === 'victory' ? '정복!' : run.outcome === 'retreat' ? '퇴각' : '전멸';
  const keep = run.outcome === 'victory' ? 1 : run.outcome === 'retreat' ? 0.5 : 0;
  const lines: string[] = [];
  if (run.outcome === 'victory') lines.push(`「${DUNGEONS[run.dungeon].name}」의 주인을 쓰러뜨렸다.`);
  if (run.outcome === 'wipe') lines.push('원정대가 모두 쓰러졌다. 모은 전리품은 어둠 속에 남겨졌다.');
  if (run.outcome === 'retreat') lines.push('살아남은 자들이 짐을 챙겨 저택으로 돌아간다.');
  lines.push(`가져갈 금화: ${Math.round(run.gold * keep)} / ${run.gold}`);
  if (run.outcome !== 'wipe' && run.essence) lines.push(`피의 정수: ${run.essence}`);
  if (run.loot.length) lines.push(run.outcome === 'wipe' ? `잃어버린 장비: ${run.loot.length}개` : `가져갈 장비: ${run.loot.map((i) => i.name).join(', ')}`);
  if (run.outcome !== 'wipe' && run.recruits.length) lines.push(`합류할 동료: ${run.recruits.map((r) => fullName(r)).join(', ')}`);
  const dead = run.fallen.filter((f) => !f.vampire);
  const dorm = run.fallen.filter((f) => f.vampire);
  modal(h('div', { class: 'col', style: { width: '520px' } },
    h('h2', { class: run.outcome === 'victory' ? 'gold' : run.outcome === 'wipe' ? 'bad' : '' }, title),
    ...lines.map((l) => h('div', { style: { lineHeight: '1.7' } }, l)),
    dead.length ? h('div', { class: 'bad', style: { lineHeight: '1.7' } }, `✝ 묘지로: ${dead.map((f) => f.name).join(', ')}`) : null,
    dorm.length ? h('div', { class: 'vamp', style: { lineHeight: '1.7' } }, `⚰ 관 속으로: ${dorm.map((f) => f.name).join(', ')}`) : null,
    h('div', { class: 'row end' }, h('button', {
      class: 'btn primary big', onclick: () => {
        const r = store.finishRun();
        app.route();
        if (r.lines.length) toast(r.lines.join(' · '), 'good');
      },
    }, '저택으로 귀환')),
  ), { closable: false });
}
