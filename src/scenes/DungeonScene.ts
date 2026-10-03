import Phaser from 'phaser';
import { drawDungeonBackdrop } from '../art/backdrops';
import { ensureBufTexture } from '../art/registry';
import { dungeonOf } from '../core/gen/dungeon';

export class DungeonScene extends Phaser.Scene {
  constructor() {
    super('dungeon');
  }

  create(data: { dungeon?: string }): void {
    const d = dungeonOf(data.dungeon ?? 'necropolis');
    const key = ensureBufTexture(this.textures, `dg_bg_${d.id}`, () => drawDungeonBackdrop(d.theme.sky[0], d.theme.sky[1], d.theme.floor[0], d.theme.accent, d.risk * 7 + 3, d.theme.style));
    this.add.image(0, 0, key).setOrigin(0).setScale(4);
    const accent = Phaser.Display.Color.HexStringToColor(d.theme.accent).color;
    for (let i = 0; i < 24; i++) {
      const p = this.add.rectangle(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 720), 4, 4, accent).setAlpha(0.0);
      this.tweens.add({ targets: p, alpha: { from: 0, to: 0.6 }, y: p.y - 60, duration: Phaser.Math.Between(2500, 5000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 4000) });
    }
    this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.35).setOrigin(0);
  }
}
