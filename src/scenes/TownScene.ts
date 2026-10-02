import Phaser from 'phaser';
import { drawTownBackdrop } from '../art/backdrops';
import { lookFromCharacter } from '../art/look';
import { ensureBufTexture, ensureSheetTexture } from '../art/registry';
import { store } from '../core/state';
import { idleAnim } from './anims';

export class TownScene extends Phaser.Scene {
  private unsub: (() => void) | null = null;
  private signature = '';

  constructor() {
    super('town');
  }

  create(): void {
    const graves = store.s.graveyard.length;
    const bgKey = ensureBufTexture(this.textures, `town_bg_${Math.min(graves, 18)}`, () => drawTownBackdrop(graves));
    this.add.image(0, 0, bgKey).setOrigin(0).setScale(4);

    // 반딧불
    for (let i = 0; i < 14; i++) {
      const f = this.add.rectangle(Phaser.Math.Between(260, 1240), Phaser.Math.Between(420, 700), 4, 4, 0xfff2a0).setAlpha(0);
      this.tweens.add({ targets: f, alpha: { from: 0, to: 0.9 }, y: f.y - Phaser.Math.Between(10, 40), duration: Phaser.Math.Between(1400, 3000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000) });
    }

    const chars = [...store.s.roster].filter((c) => c.dormant === 0).sort(() => Math.random() - 0.5).slice(0, 9);
    this.signature = store.s.roster.map((c) => c.id + (c.vampire ? 'v' : '')).join(',');
    chars.forEach((c) => {
      const spec = lookFromCharacter(c);
      const key = ensureSheetTexture(this.textures, spec);
      const x = Phaser.Math.Between(300, 900);
      const y = Phaser.Math.Between(610, 700);
      const spr = this.add.sprite(x, y, key, 0).setOrigin(0.5, 1).setScale(3).setDepth(y);
      spr.play({ key: idleAnim(this, key), startFrame: Phaser.Math.Between(0, 1) });
      const wander = () => {
        const nx = Phaser.Math.Clamp(spr.x + Phaser.Math.Between(-220, 220), 280, 1220);
        spr.setFlipX(nx < spr.x);
        this.tweens.add({
          targets: spr, x: nx, duration: Math.abs(nx - spr.x) * 14 + 200, ease: 'Linear',
          onComplete: () => this.time.delayedCall(Phaser.Math.Between(1500, 5000), wander),
        });
      };
      this.time.delayedCall(Phaser.Math.Between(300, 4000), wander);
    });

    this.unsub = store.onChange(() => {
      const sig = store.s.roster.map((c) => c.id + (c.vampire ? 'v' : '')).join(',');
      if (sig !== this.signature && this.scene.isActive()) this.scene.restart();
    });
    this.events.once('shutdown', () => { this.unsub?.(); this.unsub = null; });
  }
}
