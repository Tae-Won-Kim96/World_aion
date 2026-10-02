import { spriteEl } from '../art/registry';
import {
  type Action, actionReady, actionsOf, BAD_STATUS, estimateDamage, predictOrder, STATUS_NAMES, type Unit,
} from '../core/battle/battle';
import { CLASSES, ROLE_NAMES } from '../core/data/classes';
import { ENEMIES } from '../core/data/enemies';
import { store, type RewardSummary } from '../core/state';
import type { BattleScene } from '../scenes/BattleScene';
import { app } from './app';
import { clear, clearTips, confirmBox, h, modal, tooltip, uiRoot } from './dom';
import { hpBar } from './widgets';

export class BattleHud {
  private root: HTMLElement;
  private turnbar: HTMLElement;
  private bottom: HTMLElement;
  private info: HTMLElement;
  private logEl: HTMLElement;
  private previewEl: HTMLElement;
  private lines: string[] = [];

  constructor(private scene: BattleScene) {
    const ui = uiRoot();
    clearTips();
    clear(ui);
    this.turnbar = h('div', { class: 'turnbar' });
    this.bottom = h('div', { class: 'bhud' });
    this.info = h('div', { class: 'hover-info panel thin', style: { display: 'none' } });
    this.logEl = h('div', { class: 'blog scroll' });
    this.previewEl = h('div', { class: 'small' });
    this.root = h('div', { class: 'screen' }, this.turnbar, this.info, this.logEl, this.bottom);
    ui.appendChild(this.root);
  }

  destroy(): void {
    clearTips();
    this.root.remove();
  }

  private mini(u: Unit, now: boolean): HTMLElement {
    const look = this.scene.looks.get(u.uid)!;
    const box = h('div', { class: `t ${u.side} ${now ? 'now' : ''}` }, spriteEl(look, 1.5, { still: true }));
    return tooltip(box, `${u.name}\n체력 ${u.hp}/${u.maxHp}`);
  }

  update(): void {
    const st = this.scene.st;
    clear(this.turnbar);
    const active = this.scene.active;
    const order = predictOrder(st, 10);
    if (active && active.alive) this.turnbar.appendChild(this.mini(active, true));
    for (const u of order) if (u !== active || order.indexOf(u) > 0) this.turnbar.appendChild(this.mini(u, false));

    clear(this.bottom);
    if (!active) return;
    const look = this.scene.looks.get(active.uid)!;
    const ally = active.side === 'ally';
    const who = h('div', { class: 'who' },
      spriteEl(look, 2.5),
      h('div', { class: 'col', style: { gap: '3px', flex: '1' } },
        h('b', { class: ally ? '' : 'bad' }, active.name),
        h('span', { class: 'small dim' }, `${ROLE_NAMES[active.role]} · Lv.${active.level}${active.vampire ? ' · 🦇' : ''}`),
        hpBar(active.hp, active.maxHp),
        h('span', { class: 'small' }, `${active.hp} / ${active.maxHp}`),
        this.statusIcons(active),
      ),
    );
    const acts = h('div', { class: 'acts' });
    if (ally && this.scene.inputMode) {
      actionsOf(active).forEach((a, i) => {
        const ready = actionReady(active, a);
        const cd = active.cd[a.id] ?? 0;
        const btn = h('button', {
          class: `btn act ${this.scene.action?.id === a.id ? 'on' : ''}`, disabled: !ready,
          onclick: () => this.scene.selectAction(a),
        },
          h('span', null, `${i + 1}. ${a.name}`),
          cd > 0 ? h('span', { class: 'cd' }, `${cd}턴`) : null,
          h('span', { class: 'rng' }, `사거리 ${a.skill.range[0]}-${a.skill.range[1]}${a.skill.area ? ` · 범위 ${a.skill.area}` : ''}${a.skill.target === 'self' ? ' · 자신' : ''}`),
        );
        acts.appendChild(tooltip(btn, `${a.name}\n${a.skill.desc}${a.skill.cooldown ? `\n재사용 ${a.skill.cooldown}턴` : ''}${a.skill.target === 'self' ? '\n(다시 눌러 시전)' : ''}`));
      });
      acts.appendChild(h('button', { class: 'btn act', onclick: () => this.scene.playerWait() }, '대기', h('span', { class: 'rng' }, '턴 넘기기 (Space)')));
      if (this.scene.moved) acts.appendChild(h('button', { class: 'btn act', onclick: () => this.scene.cancelMove() }, '이동 취소', h('span', { class: 'rng' }, 'Esc')));
    } else {
      acts.appendChild(h('div', { class: 'dim', style: { padding: '8px' } }, ally ? (this.scene.auto ? '자동 전투 중…' : '행동 중…') : `${active.name}의 차례…`));
    }
    acts.appendChild(this.previewEl);
    const side = h('div', { class: 'side' },
      h('button', { class: `btn ${this.scene.auto ? 'on' : ''}`, onclick: () => this.scene.toggleAuto() }, this.scene.auto ? '■ 자동 전투 끄기' : '▶ 자동 전투'),
      h('div', { class: 'row' },
        h('button', { class: 'btn grow', onclick: () => { this.scene.speed = this.scene.speed === 1 ? 2 : 1; this.update(); } }, `속도 x${this.scene.speed}`),
        tooltip(h('button', { class: 'btn danger', disabled: !this.scene.inputMode || !!store.s.run?.battle?.boss, onclick: () => confirmBox('전투에서 도주한다. 보상은 없고, 살아남은 동료는 체력 15%를 잃는다.', '도주', () => this.scene.flee(), true) }, '도주'), '보스전에서는 도주할 수 없다.'),
      ),
      h('div', { class: 'small mute', style: { lineHeight: '1.5' } }, '파란 칸: 이동 · 붉은 칸: 대상\n숫자키: 기술 선택'),
    );
    this.bottom.append(who, acts, side);
  }

  private statusIcons(u: Unit): HTMLElement {
    return h('div', { class: 'status-icons' }, ...u.statuses.map((s) => h('span', { class: BAD_STATUS.includes(s.id) ? 'bad' : 'good' }, `${STATUS_NAMES[s.id]}${s.id === 'shield' ? ` ${s.value}` : ` ${s.turns}`}`)));
  }

  showInfo(u: Unit | null): void {
    if (!u) { this.info.style.display = 'none'; return; }
    this.info.style.display = '';
    clear(this.info);
    const look = this.scene.looks.get(u.uid)!;
    const s = u.stats;
    const clsName = u.enemyDef ? `${CLASSES[ENEMIES[u.enemyDef].cls].name}` : '';
    this.info.append(
      h('div', { class: 'row' }, spriteEl(look, 1.5, { still: true }), h('div', { class: 'col', style: { gap: '2px' } },
        h('b', { class: u.side === 'ally' ? '' : 'bad' }, u.name),
        h('span', { class: 'small dim' }, `${u.side === 'ally' ? '아군' : '적'} · ${ROLE_NAMES[u.role]} ${clsName} · Lv.${u.level}${u.boss ? ' · 보스' : u.elite ? ' · 정예' : ''}`),
        h('span', { class: 'small' }, `체력 ${u.hp}/${u.maxHp}`),
      )),
      hpBar(u.hp, u.maxHp),
      h('div', { class: 'small dim', style: { marginTop: '4px', lineHeight: '1.6' } },
        `공격 ${s.atk} · 마력 ${s.mag} · 방어 ${s.def} · 저항 ${s.res}`, h('br'), `속도 ${s.spd} · 이동 ${s.mov} · 치명 ${s.crit}%`,
        u.tags.length ? h('div', null, `특징: ${u.tags.map((t) => TAG_NAMES[t] ?? t).join(', ')}`) : null,
      ),
      this.statusIcons(u),
    );
  }

  preview(targets: Unit[], a: Action | null): void {
    clear(this.previewEl);
    const u = this.scene.active;
    if (!a || !u || !targets.length) return;
    const s = a.skill;
    const parts = targets.map((t) => {
      if (s.kind === 'phys' || s.kind === 'mag' || (s.kind === 'debuff' && s.power > 0)) {
        const d = estimateDamage(this.scene.st, u, t, s);
        return h('div', { class: d >= t.hp ? 'gold' : '' }, `${t.name}: 약 ${Math.round(d * 0.9)}~${Math.round(d * 1.1)} 피해${d >= t.hp ? ' (처치 가능)' : ''}`);
      }
      if (s.kind === 'heal') return h('div', { class: 'good' }, `${t.name}: 회복`);
      return h('div', { class: 'dim' }, `${t.name}: ${(s.status ?? []).map((x) => STATUS_NAMES[x.id]).join(', ') || '효과'}`);
    });
    this.previewEl.append(...parts.slice(0, 4));
  }

  log(text: string): void {
    this.lines.unshift(text);
    this.lines = this.lines.slice(0, 30);
    clear(this.logEl);
    this.logEl.append(...this.lines.map((l) => h('div', null, l)));
  }

  banner(text: string): void {
    const b = h('div', { class: 'banner' }, text);
    this.root.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  }

  showResult(victory: boolean, sum: RewardSummary): void {
    modal(h('div', { class: 'col', style: { width: '500px' } },
      h('h2', { class: victory ? 'gold' : 'bad' }, victory ? '승리' : '패배'),
      victory ? h('div', null, `금화 +${sum.gold}${sum.essence ? ` · 피의 정수 +${sum.essence}` : ''}`) : h('div', { class: 'dim' }, '원정대가 무너졌다…'),
      ...sum.exp.map((e) => h('div', { class: 'small' }, `${e.name}: ${e.gained ? `경험치 +${e.gained}` : '성장하지 않음'}${e.levels ? ` · 레벨 업! (+${e.levels})` : ''}`)),
      ...sum.lines.map((l) => h('div', { class: l.includes('관') ? 'vamp' : 'bad', style: { lineHeight: '1.6' } }, l)),
      h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: () => app.route() }, '계속')),
    ), { closable: false });
  }
}

const TAG_NAMES: Record<string, string> = {
  undead: '언데드', unholy: '불경', holy: '신성', infernal: '지옥', abyssal: '심연', beast: '야수', cult: '광신',
  bandit: '도적', boss: '보스', vampire: '뱀파이어', nature: '자연', fey: '요정', shadow: '그림자', stone: '바위',
  small: '소형', brute: '거한', large: '대형', civil: '문명', divine: '신족', winged: '날개',
};
