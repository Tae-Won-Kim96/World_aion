import Phaser from 'phaser';
import { drawDungeonBackdrop } from '../art/backdrops';
import { lookFromCharacter, lookFromEnemy, type LookSpec } from '../art/look';
import { ensureBufTexture, ensureSheetTexture } from '../art/registry';
import { drawCoffin, drawFloorTiles, drawHitFx, drawObstacle, drawProjectile, drawTombstone, fxColor, type ObstacleKind } from '../art/tiles';
import { planTurn } from '../core/battle/ai';
import {
  type Action, actionReady, actionsOf, advance, affectedUnits, type BattleState, type BEvent, createBattle, dist,
  endTurn, findPath, moveUnit, performAction, reachableTiles, startTurn, STATUS_NAMES, BAD_STATUS, targetTiles, type Unit,
  dangerTiles, resolvePending,
} from '../core/battle/battle';
import { DUNGEONS } from '../core/data/dungeons';
import { ENEMIES } from '../core/data/enemies';
import { store, type BattleResult } from '../core/state';
import { partySynergy } from '../core/stats';
import type { FxKind } from '../core/types';
import { app } from '../ui/app';
import { BattleHud } from '../ui/battleHud';
import { idleAnim, fxAnim } from './anims';

export const TS = 64;
export const GX = 320;
export const GY = 96;

interface Vis {
  spr: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  bar: Phaser.GameObjects.Graphics;
  tex: string;
  scale: number;
}

const wait = (scene: Phaser.Scene, ms: number) => new Promise<void>((r) => scene.time.delayedCall(ms, r));

export class BattleScene extends Phaser.Scene {
  st!: BattleState;
  looks = new Map<string, LookSpec>();
  vis = new Map<string, Vis>();
  hud!: BattleHud;
  private hl!: Phaser.GameObjects.Graphics;
  private hoverG!: Phaser.GameObjects.Graphics;
  private dangerG!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Container;
  active: Unit | null = null;
  inputMode = false;
  moved = false;
  private orig = { x: 0, y: 0 };
  action: Action | null = null;
  auto = false;
  speed = 1;
  private deaths: { id: string; by: string }[] = [];
  private resolveTurn: (() => void) | null = null;
  private hoverTile: { x: number; y: number } | null = null;

  constructor() {
    super('battle');
  }

  create(): void {
    const run = store.s.run!;
    const spec = run.battle!;
    const party = store.activeParty();
    const morale = partySynergy(party).morale;
    this.st = createBattle({ party: party.map((c) => ({ char: c, hp: run.hp[c.id] })), spec, morale, relics: run.relics });
    this.vis.clear();
    this.looks.clear();
    this.deaths = [];
    this.auto = false;
    this.active = null;
    this.inputMode = false;
    const d = DUNGEONS[spec.theme] ?? DUNGEONS.necropolis;

    const bg = ensureBufTexture(this.textures, `dg_bg_${d.id}`, () => drawDungeonBackdrop(d.theme.sky[0], d.theme.sky[1], d.theme.floor[0], d.theme.accent));
    this.add.image(0, 0, bg).setOrigin(0).setScale(4).setAlpha(0.8);
    this.add.rectangle(GX - 10, GY - 10, this.st.w * TS + 20, this.st.h * TS + 20, 0x000000, 0.45).setOrigin(0);

    const floorKey = ensureBufTexture(this.textures, `floor_${d.id}`, () => drawFloorTiles(d.theme.floor, 11), { w: 32, h: 32, n: 4 });
    const rng = new Phaser.Math.RandomDataGenerator([String(spec.seed)]);
    for (let y = 0; y < this.st.h; y++) {
      for (let x = 0; x < this.st.w; x++) {
        this.add.image(GX + x * TS, GY + y * TS, floorKey, rng.between(0, 3)).setOrigin(0).setScale(2);
      }
    }
    this.hl = this.add.graphics().setDepth(5);
    this.hoverG = this.add.graphics().setDepth(6);
    this.dangerG = this.add.graphics().setDepth(4);
    this.tweens.add({ targets: this.dangerG, alpha: { from: 0.55, to: 1 }, duration: 500, yoyo: true, repeat: -1 });

    for (const o of this.st.obstacles) {
      const key = ensureBufTexture(this.textures, `obs_${o.kind}_${d.id}`, () => drawObstacle(o.kind as ObstacleKind, d.theme.accent));
      this.add.image(GX + o.x * TS + TS / 2, GY + o.y * TS + TS - 4, key).setOrigin(0.5, 1).setScale(2).setDepth(10 + o.y * 10 + 5);
    }

    for (const u of this.st.units) this.spawnUnit(u);

    const tri = this.add.triangle(0, 0, 0, 0, 14, 0, 7, 10, 0xf2c45a).setOrigin(0, 0);
    this.marker = this.add.container(0, 0, [tri]).setDepth(999).setVisible(false);
    this.tweens.add({ targets: tri, y: 6, duration: 400, yoyo: true, repeat: -1 });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onHover(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onClick(p));
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.onKey(e));

    this.hud = new BattleHud(this);
    this.events.once('shutdown', () => this.hud.destroy());
    for (const l of this.st.log) this.hud.log(l);
    this.banner(spec.boss ? '보스 전투' : spec.ambush ? '기습!' : spec.elite ? '정예 전투' : '전투 개시');
    this.time.delayedCall(700, () => void this.loop());
  }

  // ------------------------------------------------------------ 표시
  tileCenter(x: number, y: number): { x: number; y: number } {
    return { x: GX + x * TS + TS / 2, y: GY + y * TS + TS / 2 };
  }

  private feet(x: number, y: number): { x: number; y: number } {
    return { x: GX + x * TS + TS / 2, y: GY + y * TS + TS - 6 };
  }

  private spawnUnit(u: Unit): void {
    let look: LookSpec;
    if (u.charId) {
      const ch = store.char(u.charId)!;
      look = lookFromCharacter(ch);
    } else {
      look = lookFromEnemy(ENEMIES[u.enemyDef!], u.seed);
    }
    this.looks.set(u.uid, look);
    const tex = ensureSheetTexture(this.textures, look);
    const scale = 2 * (u.enemyDef ? (ENEMIES[u.enemyDef].scale ?? 1) : 1);
    const f = this.feet(u.x, u.y);
    const shadow = this.add.ellipse(f.x, f.y + 2, 40 * (scale / 2), 12, 0x000000, 0.45).setDepth(8);
    const spr = this.add.sprite(f.x, f.y, tex, 0).setOrigin(0.5, 1).setScale(scale).setFlipX(u.side === 'enemy');
    spr.play({ key: idleAnim(this, tex, 2.2), startFrame: Phaser.Math.Between(0, 1) });
    const bar = this.add.graphics();
    this.vis.set(u.uid, { spr, shadow, bar, tex, scale });
    this.placeVis(u);
  }

  private placeVis(u: Unit): void {
    const v = this.vis.get(u.uid);
    if (!v) return;
    const f = this.feet(u.x, u.y);
    v.spr.setPosition(f.x, f.y).setDepth(10 + u.y * 10 + 6);
    v.shadow.setPosition(f.x, f.y + 2);
    this.drawBar(u);
  }

  drawBar(u: Unit): void {
    const v = this.vis.get(u.uid);
    if (!v) return;
    const g = v.bar;
    g.clear();
    if (!u.alive) return;
    const w = 44;
    const x = v.spr.x - w / 2;
    const y = v.spr.y - 40 * v.scale - 8;
    g.fillStyle(0x000000, 0.85).fillRect(x - 1, y - 1, w + 2, 7);
    const r = Math.max(0, u.hp / u.maxHp);
    const col = u.side === 'ally' ? (r > 0.6 ? 0x6ad07a : r > 0.3 ? 0xf2c45a : 0xff5a5a) : 0xe0405a;
    g.fillStyle(col, 1).fillRect(x, y, w * r, 5);
    const shield = u.statuses.find((s) => s.id === 'shield' && (s.value ?? 0) > 0);
    if (shield) g.fillStyle(0x9ad8ff, 1).fillRect(x, y + 5, Math.min(w, (w * (shield.value ?? 0)) / u.maxHp), 2);
    g.setDepth(900);
  }

  private markActive(u: Unit | null): void {
    if (!u) { this.marker.setVisible(false); return; }
    const v = this.vis.get(u.uid)!;
    this.marker.setVisible(true).setPosition(v.spr.x - 7, v.spr.y - 40 * v.scale - 26);
  }

  /** 예고 공격 위험 칸 */
  drawDanger(): void {
    const g = this.dangerG;
    g.clear();
    for (const t of dangerTiles(this.st, 'ally')) {
      const x = GX + t.x * TS;
      const y = GY + t.y * TS;
      g.fillStyle(0xff2a3a, 0.28).fillRect(x + 2, y + 2, TS - 4, TS - 4);
      g.lineStyle(2, 0xff4a5a, 0.9).strokeRect(x + 3, y + 3, TS - 6, TS - 6);
      g.lineStyle(2, 0xff4a5a, 0.5);
      for (let k = 8; k < TS * 2; k += 14) g.lineBetween(x + Math.max(4, k - TS + 4), y + Math.min(TS - 4, k), x + Math.min(TS - 4, k), y + Math.max(4, k - TS + 4));
    }
  }

  inDanger(u: Unit): boolean {
    return dangerTiles(this.st, u.side).some((t) => t.x === u.x && t.y === u.y);
  }

  banner(text: string): void {
    this.hud.banner(text);
  }

  floatText(x: number, y: number, text: string, color: string, size = 18): void {
    const t = this.add.text(x, y, text, { fontFamily: 'Galmuri11', fontSize: `${size}px`, color, stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({ targets: t, y: y - 36, alpha: { from: 1, to: 0 }, duration: 900 / this.speed, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  // ------------------------------------------------------------ 하이라이트
  private tileFromPointer(p: Phaser.Input.Pointer): { x: number; y: number } | null {
    const x = Math.floor((p.worldX - GX) / TS);
    const y = Math.floor((p.worldY - GY) / TS);
    if (x < 0 || y < 0 || x >= this.st.w || y >= this.st.h) return null;
    return { x, y };
  }

  refreshHighlights(): void {
    const g = this.hl;
    g.clear();
    const u = this.active;
    if (!u || !this.inputMode) return;
    if (!this.moved) {
      for (const t of reachableTiles(this.st, u)) {
        if (t.d === 0) continue;
        g.fillStyle(0x4a8aff, 0.22).fillRect(GX + t.x * TS + 2, GY + t.y * TS + 2, TS - 4, TS - 4);
        g.lineStyle(2, 0x6aa8ff, 0.6).strokeRect(GX + t.x * TS + 2, GY + t.y * TS + 2, TS - 4, TS - 4);
      }
    }
    if (this.action) {
      for (const t of targetTiles(this.st, u, this.action)) {
        g.fillStyle(this.action.skill.kind === 'heal' || this.action.skill.kind === 'buff' ? 0x6ad07a : 0xff4a5a, 0.25).fillRect(GX + t.x * TS + 2, GY + t.y * TS + 2, TS - 4, TS - 4);
        g.lineStyle(2, this.action.skill.kind === 'heal' || this.action.skill.kind === 'buff' ? 0x8af09a : 0xff6a7a, 0.8).strokeRect(GX + t.x * TS + 2, GY + t.y * TS + 2, TS - 4, TS - 4);
      }
    }
    g.lineStyle(2, 0xf2c45a, 1).strokeRect(GX + u.x * TS + 1, GY + u.y * TS + 1, TS - 2, TS - 2);
    this.drawHover();
  }

  private drawHover(): void {
    const g = this.hoverG;
    g.clear();
    const t = this.hoverTile;
    if (!t) return;
    g.lineStyle(2, 0xffffff, 0.5).strokeRect(GX + t.x * TS + 1, GY + t.y * TS + 1, TS - 2, TS - 2);
    const u = this.active;
    if (!u || !this.inputMode || !this.action) return;
    const valid = targetTiles(this.st, u, this.action).some((p) => p.x === t.x && p.y === t.y);
    if (!valid) return;
    const s = this.action.skill;
    const cx = s.target === 'self' ? u.x : t.x;
    const cy = s.target === 'self' ? u.y : t.y;
    for (let y = 0; y < this.st.h; y++) {
      for (let x = 0; x < this.st.w; x++) {
        if (dist({ x, y }, { x: cx, y: cy }) <= s.area) g.fillStyle(0xffa040, 0.3).fillRect(GX + x * TS + 4, GY + y * TS + 4, TS - 8, TS - 8);
      }
    }
    this.hud.preview(affectedUnits(this.st, u, this.action, t.x, t.y), this.action);
  }

  // ------------------------------------------------------------ 입력
  private onHover(p: Phaser.Input.Pointer): void {
    const t = this.tileFromPointer(p);
    this.hoverTile = t;
    const unit = t ? this.st.units.find((u) => u.alive && u.x === t.x && u.y === t.y) : undefined;
    this.hud.showInfo(unit ?? null);
    this.hud.preview([], null);
    this.drawHover();
  }

  private onClick(p: Phaser.Input.Pointer): void {
    if (!this.inputMode || !this.active) return;
    const t = this.tileFromPointer(p);
    if (!t) return;
    const u = this.active;
    if (this.action && targetTiles(this.st, u, this.action).some((q) => q.x === t.x && q.y === t.y)) {
      void this.playerAct(this.action, t.x, t.y);
      return;
    }
    if (!this.moved && reachableTiles(this.st, u).some((q) => q.x === t.x && q.y === t.y && q.d > 0)) {
      void this.playerMove(t.x, t.y);
    }
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.inputMode || !this.active) return;
    const acts = actionsOf(this.active);
    const n = Number(e.key);
    if (n >= 1 && n <= acts.length) this.selectAction(acts[n - 1]);
    if (e.key === ' ' || e.key === 'w') this.playerWait();
    if (e.key === 'Escape') this.cancelMove();
  }

  selectAction(a: Action): void {
    const u = this.active;
    if (!u || !this.inputMode || !actionReady(u, a)) return;
    if (this.action?.id === a.id && a.skill.target === 'self') {
      void this.playerAct(a, u.x, u.y);
      return;
    }
    this.action = a;
    this.refreshHighlights();
    this.hud.update();
  }

  private async playerMove(x: number, y: number): Promise<void> {
    const u = this.active!;
    this.inputMode = false;
    this.refreshHighlights();
    this.orig = { x: u.x, y: u.y };
    await this.animateMove(u, x, y);
    this.moved = true;
    this.inputMode = true;
    this.refreshHighlights();
    this.hud.update();
  }

  cancelMove(): void {
    const u = this.active;
    if (!u || !this.moved || !this.inputMode) return;
    u.x = this.orig.x;
    u.y = this.orig.y;
    this.placeVis(u);
    this.markActive(u);
    this.moved = false;
    this.refreshHighlights();
    this.hud.update();
  }

  private async playerAct(a: Action, x: number, y: number): Promise<void> {
    const u = this.active!;
    this.inputMode = false;
    this.hl.clear();
    this.hoverG.clear();
    const ev = performAction(this.st, u, a, x, y);
    await this.playEvents(u, ev);
    this.finishPlayerTurn();
  }

  playerWait(): void {
    if (!this.inputMode) return;
    this.inputMode = false;
    this.hl.clear();
    this.finishPlayerTurn();
  }

  toggleAuto(): void {
    this.auto = !this.auto;
    this.hud.update();
    if (this.auto && this.inputMode && this.active) {
      this.inputMode = false;
      this.hl.clear();
      const u = this.active;
      void (async () => {
        await this.aiAct(u);
        this.finishPlayerTurn();
      })();
    }
  }

  flee(): void {
    if (!this.inputMode || this.st.over) return;
    const hp = Object.fromEntries(this.st.units.filter((u) => u.side === 'ally' && u.alive && u.charId).map((u) => [u.charId!, u.hp]));
    const r = store.fleeBattle(hp);
    if (!r.ok) { this.hud.log(r.reason ?? '도주할 수 없다.'); return; }
    this.inputMode = false;
    this.st.over = 'defeat';
    this.resolveTurn = null;
    app.route();
  }

  private finishPlayerTurn(): void {
    const r = this.resolveTurn;
    this.resolveTurn = null;
    r?.();
  }

  // ------------------------------------------------------------ 애니메이션
  private async animateMove(u: Unit, x: number, y: number): Promise<void> {
    const path = findPath(this.st, u, x, y);
    moveUnit(this.st, u, x, y);
    const v = this.vis.get(u.uid)!;
    for (let i = 1; i < path.length; i++) {
      const f = this.feet(path[i].x, path[i].y);
      if (f.x !== v.spr.x) v.spr.setFlipX(f.x < v.spr.x);
      await new Promise<void>((res) => this.tweens.add({
        targets: [v.spr], x: f.x, y: f.y, duration: 110 / this.speed,
        onUpdate: () => { v.shadow.setPosition(v.spr.x, v.spr.y + 2); this.drawBar(u); },
        onComplete: () => res(),
      }));
    }
    v.spr.setFlipX(u.side === 'enemy');
    this.placeVis(u);
    this.markActive(u);
  }

  private hitFx(x: number, y: number, fx: FxKind): void {
    const key = ensureBufTexture(this.textures, `hit_${fx}`, () => drawHitFx(fx), { w: 32, h: 32, n: 4 });
    const s = this.add.sprite(x, y, key, 0).setScale(2).setDepth(950);
    s.play(fxAnim(this, key, 4, 14 * this.speed));
    s.once('animationcomplete', () => s.destroy());
  }

  private async projectile(from: { x: number; y: number }, to: { x: number; y: number }, fx: FxKind): Promise<void> {
    const key = ensureBufTexture(this.textures, `proj_${fx}`, () => drawProjectile(fx));
    const p = this.add.image(from.x, from.y, key).setScale(2).setDepth(960);
    p.setRotation(Math.atan2(to.y - from.y, to.x - from.x));
    const d = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    await new Promise<void>((res) => this.tweens.add({ targets: p, x: to.x, y: to.y, duration: Math.max(120, d * 0.7) / this.speed, onComplete: () => { p.destroy(); res(); } }));
  }

  private flash(u: Unit): void {
    const v = this.vis.get(u.uid);
    if (!v) return;
    v.spr.stop();
    v.spr.setFrame(4);
    v.spr.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(70 / this.speed, () => v.spr.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
    this.tweens.add({ targets: v.spr, x: v.spr.x + (u.side === 'ally' ? -5 : 5), duration: 60 / this.speed, yoyo: true });
    this.time.delayedCall(260 / this.speed, () => { if (u.alive) v.spr.play(idleAnim(this, v.tex, 2.2)); });
  }

  async playEvents(src: Unit | null, ev: BEvent[]): Promise<void> {
    const byId = (id: string) => this.st.units.find((x) => x.uid === id)!;
    const cast = ev.find((e) => e.t === 'cast') as Extract<BEvent, { t: 'cast' }> | undefined;
    if (cast && src) {
      const v = this.vis.get(src.uid)!;
      this.hud.log(`${src.name}: ${cast.name}`);
      this.floatText(v.spr.x, v.spr.y - 40 * v.scale - 18, cast.name, '#f2e6c8', 14);
      v.spr.stop();
      v.spr.setFrame(2);
      await wait(this, 150 / this.speed);
      v.spr.setFrame(3);
      const target = this.tileCenter(cast.x, cast.y);
      const dx = target.x - v.spr.x;
      const melee = !cast.projectile && dist(src, { x: cast.x, y: cast.y }) <= 1 && (cast.x !== src.x || cast.y !== src.y);
      if (melee) {
        const len = Math.hypot(dx, target.y - v.spr.y) || 1;
        await new Promise<void>((res) => this.tweens.add({ targets: v.spr, x: v.spr.x + (dx / len) * 22, y: v.spr.y + ((target.y - v.spr.y) / len) * 10, duration: 80 / this.speed, yoyo: true, onComplete: () => res() }));
      } else if (cast.projectile) {
        await this.projectile({ x: v.spr.x + (src.side === 'ally' ? 18 : -18), y: v.spr.y - 40 * v.scale * 0.55 }, target, cast.fx);
      } else {
        await wait(this, 80 / this.speed);
      }
      if (cast.area > 0) {
        const g = this.add.graphics().setDepth(940);
        const col = Phaser.Display.Color.HexStringToColor(fxColor(cast.fx)).color;
        for (let y = 0; y < this.st.h; y++) for (let x = 0; x < this.st.w; x++) {
          if (dist({ x, y }, { x: cast.x, y: cast.y }) <= cast.area) g.fillStyle(col, 0.3).fillRect(GX + x * TS + 2, GY + y * TS + 2, TS - 4, TS - 4);
        }
        this.tweens.add({ targets: g, alpha: 0, duration: 450 / this.speed, onComplete: () => g.destroy() });
        if (!ev.some((e) => e.t === 'dmg' || e.t === 'heal')) this.hitFx(target.x, target.y, cast.fx);
      }
    }
    let shook = false;
    for (const e of ev) {
      switch (e.t) {
        case 'dmg': {
          const t = byId(e.dst);
          const v = this.vis.get(t.uid)!;
          this.hitFx(v.spr.x, v.spr.y - 40 * v.scale * 0.5, e.fx);
          this.flash(t);
          this.floatText(v.spr.x + Phaser.Math.Between(-8, 8), v.spr.y - 40 * v.scale * 0.6, `${e.amount}${e.crit ? '!' : ''}`, e.crit ? '#ffd45a' : '#ffffff', e.crit ? 24 : 18);
          if (e.crit && !shook) { this.cameras.main.shake(120, 0.004); shook = true; }
          this.drawBar(t);
          break;
        }
        case 'dot': {
          const t = byId(e.dst);
          const v = this.vis.get(t.uid)!;
          this.flash(t);
          this.floatText(v.spr.x, v.spr.y - 40 * v.scale * 0.6, `${e.amount}`, e.id === 'poison' ? '#8ae05a' : e.id === 'burn' ? '#ff8a3a' : '#e0203a');
          this.hud.log(`${t.name}: ${STATUS_NAMES[e.id]} 피해 ${e.amount}`);
          this.drawBar(t);
          await wait(this, 250 / this.speed);
          break;
        }
        case 'heal': {
          const t = byId(e.dst);
          const v = this.vis.get(t.uid)!;
          if (e.amount <= 0) break;
          if (e.src !== e.dst || !cast) this.hitFx(v.spr.x, v.spr.y - 40 * v.scale * 0.5, 'heal');
          this.floatText(v.spr.x, v.spr.y - 40 * v.scale * 0.7, `+${e.amount}`, '#7affa0');
          this.drawBar(t);
          break;
        }
        case 'status': {
          const t = byId(e.dst);
          const v = this.vis.get(t.uid)!;
          this.time.delayedCall(180 / this.speed, () => this.floatText(v.spr.x, v.spr.y - 40 * v.scale - 4, STATUS_NAMES[e.id], BAD_STATUS.includes(e.id) ? '#ff9a9a' : '#9af0b0', 13));
          this.drawBar(t);
          break;
        }
        case 'stun': {
          const t = byId(e.dst);
          const v = this.vis.get(t.uid)!;
          this.floatText(v.spr.x, v.spr.y - 40 * v.scale, '기절', '#ffd45a', 15);
          this.hud.log(`${t.name}은(는) 기절해 움직이지 못한다.`);
          await wait(this, 350 / this.speed);
          break;
        }
        case 'push': {
          const t = byId(e.dst);
          await wait(this, 60);
          const v = this.vis.get(t.uid)!;
          const f = this.feet(e.x, e.y);
          this.tweens.add({ targets: v.spr, x: f.x, y: f.y, duration: 120 / this.speed, onUpdate: () => { v.shadow.setPosition(v.spr.x, v.spr.y + 2); this.drawBar(t); }, onComplete: () => this.placeVis(t) });
          break;
        }
        case 'cheat': {
          const t = byId(e.dst);
          const v = this.vis.get(t.uid)!;
          this.floatText(v.spr.x, v.spr.y - 40 * v.scale - 16, '죽음을 거부했다!', '#e0a8ff', 16);
          break;
        }
        case 'death':
          await this.killUnit(byId(e.dst), e.by);
          break;
        case 'log':
          this.hud.log(e.text);
          break;
        case 'gold': {
          const t = byId(e.src);
          const v = this.vis.get(t.uid)!;
          this.time.delayedCall(260 / this.speed, () => this.floatText(v.spr.x, v.spr.y - 40 * v.scale - 10, `+${e.amount} 금화`, '#ffd45a', 13));
          break;
        }
        case 'charge': {
          const t = byId(e.src);
          const v = this.vis.get(t.uid)!;
          v.spr.setTint(0xff6a7a);
          this.floatText(v.spr.x, v.spr.y - 40 * v.scale - 18, `영창: ${e.name}`, '#ff8a9a', 15);
          this.drawDanger();
          this.cameras.main.flash(160, 120, 0, 20);
          await wait(this, 500 / this.speed);
          v.spr.clearTint();
          break;
        }
        case 'interrupt': {
          const t = byId(e.src);
          const v = this.vis.get(t.uid)!;
          this.floatText(v.spr.x, v.spr.y - 40 * v.scale - 18, '영창 중단!', '#ffd45a', 16);
          this.drawDanger();
          break;
        }
        case 'phase': {
          const t = byId(e.src);
          const v = this.vis.get(t.uid);
          this.hud.banner(e.text, true);
          this.hud.log(e.text);
          this.cameras.main.shake(300, 0.006);
          if (v) { v.spr.setTint(0xff3a4a); this.time.delayedCall(400, () => v.spr.clearTint()); }
          await wait(this, 900 / this.speed);
          break;
        }
        case 'spawn': {
          const t = byId(e.uid);
          this.spawnUnit(t);
          const v = this.vis.get(t.uid)!;
          v.spr.setAlpha(0);
          v.shadow.setAlpha(0);
          this.hitFx(v.spr.x, v.spr.y - 30, 'dark');
          this.tweens.add({ targets: [v.spr, v.shadow], alpha: 1, duration: 350 / this.speed });
          this.hud.log(`${t.name}이(가) 나타났다!`);
          await wait(this, 200 / this.speed);
          break;
        }
        default:
          break;
      }
    }
    if (src && src.alive) {
      const v = this.vis.get(src.uid)!;
      await wait(this, 240 / this.speed);
      this.placeVis(src);
      v.spr.play(idleAnim(this, v.tex, 2.2));
    }
    this.drawDanger();
    this.hud.update();
  }

  private async killUnit(u: Unit, by: string): Promise<void> {
    const v = this.vis.get(u.uid)!;
    v.bar.clear();
    v.spr.stop();
    v.spr.setFrame(4);
    this.hud.log(`${u.name} 쓰러짐 (${by})`);
    if (u.side === 'ally' && u.charId) {
      this.deaths.push({ id: u.charId, by });
      store.battleDeath(u.charId, by);
    }
    await new Promise<void>((res) => this.tweens.add({ targets: [v.spr, v.shadow], alpha: 0, duration: 450 / this.speed, onComplete: () => res() }));
    if (u.side === 'ally' && u.charId) {
      const key = u.vampire ? ensureBufTexture(this.textures, 'coffin', drawCoffin) : ensureBufTexture(this.textures, 'tomb', drawTombstone);
      const img = this.add.image(v.spr.x, v.spr.y, key).setOrigin(0.5, 1).setScale(2).setDepth(v.spr.depth).setAlpha(0);
      this.tweens.add({ targets: img, alpha: 1, duration: 400 });
      this.floatText(v.spr.x, v.spr.y - 70, u.vampire ? '재가 되어 흩어졌다' : '사망', u.vampire ? '#e0a8ff' : '#ff6a6a', 15);
    }
  }

  // ------------------------------------------------------------ 루프
  private async aiAct(u: Unit): Promise<void> {
    await wait(this, 200 / this.speed);
    const plan = planTurn(this.st, u);
    if (plan.move) await this.animateMove(u, plan.move.x, plan.move.y);
    if (plan.action && u.alive) {
      const ev = performAction(this.st, u, plan.action.a, plan.action.x, plan.action.y);
      await this.playEvents(u, ev);
    }
  }

  private async loop(): Promise<void> {
    let guard = 0;
    while (!this.st.over && guard++ < 2000) {
      if (!this.scene.isActive()) return;
      const u = advance(this.st);
      this.active = u;
      this.markActive(u);
      this.hud.update();
      const ev: BEvent[] = [];
      const skip = startTurn(this.st, u, ev);
      await this.playEvents(null, ev);
      if (this.st.over) break;
      if (!u.alive || skip) { endTurn(this.st, u); this.drawDanger(); continue; }
      const pend = resolvePending(this.st, u);
      if (pend) {
        await wait(this, 250 / this.speed);
        await this.playEvents(u, pend);
      } else if (u.side === 'enemy' || this.auto || !u.charId) {
        await this.aiAct(u);
      } else {
        this.moved = false;
        this.orig = { x: u.x, y: u.y };
        const acts = actionsOf(u);
        this.action = acts.find((a) => a.isAttack) ?? null;
        this.inputMode = true;
        this.refreshHighlights();
        this.hud.update();
        await new Promise<void>((r) => { this.resolveTurn = r; });
        if (!this.scene.isActive()) return;
      }
      this.inputMode = false;
      this.hl.clear();
      this.hoverG.clear();
      endTurn(this.st, u);
      for (const x of this.st.units) this.drawBar(x);
    }
    this.markActive(null);
    await this.finish();
  }

  private async finish(): Promise<void> {
    const victory = this.st.over === 'victory';
    this.banner(victory ? '승리!' : '패배…');
    await wait(this, 1100);
    const res: BattleResult = {
      victory,
      hp: Object.fromEntries(this.st.units.filter((u) => u.side === 'ally' && u.alive && u.charId).map((u) => [u.charId!, u.hp])),
      deaths: this.deaths,
      kills: Object.fromEntries(this.st.units.filter((u) => u.side === 'ally' && u.charId).map((u) => [u.charId!, u.kills])),
      cheatDeathUsed: this.st.cheatUsed,
      bonusEssence: this.st.bonusEssence,
      bonusGold: this.st.bonusGold,
    };
    const summary = store.battleFinished(res);
    this.hud.showResult(victory, summary);
  }
}
